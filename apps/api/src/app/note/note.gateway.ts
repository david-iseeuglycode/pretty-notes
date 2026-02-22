import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NoteUpdateEvent } from '@pretty-notes/shared';
import { NoteService } from './note.service.js';

@WebSocketGateway({ cors: { origin: '*' } })
export class NoteGateway {
  @WebSocketServer() server!: Server;

  constructor(private noteService: NoteService) {}

  @SubscribeMessage('joinNote')
  handleJoin(
    @MessageBody() noteId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`note:${noteId}`);
  }

  @SubscribeMessage('updateNote')
  async handleUpdate(
    @MessageBody() event: NoteUpdateEvent,
    @ConnectedSocket() client: Socket,
  ) {
    await this.noteService.updateContent(event.noteId, event.content);
    client.to(`note:${event.noteId}`).emit('noteUpdated', { content: event.content });
  }
}
