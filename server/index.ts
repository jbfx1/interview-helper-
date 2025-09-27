import { createApp, setupGracefulShutdown, initializeServices } from './app';
import { serverConfig, isProduction } from './config';
import { logger } from './utils/logger';

const port = serverConfig.PORT;
const app = createApp();

// Initialize services
initializeServices();

const server = app.listen(port, () => {
  logger.logStartup(port, serverConfig.NODE_ENV);
  
  if (!isProduction()) {
    logger.info('Development mode active', {
      cors: 'Allow all origins',
      rateLimiting: 'Standard limits',
      logging: 'Full request logging',
    });
  }
});

// Setup graceful shutdown
setupGracefulShutdown(server);

// Handle server errors
server.on('error', (error: Error) => {
  logger.error('Server error', {
    error: error.message,
    stack: error.stack,
  });
});

export default server;
