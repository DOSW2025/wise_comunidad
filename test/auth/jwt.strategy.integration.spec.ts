/**
 * Integration tests for JwtStrategy
 * These tests import real classes to ensure coverage
 */
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy, JwtPayload } from '../../src/auth/strategies/jwt.strategy';
import { Role } from '../../src/auth/enums/role.enum';

// Mock envs before importing JwtStrategy
jest.mock('../../src/config', () => ({
  envs: {
    jwtSecret: 'test-secret-key-for-testing',
    port: 3000,
    databaseurl: 'postgresql://localhost:5432/test',
  },
}));

describe('JwtStrategy (Integration)', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object with valid payload', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@test.com',
        rol: Role.ESTUDIANTE,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@test.com',
        rol: Role.ESTUDIANTE,
      });
    });

    it('should throw UnauthorizedException when sub is missing', async () => {
      const payload = {
        email: 'test@test.com',
        rol: Role.ESTUDIANTE,
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when email is missing', async () => {
      const payload = {
        sub: 'user-123',
        rol: Role.ESTUDIANTE,
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when rol is missing', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@test.com',
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw with correct error message', async () => {
      const payload = {} as JwtPayload;

      try {
        await strategy.validate(payload);
        fail('Should have thrown');
      } catch (error) {
        expect((error as UnauthorizedException).message).toBe(
          'Invalid token payload',
        );
      }
    });

    it('should handle ADMIN role', async () => {
      const payload: JwtPayload = {
        sub: 'admin-123',
        email: 'admin@test.com',
        rol: Role.ADMIN,
      };

      const result = await strategy.validate(payload);

      expect(result.rol).toBe(Role.ADMIN);
    });

    it('should handle TUTOR role', async () => {
      const payload: JwtPayload = {
        sub: 'tutor-123',
        email: 'tutor@test.com',
        rol: Role.TUTOR,
      };

      const result = await strategy.validate(payload);

      expect(result.rol).toBe(Role.TUTOR);
    });
  });
});

describe('JwtPayload interface', () => {
  it('should accept valid payload structure', () => {
    const payload: JwtPayload = {
      sub: 'user-123',
      email: 'test@test.com',
      rol: Role.ESTUDIANTE,
    };

    expect(payload.sub).toBe('user-123');
    expect(payload.email).toBe('test@test.com');
    expect(payload.rol).toBe(Role.ESTUDIANTE);
  });
});
