export const DeleteGroupEndpointDoc = {
  summary: 'Eliminar un grupo de chat',
  description: 'Elimina un grupo de chat y todos sus mensajes y miembros asociados. Esta operación es irreversible.',
  responses: {
    200: {
      description: 'Grupo eliminado exitosamente',
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          nombre: 'Equipo de Desarrollo',
          creadoPor: '123e4567-e89b-12d3-a456-426614174000',
          fechaCreacion: '2025-11-30T10:00:00.000Z',
          fechaActualizacion: '2025-11-30T10:00:00.000Z',
        },
      },
    },
    401: {
      description: 'No autenticado - Token JWT inválido o ausente',
      schema: {
        example: {
          message: 'Unauthorized',
          statusCode: 401,
        },
      },
    },
    404: {
      description: 'Grupo no encontrado',
      schema: {
        example: {
          message: 'Grupo no encontrado',
          error: 'Not Found',
          statusCode: 404,
        },
      },
    },
  },
};
