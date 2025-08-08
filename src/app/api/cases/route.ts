import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  console.log('🚀 === ENDPOINT /api/cases LLAMADO ===')
  console.log('Headers recibidos:', Object.fromEntries(request.headers.entries()))
  
  try {
    // Obtener el token de autenticación
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    
    console.log('Token extraído de cookies:', token ? 'presente' : 'ausente')
    
    if (!token) {
      console.error('❌ Token de autenticación no encontrado')
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Obtener los datos del request
    const body = await request.json()
    console.log('📦 Datos recibidos para crear caso:', body)
    
    // Validar datos requeridos
    const { type, companyName, messageId } = body
    
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'El tipo de caso es requerido' },
        { status: 400 }
      )
    }
    
    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'El nombre de la empresa es requerido' },
        { status: 400 }
      )
    }
    
    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'El messageId es requerido' },
        { status: 400 }
      )
    }
    
    // Preparar el payload para el backend
    const payload = {
      type,
      companyName,
      messageId
    }
    
    console.log('🌐 Enviando al backend:', payload)
    console.log('🎯 URL del backend:', `${BACKEND_URL}/cases`)
    
    // Realizar la petición al backend
    const response = await fetch(`${BACKEND_URL}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    
    console.log('📡 Respuesta del backend - Status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Error del backend:', errorData)
      
      let errorMessage = 'Error al crear el caso'
      if (response.status === 401) {
        errorMessage = 'No autorizado'
      } else if (response.status === 400) {
        errorMessage = 'Datos inválidos'
      } else if (response.status === 500) {
        errorMessage = 'Error interno del servidor'
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      )
    }
    
    // Obtener la respuesta del backend
    const data = await response.json()
    console.log('Caso creado exitosamente:', data)
    
    return NextResponse.json({
      success: true,
      message: 'Caso creado exitosamente',
      data: data
    })
    
  } catch (error) {
    console.error('Error creando caso:', error)
    
    let errorMessage = 'Error interno del servidor'
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Error de conexión con el backend'
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de casos funcionando correctamente',
    timestamp: new Date().toISOString(),
    methods: ['POST']
  })
}
