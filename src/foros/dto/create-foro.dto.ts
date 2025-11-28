import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateForoDto {
  @ApiProperty({
    example: 'general',
    description: 'Slug único y amigable para URL del foro',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    example: 'Foro General',
    description: 'Nombre del foro',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    example: 'Discusiones generales de la comunidad',
    description: 'Descripción del foro',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    example: 'MAT101',
    description: 'ID o código de la materia (validará existencia)',
  })
  @IsString()
  @IsNotEmpty()
  materiaId: string;
}
