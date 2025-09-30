"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Eye,
  FileText,
  CreditCard,
  Mail,
  Search,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDateForDisplay } from "@/lib/date-utils"
import {
  MovimientoSocio,
  Socio,
  Factura,
  Pago,
  getMovimientosSocios,
  getSocios,
  getFacturas,
  getPagos
} from "@/lib/supabase-admin"

export function AccountsBillingModule() {
  const { toast } = useToast()
  const [movements, setMovements] = useState<MovimientoSocio[]>([])
  const [members, setMembers] = useState<Socio[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para filtros y paginación
  const [memberSearch, setMemberSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const membersPerPage = 10

  // Estados para pagos
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Socio | null>(null)

  // Estados para modal de detalle del socio
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<Socio | null>(null)

  // Estado para generación de PDF de estado de cuenta
  const [isGeneratingAccountPDF, setIsGeneratingAccountPDF] = useState(false)

  // Estados para modal de envío de email de estado de cuenta
  const [isAccountEmailModalOpen, setIsAccountEmailModalOpen] = useState(false)
  const [selectedMemberForAccountEmail, setSelectedMemberForAccountEmail] = useState<Socio | null>(null)
  const [accountEmailSender, setAccountEmailSender] = useState("")
  const [accountEmailRecipient, setAccountEmailRecipient] = useState("")
  const [accountEmailSubject, setAccountEmailSubject] = useState("")
  const [accountEmailMessage, setAccountEmailMessage] = useState("")
  const [isSendingAccountEmail, setIsSendingAccountEmail] = useState(false)

  // Cargar datos desde Supabase
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [movementsData, membersData, facturasData, pagosData] = await Promise.all([
        getMovimientosSocios(),
        getSocios(),
        getFacturas(),
        getPagos()
      ])
      setMovements(movementsData)
      setMembers(membersData)
      setFacturas(facturasData)
      setPagos(pagosData)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos')
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar y paginar miembros
  const filteredMembers = members.filter(member => {
    // Filtro por búsqueda de socio
    const matchesSearch = memberSearch === "" ||
      member.razon_social.toLowerCase().includes(memberSearch.toLowerCase())

    // Filtro por estado
    let matchesStatus = true
    if (statusFilter !== "all") {
      const memberMovements = movements.filter(m => m.fk_id_socio === member.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      const currentBalance = memberMovements.length > 0 ? memberMovements[0].saldo : 0

      switch (statusFilter) {
        case "al-dia":
          matchesStatus = currentBalance === 0
          break
        case "deudor":
          matchesStatus = currentBalance > 0
          break
        case "a-favor":
          matchesStatus = currentBalance < 0
          break
        default:
          matchesStatus = true
      }
    }

    return matchesSearch && matchesStatus
  })

  // Paginación
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage)
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * membersPerPage,
    currentPage * membersPerPage
  )

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [memberSearch, statusFilter])

  const handleGenerateAccountStatement = async (member: Socio) => {
    setIsGeneratingAccountPDF(true)

    try {
      // Importación dinámica de jsPDF
      const { jsPDF } = await import('jspdf')

      // Obtener todos los datos del socio
      const memberMovements = movements.filter(m => m.fk_id_socio === member.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      const memberFacturas = facturas.filter(f => f.fk_id_socio === member.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      // Obtener pagos del socio
      const memberPagos = pagos.filter(p => p.fk_id_socio === member.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      // Calcular estadísticas
      const currentBalance = memberMovements.length > 0 ? memberMovements[0].saldo : 0
      const totalCharges = memberMovements.filter(m => m.tipo === "Cargo").reduce((sum, m) => sum + m.monto, 0)

      // Calcular pagos usando la tabla pagos
      const totalPayments = memberPagos.reduce((sum, p) => sum + p.monto, 0)

      const pendingInvoices = memberFacturas.filter(f => f.estado === "Pendiente")
      const paidInvoices = memberFacturas.filter(f => f.estado === "Pagada")
      const overdueMovements = memberMovements.filter(m => m.estado === "Vencida")

      console.log('Debug PDF - Total Cargos:', totalCharges)
      console.log('Debug PDF - Saldo Actual:', currentBalance)
      console.log('Debug PDF - Total Pagos de tabla pagos:', totalPayments)
      console.log('Debug PDF - Cantidad de pagos:', memberPagos.length)
      console.log('Debug PDF - Pagos del socio:', memberPagos)

      // Crear nuevo documento PDF
      const doc = new jsPDF('p', 'mm', 'a4')

      // Header del documento
      doc.setFillColor(41, 128, 185) // Azul
      doc.rect(0, 0, 210, 50, 'F')

      // Logo/Título
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text('CÁMARA HAEDO', 20, 25)

      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text('Estado de Cuenta Completo', 20, 35)

      // Fecha de generación
      doc.setFontSize(10)
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`, 20, 42)

      let yPos = 65

      // Información del Socio
      doc.setFillColor(240, 248, 255) // Azul muy claro
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setTextColor(41, 128, 185)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMACIÓN DEL SOCIO', 20, yPos + 5)

      yPos += 15
      doc.setTextColor(52, 73, 94)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      // Información en dos columnas
      doc.setFont('helvetica', 'bold')
      doc.text('Razón Social:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(member.razon_social || 'N/A'), 50, yPos)

      doc.setFont('helvetica', 'bold')
      doc.text('CUIT:', 110, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(member.cuit || 'N/A'), 130, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Email:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(member.mail || 'No registrado'), 50, yPos)

      doc.setFont('helvetica', 'bold')
      doc.text('Tipo de Socio:', 110, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(member.tipo_socio || 'N/A'), 140, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Teléfono:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(member.telefono_comercial || 'No registrado'), 50, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Dirección:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      const direccionText = String(member.domicilio_comercial || 'No registrada')
      const direccionLines = doc.splitTextToSize(direccionText, 160)
      doc.text(direccionLines, 50, yPos)
      yPos += (direccionLines.length * 5)

      yPos += 10

      // Resumen Financiero
      doc.setFillColor(240, 255, 240) // Verde muy claro
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setTextColor(39, 174, 96)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('RESUMEN FINANCIERO', 20, yPos + 5)

      yPos += 15
      doc.setTextColor(52, 73, 94)
      doc.setFontSize(12)

      // Crear tabla de resumen financiero
      const summaryData = [
        ['Saldo Actual', `$${Math.abs(currentBalance).toLocaleString()}`, currentBalance === 0 ? 'Al día' : currentBalance > 0 ? 'Deudor' : 'A favor'],
        ['Total Cargos', `$${totalCharges.toLocaleString()}`, `${memberMovements.filter(m => m.tipo === "Cargo").length} registros`],
        ['Total Pagos', `$${totalPayments.toLocaleString()}`, `${memberPagos.length} registros`],
        ['Cuotas Vencidas', String(overdueMovements.length), `$${overdueMovements.reduce((sum, m) => sum + m.saldo, 0).toLocaleString()}`]
      ]

      summaryData.forEach((row, index) => {
        doc.setFont('helvetica', 'bold')
        doc.text(String(row[0]), 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(row[1]), 80, yPos)
        doc.text(String(row[2]), 140, yPos)
        yPos += 8
      })

      yPos += 10

      // Historial de Movimientos y Pagos
      // Crear historial combinado
      const historialCombinado = [
        ...memberMovements.map(m => ({
          fecha: m.fecha,
          tipo: m.tipo,
          concepto: m.concepto,
          monto: m.monto,
          saldo: m.saldo,
          esMovimiento: true
        })),
        ...memberPagos.map(p => ({
          fecha: p.fecha,
          tipo: 'Pago',
          concepto: `Pago - Ref: ${p.referencia || 'Sin referencia'}`,
          monto: -p.monto, // Negativo para mostrarlo como salida de dinero
          saldo: null, // Los pagos no tienen saldo directo
          esMovimiento: false
        }))
      ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      if (historialCombinado.length > 0) {
        doc.setFillColor(255, 248, 240) // Naranja muy claro
        doc.rect(15, yPos, 180, 8, 'F')
        doc.setTextColor(230, 126, 34)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('HISTORIAL COMPLETO', 20, yPos + 5)

        yPos += 15
        doc.setTextColor(52, 73, 94)
        doc.setFontSize(9)

        // Headers de la tabla
        doc.setFont('helvetica', 'bold')
        doc.text('Fecha', 20, yPos)
        doc.text('Tipo', 50, yPos)
        doc.text('Concepto', 70, yPos)
        doc.text('Monto', 140, yPos)
        doc.text('Saldo', 170, yPos)

        yPos += 5
        doc.setLineWidth(0.2)
        doc.line(15, yPos, 195, yPos)
        yPos += 5

        doc.setFont('helvetica', 'normal')
        historialCombinado.slice(0, 20).forEach((item) => {
          // Verificar si necesitamos nueva página
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }

          doc.text(String(formatDateForDisplay(item.fecha)), 20, yPos)
          doc.text(String(item.tipo), 50, yPos)

          const conceptoText = String(item.concepto || 'Sin concepto')
          const conceptoLines = doc.splitTextToSize(conceptoText, 65)
          doc.text(conceptoLines[0], 70, yPos) // Solo primera línea para mantener alineación

          // Color según tipo
          if (item.tipo === "Cargo") {
            doc.setTextColor(231, 76, 60) // Rojo
          } else {
            doc.setTextColor(39, 174, 96) // Verde
          }
          doc.text(`$${Math.abs(item.monto).toLocaleString()}`, 140, yPos)

          doc.setTextColor(52, 73, 94) // Gris oscuro
          if (item.saldo !== null) {
            doc.text(`$${item.saldo.toLocaleString()}`, 170, yPos)
          } else {
            doc.text('-', 170, yPos) // Para pagos que no tienen saldo
          }

          yPos += 6
        })

        if (historialCombinado.length > 20) {
          yPos += 5
          doc.setFont('helvetica', 'italic')
          doc.text(`... y ${historialCombinado.length - 20} registros más`, 20, yPos)
        }
      }

      yPos += 15

      // Facturas
      if (memberFacturas.length > 0) {
        // Verificar si necesitamos nueva página
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }

        doc.setFillColor(255, 240, 245) // Rosa muy claro
        doc.rect(15, yPos, 180, 8, 'F')
        doc.setTextColor(231, 76, 60)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('FACTURAS', 20, yPos + 5)

        yPos += 15
        doc.setTextColor(52, 73, 94)
        doc.setFontSize(9)

        // Facturas pendientes
        if (pendingInvoices.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(231, 76, 60)
          doc.text(`PENDIENTES (${pendingInvoices.length}):`, 20, yPos)
          yPos += 8

          doc.setFont('helvetica', 'normal')
          doc.setTextColor(52, 73, 94)
          pendingInvoices.slice(0, 10).forEach((factura) => {
            doc.text(String(factura.id || 'N/A'), 20, yPos)
            doc.text(String(formatDateForDisplay(factura.fecha)), 80, yPos)
            doc.setTextColor(231, 76, 60)
            doc.text(`$${factura.total.toLocaleString()}`, 120, yPos)
            doc.setTextColor(52, 73, 94)
            doc.text(String(factura.estado), 160, yPos)
            yPos += 6
          })
        }

        // Facturas pagadas
        if (paidInvoices.length > 0) {
          yPos += 5
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(39, 174, 96)
          doc.text(`PAGADAS (${paidInvoices.length}):`, 20, yPos)
          yPos += 8

          doc.setFont('helvetica', 'normal')
          doc.setTextColor(52, 73, 94)
          paidInvoices.slice(0, 5).forEach((factura) => {
            doc.text(String(factura.id || 'N/A'), 20, yPos)
            doc.text(String(formatDateForDisplay(factura.fecha)), 80, yPos)
            doc.setTextColor(39, 174, 96)
            doc.text(`$${factura.total.toLocaleString()}`, 120, yPos)
            doc.setTextColor(52, 73, 94)
            doc.text(String(factura.estado), 160, yPos)
            yPos += 6
          })

          if (paidInvoices.length > 5) {
            doc.setFont('helvetica', 'italic')
            doc.text(`... y ${paidInvoices.length - 5} facturas pagadas más`, 20, yPos)
          }
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFillColor(41, 128, 185)
        doc.rect(0, 285, 210, 12, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('Cámara Haedo - Estado de Cuenta Completo', 20, 292)
        doc.text(`Página ${i} de ${pageCount}`, 170, 292)
      }

      // Descargar el PDF
      const fileName = `estado_cuenta_${member.razon_social?.replace(/[^a-zA-Z0-9]/g, '_') || 'socio'}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      toast({
        title: "Estado de cuenta generado",
        description: "El PDF se ha descargado correctamente",
        variant: "default",
      })

    } catch (error) {
      console.error('Error generando estado de cuenta:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el estado de cuenta",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAccountPDF(false)
    }
  }

  const handleSendAccountEmail = async () => {
    if (!selectedMemberForAccountEmail || !accountEmailSender || !accountEmailRecipient) {
      toast({
        title: "Error",
        description: "Debe completar todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSendingAccountEmail(true)
    try {
      // Obtener todos los datos del socio para el email
      const memberMovements = movements.filter(m => m.fk_id_socio === selectedMemberForAccountEmail.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      const memberFacturas = facturas.filter(f => f.fk_id_socio === selectedMemberForAccountEmail.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      const memberPagos = pagos.filter(p => p.fk_id_socio === selectedMemberForAccountEmail.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      const response = await fetch('/api/movements/send-account-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member: selectedMemberForAccountEmail,
          movements: memberMovements,
          facturas: memberFacturas,
          pagos: memberPagos,
          senderEmail: accountEmailSender,
          recipientEmail: accountEmailRecipient,
          subject: accountEmailSubject || `Estado de Cuenta Completo - ${selectedMemberForAccountEmail.razon_social}`,
          message: accountEmailMessage
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Error al enviar el email: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      toast({
        title: "Email enviado",
        description: "El estado de cuenta se ha enviado correctamente",
        variant: "default",
      })

      // Cerrar modal y limpiar estados
      setIsAccountEmailModalOpen(false)
      setSelectedMemberForAccountEmail(null)
      setAccountEmailSender("")
      setAccountEmailRecipient("")
      setAccountEmailSubject("")
      setAccountEmailMessage("")

    } catch (error) {
      console.error('Error sending account email:', error)
      toast({
        title: "Error",
        description: "No se pudo enviar el email",
        variant: "destructive",
      })
    } finally {
      setIsSendingAccountEmail(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estado de Socios</h2>
          <p className="text-muted-foreground">
            Saldo actual y estado de cada socio
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-emerald-700">Estado de Socios</CardTitle>
              <CardDescription>Saldo actual y estado de cada socio</CardDescription>
            </div>
            <div className="flex gap-4 items-end">
              {/* Buscador por Socio */}
              <div className="w-64">
                <Label htmlFor="member-search">Buscar Socio</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="member-search"
                    placeholder="Buscar por razón social..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Filtro por Estado */}
              <div className="w-48">
                <Label htmlFor="status-filter">Filtrar por Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="al-dia">Al día</SelectItem>
                    <SelectItem value="deudor">Deudor</SelectItem>
                    <SelectItem value="a-favor">A favor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando estado de cuentas...</p>
            </div>
          ) : (
            <div>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Socio</TableHead>
                  <TableHead className="font-semibold">CUIT</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Saldo Actual</TableHead>
                  <TableHead className="font-semibold">Cuotas Vencidas</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member) => {
                  const memberMovements = movements.filter(m => m.fk_id_socio === member.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  const currentBalance = memberMovements.length > 0 ? memberMovements[0].saldo : 0
                  const pendingInvoices = facturas.filter(f => f.fk_id_socio === member.id && f.estado === "Pendiente")
                  const overdueMovements = memberMovements.filter(m => m.estado === "Vencida")
                  const lastPayment = movements.filter(m => m.fk_id_socio === member.id && m.tipo === "Pago").sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
                  const lastInvoice = facturas.filter(f => f.fk_id_socio === member.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.razon_social}</TableCell>
                      <TableCell>{member.cuit}</TableCell>
                      <TableCell>{member.mail}</TableCell>
                      <TableCell className={currentBalance > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                        ${Math.abs(currentBalance).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${
                          overdueMovements.length > 0 ? "text-red-600" : "text-green-600"
                        }`}>
                          {overdueMovements.length}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant={currentBalance === 0 ? "default" : currentBalance > 0 ? "destructive" : "secondary"}
                            className={
                              currentBalance === 0 ? "bg-green-100 text-green-800" :
                              currentBalance > 0 ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                            }
                          >
                            {currentBalance === 0 ? "Al día" : currentBalance > 0 ? "Deudor" : "A favor"}
                          </Badge>
                          {lastPayment && (
                            <div className="text-xs text-muted-foreground">
                              Último pago: {new Date(lastPayment.fecha).toLocaleDateString()}
                            </div>
                          )}
                          {lastInvoice && (
                            <div className="text-xs text-muted-foreground">
                              Última factura: {new Date(lastInvoice.fecha).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-800"
                            title="Generar estado de cuenta PDF"
                            onClick={() => handleGenerateAccountStatement(member)}
                            disabled={isGeneratingAccountPDF}
                          >
                            {isGeneratingAccountPDF ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </Button>
                          {pendingInvoices.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-800"
                              title={`${pendingInvoices.length} facturas pendientes`}
                              onClick={() => {
                                setSelectedMemberForPayment(member)
                                setIsPaymentDialogOpen(true)
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-800"
                            title="Enviar estado de cuenta por email"
                            onClick={() => {
                              setSelectedMemberForAccountEmail(member)
                              setAccountEmailRecipient(member.mail || "")
                              setAccountEmailSubject(`Estado de Cuenta Completo - ${member.razon_social}`)
                              setAccountEmailMessage(`Estimado/a ${member.razon_social},\n\nAdjuntamos su estado de cuenta completo con toda la información financiera actualizada.\n\nEste reporte incluye:\n- Resumen financiero completo\n- Historial de movimientos y pagos\n- Estado de facturas\n- Información de contacto\n\nSaludos cordiales,\nCámara Haedo`)
                              setIsAccountEmailModalOpen(true)
                            }}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              </Table>

              {/* Paginación */}
              {filteredMembers.length > 0 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {Math.min((currentPage - 1) * membersPerPage + 1, filteredMembers.length)} a {Math.min(currentPage * membersPerPage, filteredMembers.length)} de {filteredMembers.length} socios
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="text-sm">
                      Página {currentPage} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para ver estado de cuenta completo del socio */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Estado de Cuenta - {selectedMemberForDetail?.razon_social}</DialogTitle>
          </DialogHeader>

          {selectedMemberForDetail && (
            <div className="overflow-y-auto space-y-6 py-4">
              {(() => {
                // Calcular datos del socio
                const memberMovements = movements.filter(m => m.fk_id_socio === selectedMemberForDetail.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                const memberPagos = pagos.filter(p => p.fk_id_socio === selectedMemberForDetail.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                const currentBalance = memberMovements.length > 0 ? memberMovements[0].saldo : 0
                const totalCharges = memberMovements.filter(m => m.tipo === "Cargo").reduce((sum, m) => sum + m.monto, 0)
                const totalPayments = memberPagos.reduce((sum, p) => sum + p.monto, 0) // Calcular pagos de la tabla pagos
                const pendingInvoices = facturas.filter(f => f.fk_id_socio === selectedMemberForDetail.id && f.estado === "Pendiente")
                const overdueMovements = memberMovements.filter(m => m.estado === "Vencida")

                return (
                  <>
                    {/* Resumen Financiero Principal */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white border rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-500 mb-1">Saldo Actual</div>
                        <div className={`text-2xl font-bold ${
                          currentBalance > 0 ? 'text-red-600' :
                          currentBalance < 0 ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          ${Math.abs(currentBalance).toLocaleString()}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          currentBalance === 0 ? "bg-green-100 text-green-700" :
                          currentBalance > 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {currentBalance === 0 ? "Al día" : currentBalance > 0 ? "Deudor" : "A favor"}
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-500 mb-1">Total Cargos</div>
                        <div className="text-2xl font-bold text-red-600">
                          ${totalCharges.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {memberMovements.filter(m => m.tipo === "Cargo").length} registros
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-500 mb-1">Total Pagos</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${totalPayments.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {memberPagos.length} registros
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-500 mb-1">Vencidos</div>
                        <div className="text-2xl font-bold text-orange-600">
                          {overdueMovements.length}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${overdueMovements.reduce((sum, m) => sum + m.saldo, 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Información del Socio */}
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <h3 className="font-medium mb-3">Información del Socio</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">CUIT:</span>
                          <div className="font-mono">{selectedMemberForDetail.cuit}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <div className="truncate">{selectedMemberForDetail.mail || 'No registrado'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Tipo:</span>
                          <div>{selectedMemberForDetail.tipo_socio}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Teléfono:</span>
                          <div>{selectedMemberForDetail.telefono_comercial || 'No registrado'}</div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Dirección:</span>
                          <div className="break-words">{selectedMemberForDetail.domicilio_comercial || 'No registrada'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Historial de Movimientos */}
                    <div className="bg-white border rounded-lg">
                      <div className="p-4 border-b">
                        <h3 className="font-medium">Historial de Movimientos</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {memberMovements.length > 0 ? (
                          <div className="divide-y">
                            {memberMovements.slice(0, 10).map((movement) => (
                              <div key={movement.id} className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    movement.tipo === "Cargo" ? "bg-red-500" : "bg-green-500"
                                  }`}></div>
                                  <div>
                                    <div className="font-medium text-sm">{movement.concepto}</div>
                                    <div className="text-xs text-gray-500">
                                      {formatDateForDisplay(movement.fecha)} • {movement.tipo}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold ${
                                    movement.tipo === "Cargo" ? "text-red-600" : "text-green-600"
                                  }`}>
                                    ${Math.abs(movement.monto).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Saldo: ${movement.saldo.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            No hay movimientos registrados
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Facturas Pendientes */}
                    {pendingInvoices.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg">
                        <div className="p-4 border-b border-red-200">
                          <h3 className="font-medium text-red-800">
                            Facturas Pendientes ({pendingInvoices.length})
                          </h3>
                        </div>
                        <div className="p-4 space-y-2">
                          {pendingInvoices.slice(0, 5).map((factura) => (
                            <div key={factura.id} className="flex items-center justify-between bg-white p-3 rounded border">
                              <div>
                                <div className="font-medium">{factura.id}</div>
                                <div className="text-sm text-gray-500">{formatDateForDisplay(factura.fecha)}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-red-600">${factura.total.toLocaleString()}</div>
                                <div className="text-xs text-red-600">{factura.estado}</div>
                              </div>
                            </div>
                          ))}
                          {pendingInvoices.length > 5 && (
                            <div className="text-sm text-red-600 text-center pt-2">
                              ... y {pendingInvoices.length - 5} facturas más
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDetailModalOpen(false)
                setSelectedMemberForDetail(null)
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para envío de email de estado de cuenta */}
      <Dialog open={isAccountEmailModalOpen} onOpenChange={setIsAccountEmailModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Enviar Estado de Cuenta por Email
            </DialogTitle>
            <DialogDescription>
              Envíe el estado de cuenta completo por correo electrónico
            </DialogDescription>
          </DialogHeader>

          {selectedMemberForAccountEmail && (
            <div className="space-y-4">
              {/* Información del socio */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Estado de cuenta a enviar:</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Socio:</span> {selectedMemberForAccountEmail.razon_social}
                  </div>
                  <div>
                    <span className="font-medium">CUIT:</span> {selectedMemberForAccountEmail.cuit}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {selectedMemberForAccountEmail.tipo_socio}
                  </div>
                </div>
              </div>

              {/* Formulario de email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account-sender-email">Email Remitente *</Label>
                  <Input
                    id="account-sender-email"
                    type="email"
                    value={accountEmailSender}
                    onChange={(e) => setAccountEmailSender(e.target.value)}
                    placeholder="email@camarahaedo.com"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="account-recipient-email">Email Destinatario *</Label>
                  <Input
                    id="account-recipient-email"
                    type="email"
                    value={accountEmailRecipient}
                    onChange={(e) => setAccountEmailRecipient(e.target.value)}
                    placeholder="destinatario@email.com"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="account-email-subject">Asunto</Label>
                <Input
                  id="account-email-subject"
                  value={accountEmailSubject}
                  onChange={(e) => setAccountEmailSubject(e.target.value)}
                  className="mt-1"
                  placeholder="Asunto del email"
                />
              </div>

              <div>
                <Label htmlFor="account-email-message">Mensaje</Label>
                <textarea
                  id="account-email-message"
                  value={accountEmailMessage}
                  onChange={(e) => setAccountEmailMessage(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                  placeholder="Mensaje del email"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">📧 El email incluirá:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Información completa del socio</li>
                    <li>Resumen financiero detallado</li>
                    <li>Historial completo de movimientos y pagos</li>
                    <li>Estado de todas las facturas</li>
                    <li>Cuotas vencidas y pendientes</li>
                    <li>Mensaje personalizado</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAccountEmailModalOpen(false)
                setSelectedMemberForAccountEmail(null)
                setAccountEmailSender("")
                setAccountEmailRecipient("")
                setAccountEmailSubject("")
                setAccountEmailMessage("")
              }}
              disabled={isSendingAccountEmail}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendAccountEmail}
              disabled={isSendingAccountEmail || !accountEmailSender || !accountEmailRecipient}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSendingAccountEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}