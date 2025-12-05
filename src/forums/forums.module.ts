import { Module } from '@nestjs/common';
import { ForumsService } from './forums.service';
import { ForumsController } from './forums.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ThreadsModule } from '../threads/threads.module';

@Module({
  imports: [PrismaModule, ThreadsModule],
  providers: [ForumsService],
  controllers: [ForumsController],
  exports: [ForumsService],
})
export class ForumsModule {}
