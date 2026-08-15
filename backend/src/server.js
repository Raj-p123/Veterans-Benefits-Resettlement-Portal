import http from 'http';
import app from './app.js';
import { config } from './config/environment.js';
import { connectDB } from './config/database.js';
import { socketService } from './services/socketService.js';

const server = http.createServer(app);

// Initialize Socket.IO with the shared HTTP server
socketService.init(server);

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Start HTTP Listener
  server.listen(config.port, () => {
    console.log('====================================================');
    console.log(` Veterans Benefits & Resettlement Portal - Backend API `);
    console.log(` Environment : ${config.nodeEnv}`);
    console.log(` Server URL  : http://localhost:${config.port}`);
    console.log(` Health Check: http://localhost:${config.port}/api/health`);
    console.log(` Real-Time   : Socket.IO Engine Active`);
    console.log('====================================================');
  });
};

// Graceful Shutdown Handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection at]:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]:', error);
});

startServer();
