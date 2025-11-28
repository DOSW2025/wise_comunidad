import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMensajeDto {
  @ApiProperty({
    description: 'Contenido del mensaje',
    example: 'Alguien sabe cómo resolver este problema?',
  })
  @IsString()
  @IsNotEmpty()
  contenido: string;

  @ApiProperty({
    description: 'ID del usuario que envía el mensaje',
    example: 'user-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  authorId: string;
}

export class ListMensajesQueryDto {
  @ApiProperty({
    description: 'Número de página para paginación',
    example: 1,
    required: false,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Mostrar solo mensajes no leídos',
    example: false,
    required: false,
  })
  @IsOptional()
  unreadOnly?: boolean;
}
