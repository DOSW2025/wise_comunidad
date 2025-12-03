import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SendMessageDtoDoc } from '../documents/dtos/send-message.doc';

export class SendMessageDto {
  @ApiProperty(SendMessageDtoDoc.grupoId)
  @IsUUID()
  @IsNotEmpty()
  grupoId: string;

  @ApiProperty(SendMessageDtoDoc.contenido)
  @IsString()
  @IsNotEmpty()
  contenido: string;
}
