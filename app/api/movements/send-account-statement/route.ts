import { NextRequest, NextResponse } from 'next/server'
import { formatDateForDisplay } from '@/lib/date-utils'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { member, movements, facturas, pagos, senderEmail, recipientEmail, subject, message } = await request.json()

    // Validaciones
    if (!member || !senderEmail || !recipientEmail) {
      return NextResponse.json(
        { error: 'Datos inválidos. Verifique member, senderEmail y recipientEmail' },
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
    const emailContent = generateAccountStatementEmailContent(member, movements, facturas, pagos, message)

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

    console.log('Estado de cuenta enviado por email:', {
      from: senderEmail,
      to: recipientEmail,
      subject: subject,
      member: member.razon_social
    })

    return NextResponse.json({
      success: true,
      message: 'Estado de cuenta enviado correctamente',
      details: {
        from: senderEmail,
        to: recipientEmail,
        subject: subject
      }
    })

  } catch (error) {
    console.error('Error en send-account-statement:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function generateAccountStatementEmailContent(member: any, movements: any[], facturas: any[], pagos: any[], customMessage: string) {
  const memberName = member?.razon_social || 'N/A'
  const memberCuit = member?.cuit || 'N/A'
  const memberEmail = member?.mail || 'N/A'
  const memberTipo = member?.tipo_socio || 'N/A'
  const memberTelefono = member?.telefono || 'No registrado'
  const memberDireccion = member?.direccion || 'No registrada'

  // Calcular estadísticas
  const currentBalance = movements.length > 0 ? movements[0].saldo : 0
  const totalCharges = movements.filter(m => m.tipo === "Cargo").reduce((sum, m) => sum + m.monto, 0)
  const totalPayments = pagos.reduce((sum, p) => sum + p.monto, 0)
  const pendingInvoices = facturas.filter(f => f.estado === "Pendiente")
  const paidInvoices = facturas.filter(f => f.estado === "Pagada")
  const overdueMovements = movements.filter(m => m.estado === "Vencida")

  // Crear historial combinado
  const historialCombinado = [
    ...movements.map(m => ({
      fecha: m.fecha,
      tipo: m.tipo,
      concepto: m.concepto,
      monto: m.monto,
      saldo: m.saldo,
      esPago: false
    })),
    ...pagos.map(p => ({
      fecha: p.fecha,
      tipo: 'Pago',
      concepto: `Pago - Ref: ${p.referencia || 'Sin referencia'}`,
      monto: -p.monto,
      saldo: null,
      esPago: true
    }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estado de Cuenta Completo - Cámara Haedo</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #2980b9, #3498db);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 12px;
            margin-bottom: 35px;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.95;
            font-size: 16px;
        }
        .section {
            margin-bottom: 35px;
            border-left: 5px solid #3498db;
            padding-left: 20px;
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
        }
        .section-title {
            color: #2980b9;
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
        }
        .section-title::before {
            content: "▶";
            margin-right: 10px;
            color: #3498db;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .info-label {
            font-weight: bold;
            color: #2c3e50;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            color: #34495e;
            margin-top: 5px;
            font-size: 16px;
            word-wrap: break-word;
        }
        .financial-summary {
            background: linear-gradient(135deg, #e8f8f5, #d5f4e6);
            padding: 25px;
            border-radius: 12px;
            border: 2px solid #27ae60;
            margin-bottom: 20px;
        }
        .financial-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .financial-item {
            text-align: center;
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .financial-label {
            font-size: 14px;
            color: #27ae60;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .financial-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .amount-saldo { color: #3498db; }
        .amount-saldo.deudor { color: #e74c3c; }
        .amount-saldo.favor { color: #2980b9; }
        .amount-charges { color: #e74c3c; }
        .amount-payments { color: #27ae60; }
        .amount-overdue { color: #f39c12; }
        .estado-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 5px;
        }
        .estado-al-dia { background-color: #d5f4e6; color: #27ae60; }
        .estado-deudor { background-color: #fadbd8; color: #e74c3c; }
        .estado-favor { background-color: #d6eaf8; color: #2980b9; }
        .custom-message {
            background: linear-gradient(135deg, #fff3e0, #ffe0b2);
            border-left: 5px solid #ff9800;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            font-style: italic;
        }
        .history-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .history-table th {
            background: linear-gradient(135deg, #34495e, #2c3e50);
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
        }
        .history-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #ecf0f1;
        }
        .history-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .history-table tr:hover {
            background-color: #e3f2fd;
        }
        .tipo-cargo { color: #e74c3c; font-weight: bold; }
        .tipo-pago { color: #27ae60; font-weight: bold; }
        .invoices-section {
            background: linear-gradient(135deg, #ffebee, #fce4ec);
            border: 2px solid #e91e63;
            border-radius: 12px;
            padding: 20px;
        }
        .invoice-item {
            background-color: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #e91e63;
            display: flex;
            justify-content: between;
            align-items: center;
        }
        .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 3px solid #3498db;
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container { padding: 20px; }
            .info-grid { grid-template-columns: 1fr; }
            .financial-grid { grid-template-columns: 1fr; }
            .history-table { font-size: 12px; }
            .history-table th, .history-table td { padding: 8px 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CÁMARA HAEDO</h1>
            <p>Estado de Cuenta Completo</p>
            <p>Generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}</p>
        </div>

        ${customMessage ? `
        <div class="custom-message">
            <strong>Mensaje:</strong><br>
            ${customMessage.replace(/\n/g, '<br>')}
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">Información del Socio</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Razón Social</div>
                    <div class="info-value">${memberName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">CUIT</div>
                    <div class="info-value" style="font-family: monospace;">${memberCuit}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tipo de Socio</div>
                    <div class="info-value">${memberTipo}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${memberEmail}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Teléfono</div>
                    <div class="info-value">${memberTelefono}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Dirección</div>
                    <div class="info-value">${memberDireccion}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Resumen Financiero</div>
            <div class="financial-summary">
                <div class="financial-grid">
                    <div class="financial-item">
                        <div class="financial-label">Saldo Actual</div>
                        <div class="financial-value amount-saldo ${currentBalance > 0 ? 'deudor' : currentBalance < 0 ? 'favor' : ''}">
                            $${Math.abs(currentBalance).toLocaleString()}
                        </div>
                        <div class="estado-badge estado-${currentBalance === 0 ? 'al-dia' : currentBalance > 0 ? 'deudor' : 'favor'}">
                            ${currentBalance === 0 ? 'Al día' : currentBalance > 0 ? 'Deudor' : 'A favor'}
                        </div>
                    </div>
                    <div class="financial-item">
                        <div class="financial-label">Total Cargos</div>
                        <div class="financial-value amount-charges">$${totalCharges.toLocaleString()}</div>
                        <div style="font-size: 14px; color: #7f8c8d;">${movements.filter(m => m.tipo === "Cargo").length} registros</div>
                    </div>
                    <div class="financial-item">
                        <div class="financial-label">Total Pagos</div>
                        <div class="financial-value amount-payments">$${totalPayments.toLocaleString()}</div>
                        <div style="font-size: 14px; color: #7f8c8d;">${pagos.length} registros</div>
                    </div>
                    <div class="financial-item">
                        <div class="financial-label">Cuotas Vencidas</div>
                        <div class="financial-value amount-overdue">${overdueMovements.length}</div>
                        <div style="font-size: 14px; color: #7f8c8d;">$${overdueMovements.reduce((sum, m) => sum + m.saldo, 0).toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Historial Completo</div>
            ${historialCombinado.length > 0 ? `
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Concepto</th>
                        <th style="text-align: right;">Monto</th>
                        <th style="text-align: right;">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    ${historialCombinado.slice(0, 15).map(item => `
                    <tr>
                        <td>${formatDateForDisplay(item.fecha)}</td>
                        <td><span class="tipo-${item.tipo.toLowerCase()}">${item.tipo}</span></td>
                        <td>${item.concepto || 'Sin concepto'}</td>
                        <td style="text-align: right; font-weight: bold;" class="tipo-${item.tipo.toLowerCase()}">
                            $${Math.abs(item.monto).toLocaleString()}
                        </td>
                        <td style="text-align: right;">
                            ${item.saldo !== null ? '$' + item.saldo.toLocaleString() : '-'}
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ${historialCombinado.length > 15 ? `
            <p style="text-align: center; margin-top: 15px; color: #7f8c8d;">
                <em>... y ${historialCombinado.length - 15} registros más</em>
            </p>
            ` : ''}
            ` : '<p style="text-align: center; color: #7f8c8d; font-style: italic;">No hay movimientos registrados</p>'}
        </div>

        ${pendingInvoices.length > 0 ? `
        <div class="section">
            <div class="section-title">Facturas Pendientes (${pendingInvoices.length})</div>
            <div class="invoices-section">
                ${pendingInvoices.slice(0, 5).map(factura => `
                <div class="invoice-item">
                    <div style="flex: 1;">
                        <strong>${factura.numero_factura || 'N/A'}</strong><br>
                        <small style="color: #7f8c8d;">${formatDateForDisplay(factura.fecha)}</small>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">
                            $${factura.monto.toLocaleString()}
                        </div>
                        <div style="font-size: 12px; color: #e74c3c;">${factura.estado}</div>
                    </div>
                </div>
                `).join('')}
                ${pendingInvoices.length > 5 ? `
                <p style="text-align: center; margin-top: 15px; color: #e74c3c;">
                    <strong>... y ${pendingInvoices.length - 5} facturas pendientes más</strong>
                </p>
                ` : ''}
            </div>
        </div>
        ` : ''}

        ${paidInvoices.length > 0 ? `
        <div class="section">
            <div class="section-title">Facturas Pagadas (${paidInvoices.length})</div>
            <p style="color: #27ae60; font-weight: bold;">
                ✅ ${paidInvoices.length} facturas pagadas por un total de $${paidInvoices.reduce((sum, f) => sum + f.monto, 0).toLocaleString()}
            </p>
        </div>
        ` : ''}

        <div class="footer">
            <p><strong>Cámara Haedo</strong> - Estado de Cuenta Completo</p>
            <p>Este documento fue generado automáticamente por el Sistema de Gestión.</p>
            <p>Para consultas o aclaraciones, por favor contacte con la administración.</p>
        </div>
    </div>
</body>
</html>
  `
}