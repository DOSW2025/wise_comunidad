import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { CreateGroupDto, SendMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateGroupEndpointDoc } from './documents/endpoints/create-group.doc';
import { GetAllGroupsEndpointDoc } from './documents/endpoints/get-all-groups.doc';
import { GetGroupEndpointDoc } from './documents/endpoints/get-group.doc';
import { GetMessagesEndpointDoc } from './documents/endpoints/get-messages.doc';
import { SendMessageEndpointDoc } from './documents/endpoints/send-message.doc';
import { DeleteGroupEndpointDoc } from './documents/endpoints/delete-group.doc';
import { CreateGroupResponseDoc } from './documents/dtos/create-group.doc';
import { SendMessageResponseDoc } from './documents/dtos/send-message.doc';

@ApiTags('Chats')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({
    summary: CreateGroupEndpointDoc.summary,
    description: CreateGroupEndpointDoc.description,
  })
  @ApiResponse({ status: 201, ...CreateGroupResponseDoc })
  @ApiResponse({ status: 400, ...CreateGroupEndpointDoc.responses[400] })
  @ApiResponse({ status: 401, ...CreateGroupEndpointDoc.responses[401] })
  @ApiResponse({ status: 404, ...CreateGroupEndpointDoc.responses[404] })
  @ApiResponse({ status: 409, ...CreateGroupEndpointDoc.responses[409] })
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
  @ApiOperation({
    summary: GetAllGroupsEndpointDoc.summary,
    description: GetAllGroupsEndpointDoc.description,
  })
  @ApiResponse({ status: 200, ...GetAllGroupsEndpointDoc.responses[200] })
  @ApiResponse({ status: 401, ...GetAllGroupsEndpointDoc.responses[401] })
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
  @ApiOperation({
    summary: GetGroupEndpointDoc.summary,
    description: GetGroupEndpointDoc.description,
  })
  @ApiResponse({ status: 200, ...GetGroupEndpointDoc.responses[200] })
  @ApiResponse({ status: 401, ...GetGroupEndpointDoc.responses[401] })
  @ApiResponse({ status: 404, ...GetGroupEndpointDoc.responses[404] })
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
  @ApiOperation({
    summary: GetMessagesEndpointDoc.summary,
    description: GetMessagesEndpointDoc.description,
  })
  @ApiResponse({ status: 200, ...GetMessagesEndpointDoc.responses[200] })
  @ApiResponse({ status: 401, ...GetMessagesEndpointDoc.responses[401] })
  @ApiResponse({ status: 403, ...GetMessagesEndpointDoc.responses[403] })
  @ApiResponse({ status: 404, ...GetMessagesEndpointDoc.responses[404] })
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
  @ApiOperation({
    summary: SendMessageEndpointDoc.summary,
    description: SendMessageEndpointDoc.description,
  })
  @ApiResponse({ status: 201, ...SendMessageResponseDoc })
  @ApiResponse({ status: 400, ...SendMessageEndpointDoc.responses[400] })
  @ApiResponse({ status: 401, ...SendMessageEndpointDoc.responses[401] })
  @ApiResponse({ status: 403, ...SendMessageEndpointDoc.responses[403] })
  @ApiResponse({ status: 404, ...SendMessageEndpointDoc.responses[404] })
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
  @ApiOperation({
    summary: DeleteGroupEndpointDoc.summary,
    description: DeleteGroupEndpointDoc.description,
  })
  @ApiResponse({ status: 200, ...DeleteGroupEndpointDoc.responses[200] })
  @ApiResponse({ status: 401, ...DeleteGroupEndpointDoc.responses[401] })
  @ApiResponse({ status: 404, ...DeleteGroupEndpointDoc.responses[404] })
  remove(
    @Param('id') id: string,
    @GetUser() user: { id: string; email: string; rol: string },
  ) {
    return this.chatsService.remove(id);
  }
}
