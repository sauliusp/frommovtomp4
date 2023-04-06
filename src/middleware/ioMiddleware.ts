import { Server as SocketIOServer } from 'socket.io';
import { Request, Response, NextFunction } from 'express';

export function ioMiddleware(io: SocketIOServer) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.io = io;
    next();
  };
}
