import { Test } from '@nestjs/testing';
import { BadRequestException, HttpException, NotFoundException, ConflictException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost } from '@nestjs/common';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockRequest = {
      url: '/test-endpoint',
      method: 'GET',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  describe('catch', () => {
    it('debería manejar HttpException correctamente', () => {
      const exception = new BadRequestException('Bad request error');

      filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 400,
          message: 'Bad request error',
          path: '/test-endpoint',
        }),
      );
    });

    it('debería retornar statusCode 404 para NotFoundException', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Not found',
        }),
      );
    });

    it('debería retornar statusCode 409 para ConflictException', () => {
      const exception = new ConflictException('Conflict');

      filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 409,
          message: 'Conflict',
        }),
      );
    });

    it('debería retornar statusCode 500 para excepciones genéricas', () => {
      const exception = new Error('Generic error');

      filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 500,
        }),
      );
    });

    it('debería incluir timestamp en la respuesta', () => {
      const exception = new BadRequestException('Test error');

      filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });

    it('debería incluir path en la respuesta', () => {
      const exception = new BadRequestException('Test error');
      mockRequest.url = '/forums/1/messages';

      filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/forums/1/messages',
        }),
      );
    });

    it('debería incluir array de errores si existen', () => {
      const exception = new BadRequestException({
        message: 'Bad request',
        statusCode: 400,
      });

      filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs).toHaveProperty('success');
      expect(callArgs).toHaveProperty('statusCode');
    });

    it('debería manejar excepciones sin mensaje', () => {
      const exception = new Error();

      filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 500,
        }),
      );
    });

    it('debería incluir success: false', () => {
      const exception = new BadRequestException('Error');

      filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });

  describe('Manejo de diferentes tipos de excepciones HTTP', () => {
    const testCases = [
      { exception: new BadRequestException('Bad request'), expectedStatus: 400 },
      { exception: new NotFoundException('Not found'), expectedStatus: 404 },
      { exception: new ConflictException('Conflict'), expectedStatus: 409 },
    ];

    testCases.forEach(({ exception, expectedStatus }) => {
      it(`debería manejar ${exception.constructor.name} correctamente`, () => {
        filter.catch(exception, mockArgumentsHost as unknown as ArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            statusCode: expectedStatus,
          }),
        );
      });
    });
  });
});
