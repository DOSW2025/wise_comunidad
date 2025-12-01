import { Injectable, Logger } from '@nestjs/common';
import { VotesGateway } from './votes.gateway';
import { ResponsesService } from '../responses/responses.service';

export type VoteState = 'useful' | 'not_useful' | 'none';

interface ResponseVotes {
  useful: number;
  notUseful: number;
  userVotes: Map<string, VoteState>;
}

@Injectable()
export class VotesService {
  private readonly logger = new Logger(VotesService.name);
  private votes = new Map<string, ResponseVotes>();

  constructor(private readonly gateway: VotesGateway, private readonly responses: ResponsesService) {}

  private ensureResponseBucket(responseId: string): ResponseVotes {
    let b = this.votes.get(responseId);
    if (!b) {
      b = { useful: 0, notUseful: 0, userVotes: new Map() };
      this.votes.set(responseId, b);
    }
    return b;
  }

  getCounts(responseId: string) {
    const b = this.votes.get(responseId);
    if (!b) return { useful: 0, notUseful: 0 };
    return { useful: b.useful, notUseful: b.notUseful };
  }

  vote(responseId: string, userId: string, newState: VoteState) {
    if (!userId) {
      this.logger.warn('Missing userId for vote attempt');
      throw new Error('Missing user id');
    }

    // validate existence of response
    if (!this.responses.exists(responseId)) {
      this.logger.warn(`Attempt to vote on non-existent response ${responseId} by ${userId}`);
      const err: any = new Error('Response not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const bucket = this.ensureResponseBucket(responseId);
    const prev = bucket.userVotes.get(userId) ?? 'none';

    // idempotency: same state -> no-op
    if (prev === newState) {
      this.logger.warn(`Idempotent vote attempt by ${userId} on ${responseId} state=${newState}`);
      return { updated: false, counts: { useful: bucket.useful, notUseful: bucket.notUseful }, prev };
    }

    // apply transition
    // decrement prev
    switch (prev) {
      case 'useful':
        bucket.useful = Math.max(0, bucket.useful - 1);
        break;
      case 'not_useful':
        bucket.notUseful = Math.max(0, bucket.notUseful - 1);
        break;
      case 'none':
      default:
        break;
    }

    // increment new
    switch (newState) {
      case 'useful':
        bucket.useful += 1;
        break;
      case 'not_useful':
        bucket.notUseful += 1;
        break;
      case 'none':
      default:
        break;
    }

    if (newState === 'none') {
      bucket.userVotes.delete(userId);
    } else {
      bucket.userVotes.set(userId, newState);
    }

    const counts = { useful: bucket.useful, notUseful: bucket.notUseful };
    this.logger.log(`Vote updated for response=${responseId} user=${userId} ${prev} -> ${newState}`);

    // emit realtime event
    try {
      this.gateway.emitVote(responseId, counts);
    } catch (e) {
      this.logger.error('Failed to emit realtime event', e as any);
    }

    return { updated: true, counts, prev };
  }
}
