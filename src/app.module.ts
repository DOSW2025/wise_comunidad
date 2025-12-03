import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ReportesModule } from './reportes/reportes.module';
import { ChatsModule } from './chats/chats.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, ChatsModule, ReportesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
