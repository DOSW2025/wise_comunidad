import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsOptional()
  @IsInt()
  parentId?: number;
}
