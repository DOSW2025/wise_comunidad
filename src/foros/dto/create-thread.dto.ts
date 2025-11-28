import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateThreadDto {
  @ApiProperty({ example: 'Cómo usar WISE', description: 'Título del hilo' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'como-usar-wise', description: 'Slug único amigable para URL' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Contenido inicial del hilo', description: 'Contenido opcional del hilo' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: '123', description: 'ID del autor' })
  @IsString()
  @IsNotEmpty()
  authorId: string;
}
