import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ChatsModule } from './chats/chats.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, ChatsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
