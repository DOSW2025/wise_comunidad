export const GetMessagesEndpointDoc = {
  summary: 'Obtener mensajes de un grupo',
  description: 'Obtiene todos los mensajes de un grupo de chat específico. El usuario debe ser miembro del grupo para acceder a los mensajes.',
  responses: {
    200: {
      description: 'Mensajes obtenidos exitosamente',
      schema: {
        example: [
          {
            id: '770e8400-e29b-41d4-a716-446655440002',
            grupoId: '550e8400-e29b-41d4-a716-446655440000',
            usuarioId: '123e4567-e89b-12d3-a456-426614174000',
            contenido: 'Hola equipo, ¿cómo están?',
            fechaCreacion: '2025-11-30T10:15:00.000Z',
            usuario: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'usuario1@example.com',
              nombre: 'Juan',
              apellido: 'Pérez',
              avatar_url: null,
            },
          },
          {
            id: '770e8400-e29b-41d4-a716-446655440003',
            grupoId: '550e8400-e29b-41d4-a716-446655440000',
            usuarioId: '123e4567-e89b-12d3-a456-426614174001',
            contenido: 'Todo bien, gracias',
            fechaCreacion: '2025-11-30T10:16:00.000Z',
            usuario: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              email: 'usuario2@example.com',
              nombre: 'María',
              apellido: 'García',
              avatar_url: null,
            },
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
    403: {
      description: 'No eres miembro de este grupo',
      schema: {
        example: {
          message: 'No eres miembro de este grupo',
          error: 'Forbidden',
          statusCode: 403,
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
