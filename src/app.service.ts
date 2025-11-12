import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Microservicio de wise_comunidad desplegadp correctamente';
  }
}
