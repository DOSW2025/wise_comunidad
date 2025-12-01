import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [PrismaModule, ReportesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
