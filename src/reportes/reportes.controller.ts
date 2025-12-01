import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { CreateReporteDto } from './dto/create-reporte.dto';

/**
 * Controlador de Reportes
 * Expone los endpoints para la gestión de reportes según RB-01
 */
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  /**
   * POST /reportes
   * Crea un nuevo reporte en el sistema
   *
   * @header x-user-id - ID del usuario autenticado (temporal, será reemplazado por JWT)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createReporteDto: CreateReporteDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-forwarded-for') ipAddress?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    // TODO: Reemplazar x-user-id por extracción desde JWT cuando se implemente auth
    if (!userId) {
      return {
        success: false,
        message: 'Usuario no autenticado. Se requiere el header x-user-id',
        statusCode: 401,
      };
    }

    return this.reportesService.create(userId, createReporteDto, {
      ipAddress,
      userAgent,
    });
  }

  /**
   * GET /reportes
   * Lista todos los reportes (solo administradores)
   */
  @Get()
  async findAll(
    @Query('estado') estado?: string,
    @Query('tipoEntidad') tipoEntidad?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportesService.findAll({
      estado,
      tipoEntidad,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  /**
   * GET /reportes/:id
   * Obtiene un reporte específico por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportesService.findOne(id);
  }

  /**
   * GET /reportes/usuario/:userId
   * Obtiene los reportes creados por un usuario específico
   */
  @Get('usuario/:userId')
  async findByReporter(@Param('userId') userId: string) {
    return this.reportesService.findByReporter(userId);
  }
}
