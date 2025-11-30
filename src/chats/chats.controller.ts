import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateGroupDto, SendMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('chats')
@UseGuards(JwtAuthGuard) // Proteger todos los endpoints con JWT
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * Crea un nuevo grupo de chat
   * POST /chats
   * @param createGroupDto - Datos del grupo (nombre y emails)
   * @param user - Usuario autenticado extraído del JWT
   */
  @Post()
  create(
    @Body() createGroupDto: CreateGroupDto,
    @GetUser() user: { id: string; email: string; rol: string },
  ) {
    return this.chatsService.create(createGroupDto, user.id);
  }

  /**
   * Obtiene todos los grupos del usuario autenticado
   * GET /chats
   */
  @Get()
  findAll(@GetUser('id') userId: string) {
    return this.chatsService.findAll();
  }

  /**
   * Obtiene un grupo por su ID con todos sus mensajes
   * GET /chats/:id
   * @param id - ID del grupo
   * @param user - Usuario autenticado
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser() user: { id: string; email: string; rol: string },
  ) {
    return this.chatsService.findOne(id);
  }

  /**
   * Obtiene los mensajes de un grupo
   * GET /chats/:id/messages
   * @param id - ID del grupo
   * @param user - Usuario autenticado
   */
  @Get(':id/messages')
  getMessages(
    @Param('id') grupoId: string,
    @GetUser('id') userId: string,
  ) {
    return this.chatsService.getMessages(grupoId, userId);
  }

  /**
   * Envía un mensaje a un grupo (vía REST)
   * POST /chats/:id/messages
   * @param id - ID del grupo
   * @param sendMessageDto - Contenido del mensaje
   * @param user - Usuario autenticado
   */
  @Post(':id/messages')
  sendMessage(
    @Param('id') grupoId: string,
    @Body() sendMessageDto: { contenido: string },
    @GetUser('id') userId: string,
  ) {
    return this.chatsService.sendMessage(
      { grupoId, contenido: sendMessageDto.contenido },
      userId,
    );
  }

  /**
   * Elimina un grupo
   * DELETE /chats/:id
   * @param id - ID del grupo a eliminar
   * @param user - Usuario autenticado
   */
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: { id: string; email: string; rol: string },
  ) {
    return this.chatsService.remove(id);
  }
}
