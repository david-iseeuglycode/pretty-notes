import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { NoteUpdateEvent } from '@pretty-notes/shared';

@Injectable({ providedIn: 'root' })

export class NoteSocketService {
  private socket: Socket = io(
    {
      transports: ['websocket']
      , autoConnect: false
    }
  );

  joinNote(noteId: number): void {
    if (this.socket.connected) {
      this.socket.emit('joinNote', noteId);
    } else {
      this.socket.once(
        'connect'
        , () => {
          this.socket.emit(
            'joinNote'
            , noteId
          );
        }
      );

      this.socket.connect();
    }
  }

  sendUpdate(event: NoteUpdateEvent): void {
    this.socket.emit(
      'updateNote'
      , event
    );
  }

  onNoteUpdated(callback: (
    data: { content: string }
  ) => void): void {
    this.socket.on(
      'noteUpdated'
      , callback
    );
  }

  offNoteUpdated(): void {
    this.socket.off('noteUpdated');
    this.socket.off('connect');
    this.socket.disconnect();
  }
}
