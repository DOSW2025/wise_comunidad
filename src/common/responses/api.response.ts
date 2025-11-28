/**
 * Estructura estándar para respuestas de éxito y error
 */

export class ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
  path?: string;
  errors?: { field: string; message: string }[];

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    data?: T,
    errors?: { field: string; message: string }[],
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.errors = errors;
  }

  static success<T>(message: string, data: T, statusCode = 200): ApiResponse<T> {
    return new ApiResponse(true, statusCode, message, data);
  }

  static error(message: string, statusCode = 400, errors?: { field: string; message: string }[]): ApiResponse {
    return new ApiResponse(false, statusCode, message, undefined, errors);
  }

  static created<T>(message: string, data: T): ApiResponse<T> {
    return new ApiResponse(true, 201, message, data);
  }

  static notFound(message: string): ApiResponse {
    return new ApiResponse(false, 404, message);
  }

  static conflict(message: string): ApiResponse {
    return new ApiResponse(false, 409, message);
  }

  static badRequest(message: string, errors?: { field: string; message: string }[]): ApiResponse {
    return new ApiResponse(false, 400, message, undefined, errors);
  }

  static internalError(message: string): ApiResponse {
    return new ApiResponse(false, 500, message);
  }
}
