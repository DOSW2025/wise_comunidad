import { ResponsesController } from './responses.controller';

describe('ResponsesController', () => {
  let controller: ResponsesController;
  const mockService = {
    create: jest.fn(),
    get: jest.fn(),
    list: jest.fn(),
  };

  beforeEach(() => {
    mockService.create.mockReset();
    mockService.get.mockReset();
    mockService.list.mockReset();
    controller = new ResponsesController(mockService as any);
  });

  it('creates a response', () => {
    mockService.create.mockReturnValue({ id: 'r1', content: 'demo' });
    const res = controller.create({ id: 'r1', content: 'demo' } as any);
    expect(mockService.create).toHaveBeenCalledWith('r1', 'demo');
    expect(res).toEqual({ status: 'ok', response: { id: 'r1', content: 'demo' } });
  });

  it('returns error when creating without id', () => {
    const res = controller.create({} as any);
    expect(res).toEqual({ status: 'error', message: 'id es obligatorio' });
  });

  it('gets an existing response', () => {
    mockService.get.mockReturnValue({ id: 'r1' });
    const res = controller.get('r1');
    expect(mockService.get).toHaveBeenCalledWith('r1');
    expect(res).toEqual({ status: 'ok', response: { id: 'r1' } });
  });

  it('returns not found for missing response', () => {
    mockService.get.mockReturnValue(undefined);
    const res = controller.get('r2');
    expect(res).toEqual({ status: 'no_encontrado', message: 'Respuesta no encontrada' });
  });

  it('lists responses', () => {
    mockService.list.mockReturnValue([{ id: 'r1' }]);
    const res = controller.list();
    expect(res).toEqual({ status: 'ok', responses: [{ id: 'r1' }] });
  });
});
