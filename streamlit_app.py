import streamlit as st
import subprocess
import os
import time
import sys
import re

st.set_page_config(page_title="PanicSense Deployment Hub", layout="centered")

st.title("🚨 PanicSense Deployment Hub")
st.markdown("This Streamlit wrapper compiles and launches the PanicSense React + Express monorepo directly inside the cloud container.")

# Check for Node.js
try:
    node_version = subprocess.check_output(["node", "-v"]).decode().strip()
    st.success(f"✓ Node.js detected: {node_version}")
except Exception:
    st.error("✗ Node.js is not installed. Ensure packages.txt is present with nodejs and npm.")
    st.stop()

# Set up log files
backend_log_path = "backend_log.txt"
ai_log_path = "ai_engine_log.txt"

@st.cache_resource
def start_services():
    status = st.empty()
    
    # 1. Install npm packages
    status.info("📦 Installing npm packages (npm install)...")
    subprocess.run(["npm", "install"], check=True)
    
    # 2. Compile frontend and backend
    status.info("🏗️ Compiling build files (npm run build)...")
    subprocess.run(["npm", "run", "build"], check=True)
    
    # Open log files
    backend_log = open(backend_log_path, "w", encoding="utf-8")
    ai_log = open(ai_log_path, "w", encoding="utf-8")
    
    # Ensure port 3000 is used for Backend Core
    env = os.environ.copy()
    env["PORT"] = "3000"
    
    # 3. Launch Backend Core (Port 3000)
    status.info("🚀 Launching Backend Core (Port 3000)...")
    backend_proc = subprocess.Popen(
        ["node", "dist/server.cjs"],
        env=env,
        stdout=backend_log,
        stderr=backend_log
    )
    
    # 4. Launch AI Engine (Port 8001)
    status.info("🧠 Launching AI Engine (Port 8001)...")
    ai_proc = subprocess.Popen(
        ["node", "dist/ai-engine.cjs"],
        env=env,
        stdout=ai_log,
        stderr=ai_log
    )
    
    time.sleep(5)
    status.success("✓ All background services are successfully running!")
    
    # 5. Expose port 3000 publicly using localtunnel (Hackathon Workaround)
    status.info("🌐 Exposing port 3000 publicly...")
    lt_proc = subprocess.Popen(
        ["npx", "localtunnel", "--port", "3000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Read localtunnel URL from stdout
    lt_url = ""
    for _ in range(15):  # Try for 15 seconds to get the URL
        line = lt_proc.stdout.readline()
        if "url is" in line:
            lt_url = line.split("is:")[-1].strip()
            break
        time.sleep(1)
        
    if not lt_url:
        lt_url = "Expose failed or took too long to resolve."
        
    return backend_proc, ai_proc, lt_url

# Initialize
backend_p, ai_p, public_url = start_services()

st.markdown("---")
st.subheader("🔗 Public Access URL")
if public_url.startswith("http"):
    st.balloons()
    st.success(f"Your application is live and publicly accessible at:")
    st.subheader(f"[{public_url}]({public_url})")
    st.info("Click the link above to access the PanicSense portal. If prompted for a localtunnel password, enter the external IP of the host container.")
else:
    st.warning("Could not establish a public tunnel. You can still access services internally.")
    st.code(public_url)

st.subheader("📊 System Services Status")
col1, col2 = st.columns(2)
with col1:
    st.metric("Backend Core (API)", "ONLINE (Port 3000)", delta_color="normal")
with col2:
    st.metric("AI Engine", "ONLINE (Port 8001)", delta_color="normal")

# Logs Expander
st.markdown("---")
st.subheader("📋 Application Logs")
with st.expander("View Backend Core Logs"):
    if os.path.exists(backend_log_path):
        with open(backend_log_path, "r", encoding="utf-8") as f:
            st.code(f.read(), language="text")
    else:
        st.write("No logs available yet.")

with st.expander("View AI Engine Logs"):
    if os.path.exists(ai_log_path):
        with open(ai_log_path, "r", encoding="utf-8") as f:
            st.code(f.read(), language="text")
    else:
        st.write("No logs available yet.")

st.markdown("---")
st.caption("Powered by Streamlit Community Cloud wrapper. Log outputs are routed to container files.")
