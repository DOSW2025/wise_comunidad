import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

function trimAndNormalize(value: any) {
  if (typeof value !== 'string') return value;
  return value.replace(/\s+/g, ' ').trim();
}

export class CreateResponseDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', description: 'Identificador del hilo al que responde' })
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @ApiProperty({ example: '37292cf3-6a1a-4211-9b3f-7a82331d0965', description: 'Identificador del autor (usuario existente)' })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({ example: 'Contenido de la respuesta', description: 'Texto de la respuesta (mínimo 1 carácter)' })
  @Transform(({ value }) => trimAndNormalize(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}
