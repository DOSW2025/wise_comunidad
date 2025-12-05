export const CreateGroupEndpointDoc = {
  summary: 'Crear un nuevo grupo de chat',
  description: 'Crea un nuevo grupo de chat con un nombre único y agrega los usuarios especificados por correo electrónico como miembros. El usuario autenticado será el creador del grupo y se agregará automáticamente como miembro.',
  responses: {
    201: {
      description: 'Grupo creado exitosamente',
    },
    400: {
      description: 'Datos de entrada inválidos',
      schema: {
        example: {
          message: ['nombre should not be empty', 'emails must be an array'],
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
    404: {
      description: 'Uno o más correos electrónicos no están registrados',
      schema: {
        example: {
          message: 'Los siguientes correos no están registrados: usuario@example.com',
          error: 'Not Found',
          statusCode: 404,
        },
      },
    },
    409: {
      description: 'Ya existe un grupo con ese nombre',
      schema: {
        example: {
          message: 'Ya existe un grupo con el nombre: Equipo de Desarrollo',
          error: 'Conflict',
          statusCode: 409,
        },
      },
    },
  },
};
