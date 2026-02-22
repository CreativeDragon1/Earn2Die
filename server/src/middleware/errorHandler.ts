import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err.message);
  console.error(err.stack);

  if (err.name === 'ZodError') {
    res.status(400).json({ error: 'Validation error', details: err.message });
    return;
  }

  if (err.message.includes('Unique constraint')) {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
