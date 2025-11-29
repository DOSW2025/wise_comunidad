import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/creategroup.dto';


@Injectable()
export class ChatsService {
  create(CreateGroupDto: CreateGroupDto) {
    return 'This action adds a new chat';
  }

  findAll() {
    return `This action returns all chats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
