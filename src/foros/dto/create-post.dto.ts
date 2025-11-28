import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'Este es un comentario', description: 'Contenido del post' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '123', description: 'ID del autor' })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del post padre si es respuesta' })
  @IsOptional()
  @IsInt()
  parentId?: number;
}
