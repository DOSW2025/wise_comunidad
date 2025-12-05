import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { VotesModule } from './votes/votes.module';
import { ResponsesModule } from './responses/responses.module';
import { ThreadsModule } from './threads/threads.module';
import { ForumsModule } from './forums/forums.module';
import { AppController } from './app.controller';

@Module({
  imports: [PrismaModule, ResponsesModule, VotesModule, ThreadsModule, ForumsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
