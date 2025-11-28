import { Module } from '@nestjs/common';
import { ForosService } from './foros.service';
import { ForosController } from './foros.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ForosController],
  providers: [ForosService],
})
export class ForosModule {}
