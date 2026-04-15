import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  Server,
  Socket,
} from 'socket.io';
import type {
  NoteUpdateEvent,
} from '@pretty-notes/shared';
import {
  NoteService,
} from './note.service.js';
import {
  WsCurrentUser,
} from '../auth/current-user.decorator.js';
import type {
  JwtUser,
} from '../auth/current-user.decorator.js';
import {
  UseGuards,
} from '@nestjs/common';
import {
  WsGuard,
} from '../auth/ws.guard.js';


@WebSocketGateway(
  {
    cors: {
      origin: process.env['CORS_ORIGIN'] ?? '*',
    },
  },
)
export class NoteGateway
{
  @WebSocketServer() server!: Server;


  constructor(
    private noteService: NoteService,
  ) {
  }


  @SubscribeMessage(
    'joinNote',
  )
  @UseGuards(
    WsGuard,
  )
  async handleJoin(
    @MessageBody() noteId: number,
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: JwtUser,
  ): Promise<void> {
    await this.noteService.assertUserCanAccessNote(
      noteId,
      user.sub,
    );

    client.join(
      `note:${noteId}`,
    );
  }

  @SubscribeMessage(
    'updateNote',
  )
  @UseGuards(
    WsGuard,
  )
  async handleUpdate(
    @MessageBody() event: NoteUpdateEvent,
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: JwtUser,
  ): Promise<void> {
    await this.noteService.updateContent(
      event.noteId,
      user.sub,
      event.content,
    );
    client.to(
      `note:${event.noteId}`,
    ).emit(
      'noteUpdated',
      {
        content: event.content,
      },
    );
  }
}
