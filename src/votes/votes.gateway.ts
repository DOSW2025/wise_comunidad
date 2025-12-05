import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class VotesGateway {
  private readonly logger = new Logger(VotesGateway.name);

  @WebSocketServer()
  server: Server;

  emitVote(responseId: string, counts: { useful: number; notUseful: number }) {
    this.logger.log(`Emitting vote event for ${responseId}`);
    // broadcast to all clients (in a real app, consider rooms)
    this.server?.emit('response:vote', { responseId, counts });
  }
}
