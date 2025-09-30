// Suprimir errores específicos de headers() en development
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // Suprimir errores específicos de headers()
    if (
      message.includes('headers() should be awaited') ||
      message.includes('sync-dynamic-apis') ||
      message.includes('createHeadersAccessError') ||
      message.includes('Route "/') && message.includes('used `...headers()')
    ) {
      return; // No mostrar estos errores
    }
    
    // Mostrar otros errores normalmente
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // Suprimir warnings específicos de headers()
    if (
      message.includes('headers() should be awaited') ||
      message.includes('sync-dynamic-apis')
    ) {
      return; // No mostrar estos warnings
    }
    
    // Mostrar otros warnings normalmente
    originalWarn.apply(console, args);
  };

  // También interceptar uncaughtException para errores de headers
  const originalUncaughtException = process.listeners('uncaughtException');
  process.removeAllListeners('uncaughtException');
  
  process.on('uncaughtException', (error) => {
    if (
      error.message.includes('headers() should be awaited') ||
      error.message.includes('sync-dynamic-apis')
    ) {
      return; // Ignorar estos errores
    }
    
    // Re-emitir otros errores
    originalUncaughtException.forEach(listener => {
      if (typeof listener === 'function') {
        listener(error);
      }
    });
  });
}