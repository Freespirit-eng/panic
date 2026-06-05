import { createServer } from 'http';
import dotenv from 'dotenv';
import app from './src/backend-core/app';
import { socketService } from './src/backend-core/services/socket.service';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Create HTTP Server wrapping Express App
const httpServer = createServer(app);

// Initialize Socket.IO with WebSocket Handlers
socketService.initialize(httpServer);

// Boot Server
httpServer.listen(PORT, () => {
  console.log(`PanicSense Foundation Server running on port ${PORT}`);
});
