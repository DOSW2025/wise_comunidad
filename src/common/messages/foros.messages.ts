/**
 * Mensajes consistentes para la aplicación
 * Centralizados para fácil mantenimiento
 */

export class ForosMessages {
  // Éxito - Foros
  static FORO_CREATED(nombre: string, materia: string) {
    return `✅ Foro "${nombre}" creado exitosamente para la materia "${materia}".`;
  }

  static FORO_LISTED = '✅ Foros listados exitosamente.';
  static FORO_RETRIEVED = '✅ Foro obtenido exitosamente.';

  // Éxito - Hilos
  static THREAD_CREATED(title: string) {
    return `✅ Hilo "${title}" creado exitosamente.`;
  }

  static THREAD_LISTED = '✅ Hilos listados exitosamente.';
  static THREAD_RETRIEVED = '✅ Hilo obtenido exitosamente.';

  // Éxito - Posts
  static POST_CREATED = '✅ Post creado exitosamente.';
  static POST_LISTED = '✅ Posts listados exitosamente.';

  // Éxito - Mensajes
  static MENSAJE_SENT(username: string) {
    return `✅ Mensaje enviado exitosamente por ${username}.`;
  }

  static MENSAJES_LISTED = '✅ Mensajes listados exitosamente.';
  static MENSAJE_MARKED_READ = '✅ Mensaje marcado como leído.';

  // Errores - Validación
  static MATERIA_NOT_FOUND(materiaId: string) {
    return `❌ La materia con ID "${materiaId}" no existe. Por favor, verifica el ID. Asegúrate de que la materia está registrada en el sistema.`;
  }

  static FORO_SLUG_DUPLICATE(slug: string) {
    return `❌ Un foro con el slug "${slug}" ya existe. Por favor, usa otro slug único.`;
  }

  static FORO_DUPLICATE(materiaNombre: string) {
    return `❌ Ya existe un foro para la materia "${materiaNombre}". No se pueden crear foros duplicados. Una materia solo puede tener un foro.`;
  }

  static FORO_NOT_FOUND = `❌ El foro solicitado no fue encontrado. Verifica el slug e intenta de nuevo.`;
  static THREAD_NOT_FOUND = `❌ El hilo solicitado no fue encontrado. Verifica el ID e intenta de nuevo.`;
  static USUARIO_NOT_FOUND(usuarioId: string) {
    return `❌ El usuario con ID "${usuarioId}" no existe. Por favor, verifica el ID.`;
  }

  // Errores - Validación de entrada
  static INVALID_SLUG = '❌ El slug no es válido. Usa solo letras, números y guiones.';
  static INVALID_NOMBRE = '❌ El nombre debe tener entre 3 y 100 caracteres.';
  static REQUIRED_FIELD(field: string) {
    return `❌ El campo "${field}" es requerido.`;
  }

  // Errores - BD
  static DATABASE_ERROR = '❌ Error al acceder a la base de datos. Por favor, intenta de nuevo más tarde.';
  static DATABASE_CREATE_ERROR = '❌ Error al crear el registro en la base de datos. Por favor, verifica los datos e intenta de nuevo.';
  static DATABASE_UPDATE_ERROR = '❌ Error al actualizar el registro. Por favor, intenta de nuevo.';
  static DATABASE_DELETE_ERROR = '❌ Error al eliminar el registro. Por favor, intenta de nuevo.';

  // Errores - Genéricos
  static INTERNAL_ERROR = '❌ Error interno del servidor. Por favor, contacta al administrador.';
  static UNAUTHORIZED = '❌ No tienes permiso para realizar esta acción.';
  static FORBIDDEN = '❌ Acceso denegado a este recurso.';

  // Warnings
  static NO_DATA = '⚠️ No hay datos disponibles.';
  static PARTIAL_ERROR = '⚠️ Se completó parcialmente con algunas advertencias.';
}
