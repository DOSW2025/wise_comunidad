import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { Role } from '../../src/auth/enums/role.enum';
import { ROLES_KEY } from '../../src/auth/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (
    user: { id: string; email: string; rol: Role } | null,
  ): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('debe estar definido', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate()', () => {
    it('debe permitir acceso si no hay roles requeridos', () => {
      const context = createMockContext({
        id: 'user-123',
        email: 'test@mail.com',
        rol: Role.ESTUDIANTE,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('debe permitir acceso si los roles requeridos están vacíos', () => {
      const context = createMockContext({
        id: 'user-123',
        email: 'test@mail.com',
        rol: Role.ESTUDIANTE,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('debe permitir acceso si el usuario tiene el rol requerido', () => {
      const context = createMockContext({
        id: 'admin-123',
        email: 'admin@mail.com',
        rol: Role.ADMIN,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('debe permitir acceso si el usuario tiene uno de los roles requeridos', () => {
      const context = createMockContext({
        id: 'tutor-123',
        email: 'tutor@mail.com',
        rol: Role.TUTOR,
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.TUTOR]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('debe lanzar ForbiddenException si el usuario no tiene el rol requerido', () => {
      const context = createMockContext({
        id: 'user-123',
        email: 'user@mail.com',
        rol: Role.ESTUDIANTE,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Se requiere uno de los siguientes roles: admin',
      );
    });

    it('debe lanzar ForbiddenException si no hay usuario en la request', () => {
      const context = createMockContext(null);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Usuario no autenticado');
    });

    it('debe verificar los roles contra ROLES_KEY', () => {
      const context = createMockContext({
        id: 'user-123',
        email: 'user@mail.com',
        rol: Role.ESTUDIANTE,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('Roles permitidos', () => {
    it('ESTUDIANTE puede acceder a rutas de ESTUDIANTE', () => {
      const context = createMockContext({
        id: 'est-123',
        email: 'estudiante@mail.com',
        rol: Role.ESTUDIANTE,
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ESTUDIANTE]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('TUTOR puede acceder a rutas de TUTOR', () => {
      const context = createMockContext({
        id: 'tutor-123',
        email: 'tutor@mail.com',
        rol: Role.TUTOR,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TUTOR]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('ADMIN puede acceder a rutas de ADMIN', () => {
      const context = createMockContext({
        id: 'admin-123',
        email: 'admin@mail.com',
        rol: Role.ADMIN,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('ESTUDIANTE NO puede acceder a rutas de ADMIN', () => {
      const context = createMockContext({
        id: 'est-123',
        email: 'estudiante@mail.com',
        rol: Role.ESTUDIANTE,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('TUTOR NO puede acceder a rutas exclusivas de ADMIN', () => {
      const context = createMockContext({
        id: 'tutor-123',
        email: 'tutor@mail.com',
        rol: Role.TUTOR,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
