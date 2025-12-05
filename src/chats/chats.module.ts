import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ServiceBusClient } from '@azure/service-bus';
import { envs } from '../config/envs';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway,
    {
      provide: ServiceBusClient,
      useFactory: () => {
        return new ServiceBusClient(envs.serviceBusConnectionString);
      },
    }
  ],
})
export class ChatsModule { }
