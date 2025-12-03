import { IsArray, IsEmail, IsNotEmpty, IsString, MaxLength, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateGroupDtoDoc } from '../documents/dtos/create-group.doc';

export class CreateGroupDto {
  @ApiProperty(CreateGroupDtoDoc.nombre)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nombre: string;

  @ApiProperty(CreateGroupDtoDoc.emails)
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails: string[];
}
