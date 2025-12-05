import { IsOptional, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateThreadDto {
  @ApiPropertyOptional({ description: 'Nuevo título del hilo', example: 'Título actualizado' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(190)
  title?: string;

  @ApiPropertyOptional({ description: 'Nuevo contenido del hilo', example: 'Contenido actualizado' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: 'Identificador del autor que intenta editar' })
  @IsOptional()
  @IsString()
  authorId?: string;
}
