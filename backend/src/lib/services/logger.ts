/**
 * Real-time logging service with WebSocket support
 * Broadcasts log events to connected clients
 */

import { EventEmitter } from 'events';
import { WebSocket } from 'ws';

export interface LogEvent {
  type: 'file-edit' | 'file-complete' | 'progress' | 'status' | 'error';
  file?: string;
  status?: string;
  message?: string;
  progress?: number;
  timestamp: number;
}

export class LoggerService extends EventEmitter {
  private clients: Set<WebSocket> = new Set();
  private logHistory: LogEvent[] = [];
  private maxHistorySize = 1000;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Forward all events to connected WebSocket clients
    this.on('log', (event: LogEvent) => {
      this.broadcastToClients(event);
      this.addToHistory(event);
    });
  }

  /**
   * Add a WebSocket client
   */
  addClient(ws: WebSocket): void {
    this.clients.add(ws);
    console.log(`[Logger] Client connected. Total clients: ${this.clients.size}`);

    // Send recent history to new client
    ws.send(JSON.stringify({
      type: 'history',
      logs: this.getRecentLogs(50),
    }));

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(ws);
      console.log(`[Logger] Client disconnected. Total clients: ${this.clients.size}`);
    });
  }

  /**
   * Log a file edit event
   */
  logFileEdit(file: string, status: 'editing' | 'done' = 'editing'): void {
    const event: LogEvent = {
      type: status === 'done' ? 'file-complete' : 'file-edit',
      file,
      status,
      timestamp: Date.now(),
    };
    this.emit('log', event);
    console.log(`[Logger] File ${status}: ${file}`);
  }

  /**
   * Log a progress update
   */
  logProgress(message: string, progress: number): void {
    const event: LogEvent = {
      type: 'progress',
      message,
      progress,
      timestamp: Date.now(),
    };
    this.emit('log', event);
    console.log(`[Logger] Progress ${progress}%: ${message}`);
  }

  /**
   * Log a status update
   */
  logStatus(message: string): void {
    const event: LogEvent = {
      type: 'status',
      message,
      timestamp: Date.now(),
    };
    this.emit('log', event);
    console.log(`[Logger] Status: ${message}`);
  }

  /**
   * Log an error
   */
  logError(message: string, error?: Error): void {
    const event: LogEvent = {
      type: 'error',
      message: error ? `${message}: ${error.message}` : message,
      timestamp: Date.now(),
    };
    this.emit('log', event);
    console.error(`[Logger] Error: ${event.message}`);
  }

  /**
   * Broadcast event to all connected clients
   */
  private broadcastToClients(event: LogEvent): void {
    const message = JSON.stringify(event);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('[Logger] Error sending to client:', error);
        }
      }
    });
  }

  /**
   * Add event to history
   */
  private addToHistory(event: LogEvent): void {
    this.logHistory.push(event);
    
    // Keep history size under limit
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100): LogEvent[] {
    return this.logHistory.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logHistory = [];
    console.log('[Logger] Log history cleared');
  }

  /**
   * Get client count
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

// Export singleton instance
export const logger = new LoggerService();
