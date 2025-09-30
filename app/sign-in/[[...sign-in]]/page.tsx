"use client";

import { useState, useEffect } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { signIn, setActive } = useSignIn();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Si el usuario ya está autenticado, redirigir inmediatamente
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/home");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!signIn) {
      setError("Error de configuración del sistema");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn.create({
        identifier: username,
        password,
      });

      if (result?.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/home");
      } else {
        setError("Error al iniciar sesión. Verifica tus credenciales.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (!isLoaded || (isLoaded && isSignedIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel Izquierdo - Ilustración */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Contenido del panel izquierdo */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-16 text-center w-full">
          {/* Logo grande */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/logo-cooperativa.png"
              alt="Logo Cooperativa"
              width={120}
              height={120}
              className="rounded-2xl shadow-2xl"
            />
          </div>
          
          {/* Título principal */}
          <h1 className="text-5xl font-bold mb-4 text-center">
            Camara de Comercio Haedo
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-md text-center mx-auto">
            Sistema de Gestión Integral para Agrupaciones
          </p>
          
          {/* Características del sistema */}
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              <span className="text-blue-100 text-center">Gestión completa de socios</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              <span className="text-blue-100 text-center">Facturación automatizada</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              <span className="text-blue-100 text-center">Control de proveedores</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              <span className="text-blue-100 text-center">Reportes en tiempo real</span>
            </div>
          </div>
        </div>
        
        {/* Elementos flotantes decorativos */}
        <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-white/10 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="flex-1 lg:w-2/5 flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo pequeño para móviles */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/images/logo-cooperativa.png"
              alt="Logo Cooperativa"
              width={60}
              height={60}
              className="rounded-xl mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              1
            </h2>
          </div>

          {/* Título del formulario */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bienvenido de vuelta
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Inicia sesión para acceder a tu cuenta
            </p>
          </div>

          {/* Formulario personalizado */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de username */}
              <div>
                <label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 text-lg"
                  placeholder="Ingresa tu nombre de usuario"
                  required
                />
              </div>

              {/* Campo de contraseña */}
              <div>
                <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 text-lg"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          </div>

          {/* Información adicional */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿Necesitas ayuda?{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Contacta al administrador
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
