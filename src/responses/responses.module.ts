import { Module } from '@nestjs/common';
import { ResponsesService, ResponsesController } from '.';

@Module({
  imports: [],
  providers: [ResponsesService],
  controllers: [ResponsesController],
  exports: [ResponsesService],
})
export class ResponsesModule {}
