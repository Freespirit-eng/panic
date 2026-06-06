const { spawn } = require('child_process');

console.log('🚀 Starting PanicSense services on Render...');

// 1. Start Express Backend
const backend = spawn('node', ['dist/server.cjs'], {
  env: process.env,
  stdio: 'inherit'
});

backend.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code || 0);
});

// 2. Start AI Engine
const aiEngine = spawn('node', ['dist/ai-engine.cjs'], {
  env: process.env,
  stdio: 'inherit'
});

aiEngine.on('exit', (code) => {
  console.log(`AI Engine process exited with code ${code}`);
});

// Clean up child processes on exit
process.on('SIGTERM', () => {
  backend.kill();
  aiEngine.kill();
});

process.on('SIGINT', () => {
  backend.kill();
  aiEngine.kill();
});
