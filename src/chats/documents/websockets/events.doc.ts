export const WebSocketEventsDoc = {
  namespace: '/chat',
  description: 'WebSocket Gateway para comunicación de chat en tiempo real usando Socket.IO',

  authentication: {
    description: 'Autenticación mediante JWT',
    details: 'Al conectarse, el cliente debe proporcionar un token JWT válido en el handshake (auth.token o query.token). El token debe contener los claims: sub (userId), email, y rol.',
    example: {
      auth: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  },

  events: {
    // Eventos que el cliente ENVIA al servidor
    clientToServer: {
      joinGroup: {
        event: 'joinGroup',
        description: 'El usuario se une a un grupo de chat (sala)',
        payload: {
          grupoId: 'ID del grupo al que desea unirse',
        },
        example: {
          grupoId: '550e8400-e29b-41d4-a716-446655440000',
        },
        response: {
          success: true,
          message: 'Te has unido al grupo correctamente',
          grupoId: '550e8400-e29b-41d4-a716-446655440000',
        },
        errors: [
          'No eres miembro de este grupo',
        ],
      },

      leaveGroup: {
        event: 'leaveGroup',
        description: 'El usuario abandona un grupo de chat (sala)',
        payload: {
          grupoId: 'ID del grupo que desea abandonar',
        },
        example: {
          grupoId: '550e8400-e29b-41d4-a716-446655440000',
        },
        response: {
          success: true,
          message: 'Has abandonado el grupo',
          grupoId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },

      sendMessage: {
        event: 'sendMessage',
        description: 'Enviar un mensaje al grupo. El usuario debe haber ejecutado joinGroup primero.',
        payload: {
          grupoId: 'ID del grupo',
          contenido: 'Contenido del mensaje',
        },
        example: {
          grupoId: '550e8400-e29b-41d4-a716-446655440000',
          contenido: 'Hola equipo, ¿cómo están?',
        },
        response: {
          success: true,
          message: 'Mensaje enviado correctamente',
          data: {
            id: '770e8400-e29b-41d4-a716-446655440002',
            grupoId: '550e8400-e29b-41d4-a716-446655440000',
            usuarioId: '123e4567-e89b-12d3-a456-426614174000',
            contenido: 'Hola equipo, ¿cómo están?',
            fechaCreacion: '2025-11-30T10:15:00.000Z',
          },
        },
        errors: [
          'Debes unirte al grupo antes de enviar mensajes (usa joinGroup)',
          'No eres miembro de este grupo',
        ],
      },

      typing: {
        event: 'typing',
        description: 'Notifica que el usuario está escribiendo. El usuario debe estar en la sala del grupo.',
        payload: {
          grupoId: 'ID del grupo',
        },
        example: {
          grupoId: '550e8400-e29b-41d4-a716-446655440000',
        },
        note: 'Este evento no devuelve respuesta al emisor, pero emite "userTyping" a los demás miembros',
      },

      stopTyping: {
        event: 'stopTyping',
        description: 'Notifica que el usuario dejó de escribir',
        payload: {
          grupoId: 'ID del grupo',
        },
        example: {
          grupoId: '550e8400-e29b-41d4-a716-446655440000',
        },
        note: 'Este evento no devuelve respuesta al emisor, pero emite "userStoppedTyping" a los demás miembros',
      },
    },

    // Eventos que el servidor ENVIA a los clientes
    serverToClient: {
      userJoined: {
        event: 'userJoined',
        description: 'Se emite cuando un usuario se une al grupo (recibido por todos los demás miembros)',
        payload: {
          userId: 'ID del usuario que se unió',
          email: 'Email del usuario',
          message: 'Mensaje descriptivo',
          timestamp: 'Fecha y hora del evento',
        },
        example: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          email: 'usuario1@example.com',
          message: 'usuario1@example.com se ha unido al chat',
          timestamp: '2025-11-30T10:00:00.000Z',
        },
      },

      userLeft: {
        event: 'userLeft',
        description: 'Se emite cuando un usuario abandona el grupo (recibido por todos los demás miembros)',
        payload: {
          userId: 'ID del usuario que se fue',
          email: 'Email del usuario',
          message: 'Mensaje descriptivo',
          timestamp: 'Fecha y hora del evento',
        },
        example: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          email: 'usuario1@example.com',
          message: 'usuario1@example.com ha abandonado el chat',
          timestamp: '2025-11-30T10:30:00.000Z',
        },
      },

      newMessage: {
        event: 'newMessage',
        description: 'Se emite cuando se envía un nuevo mensaje al grupo (recibido por TODOS los miembros incluyendo el emisor)',
        payload: {
          id: 'ID del mensaje',
          grupoId: 'ID del grupo',
          contenido: 'Contenido del mensaje',
          fechaCreacion: 'Fecha de creación',
          usuario: 'Datos del usuario que envió el mensaje',
        },
        example: {
          id: '770e8400-e29b-41d4-a716-446655440002',
          grupoId: '550e8400-e29b-41d4-a716-446655440000',
          contenido: 'Hola equipo, ¿cómo están?',
          fechaCreacion: '2025-11-30T10:15:00.000Z',
          usuario: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'usuario1@example.com',
            avatar_url: null,
          },
        },
      },

      userTyping: {
        event: 'userTyping',
        description: 'Se emite cuando un usuario está escribiendo (recibido por todos EXCEPTO el emisor)',
        payload: {
          userId: 'ID del usuario que está escribiendo',
          email: 'Email del usuario',
        },
        example: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          email: 'usuario1@example.com',
        },
      },

      userStoppedTyping: {
        event: 'userStoppedTyping',
        description: 'Se emite cuando un usuario dejó de escribir (recibido por todos EXCEPTO el emisor)',
        payload: {
          userId: 'ID del usuario',
        },
        example: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  },

  connectionFlow: {
    title: 'Flujo de conexión y uso',
    steps: [
      '1. Conectarse al namespace /chat con token JWT en handshake',
      '2. Escuchar eventos del servidor (newMessage, userJoined, userLeft, userTyping, userStoppedTyping)',
      '3. Emitir "joinGroup" con el grupoId para unirse a una sala',
      '4. Emitir "sendMessage" para enviar mensajes',
      '5. Opcionalmente emitir "typing" y "stopTyping" para indicadores de escritura',
      '6. Emitir "leaveGroup" al salir de la sala',
    ],
  },

  exampleClient: {
    javascript: `
// Conexión con Socket.IO Client
import { io } from 'socket.io-client';

const socket = io('http://localhost:3004/chat', {
  auth: {
    token: 'your-jwt-token-here'
  }
});

// Escuchar eventos del servidor
socket.on('newMessage', (mensaje) => {
  console.log('Nuevo mensaje:', mensaje);
});

socket.on('userJoined', (data) => {
  console.log('Usuario se unió:', data.email);
});

socket.on('userLeft', (data) => {
  console.log('Usuario se fue:', data.email);
});

socket.on('userTyping', (data) => {
  console.log('Usuario escribiendo:', data.email);
});

socket.on('userStoppedTyping', (data) => {
  console.log('Usuario dejó de escribir');
});

// Unirse a un grupo
socket.emit('joinGroup', { grupoId: 'grupo-id-123' }, (response) => {
  console.log('Respuesta:', response);
});

// Enviar mensaje
socket.emit('sendMessage', {
  grupoId: 'grupo-id-123',
  contenido: 'Hola!'
}, (response) => {
  console.log('Respuesta:', response);
});

// Indicador de escritura
socket.emit('typing', { grupoId: 'grupo-id-123' });
setTimeout(() => {
  socket.emit('stopTyping', { grupoId: 'grupo-id-123' });
}, 3000);

// Abandonar grupo
socket.emit('leaveGroup', { grupoId: 'grupo-id-123' });
    `,
  },
};
