import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private readonly serverUrl: string = 'http://localhost:3000';
  private newLeadSubject = new Subject<any>();

  constructor() {
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('🟢 Connected to Socket.IO server:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Disconnected from Socket.IO server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket.IO connection error:', error.message);
    });

    // Listen for new-lead events and pipe to Subject
    this.socket.on('new-lead', (leadData: any) => {
      console.log('⚡ Received real-time new-lead via Socket.IO:', leadData);
      this.newLeadSubject.next(leadData);
    });
  }

  /**
   * Observable stream that emits whenever a new lead arrives
   */
  onNewLead(): Observable<any> {
    return this.newLeadSubject.asObservable();
  }

  /**
   * Listen to any custom socket event
   */
  on(eventName: string, callback: (...args: any[]) => void): void {
    this.socket.on(eventName, callback);
  }

  /**
   * Emit custom socket event
   */
  emit(eventName: string, ...args: any[]): void {
    this.socket.emit(eventName, ...args);
  }

  /**
   * Manually reconnect if disconnected
   */
  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
