/**
 * Utilidades para manejo de fechas con zona horaria de Argentina
 */

export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en zona horaria de Argentina
 */
export function getArgentinaDateString(): string {
  const now = new Date();
  // Convertir a zona horaria de Argentina
  const argentinaDate = new Date(now.toLocaleString("en-US", {timeZone: ARGENTINA_TIMEZONE}));
  return argentinaDate.toLocaleDateString('en-CA'); // formato YYYY-MM-DD
}

/**
 * Formatea una fecha para mostrar en la UI en formato argentino
 */
export function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';

  try {
    // Si la fecha ya tiene hora (formato ISO completo), usarla directamente
    let date: Date;
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      // Si solo es fecha (YYYY-MM-DD), agregar hora del mediodía
      date = new Date(dateString + 'T12:00:00');
    }

    // Verificar que la fecha es válida
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', dateString);
      return 'Fecha inválida';
    }

    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: ARGENTINA_TIMEZONE
    });
  } catch (error) {
    console.error('Error formateando fecha:', error, 'dateString:', dateString);
    return 'Fecha inválida';
  }
}

/**
 * Convierte una fecha de string a formato ISO para inputs de fecha
 */
export function dateStringToInputValue(dateString: string | null): string {
  if (!dateString) return '';
  
  try {
    // Si ya está en formato YYYY-MM-DD, devolverla tal como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Si es una fecha ISO completa, extraer solo la fecha
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Intentar parsear y convertir
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error convirtiendo fecha para input:', error);
    return '';
  }
}