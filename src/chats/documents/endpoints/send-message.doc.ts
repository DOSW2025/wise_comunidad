export const SendMessageEndpointDoc = {
  summary: 'Enviar un mensaje a un grupo (REST)',
  description: 'Envía un mensaje a un grupo de chat a través de HTTP REST. El usuario debe ser miembro del grupo. Para comunicación en tiempo real, utilice el evento WebSocket "sendMessage".',
  responses: {
    201: {
      description: 'Mensaje enviado exitosamente',
    },
    400: {
      description: 'Datos de entrada inválidos',
      schema: {
        example: {
          message: ['contenido should not be empty'],
          error: 'Bad Request',
          statusCode: 400,
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
