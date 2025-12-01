import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { VotesModule } from './votes/votes.module';
import { ResponsesModule } from './responses/responses.module';
import { AppController } from './app.controller';

@Module({
  imports: [PrismaModule, ResponsesModule, VotesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
