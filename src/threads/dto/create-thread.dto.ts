import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

function trimAndNormalize(value: any) {
  if (typeof value !== 'string') return value;
  return value.replace(/\s+/g, ' ').trim();
}

export class CreateThreadDto {
  @ApiProperty({
    example: 'Título de prueba válido con más de quince caracteres',
    description: 'Título del hilo. Mínimo 15 caracteres.',
  })
  @Transform(({ value }) => trimAndNormalize(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(15, { message: 'Título inválido (mínimo 15 caracteres)' })
  @MaxLength(190)
  title: string;

  @ApiProperty({
    example: 'Contenido de prueba del hilo. Debe tener al menos quince caracteres.',
    description: 'Contenido del hilo. Mínimo 15 caracteres.',
  })
  @Transform(({ value }) => trimAndNormalize(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(15, { message: 'Contenido inválido (mínimo 15 caracteres)' })
  @MaxLength(5000)
  content: string;

  @ApiProperty({
    example: '37292cf3-6a1a-4211-9b3f-7a82331d0965',
    description: 'Identificador del autor (usuario existente). No se exige formato UUID.',
  })
  @IsString()
  @IsNotEmpty()
  authorId: string;
}
