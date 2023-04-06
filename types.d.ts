import { Server as SocketIOServer } from 'socket.io';

declare module 'express-serve-static-core' {
  export interface Request {
    io: SocketIOServer;
  }
}
