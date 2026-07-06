import helmet from 'helmet';
import compression from 'compression';

export const securityMiddleware = [
  helmet(),
  compression()
];
