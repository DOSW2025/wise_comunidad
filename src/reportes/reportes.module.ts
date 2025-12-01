import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

/**
 * Módulo de Reportes
 * Gestiona las denuncias de contenido y comportamiento según RB-01 y RB-02
 */
@Module({
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
