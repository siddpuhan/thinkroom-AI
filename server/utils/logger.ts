// Logger utility for ThinkRoom AI Backend

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

const shouldLog = (level) => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
};

const formatMessage = (level, namespace, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${namespace}]: ${message}`;
};

export const logger = {
  debug(namespace, message, ...args) {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', namespace, message), ...args);
    }
  },

  info(namespace, message, ...args) {
    if (shouldLog('info')) {
      console.info(formatMessage('info', namespace, message), ...args);
    }
  },

  warn(namespace, message, ...args) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', namespace, message), ...args);
    }
  },

  error(namespace, message, ...args) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', namespace, message), ...args);
    }
  }
};
