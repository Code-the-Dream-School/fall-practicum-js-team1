import { type Request, type Response } from 'express';

// Simple controller example
const getHello = (req: Request, res: Response): void => {
  res.json({
    message: 'Hello World',
  });
};

export { getHello };
