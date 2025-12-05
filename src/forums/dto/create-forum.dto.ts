import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateForumDto {
  @ApiProperty({ example: 'Mecánica del fútbol', description: 'Título del foro' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(190)
  title: string;

  @ApiProperty({ example: 'Foro para discutir mecánica y tácticas', description: 'Descripción opcional', required: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'MAT101', description: 'ID de la materia existente en la BD' })
  @IsString()
  @IsNotEmpty()
  materiaId: string;

  @ApiProperty({ example: '37292cf3-6a1a-4211-9b3f-7a82331d0965', description: 'Identificador del usuario creador del foro' })
  @IsString()
  @IsNotEmpty()
  creatorId: string;
}
