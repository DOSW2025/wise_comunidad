import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator para especificar qué roles pueden acceder a una ruta.
 * Si no ponen @Public() antes de la ruta, se asume que es privada y requiere autenticación. (solo que el usuario este registrado)
 * @example
 * // Solo admin puede acceder, lo mimso, cambian de Role.,ADMIN a Role.TUTOR
 * @Roles(Role.ADMIN)
 *
 * @example
 * // Admin o tutor pueden acceder, ambos roles tienen acceso.
 * @Roles(Role.ADMIN, Role.TUTOR)
 * es solo un ejemplo pero dejen la documentación como esta en todo microservicio que implemente auth.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
