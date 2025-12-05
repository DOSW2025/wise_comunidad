import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateReporteDto,
  TipoEntidadReporte,
  MotivoReporte,
} from '../../src/reportes/dto/create-reporte.dto';

describe('CreateReporteDto', () => {
  describe('Validaciones del formulario de reporte', () => {
    it('debe aceptar un reporte válido completo', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        reportedUserId: 'user-456',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion:
          'El tutor no se presentó a la sesión programada para hoy a las 10am sin previo aviso.',
        evidenciaUrl: 'https://ejemplo.com/captura.png',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar un reporte sin campos opcionales', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.USUARIO,
        entidadId: 'user-789',
        motivo: MotivoReporte.COMPORTAMIENTO_INAPROPIADO,
        descripcion:
          'El usuario envió mensajes ofensivos durante la sesión de tutoría.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar si falta tipoEntidad', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'Descripción válida con más de veinte caracteres.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('tipoEntidad');
    });

    it('debe rechazar si falta entidadId', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'Descripción válida con más de veinte caracteres.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'entidadId')).toBe(true);
    });

    it('debe rechazar si falta motivo', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        descripcion: 'Descripción válida con más de veinte caracteres.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'motivo')).toBe(true);
    });

    it('debe rechazar si falta descripcion', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'descripcion')).toBe(true);
    });

    it('debe rechazar descripción menor a 20 caracteres', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'Muy corta',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'descripcion')).toBe(true);
    });

    it('debe rechazar descripción mayor a 1000 caracteres', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'a'.repeat(1001),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'descripcion')).toBe(true);
    });

    it('debe aceptar descripción de exactamente 20 caracteres', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'a'.repeat(20),
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar descripción de exactamente 1000 caracteres', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'a'.repeat(1000),
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar tipoEntidad inválido', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: 'TIPO_INVALIDO',
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'Descripción válida con más de veinte caracteres.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('tipoEntidad');
    });

    it('debe rechazar motivo inválido', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo: 'MOTIVO_INVALIDO',
        descripcion: 'Descripción válida con más de veinte caracteres.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'motivo')).toBe(true);
    });

    it('debe rechazar URL de evidencia inválida', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'Descripción válida con más de veinte caracteres.',
        evidenciaUrl: 'no-es-una-url-valida',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'evidenciaUrl')).toBe(true);
    });

    it('debe aceptar URL de evidencia válida', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'Descripción válida con más de veinte caracteres.',
        evidenciaUrl: 'https://imgur.com/screenshot.png',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Tipos de entidad disponibles (RB-01)', () => {
    const tiposValidos = [
      TipoEntidadReporte.TUTORIA,
      TipoEntidadReporte.USUARIO,
      TipoEntidadReporte.MATERIAL,
      TipoEntidadReporte.COMENTARIO_FORO,
      TipoEntidadReporte.GRUPO_CHAT,
    ];

    it.each(tiposValidos)('debe aceptar el tipo: %s', async (tipo) => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: tipo,
        entidadId: 'entity-123',
        motivo: MotivoReporte.CONTENIDO_OFENSIVO,
        descripcion: 'Descripción válida con más de veinte caracteres.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Motivos de reporte disponibles (RB-01)', () => {
    const motivosValidos = [
      MotivoReporte.CONTENIDO_SPAM,
      MotivoReporte.CONTENIDO_OFENSIVO,
      MotivoReporte.VIOLACION_DERECHOS_AUTOR,
      MotivoReporte.INFORMACION_ERRONEA,
      MotivoReporte.AUSENCIA_TUTOR,
      MotivoReporte.COMPORTAMIENTO_INAPROPIADO,
      MotivoReporte.SUPLANTACION_IDENTIDAD,
      MotivoReporte.COBROS_INDEBIDOS,
      MotivoReporte.OTRO,
    ];

    it.each(motivosValidos)('debe aceptar el motivo: %s', async (motivo) => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo,
        descripcion: 'Descripción válida con más de veinte caracteres.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Campo reportedUserId opcional', () => {
    it('debe aceptar reporte sin reportedUserId', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.MATERIAL,
        entidadId: 'material-123',
        motivo: MotivoReporte.VIOLACION_DERECHOS_AUTOR,
        descripcion: 'Material con contenido copiado de terceros sin autorización.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar reporte con reportedUserId válido', async () => {
      const dto = plainToInstance(CreateReporteDto, {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        reportedUserId: 'user-456',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'El tutor no se presentó a la sesión programada.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
