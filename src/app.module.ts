import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ForosModule } from './foros/foros.module';

@Module({
  imports: [PrismaModule, ForosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
