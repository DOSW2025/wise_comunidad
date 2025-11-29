import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [PrismaModule, ChatsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
