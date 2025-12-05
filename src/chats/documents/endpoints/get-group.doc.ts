export const GetGroupEndpointDoc = {
  summary: 'Obtener un grupo por ID',
  description: 'Obtiene los detalles de un grupo de chat específico incluyendo sus mensajes y miembros.',
  responses: {
    200: {
      description: 'Grupo obtenido exitosamente',
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          nombre: 'Equipo de Desarrollo',
          creadoPor: '123e4567-e89b-12d3-a456-426614174000',
          fechaCreacion: '2025-11-30T10:00:00.000Z',
          fechaActualizacion: '2025-11-30T10:00:00.000Z',
          mensajes: [
            {
              id: '770e8400-e29b-41d4-a716-446655440002',
              grupoId: '550e8400-e29b-41d4-a716-446655440000',
              usuarioId: '123e4567-e89b-12d3-a456-426614174000',
              contenido: 'Hola equipo',
              fechaCreacion: '2025-11-30T10:15:00.000Z',
              usuario: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'usuario1@example.com',
                nombre: 'Juan',
                apellido: 'Pérez',
              },
            },
          ],
          miembros: [
            {
              id: '660e8400-e29b-41d4-a716-446655440001',
              grupoId: '550e8400-e29b-41d4-a716-446655440000',
              usuarioId: '123e4567-e89b-12d3-a456-426614174000',
              fechaUnion: '2025-11-30T10:00:00.000Z',
              usuario: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'usuario1@example.com',
                nombre: 'Juan',
                apellido: 'Pérez',
              },
            },
          ],
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
