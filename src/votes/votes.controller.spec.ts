import { VotesController } from './votes.controller';
import { BadRequestException } from '@nestjs/common';

describe('VotesController', () => {
  let controller: VotesController;
  const mockService = {
    vote: jest.fn(),
    getCounts: jest.fn(),
  };

  beforeEach(() => {
    mockService.vote.mockReset();
    mockService.getCounts.mockReset();
    controller = new VotesController(mockService as any);
  });

  it('throws when x-user-id header is missing', async () => {
    await expect(controller.vote('r1', undefined as any, { vote: 'useful' } as any)).rejects.toThrow(BadRequestException);
  });

  it('throws when payload is invalid', async () => {
    await expect(controller.vote('r1', 'user1', { } as any)).rejects.toThrow(BadRequestException);
  });

  it('returns idempotent result when service reports no update', async () => {
    mockService.vote.mockReturnValue({ updated: false, counts: { useful: 1, notUseful: 0 } });
    const res = await controller.vote('r1', 'user1', { vote: 'useful' } as any);
    expect(res).toEqual({ status: 'ok', message: 'Sin cambio (idempotente)', counts: { useful: 1, notUseful: 0 } });
  });

  it('returns recorded result when service reports update', async () => {
    mockService.vote.mockReturnValue({ updated: true, counts: { useful: 2, notUseful: 0 }, prev: 'none' });
    const res = await controller.vote('r1', 'user1', { vote: 'useful' } as any);
    expect(res).toEqual({ status: 'ok', message: 'Voto registrado', counts: { useful: 2, notUseful: 0 }, prev: 'none' });
  });

  it('returns counts from getCounts', () => {
    mockService.getCounts.mockReturnValue({ useful: 5, notUseful: 1 });
    const res = controller.getCounts('r1');
    expect(res).toEqual({ status: 'ok', counts: { useful: 5, notUseful: 1 } });
  });
});
