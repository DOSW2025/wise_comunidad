import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ChatsModule } from './chats/chats.module';
import { AuthModule } from './auth/auth.module';
import { VotesModule } from './votes/votes.module';
import { ResponsesModule } from './responses/responses.module';
import { ThreadsModule } from './threads/threads.module';

@Module({
  imports: [PrismaModule, AuthModule, ChatsModule,ResponsesModule, VotesModule, ThreadsModule],
  controllers: [],
})
export class AppModule {}
