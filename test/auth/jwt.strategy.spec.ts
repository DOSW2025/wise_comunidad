import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy, JwtPayload } from '../../src/auth/strategies/jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../../src/auth/enums/role.enum';

// Mock de envs
jest.mock('../../src/config', () => ({
  envs: {
    jwtSecret: 'test-secret-key-for-testing',
  },
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('debe estar definido', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate()', () => {
    it('debe validar un payload correcto', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@mail.escuelaing.edu.co',
        rol: Role.ESTUDIANTE,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@mail.escuelaing.edu.co',
        rol: Role.ESTUDIANTE,
      });
    });

    it('debe validar payload con rol TUTOR', async () => {
      const payload: JwtPayload = {
        sub: 'tutor-456',
        email: 'tutor@mail.escuelaing.edu.co',
        rol: Role.TUTOR,
      };

      const result = await strategy.validate(payload);

      expect(result.rol).toBe(Role.TUTOR);
    });

    it('debe validar payload con rol ADMIN', async () => {
      const payload: JwtPayload = {
        sub: 'admin-789',
        email: 'admin@mail.escuelaing.edu.co',
        rol: Role.ADMIN,
      };

      const result = await strategy.validate(payload);

      expect(result.rol).toBe(Role.ADMIN);
    });

    it('debe lanzar UnauthorizedException si falta sub', async () => {
      const payload = {
        email: 'test@mail.escuelaing.edu.co',
        rol: Role.ESTUDIANTE,
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Invalid token payload',
      );
    });

    it('debe lanzar UnauthorizedException si falta email', async () => {
      const payload = {
        sub: 'user-123',
        rol: Role.ESTUDIANTE,
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si falta rol', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@mail.escuelaing.edu.co',
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si el payload está vacío', async () => {
      const payload = {} as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
