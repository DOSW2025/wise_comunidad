/**
 * Integration tests for Chats DTOs
 * These tests import real classes to ensure coverage
 */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateGroupDto } from '../../src/chats/dto/creategroup.dto';
import { SendMessageDto } from '../../src/chats/dto/send-message.dto';

describe('Chats DTOs (Integration)', () => {
  describe('CreateGroupDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Test Group',
        emails: ['user1@test.com', 'user2@test.com'],
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation with empty nombre', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: '',
        emails: ['user@test.com'],
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
    });

    it('should fail validation when nombre exceeds max length', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'A'.repeat(31),
        emails: ['user@test.com'],
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
    });

    it('should fail validation with empty emails array', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Test Group',
        emails: [],
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('emails');
    });

    it('should fail validation with invalid email format', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Test Group',
        emails: ['not-an-email'],
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('emails');
    });

    it('should fail validation with missing nombre', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        emails: ['user@test.com'],
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with missing emails', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Test Group',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass validation with exactly 30 characters nombre', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'A'.repeat(30),
        emails: ['user@test.com'],
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should pass validation with multiple valid emails', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Test Group',
        emails: [
          'user1@test.com',
          'user2@example.org',
          'user3@domain.edu',
        ],
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('SendMessageDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '550e8400-e29b-41d4-a716-446655440000',
        contenido: 'Hello World',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation with empty grupoId', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '',
        contenido: 'Hello',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('grupoId');
    });

    it('should fail validation with invalid UUID format', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: 'not-a-uuid',
        contenido: 'Hello',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('grupoId');
    });

    it('should fail validation with empty contenido', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '550e8400-e29b-41d4-a716-446655440000',
        contenido: '',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('contenido');
    });

    it('should fail validation with missing grupoId', async () => {
      const dto = plainToInstance(SendMessageDto, {
        contenido: 'Hello',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with missing contenido', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass validation with long message content', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '550e8400-e29b-41d4-a716-446655440000',
        contenido: 'A'.repeat(1000),
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should pass validation with UUID v4 format', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        contenido: 'Test message',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });
});

// Test exports from index
describe('Chats DTO Index Exports', () => {
  it('should export CreateGroupDto', () => {
    const { CreateGroupDto: ExportedDto } = require('../../src/chats/dto');
    expect(ExportedDto).toBeDefined();
  });

  it('should export SendMessageDto', () => {
    const { SendMessageDto: ExportedDto } = require('../../src/chats/dto');
    expect(ExportedDto).toBeDefined();
  });
});
