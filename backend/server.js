const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = parseInt(process.env.PORT, 10) || 5000;

async function startServer() {
  console.log('----------------------------------------------------');
  console.log('StockSense Enterprise IMS — Backend Server Bootstrapping');
  console.log('----------------------------------------------------');

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('[Warning] Server starting with database in disconnected/retry mode.');
  }

  const server = app.listen(PORT, () => {
    console.log(`[HTTP Server] StockSense API listening on port ${PORT}`);
    console.log(`[HTTP Server] Health check available at http://localhost:${PORT}/api/health`);
    console.log(`[HTTP Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down StockSense server gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
