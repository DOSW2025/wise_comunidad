import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateForumDto {
  @ApiPropertyOptional({ description: 'Nuevo título del foro', example: 'Nuevo título' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(190)
  title?: string;

  @ApiPropertyOptional({ description: 'Nueva descripción del foro', example: 'Descripción actualizada' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Identificador del usuario que intenta editar' })
  @IsOptional()
  @IsString()
  editorId?: string;
}
