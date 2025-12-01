import { Body, Controller, Headers, Param, Post, Get, BadRequestException, HttpCode } from '@nestjs/common';
import { VotesService } from './votes.service';
import type { VoteState } from './votes.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';

class VoteDto {
  @ApiProperty({ description: 'Estado del voto', enum: ['useful', 'not_useful', 'none'] })
  vote: VoteState;
}

@ApiTags('Respuestas')
@Controller('responses')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post(':id/vote')
  @HttpCode(200)
  @ApiOperation({ summary: 'Emitir o actualizar un voto para una respuesta' })
  @ApiBody({ type: VoteDto })
  @ApiResponse({ status: 200, description: 'Voto registrado o sin cambio (idempotente)' })
  @ApiResponse({ status: 400, description: 'Solicitud inválida (payload inválido o falta x-user-id)' })
  async vote(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() body: VoteDto,
  ) {
    if (!userId) {
      throw new BadRequestException('Falta la cabecera x-user-id (no hay autenticación implementada)');
    }
    const allowed = ['useful', 'not_useful', 'none'];
    if (!body || !allowed.includes(body.vote)) {
      throw new BadRequestException('Payload de voto inválido');
    }

    try {
      const res = this.votesService.vote(id, userId, body.vote);
      if (!res.updated) {
        return { status: 'ok', message: 'Sin cambio (idempotente)', counts: res.counts };
      }
      return { status: 'ok', message: 'Voto registrado', counts: res.counts, prev: res.prev };
    } catch (e: any) {
      if (e?.code === 'NOT_FOUND') {
        throw new BadRequestException('Respuesta no encontrada');
      }
      throw e;
    }
  }

  @Get(':id/votes')
  @ApiOperation({ summary: 'Obtener los conteos de votos para una respuesta' })
  @ApiResponse({ status: 200, description: 'Conteos actuales de votos' })
  getCounts(@Param('id') id: string) {
    const counts = this.votesService.getCounts(id);
    return { status: 'ok', counts };
  }
}
