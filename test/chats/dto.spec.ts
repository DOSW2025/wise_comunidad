import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateGroupDto } from '../../src/chats/dto/creategroup.dto';
import { SendMessageDto } from '../../src/chats/dto/send-message.dto';

describe('CreateGroupDto', () => {
  describe('Validación de nombre', () => {
    it('debe aceptar un nombre válido', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Grupo de Cálculo',
        emails: ['user@mail.escuelaing.edu.co'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar nombre vacío', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: '',
        emails: ['user@mail.escuelaing.edu.co'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'nombre')).toBe(true);
    });

    it('debe rechazar nombre mayor a 30 caracteres', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Este es un nombre muy largo que supera los treinta caracteres permitidos',
        emails: ['user@mail.escuelaing.edu.co'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'nombre')).toBe(true);
    });
  });

  describe('Validación de emails', () => {
    it('debe aceptar un array con emails válidos', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Grupo Test',
        emails: [
          'user1@mail.escuelaing.edu.co',
          'user2@mail.escuelaing.edu.co',
        ],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar array vacío de emails', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Grupo Test',
        emails: [],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'emails')).toBe(true);
    });

    it('debe rechazar emails inválidos', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Grupo Test',
        emails: ['no-es-un-email'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'emails')).toBe(true);
    });

    it('debe rechazar si emails no es un array', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Grupo Test',
        emails: 'user@mail.escuelaing.edu.co',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('debe aceptar múltiples emails válidos', async () => {
      const dto = plainToInstance(CreateGroupDto, {
        nombre: 'Grupo Grande',
        emails: [
          'user1@mail.escuelaing.edu.co',
          'user2@mail.escuelaing.edu.co',
          'user3@mail.escuelaing.edu.co',
          'user4@mail.escuelaing.edu.co',
        ],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});

describe('SendMessageDto', () => {
  describe('Validación de grupoId', () => {
    it('debe aceptar un UUID válido', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '123e4567-e89b-12d3-a456-426614174000',
        contenido: 'Mensaje de prueba',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar grupoId vacío', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '',
        contenido: 'Mensaje de prueba',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'grupoId')).toBe(true);
    });

    it('debe rechazar grupoId no UUID', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: 'no-es-uuid',
        contenido: 'Mensaje de prueba',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'grupoId')).toBe(true);
    });
  });

  describe('Validación de contenido', () => {
    it('debe aceptar contenido válido', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '123e4567-e89b-12d3-a456-426614174000',
        contenido: 'Hola a todos!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar contenido vacío', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '123e4567-e89b-12d3-a456-426614174000',
        contenido: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'contenido')).toBe(true);
    });

    it('debe aceptar mensajes largos', async () => {
      const dto = plainToInstance(SendMessageDto, {
        grupoId: '123e4567-e89b-12d3-a456-426614174000',
        contenido: 'Este es un mensaje muy largo que contiene mucha información relevante para el grupo de estudio sobre el tema de matemáticas avanzadas.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
