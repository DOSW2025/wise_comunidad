export const GetAllGroupsEndpointDoc = {
  summary: 'Obtener todos los grupos de chat',
  description: 'Obtiene la lista completa de todos los grupos de chat existentes en el sistema.',
  responses: {
    200: {
      description: 'Lista de grupos obtenida exitosamente',
      schema: {
        example: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            nombre: 'Equipo de Desarrollo',
            creadoPor: '123e4567-e89b-12d3-a456-426614174000',
            fechaCreacion: '2025-11-30T10:00:00.000Z',
            fechaActualizacion: '2025-11-30T10:00:00.000Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            nombre: 'Equipo de Marketing',
            creadoPor: '123e4567-e89b-12d3-a456-426614174001',
            fechaCreacion: '2025-11-30T11:00:00.000Z',
            fechaActualizacion: '2025-11-30T11:00:00.000Z',
          },
        ],
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
  },
};
