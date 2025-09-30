import { NextRequest, NextResponse } from 'next/server'
import { formatDateForDisplay } from '@/lib/date-utils'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { movement, member, cargo, senderEmail, recipientEmail, subject, message } = await request.json()

    // Validaciones
    if (!movement || !senderEmail || !recipientEmail) {
      return NextResponse.json(
        { error: 'Datos inválidos. Verifique movement, senderEmail y recipientEmail' },
        { status: 400 }
      )
    }

    // Validar formato de emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(senderEmail) || !emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Generar contenido HTML del email
    const emailContent = generateEmailContent(movement, member, cargo, message)

    // Crear transporter de Nodemailer
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Verificar configuración
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { error: 'Configuración de email no encontrada. Configure EMAIL_USER y EMAIL_PASS en .env.local' },
        { status: 500 }
      )
    }

    // Enviar email
    const mailOptions = {
      from: `"Cámara Haedo" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: emailContent,
      replyTo: senderEmail
    }

    await transporter.sendMail(mailOptions)

    console.log('Email enviado exitosamente:', {
      from: senderEmail,
      to: recipientEmail,
      subject: subject
    })

    return NextResponse.json({
      success: true,
      message: 'Email enviado correctamente',
      details: {
        from: senderEmail,
        to: recipientEmail,
        subject: subject
      }
    })

  } catch (error) {
    console.error('Error en send-email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function generateEmailContent(movement: any, member: any, cargo: any, customMessage: string) {
  const memberName = member?.razon_social || 'N/A'
  const memberCuit = member?.cuit || 'N/A'
  const memberEmail = member?.mail || 'N/A'

  const movementDate = formatDateForDisplay(movement.fecha)
  const dueDate = movement.fecha_vencimiento ? formatDateForDisplay(movement.fecha_vencimiento) : 'Sin vencimiento'
  const estado = movement.estado || 'N/A'
  const tipo = movement.tipo || 'N/A'
  const concepto = movement.concepto || 'Sin concepto'
  const comprobante = movement.comprobante || 'N/A'
  const monto = movement.monto ? movement.monto.toLocaleString() : '0'
  const saldo = movement.saldo ? movement.saldo.toLocaleString() : '0'
  const pagado = movement.monto && movement.saldo ? (movement.monto - movement.saldo).toLocaleString() : '0'

  const cargoName = cargo?.nombre || 'N/A'
  const metodo = movement.metodo_pago || 'No especificado'
  const referencia = movement.referencia || ''

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detalle de Cuenta - Cámara Haedo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #2980b9, #3498db);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 25px;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        .section-title {
            color: #2980b9;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
        }
        .info-item {
            background-color: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #3498db;
        }
        .info-label {
            font-weight: bold;
            color: #2c3e50;
            font-size: 14px;
        }
        .info-value {
            color: #34495e;
            margin-top: 3px;
        }
        .financial-summary {
            background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #27ae60;
            text-align: center;
        }
        .financial-item {
            display: inline-block;
            margin: 0 20px;
            text-align: center;
        }
        .financial-label {
            font-size: 12px;
            color: #27ae60;
            font-weight: bold;
            text-transform: uppercase;
        }
        .financial-value {
            font-size: 20px;
            font-weight: bold;
            margin-top: 5px;
        }
        .amount-original { color: #3498db; }
        .amount-paid { color: #27ae60; }
        .amount-pending { color: #e74c3c; }
        .estado-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .estado-cobrada { background-color: #d5f4e6; color: #27ae60; }
        .estado-pendiente { background-color: #fff3cd; color: #856404; }
        .estado-vencida { background-color: #f8d7da; color: #721c24; }
        .custom-message {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
        }
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            .financial-item {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CÁMARA HAEDO</h1>
            <p>Sistema de Gestión - Detalle de Cuenta</p>
            <p>Generado el ${new Date().toLocaleDateString('es-AR')}</p>
        </div>

        ${customMessage ? `
        <div class="custom-message">
            <strong>Mensaje:</strong><br>
            ${customMessage.replace(/\n/g, '<br>')}
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">👤 Información del Socio</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Razón Social</div>
                    <div class="info-value">${memberName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">CUIT</div>
                    <div class="info-value">${memberCuit}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${memberEmail}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📋 Detalles del Movimiento</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">ID del Movimiento</div>
                    <div class="info-value" style="font-family: monospace; font-size: 12px;">${movement.id}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tipo</div>
                    <div class="info-value">
                        <span class="estado-badge ${tipo === 'Cargo' ? 'estado-vencida' : 'estado-cobrada'}">${tipo}</span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fecha</div>
                    <div class="info-value">${movementDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Estado</div>
                    <div class="info-value">
                        <span class="estado-badge estado-${estado.toLowerCase()}">${estado}</span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Vencimiento</div>
                    <div class="info-value">${dueDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Comprobante</div>
                    <div class="info-value" style="font-family: monospace; font-size: 12px;">${comprobante}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">💰 Resumen Financiero</div>
            <div class="financial-summary">
                <div class="financial-item">
                    <div class="financial-label">Monto Original</div>
                    <div class="financial-value amount-original">$${monto}</div>
                </div>
                <div class="financial-item">
                    <div class="financial-label">Monto Pagado</div>
                    <div class="financial-value amount-paid">$${pagado}</div>
                </div>
                <div class="financial-item">
                    <div class="financial-label">Saldo Pendiente</div>
                    <div class="financial-value amount-pending">$${saldo}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📝 Información Adicional</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Concepto</div>
                    <div class="info-value">${concepto}</div>
                </div>
                ${cargoName !== 'N/A' ? `
                <div class="info-item">
                    <div class="info-label">Cargo Asociado</div>
                    <div class="info-value">${cargoName}</div>
                </div>
                ` : ''}
                <div class="info-item">
                    <div class="info-label">Método de Pago</div>
                    <div class="info-value">${metodo}</div>
                </div>
                ${referencia ? `
                <div class="info-item">
                    <div class="info-label">Referencia</div>
                    <div class="info-value">${referencia}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="footer">
            <p><strong>Cámara Haedo</strong> - Sistema de Gestión</p>
            <p>Este documento fue generado automáticamente. Para consultas, contacte con la administración.</p>
        </div>
    </div>
</body>
</html>
  `
}