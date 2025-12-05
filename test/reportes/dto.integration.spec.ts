/**
 * Integration tests for Reportes DTOs
 * These tests import real classes to ensure coverage
 */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateReporteDto,
  TipoEntidadReporte,
  MotivoReporte,
} from '../../src/reportes/dto/create-reporte.dto';

describe('Reportes DTOs (Integration)', () => {
  describe('CreateReporteDto', () => {
    const validDto = {
      tipoEntidad: TipoEntidadReporte.USUARIO,
      entidadId: 'user-123',
      motivo: MotivoReporte.CONTENIDO_SPAM,
      descripcion: 'This user is sending spam messages to all users in the platform repeatedly.',
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(CreateReporteDto, validDto);

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should pass validation with all optional fields', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        reportedUserId: 'user-456',
        evidenciaUrl: 'https://example.com/evidence.png',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    // TipoEntidad validation
    it('should fail validation with invalid tipoEntidad', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        tipoEntidad: 'INVALID_TYPE',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('tipoEntidad');
    });

    it('should fail validation with missing tipoEntidad', async () => {
      const { tipoEntidad, ...withoutTipo } = validDto;
      const dto = plainToInstance(CreateReporteDto, withoutTipo);

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    // EntidadId validation
    it('should fail validation with empty entidadId', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        entidadId: '',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('entidadId');
    });

    it('should fail validation with missing entidadId', async () => {
      const { entidadId, ...withoutEntidadId } = validDto;
      const dto = plainToInstance(CreateReporteDto, withoutEntidadId);

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    // Motivo validation
    it('should fail validation with invalid motivo', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        motivo: 'INVALID_MOTIVO',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('motivo');
    });

    it('should fail validation with missing motivo', async () => {
      const { motivo, ...withoutMotivo } = validDto;
      const dto = plainToInstance(CreateReporteDto, withoutMotivo);

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    // Descripcion validation
    it('should fail validation with too short descripcion', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        descripcion: 'Too short',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('descripcion');
    });

    it('should fail validation with too long descripcion', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        descripcion: 'A'.repeat(1001),
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('descripcion');
    });

    it('should fail validation with empty descripcion', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        descripcion: '',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('descripcion');
    });

    it('should pass validation with exactly 20 characters descripcion', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        descripcion: 'A'.repeat(20),
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should pass validation with exactly 1000 characters descripcion', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        descripcion: 'A'.repeat(1000),
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    // EvidenciaUrl validation
    it('should fail validation with invalid URL format', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        evidenciaUrl: 'not-a-valid-url',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('evidenciaUrl');
    });

    it('should pass validation with valid URL', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        evidenciaUrl: 'https://example.com/evidence/image.png',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    // All TipoEntidad enum values
    it('should accept TUTORIA as tipoEntidad', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        tipoEntidad: TipoEntidadReporte.TUTORIA,
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept MATERIAL as tipoEntidad', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        tipoEntidad: TipoEntidadReporte.MATERIAL,
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept COMENTARIO_FORO as tipoEntidad', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        tipoEntidad: TipoEntidadReporte.COMENTARIO_FORO,
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept GRUPO_CHAT as tipoEntidad', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        ...validDto,
        tipoEntidad: TipoEntidadReporte.GRUPO_CHAT,
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    // All MotivoReporte enum values
    it('should accept all motivo enum values', async () => {
      const motivos = Object.values(MotivoReporte);

      for (const motivo of motivos) {
        const dto = plainToInstance(CreateReporteDto, {
          ...validDto,
          motivo,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('TipoEntidadReporte Enum', () => {
    it('should have TUTORIA value', () => {
      expect(TipoEntidadReporte.TUTORIA).toBe('TUTORIA');
    });

    it('should have USUARIO value', () => {
      expect(TipoEntidadReporte.USUARIO).toBe('USUARIO');
    });

    it('should have MATERIAL value', () => {
      expect(TipoEntidadReporte.MATERIAL).toBe('MATERIAL');
    });

    it('should have COMENTARIO_FORO value', () => {
      expect(TipoEntidadReporte.COMENTARIO_FORO).toBe('COMENTARIO_FORO');
    });

    it('should have GRUPO_CHAT value', () => {
      expect(TipoEntidadReporte.GRUPO_CHAT).toBe('GRUPO_CHAT');
    });

    it('should have exactly 5 values', () => {
      expect(Object.keys(TipoEntidadReporte).length).toBe(5);
    });
  });

  describe('MotivoReporte Enum', () => {
    it('should have CONTENIDO_SPAM value', () => {
      expect(MotivoReporte.CONTENIDO_SPAM).toBe('CONTENIDO_SPAM');
    });

    it('should have CONTENIDO_OFENSIVO value', () => {
      expect(MotivoReporte.CONTENIDO_OFENSIVO).toBe('CONTENIDO_OFENSIVO');
    });

    it('should have VIOLACION_DERECHOS_AUTOR value', () => {
      expect(MotivoReporte.VIOLACION_DERECHOS_AUTOR).toBe('VIOLACION_DERECHOS_AUTOR');
    });

    it('should have INFORMACION_ERRONEA value', () => {
      expect(MotivoReporte.INFORMACION_ERRONEA).toBe('INFORMACION_ERRONEA');
    });

    it('should have AUSENCIA_TUTOR value', () => {
      expect(MotivoReporte.AUSENCIA_TUTOR).toBe('AUSENCIA_TUTOR');
    });

    it('should have COMPORTAMIENTO_INAPROPIADO value', () => {
      expect(MotivoReporte.COMPORTAMIENTO_INAPROPIADO).toBe('COMPORTAMIENTO_INAPROPIADO');
    });

    it('should have SUPLANTACION_IDENTIDAD value', () => {
      expect(MotivoReporte.SUPLANTACION_IDENTIDAD).toBe('SUPLANTACION_IDENTIDAD');
    });

    it('should have COBROS_INDEBIDOS value', () => {
      expect(MotivoReporte.COBROS_INDEBIDOS).toBe('COBROS_INDEBIDOS');
    });

    it('should have OTRO value', () => {
      expect(MotivoReporte.OTRO).toBe('OTRO');
    });

    it('should have exactly 9 values', () => {
      expect(Object.keys(MotivoReporte).length).toBe(9);
    });
  });
});
