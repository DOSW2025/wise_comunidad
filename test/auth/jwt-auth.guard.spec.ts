import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../src/auth/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('debe estar definido', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate()', () => {
    const createMockExecutionContext = (isPublic: boolean): ExecutionContext => {
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: 'user-123', email: 'test@mail.com', rol: 'estudiante' },
          }),
        }),
      } as unknown as ExecutionContext;

      // Mock del reflector
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

      return mockContext;
    };

    it('debe permitir acceso a rutas públicas', () => {
      const context = createMockExecutionContext(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('debe verificar el decorador @Public()', () => {
      const context = createMockExecutionContext(true);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('handleRequest()', () => {
    it('debe retornar el usuario si existe', () => {
      const mockUser = { id: 'user-123', email: 'test@mail.com' };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toEqual(mockUser);
    });

    it('debe lanzar error si hay error', () => {
      const mockError = new Error('Token error');

      expect(() => guard.handleRequest(mockError, null, null)).toThrow(mockError);
    });

    it('debe lanzar UnauthorizedException si no hay usuario', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        'Invalid or expired token',
      );
    });

    it('debe incluir info del error en la causa', () => {
      const mockInfo = { message: 'jwt expired' };

      try {
        guard.handleRequest(null, null, mockInfo);
        fail('Debería haber lanzado una excepción');
      } catch (error) {
        expect(error.options.cause).toEqual(mockInfo);
      }
    });
  });
});
