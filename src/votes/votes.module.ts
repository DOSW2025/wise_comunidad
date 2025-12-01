import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { VotesGateway } from './votes.gateway';
import { ResponsesModule } from '../responses/responses.module';

@Module({
  imports: [ResponsesModule],
  providers: [VotesService, VotesGateway],
  controllers: [VotesController],
})
export class VotesModule {}
