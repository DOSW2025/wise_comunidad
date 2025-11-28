import { ApiResponse } from './api.response';

describe('ApiResponse', () => {
  describe('Constructor', () => {
    it('debería crear una instancia con todos los campos', () => {
      const response = new ApiResponse(true, 200, 'Success', { id: 1 });

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Success');
      expect(response.data).toEqual({ id: 1 });
      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });

    it('debería generar timestamp automáticamente', () => {
      const beforeTime = new Date();
      const response = new ApiResponse(true, 200, 'Success');
      const afterTime = new Date();

      expect(response.timestamp).toBeDefined();
      const responseTime = new Date(response.timestamp);
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('success', () => {
    it('debería crear una respuesta exitosa', () => {
      const data = { id: 1, nombre: 'Test' };
      const response = ApiResponse.success('Operación exitosa', data);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Operación exitosa');
      expect(response.data).toEqual(data);
    });

    it('debería crear respuesta con statusCode personalizado', () => {
      const response = ApiResponse.success('Success', { id: 1 }, 202);

      expect(response.statusCode).toBe(202);
    });
  });

  describe('created', () => {
    it('debería crear una respuesta de creación (201)', () => {
      const data = { id: 1, nombre: 'Foro creado' };
      const response = ApiResponse.created('Foro creado exitosamente', data);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
      expect(response.message).toBe('Foro creado exitosamente');
      expect(response.data).toEqual(data);
    });

    it('debería usar statusCode 201', () => {
      const response = ApiResponse.created('Created', {});

      expect(response.statusCode).toBe(201);
    });
  });

  describe('error', () => {
    it('debería crear una respuesta de error', () => {
      const response = ApiResponse.error('Error en la solicitud', 400);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Error en la solicitud');
    });

    it('debería permitir agregar errores detallados', () => {
      const errors = [{ field: 'email', message: 'Email inválido' }];
      const response = ApiResponse.error('Validación fallida', 400, errors);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.errors).toEqual(errors);
    });

    it('debería usar statusCode 400 por defecto', () => {
      const response = ApiResponse.error('Error');

      expect(response.statusCode).toBe(400);
    });
  });

  describe('notFound', () => {
    it('debería crear una respuesta 404 Not Found', () => {
      const response = ApiResponse.notFound('Recurso no encontrado');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('Recurso no encontrado');
    });

    it('debería usar statusCode 404', () => {
      const response = ApiResponse.notFound('Not found');

      expect(response.statusCode).toBe(404);
    });
  });

  describe('conflict', () => {
    it('debería crear una respuesta 409 Conflict', () => {
      const response = ApiResponse.conflict('El recurso ya existe');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(409);
      expect(response.message).toBe('El recurso ya existe');
    });

    it('debería usar statusCode 409', () => {
      const response = ApiResponse.conflict('Conflict');

      expect(response.statusCode).toBe(409);
    });
  });

  describe('badRequest', () => {
    it('debería crear una respuesta 400 Bad Request', () => {
      const response = ApiResponse.badRequest('Solicitud inválida');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Solicitud inválida');
    });

    it('debería permitir agregar detalles de validación', () => {
      const errors = [
        { field: 'campo1', message: 'requerido' },
        { field: 'campo2', message: 'formato inválido' },
      ];
      const response = ApiResponse.badRequest('Validación fallida', errors);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.errors).toEqual(errors);
    });

    it('debería usar statusCode 400', () => {
      const response = ApiResponse.badRequest('Bad request');

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Casos de uso realistas', () => {
    it('debería manejar creación de foro exitosa', () => {
      const foroData = {
        id: 1,
        slug: 'test-foro',
        nombre: 'Test Foro',
        materiaId: 'MAT101',
      };

      const response = ApiResponse.created('✅ Foro creado exitosamente', foroData);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
      expect(response.data).toEqual(foroData);
    });

    it('debería manejar error de materia no encontrada', () => {
      const response = ApiResponse.notFound('❌ La materia no existe');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
    });

    it('debería manejar error de slug duplicado', () => {
      const response = ApiResponse.conflict('❌ Un foro con este slug ya existe');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(409);
    });

    it('debería manejar listado de foros', () => {
      const foros = [
        { id: 1, slug: 'foro1' },
        { id: 2, slug: 'foro2' },
      ];

      const response = ApiResponse.success('Foros listados', { foros });

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data && response.data.foros).toHaveLength(2);
    });
  });

  describe('Genericidad de tipos', () => {
    it('debería funcionar con diferentes tipos de datos', () => {
      const stringResponse = ApiResponse.success('Success', 'String data');
      const numberResponse = ApiResponse.success('Success', 42);
      const arrayResponse = ApiResponse.success('Success', [1, 2, 3]);
      const objectResponse = ApiResponse.success('Success', { key: 'value' });

      expect(stringResponse.data).toBe('String data');
      expect(numberResponse.data).toBe(42);
      expect(arrayResponse.data).toEqual([1, 2, 3]);
      expect(objectResponse.data).toEqual({ key: 'value' });
    });
  });

  describe('Estructura de respuesta', () => {
    it('debería siempre tener estructura consistente', () => {
      const response = ApiResponse.success('Test', {});

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('timestamp');
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.statusCode).toBe('number');
      expect(typeof response.message).toBe('string');
      expect(typeof response.timestamp).toBe('string');
    });

    it('debería permitir path y errors opcionales', () => {
      const response = ApiResponse.success('Test', {});

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('statusCode');
    });
  });
});
