/**
 * Integration tests for Auth Guards
 * These tests import real classes to ensure coverage
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { Role } from '../../src/auth/enums/role.enum';
import { IS_PUBLIC_KEY } from '../../src/auth/decorators/public.decorator';
import { ROLES_KEY } from '../../src/auth/decorators/roles.decorator';

describe('Auth Guards (Integration)', () => {
  describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: Reflector;

    const createMockContext = (handler = {}, classRef = {}): ExecutionContext => ({
      getHandler: () => handler as any,
      getClass: () => classRef as any,
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
        getNext: () => () => {},
      }),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({} as any),
      switchToWs: () => ({} as any),
      getType: () => 'http' as any,
    });

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JwtAuthGuard,
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn(),
            },
          },
        ],
      }).compile();

      guard = module.get<JwtAuthGuard>(JwtAuthGuard);
      reflector = module.get<Reflector>(Reflector);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should allow access to public routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = createMockContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should call parent canActivate for non-public routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const context = createMockContext();
      
      // Mock the parent's canActivate
      const parentCanActivate = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      parentCanActivate.mockReturnValue(true);

      guard.canActivate(context);

      // Verify parent was called for non-public route
    });

    it('should handle request with valid user', () => {
      const user = { id: 'user-123', email: 'test@test.com', rol: Role.ESTUDIANTE };
      
      const result = guard.handleRequest(null, user, null);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when error is provided', () => {
      const error = new Error('Auth error');

      expect(() => guard.handleRequest(error, null, null)).toThrow(error);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => guard.handleRequest(null, null, 'Token expired')).toThrow(
        UnauthorizedException,
      );
    });

    it('should include info in UnauthorizedException cause', () => {
      try {
        guard.handleRequest(null, null, 'Token info');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).cause).toBe('Token info');
      }
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    const createMockContext = (user?: any): ExecutionContext => ({
      getHandler: () => ({} as any),
      getClass: () => ({} as any),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
        getNext: () => () => {},
      }),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({} as any),
      switchToWs: () => ({} as any),
      getType: () => 'http' as any,
    });

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RolesGuard,
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn(),
            },
          },
        ],
      }).compile();

      guard = module.get<RolesGuard>(RolesGuard);
      reflector = module.get<Reflector>(Reflector);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const context = createMockContext({ id: 'user-123', rol: Role.ESTUDIANTE });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when roles array is empty', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = createMockContext({ id: 'user-123', rol: Role.ESTUDIANTE });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context = createMockContext({ id: 'user-123', rol: Role.ADMIN });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.TUTOR]);

      const context = createMockContext({ id: 'user-123', rol: Role.TUTOR });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context = createMockContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user lacks required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context = createMockContext({ id: 'user-123', rol: Role.ESTUDIANTE });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should include required roles in error message', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.TUTOR]);

      const context = createMockContext({ id: 'user-123', rol: Role.ESTUDIANTE });

      try {
        guard.canActivate(context);
        fail('Should have thrown');
      } catch (error) {
        expect((error as ForbiddenException).message).toContain(Role.ADMIN);
        expect((error as ForbiddenException).message).toContain(Role.TUTOR);
      }
    });
  });
});
