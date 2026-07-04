// Logger utility for ThinkRoom AI Frontend
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default log level: 'info' in production, 'debug' in development
const isDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const currentLevel: LogLevel = isDev ? 'debug' : 'info';

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
};

const formatMessage = (level: LogLevel, namespace: string, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${namespace}]: ${message}`;
};

export const logger = {
  debug(namespace: string, message: string, ...args: any[]) {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', namespace, message), ...args);
    }
  },

  info(namespace: string, message: string, ...args: any[]) {
    if (shouldLog('info')) {
      console.info(formatMessage('info', namespace, message), ...args);
    }
  },

  warn(namespace: string, message: string, ...args: any[]) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', namespace, message), ...args);
    }
  },

  error(namespace: string, message: string, ...args: any[]) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', namespace, message), ...args);
    }
  }
};
