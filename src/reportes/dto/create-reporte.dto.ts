import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Tipos de entidad que pueden ser reportadas
 */
export enum TipoEntidadReporte {
  TUTORIA = 'TUTORIA',
  USUARIO = 'USUARIO',
  MATERIAL = 'MATERIAL',
  COMENTARIO_FORO = 'COMENTARIO_FORO',
  GRUPO_CHAT = 'GRUPO_CHAT',
}

/**
 * Motivos de reporte según las normas de la comunidad (RB-01)
 */
export enum MotivoReporte {
  // Contenido
  CONTENIDO_SPAM = 'CONTENIDO_SPAM',
  CONTENIDO_OFENSIVO = 'CONTENIDO_OFENSIVO',
  VIOLACION_DERECHOS_AUTOR = 'VIOLACION_DERECHOS_AUTOR',
  INFORMACION_ERRONEA = 'INFORMACION_ERRONEA',

  // Usuarios/Tutorías
  AUSENCIA_TUTOR = 'AUSENCIA_TUTOR',
  COMPORTAMIENTO_INAPROPIADO = 'COMPORTAMIENTO_INAPROPIADO',
  SUPLANTACION_IDENTIDAD = 'SUPLANTACION_IDENTIDAD',
  COBROS_INDEBIDOS = 'COBROS_INDEBIDOS',

  // Otros
  OTRO = 'OTRO',
}

/**
 * DTO para crear un nuevo reporte
 * Implementa el formulario de reporte según RB-01
 */
export class CreateReporteDto {
  @IsEnum(TipoEntidadReporte, {
    message:
      'El tipo de entidad debe ser: TUTORIA, USUARIO, MATERIAL, COMENTARIO_FORO o GRUPO_CHAT',
  })
  @IsNotEmpty({ message: 'El tipo de entidad es requerido' })
  tipoEntidad: TipoEntidadReporte;

  @IsString({ message: 'El ID de la entidad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El ID de la entidad reportada es requerido' })
  entidadId: string;

  @IsString({ message: 'El ID del usuario reportado debe ser una cadena de texto' })
  @IsOptional()
  reportedUserId?: string;

  @IsEnum(MotivoReporte, {
    message: 'El motivo del reporte no es válido',
  })
  @IsNotEmpty({ message: 'El motivo del reporte es requerido' })
  motivo: MotivoReporte;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MinLength(20, {
    message: 'La descripción debe tener al menos 20 caracteres',
  })
  @MaxLength(1000, {
    message: 'La descripción no puede exceder los 1000 caracteres',
  })
  descripcion: string;

  @IsUrl({}, { message: 'La URL de evidencia no es válida' })
  @IsOptional()
  evidenciaUrl?: string;
}
