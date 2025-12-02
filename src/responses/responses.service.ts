import { Injectable, Logger } from '@nestjs/common';

export interface ResponseRecord {
  id: string;
  content?: string;
  createdAt: Date;
}

@Injectable()
export class ResponsesService {
  private readonly logger = new Logger(ResponsesService.name);
  private responses = new Map<string, ResponseRecord>();

  exists(responseId: string): boolean {
    return this.responses.has(responseId);
  }

  create(responseId: string, content?: string): ResponseRecord {
    const rec: ResponseRecord = { id: responseId, content, createdAt: new Date() };
    this.responses.set(responseId, rec);
    this.logger.log(`Registered response ${responseId}`);
    return rec;
  }

  get(responseId: string): ResponseRecord | undefined {
    return this.responses.get(responseId);
  }

  // helper for tests / demos
  list(): ResponseRecord[] {
    return Array.from(this.responses.values());
  }
}
