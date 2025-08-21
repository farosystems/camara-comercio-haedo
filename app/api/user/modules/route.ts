import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserModules } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const modulos = await getUserModules();
    return NextResponse.json(modulos);
  } catch (error) {
    console.error('Error obteniendo módulos del usuario:', error);
    return NextResponse.json(
      { error: 'Error obteniendo módulos' },
      { status: 500 }
    );
  }
}





