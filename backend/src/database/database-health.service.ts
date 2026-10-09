import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';

export interface DatabaseHealth {
  status: 'up' | 'down';
  state: string;
  database?: string;
  host?: string;
  latencyMs?: number;
  error?: string;
}

const STATE_LABELS: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

@Injectable()
export class DatabaseHealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async check(): Promise<DatabaseHealth> {
    const started = Date.now();
    try {
      const state = this.connection.readyState;
      if (state !== ConnectionStates.connected) {
        return { status: 'down', state: STATE_LABELS[state] ?? `unknown(${state})` };
      }
      const admin = this.connection.db?.admin();
      await admin?.ping();
      return {
        status: 'up',
        state: STATE_LABELS[state] ?? 'connected',
        database: this.connection.name,
        host: this.connection.host,
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      return {
        status: 'down',
        state: STATE_LABELS[this.connection.readyState] ?? 'unknown',
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}
