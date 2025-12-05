export const CreateGroupDtoDoc = {
  nombre: {
    description: 'Nombre del grupo de chat',
    example: 'Equipo de Desarrollo',
    type: String,
    maxLength: 30,
  },
  emails: {
    description: 'Lista de correos electrónicos de los usuarios a agregar al grupo',
    example: ['usuario1@example.com', 'usuario2@example.com'],
    type: String,
    isArray: true,
  },
};

export const CreateGroupResponseDoc = {
  description: 'Grupo de chat creado exitosamente',
  schema: {
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nombre: 'Equipo de Desarrollo',
      creadoPor: '123e4567-e89b-12d3-a456-426614174000',
      fechaCreacion: '2025-11-30T10:00:00.000Z',
      fechaActualizacion: '2025-11-30T10:00:00.000Z',
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
};
