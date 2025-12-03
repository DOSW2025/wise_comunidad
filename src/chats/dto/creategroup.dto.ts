import { IsArray, IsEmail, IsNotEmpty, IsString, MaxLength, ArrayMinSize } from 'class-validator';
export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nombre: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails: string[];
}