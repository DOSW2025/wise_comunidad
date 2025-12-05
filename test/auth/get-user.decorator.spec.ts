import { ExecutionContext } from '@nestjs/common';
import { GetUser } from '../../src/auth/decorators/get-user.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

describe('GetUser Decorator', () => {
  // Helper para extraer la factory del decorador
  function getParamDecoratorFactory(decorator: Function) {
    class Test {
      public test(@decorator() value: unknown) {
        return value;
      }
    }

    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    return args[Object.keys(args)[0]].factory;
  }

  const mockUser = {
    id: 'user-123',
    email: 'test@mail.escuelaing.edu.co',
    rol: 'estudiante',
    nombre: 'Test User',
  };

  const createMockContext = (user: unknown): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('debe retornar el usuario completo si no se especifica propiedad', () => {
    const factory = getParamDecoratorFactory(GetUser);
    const context = createMockContext(mockUser);

    const result = factory(undefined, context);

    expect(result).toEqual(mockUser);
  });

  it('debe retornar una propiedad específica del usuario', () => {
    const factory = getParamDecoratorFactory(GetUser);
    const context = createMockContext(mockUser);

    const resultId = factory('id', context);
    const resultEmail = factory('email', context);
    const resultRol = factory('rol', context);

    expect(resultId).toBe('user-123');
    expect(resultEmail).toBe('test@mail.escuelaing.edu.co');
    expect(resultRol).toBe('estudiante');
  });

  it('debe retornar undefined si la propiedad no existe', () => {
    const factory = getParamDecoratorFactory(GetUser);
    const context = createMockContext(mockUser);

    const result = factory('propiedadInexistente', context);

    expect(result).toBeUndefined();
  });

  it('debe retornar undefined si no hay usuario', () => {
    const factory = getParamDecoratorFactory(GetUser);
    const context = createMockContext(undefined);

    const result = factory('id', context);

    expect(result).toBeUndefined();
  });

  it('debe manejar usuario null', () => {
    const factory = getParamDecoratorFactory(GetUser);
    const context = createMockContext(null);

    const result = factory('id', context);

    expect(result).toBeUndefined();
  });
});
