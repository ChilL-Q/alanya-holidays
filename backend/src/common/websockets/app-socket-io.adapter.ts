import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import type { Server, ServerOptions } from 'socket.io';
import {
  createCorsOriginDelegate,
  parseAllowedOrigins,
} from '../security/security.config';

export class AppSocketIoAdapter extends IoAdapter {
  constructor(app: INestApplicationContext) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const allowedOrigins = parseAllowedOrigins();

    const server = super.createIOServer(port, {
      ...options,
      cors: {
        ...options?.cors,
        credentials: true,
        origin: createCorsOriginDelegate(allowedOrigins),
      },
    }) as Server;

    return server;
  }
}
