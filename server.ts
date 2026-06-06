import { createServer } from 'http';
import dotenv from 'dotenv';
import app from './src/backend-core/app';
import { socketService } from './src/backend-core/services/socket.service';
import { startWorkers } from './src/backend-core/queue/aiWorker';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Create HTTP Server wrapping Express App
const httpServer = createServer(app);

// Initialize Socket.IO with WebSocket Handlers
socketService.initialize(httpServer);

// Start BullMQ AI workers (no-op if REDIS_URL not set)
startWorkers();

// Boot Server
httpServer.listen(PORT, () => {
  console.log(`PanicSense Foundation Server running on port ${PORT}`);
  console.log(`  API   → http://localhost:${PORT}/api`);
  console.log(`  SQLite → panicsense.db`);
});
