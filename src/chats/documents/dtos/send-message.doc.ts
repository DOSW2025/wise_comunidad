export const SendMessageDtoDoc = {
  grupoId: {
    description: 'ID del grupo al que se enviará el mensaje',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  },
  contenido: {
    description: 'Contenido del mensaje',
    example: 'Hola equipo, ¿cómo están?',
    type: String,
  },
};

export const SendMessageResponseDoc = {
  description: 'Mensaje enviado exitosamente',
  schema: {
    example: {
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
  },
};
