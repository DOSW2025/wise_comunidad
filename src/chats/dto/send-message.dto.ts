import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  grupoId: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;
}
