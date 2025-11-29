import { Controller, Get, Post, Body, Param, Delete, Headers, UnauthorizedException } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateGroupDto } from './dto/creategroup.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * Crea un nuevo grupo de chat
   * POST /chats
   * @param createGroupDto - Datos del grupo (nombre y emails)
   * @param userId - ID del usuario desde el header (temporalmente)
   * TODO: Implementar autenticación JWT y obtener el userId desde el token
   */
  @Post()
  create(
    @Body() createGroupDto: CreateGroupDto,
    @Headers('user-id') userId: string,
  ) {
    // Validación temporal: asegurarse de que venga el user-id en los headers
    if (!userId) {
      throw new UnauthorizedException(
        'Se requiere el header "user-id" para crear un grupo',
      );
    }

    return this.chatsService.create(createGroupDto, userId);
  }

  /**
   * Obtiene todos los grupos
   * GET /chats
   */
  @Get()
  findAll() {
    return this.chatsService.findAll();
  }

  /**
   * Obtiene un grupo por su ID con todos sus mensajes
   * GET /chats/:id
   * @param id - ID del grupo
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatsService.findOne(id);
  }

  /**
   * Elimina un grupo
   * DELETE /chats/:id
   * @param id - ID del grupo a eliminar
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatsService.remove(id);
  }
}
