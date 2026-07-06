import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
