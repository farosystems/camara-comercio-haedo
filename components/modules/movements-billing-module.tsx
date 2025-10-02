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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Receipt,
  Filter,
  Download,
  Send,
  Eye,
  Search,
  CreditCard as PaymentIcon,
  Users,
  DollarSign,
  CheckSquare,
  Mail
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDateForDisplay } from "@/lib/date-utils"
import {
  MovimientoSocio,
  Socio,
  Cargo,
  CuentaTesoreria,
  getMovimientosSocios,
  getSocios,
  getCargos,
  getCuentasTesoreria
} from "@/lib/supabase-admin"

export function MovementsBillingModule() {
  const { toast } = useToast()
  const [movements, setMovements] = useState<MovimientoSocio[]>([])
  const [members, setMembers] = useState<Socio[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [cuentasTesoreria, setCuentasTesoreria] = useState<CuentaTesoreria[]>([])
  const [metodosPago, setMetodosPago] = useState<any[]>([])
  const [cuentasDestino, setCuentasDestino] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para filtros
  const [memberSearch, setMemberSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Estados para pagos
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Socio | null>(null)
  const [selectedMovementForPayment, setSelectedMovementForPayment] = useState<MovimientoSocio | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentMetodoPago, setPaymentMetodoPago] = useState("")
  const [paymentCuentaDestino, setPaymentCuentaDestino] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Estados para modal de detalles
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedMovementForDetail, setSelectedMovementForDetail] = useState<MovimientoSocio | null>(null)

  // Estado para descarga de PDF
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Estados para modal de envío de email
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [selectedMovementForEmail, setSelectedMovementForEmail] = useState<MovimientoSocio | null>(null)
  const [senderEmail, setSenderEmail] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Estados para modal de generar cuotas
  const [isGenerateChargesModalOpen, setIsGenerateChargesModalOpen] = useState(false)
  const [modalMemberSearch, setModalMemberSearch] = useState("")
  const [memberTypeFilter, setMemberTypeFilter] = useState("all")
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [selectedCargo, setSelectedCargo] = useState<number | null>(null)
  const [chargeDate, setChargeDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Cargar datos desde Supabase
  useEffect(() => {
    cargarDatos()
  }, [])

  const actualizarCuotasVencidas = async () => {
    try {
      const response = await fetch('/api/movements/update-overdue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.updated > 0) {
          console.log(`Se actualizaron ${result.updated} cuotas vencidas`)
        }
      }
    } catch (error) {
      console.error('Error actualizando cuotas vencidas:', error)
    }
  }

  const cargarMetodosPago = async () => {
    try {
      const response = await fetch('/api/cuentas')
      if (response.ok) {
        const data = await response.json()
        setMetodosPago(data.cuentas || [])
      }
    } catch (error) {
      console.error('Error cargando métodos de pago:', error)
    }
  }

  const cargarCuentasDestino = async () => {
    try {
      const response = await fetch('/api/cuentas/list')
      if (response.ok) {
        const data = await response.json()
        setCuentasDestino(data.cuentas || [])
      }
    } catch (error) {
      console.error('Error cargando cuentas destino:', error)
    }
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Actualizar cuotas vencidas antes de cargar los datos
      await actualizarCuotasVencidas()

      const [movementsData, membersData, cargosData, cuentasTesoreriaData] = await Promise.all([
        getMovimientosSocios(),
        getSocios(),
        getCargos(),
        getCuentasTesoreria(),
        cargarMetodosPago(),
        cargarCuentasDestino()
      ])
      setMovements(movementsData)
      setMembers(membersData)
      setCargos(cargosData)
      setCuentasTesoreria(cuentasTesoreriaData)
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

  // Filtrar movimientos según los criterios seleccionados
  const filteredMovements = movements.filter(movement => {
    // Filtro por socio (búsqueda por razón social)
    const member = members.find(m => m.id === movement.fk_id_socio)
    const memberName = member?.razon_social || ''
    const matchesMember = memberSearch === "" || memberName.toLowerCase().includes(memberSearch.toLowerCase())

    // Filtro por fecha
    let matchesDateRange = true
    if (startDate || endDate) {
      const movementDate = new Date(movement.fecha)
      if (startDate) {
        const start = new Date(startDate)
        matchesDateRange = matchesDateRange && movementDate >= start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // Include the entire end date
        matchesDateRange = matchesDateRange && movementDate <= end
      }
    }

    return matchesMember && matchesDateRange
  })

  // Filtrar miembros para el modal según búsqueda y tipo
  const filteredModalMembers = members.filter(member => {
    const matchesSearch = modalMemberSearch === "" ||
      member.razon_social.toLowerCase().includes(modalMemberSearch.toLowerCase())

    let matchesType = true
    if (memberTypeFilter !== "all") {
      switch (memberTypeFilter) {
        case "activo":
          matchesType = member.tipo_socio === 'Activo'
          break
        case "adherente":
          matchesType = member.tipo_socio === 'Adherente'
          break
        case "vitalicio":
          matchesType = member.tipo_socio === 'Vitalicio'
          break
        default:
          matchesType = true
      }
    }

    return matchesSearch && matchesType
  })

  // Seleccionar todos los socios por defecto cuando se abre el modal
  useEffect(() => {
    if (isGenerateChargesModalOpen && filteredModalMembers.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers(filteredModalMembers.map(member => member.id))
    }
  }, [isGenerateChargesModalOpen])

  // Funciones para el modal de generar cuotas
  const handleSelectAllMembers = () => {
    setSelectedMembers(filteredModalMembers.map(member => member.id))
  }

  const handleSelectNoneMembers = () => {
    setSelectedMembers([])
  }

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleGenerateCharges = async () => {
    if (selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un socio",
        variant: "destructive",
      })
      return
    }

    if (!selectedCargo) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cargo",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/movements/generate-charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberIds: selectedMembers,
          cargoId: selectedCargo,
          fecha: chargeDate,
          fechaVencimiento: dueDate || null
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Error al generar cuotas: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      toast({
        title: "Éxito",
        description: result.message,
        variant: result.vencidas > 0 ? "default" : "default",
      })

      // Cerrar modal y refrescar datos
      setIsGenerateChargesModalOpen(false)
      setSelectedMembers([])
      setSelectedCargo(null)
      setModalMemberSearch("")
      setMemberTypeFilter("all")
      setChargeDate(new Date().toISOString().split('T')[0])
      setDueDate("")
      await cargarDatos()

    } catch (error) {
      console.error('Error generating charges:', error)
      toast({
        title: "Error",
        description: "No se pudieron generar las cuotas",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleProcessPayment = async () => {
    if (!selectedMovementForPayment || !paymentAmount || parseFloat(paymentAmount) <= 0 || !paymentMetodoPago || !paymentCuentaDestino) {
      toast({
        title: "Error",
        description: "Debe completar todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    const amountToPay = parseFloat(paymentAmount)
    if (amountToPay > selectedMovementForPayment.saldo) {
      toast({
        title: "Error",
        description: "El monto no puede ser mayor al saldo pendiente",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      const response = await fetch('/api/movements/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movementId: selectedMovementForPayment.id,
          socioId: selectedMovementForPayment.fk_id_socio,
          amount: amountToPay,
          cuentaId: parseInt(paymentMetodoPago),
          cuentaDestinoId: parseInt(paymentCuentaDestino),
          reference: paymentReference || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('Error response:', errorData)

        // Mostrar mensaje específico si no hay caja abierta
        if (errorData.error && errorData.error.includes('abrir una caja')) {
          toast({
            title: "Caja no abierta",
            description: errorData.error,
            variant: "destructive",
          })
          setIsProcessingPayment(false)
          return
        }

        throw new Error(errorData.error || 'Error al procesar el pago')
      }

      const result = await response.json()

      toast({
        title: "Éxito",
        description: result.message,
        variant: "default",
      })

      // Cerrar modal y limpiar estados
      setIsPaymentDialogOpen(false)
      setSelectedMemberForPayment(null)
      setSelectedMovementForPayment(null)
      setPaymentAmount("")
      setPaymentReference("")
      setPaymentMetodoPago("")
      setPaymentCuentaDestino("")

      // Refrescar datos
      await cargarDatos()

    } catch (error) {
      console.error('Error processing payment:', error)
      toast({
        title: "Error",
        description: "No se pudo procesar el pago",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleDownloadPDF = async (movement: MovimientoSocio) => {
    setIsGeneratingPDF(true)

    try {
      // Importación dinámica de jsPDF
      const { jsPDF } = await import('jspdf')

      const member = members.find(m => m.id === movement.fk_id_socio)
      const cargo = cargos.find(c => c.id === movement.fk_id_cargo)

      // Crear nuevo documento PDF
      const doc = new jsPDF('p', 'mm', 'a4')

      // Header del documento
      doc.setFillColor(41, 128, 185) // Azul
      doc.rect(0, 0, 210, 40, 'F')

      // Logo/Título
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('CÁMARA HAEDO', 20, 20)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Sistema de Gestión - Detalle de Movimiento', 20, 30)

      // Fecha de generación
      doc.setFontSize(10)
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-AR')}`, 150, 30)

      let yPos = 55

      // Información del Socio
      doc.setFillColor(236, 240, 241) // Gris claro
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setTextColor(52, 73, 94) // Gris oscuro
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMACIÓN DEL SOCIO', 20, yPos + 5)

      yPos += 15
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      doc.setFont('helvetica', 'bold')
      doc.text('Razón Social:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(member?.razon_social || 'N/A'), 60, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('CUIT:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(member?.cuit || 'N/A'), 60, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Email:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(member?.mail || 'N/A'), 60, yPos)

      yPos += 15

      // Información del Movimiento
      doc.setFillColor(236, 240, 241) // Gris claro
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setTextColor(52, 73, 94) // Gris oscuro
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLES DEL MOVIMIENTO', 20, yPos + 5)

      yPos += 15
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      doc.setFont('helvetica', 'bold')
      doc.text('ID del Movimiento:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(movement.id), 70, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Tipo:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(movement.tipo || 'N/A'), 70, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Fecha:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(formatDateForDisplay(movement.fecha)), 70, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Estado:', 20, yPos)
      doc.setFont('helvetica', 'normal')

      // Color según estado
      if (movement.estado === 'Cobrada') {
        doc.setTextColor(39, 174, 96) // Verde
      } else if (movement.estado === 'Vencida') {
        doc.setTextColor(231, 76, 60) // Rojo
      } else {
        doc.setTextColor(243, 156, 18) // Naranja
      }
      doc.text(String(movement.estado || 'N/A'), 70, yPos)
      doc.setTextColor(52, 73, 94) // Gris oscuro

      yPos += 15

      // Información Financiera
      doc.setFillColor(236, 240, 241) // Gris claro
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setTextColor(52, 73, 94) // Gris oscuro
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMACIÓN FINANCIERA', 20, yPos + 5)

      yPos += 15
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      // Crear tabla financiera
      doc.setFont('helvetica', 'bold')
      doc.text('Monto Original:', 20, yPos)
      doc.setTextColor(39, 174, 96)
      doc.setFontSize(12)
      doc.text(`$${movement.monto.toLocaleString()}`, 70, yPos)

      doc.setTextColor(52, 73, 94) // Gris oscuro
      doc.setFontSize(10)
      yPos += 8
      doc.setFont('helvetica', 'bold')
      doc.text('Saldo Actual:', 20, yPos)
      doc.setTextColor(movement.saldo > 0 ? 231 : 39, movement.saldo > 0 ? 76 : 174, movement.saldo > 0 ? 60 : 96)
      doc.setFontSize(12)
      doc.text(`$${movement.saldo.toLocaleString()}`, 70, yPos)

      doc.setTextColor(52, 73, 94) // Gris oscuro
      doc.setFontSize(10)
      yPos += 8
      doc.setFont('helvetica', 'bold')
      doc.text('Monto Pagado:', 20, yPos)
      doc.setTextColor(52, 152, 219)
      doc.setFontSize(12)
      doc.text(`$${(movement.monto - movement.saldo).toLocaleString()}`, 70, yPos)

      doc.setTextColor(52, 73, 94) // Gris oscuro
      yPos += 15

      // Detalles Adicionales
      doc.setFillColor(236, 240, 241) // Gris claro
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setTextColor(52, 73, 94) // Gris oscuro
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLES ADICIONALES', 20, yPos + 5)

      yPos += 15
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      doc.setFont('helvetica', 'bold')
      doc.text('Concepto:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      // Dividir texto largo en múltiples líneas
      const conceptoText = String(movement.concepto || 'Sin concepto')
      const conceptoLines = doc.splitTextToSize(conceptoText, 120)
      doc.text(conceptoLines, 20, yPos + 6)
      yPos += (conceptoLines.length * 5) + 6

      doc.setFont('helvetica', 'bold')
      doc.text('Comprobante:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(movement.comprobante || 'N/A'), 70, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Vencimiento:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      const vencimientoText = movement.fecha_vencimiento ? formatDateForDisplay(movement.fecha_vencimiento) : 'Sin vencimiento'
      doc.text(String(vencimientoText), 70, yPos)

      if (movement.metodo_pago) {
        yPos += 6
        doc.setFont('helvetica', 'bold')
        doc.text('Método de Pago:', 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(movement.metodo_pago), 70, yPos)
      }

      // Cargo asociado (si existe)
      if (cargo) {
        yPos += 15
        doc.setFillColor(236, 240, 241) // Gris claro
        doc.rect(15, yPos, 180, 8, 'F')
        doc.setTextColor(52, 73, 94) // Gris oscuro
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('CARGO ASOCIADO', 20, yPos + 5)

        yPos += 15
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)

        doc.setFont('helvetica', 'bold')
        doc.text('ID del Cargo:', 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(cargo.id), 70, yPos)

        yPos += 6
        doc.setFont('helvetica', 'bold')
        doc.text('Nombre:', 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(cargo.nombre || 'N/A'), 70, yPos)
      }

      // Referencia (si existe)
      if (movement.referencia) {
        yPos += 15
        doc.setFillColor(236, 240, 241) // Gris claro
        doc.rect(15, yPos, 180, 8, 'F')
        doc.setTextColor(52, 73, 94) // Gris oscuro
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('REFERENCIA', 20, yPos + 5)

        yPos += 15
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const referenciaText = String(movement.referencia || '')
        const referenciaLines = doc.splitTextToSize(referenciaText, 160)
        doc.text(referenciaLines, 20, yPos)
        yPos += (referenciaLines.length * 5)
      }

      // Footer
      yPos = 280
      doc.setFillColor(41, 128, 185) // Azul
      doc.rect(0, yPos, 210, 17, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Documento generado automáticamente por el Sistema de Gestión de Cámara Haedo', 20, yPos + 10)

      // Descargar el PDF
      const fileName = `movimiento_${movement.id}_${member?.razon_social?.replace(/[^a-zA-Z0-9]/g, '_') || 'socio'}.pdf`
      doc.save(fileName)

      toast({
        title: "PDF generado",
        description: "El archivo PDF se ha descargado correctamente",
        variant: "default",
      })

    } catch (error) {
      console.error('Error generando PDF:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleSendEmail = async () => {
    if (!selectedMovementForEmail || !senderEmail || !recipientEmail) {
      toast({
        title: "Error",
        description: "Debe completar todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const member = members.find(m => m.id === selectedMovementForEmail.fk_id_socio)
      const cargo = cargos.find(c => c.id === selectedMovementForEmail.fk_id_cargo)

      const response = await fetch('/api/movements/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movement: selectedMovementForEmail,
          member: member,
          cargo: cargo,
          senderEmail: senderEmail,
          recipientEmail: recipientEmail,
          subject: emailSubject || `Detalle de Cuenta - ${member?.razon_social}`,
          message: emailMessage
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
        description: "El email se ha enviado correctamente",
        variant: "default",
      })

      // Cerrar modal y limpiar estados
      setIsEmailModalOpen(false)
      setSelectedMovementForEmail(null)
      setSenderEmail("")
      setRecipientEmail("")
      setEmailSubject("")
      setEmailMessage("")

    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "Error",
        description: "No se pudo enviar el email",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion de cuotas</h2>
          <p className="text-muted-foreground">
            Registro de cargos y pagos de todos los socios
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-black hover:bg-gray-800 text-white"
            onClick={() => setIsGenerateChargesModalOpen(true)}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Generar Cuotas
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-indigo-700">Gestion de cuotas</CardTitle>
              <CardDescription>Registro de cargos y pagos de todos los socios</CardDescription>
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

              {/* Filtro por Fecha Desde */}
              <div className="w-40">
                <Label htmlFor="start-date">Fecha Desde</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* Filtro por Fecha Hasta */}
              <div className="w-40">
                <Label htmlFor="end-date">Fecha Hasta</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando cuotas pendientes...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Socio</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Concepto</TableHead>
                  <TableHead className="font-semibold">Monto</TableHead>
                  <TableHead className="font-semibold">Saldo</TableHead>
                  <TableHead className="font-semibold">Vencimiento</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDateForDisplay(movement.fecha)}</TableCell>
                    <TableCell className="font-medium">
                      {members.find(m => m.id === movement.fk_id_socio)?.razon_social || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={movement.tipo === "Cargo" ? "destructive" : "default"} className={movement.tipo === "Cargo" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                        {movement.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.concepto}</TableCell>
                    <TableCell className={movement.monto > 0 ? "text-red-600" : "text-green-600"}>
                      ${Math.abs(movement.monto).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${movement.saldo.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {movement.fecha_vencimiento ? (
                        <div className={`text-sm ${
                          new Date(movement.fecha_vencimiento) < new Date()
                            ? 'text-red-600 font-medium'
                            : new Date(movement.fecha_vencimiento) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                            ? 'text-orange-600 font-medium'
                            : 'text-gray-600'
                        }`}>
                          {formatDateForDisplay(movement.fecha_vencimiento)}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin vencimiento</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          movement.estado === "Cobrada" ? "default" :
                          movement.estado === "Pendiente" ? "secondary" :
                          movement.estado === "Vencida" ? "destructive" : "outline"
                        }
                        className={
                          movement.estado === "Cobrada" ? "bg-green-100 text-green-800" :
                          movement.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                          movement.estado === "Vencida" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {movement.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                          onClick={() => {
                            setSelectedMovementForDetail(movement)
                            setIsDetailModalOpen(true)
                          }}
                          title="Ver detalles del registro"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                          onClick={() => handleDownloadPDF(movement)}
                          disabled={isGeneratingPDF}
                          title="Descargar PDF del registro"
                        >
                          {isGeneratingPDF ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        {(movement.estado === "Pendiente" || movement.estado === "Vencida") && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => {
                                const member = members.find(m => m.id === movement.fk_id_socio)
                                if (member) {
                                  setSelectedMovementForEmail(movement)
                                  setRecipientEmail(member.mail || "")
                                  setEmailSubject(`Detalle de Cuenta - ${member.razon_social}`)
                                  setEmailMessage(`Estimado/a ${member.razon_social},\n\nAdjuntamos el detalle de su cuenta corriente.\n\nSaludos cordiales,\nCámara Haedo`)
                                  setIsEmailModalOpen(true)
                                }
                              }}
                              title="Enviar por email"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={movement.estado === "Vencida" ? "text-red-600 hover:text-red-800" : "text-gray-600 hover:text-gray-800"}
                              onClick={() => {
                                const member = members.find(m => m.id === movement.fk_id_socio)
                                if (member) {
                                  setSelectedMemberForPayment(member)
                                  setSelectedMovementForPayment(movement)
                                  setPaymentAmount(movement.saldo.toString())
                                  setPaymentReference("")
                                  setIsPaymentDialogOpen(true)
                                }
                              }}
                              title={movement.estado === "Vencida" ? "Registrar pago de cuota vencida" : "Registrar pago"}
                            >
                              <PaymentIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para generar cuotas */}
      <Dialog open={isGenerateChargesModalOpen} onOpenChange={setIsGenerateChargesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Generar Cuotas
            </DialogTitle>
            <DialogDescription>
              Seleccione los socios y el cargo para generar las cuotas correspondientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Fechas de la cuota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="charge-date">Fecha de la Cuota</Label>
                <Input
                  id="charge-date"
                  type="date"
                  value={chargeDate}
                  onChange={(e) => setChargeDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="due-date">Fecha de Vencimiento (Opcional)</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                  placeholder="Sin fecha de vencimiento"
                />
              </div>
            </div>

            <Separator />

            {/* Filtros para socios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal-member-search">Buscar Socio</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="modal-member-search"
                    placeholder="Buscar por razón social..."
                    value={modalMemberSearch}
                    onChange={(e) => setModalMemberSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="member-type-filter">Filtrar por Tipo</Label>
                <Select value={memberTypeFilter} onValueChange={setMemberTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="adherente">Adherente</SelectItem>
                    <SelectItem value="vitalicio">Vitalicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selección de socios */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium">Seleccionar Socios</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllMembers}
                    className="flex items-center gap-1"
                  >
                    <CheckSquare className="h-3 w-3" />
                    Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNoneMembers}
                    className="flex items-center gap-1"
                  >
                    <Users className="h-3 w-3" />
                    Ninguno
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {filteredModalMembers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No se encontraron socios con los filtros aplicados
                    </p>
                  ) : (
                    filteredModalMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={() => handleMemberToggle(member.id)}
                        />
                        <label
                          htmlFor={`member-${member.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{member.razon_social}</div>
                          <div className="text-sm text-muted-foreground">
                            <Badge
                              variant={
                                member.tipo_socio === "Activo" ? "default" :
                                member.tipo_socio === "Adherente" ? "secondary" : "outline"
                              }
                              className={
                                member.tipo_socio === "Activo" ? "bg-green-100 text-green-800 mr-1" :
                                member.tipo_socio === "Adherente" ? "bg-blue-100 text-blue-800 mr-1" :
                                "bg-purple-100 text-purple-800 mr-1"
                              }
                            >
                              {member.tipo_socio}
                            </Badge>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                {selectedMembers.length} de {filteredModalMembers.length} socios seleccionados
              </div>
            </div>

            <Separator />

            {/* Selección de cargo */}
            <div>
              <Label className="text-base font-medium">Seleccionar Cargo</Label>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {cargos.filter(cargo => cargo.activo).map((cargo) => (
                  <div
                    key={cargo.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedCargo === cargo.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedCargo(cargo.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedCargo === cargo.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedCargo === cargo.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{cargo.nombre}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">{cargo.descripcion}</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline">{cargo.tipo}</Badge>
                          <Badge variant="secondary">{cargo.frecuencia}</Badge>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right ml-3">
                        <div className="text-lg font-bold text-green-600 whitespace-nowrap">
                          ${cargo.monto?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedCargo && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      Cargo seleccionado: {cargos.find(c => c.id === selectedCargo)?.nombre}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsGenerateChargesModalOpen(false)}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateCharges}
              disabled={isGenerating || selectedMembers.length === 0 || !selectedCargo}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Generar Cuotas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para pago de cuotas */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PaymentIcon className="h-5 w-5" />
              Registrar Pago de Cuota
            </DialogTitle>
            <DialogDescription>
              Registre el pago para la cuota seleccionada. Puede ser un pago parcial o total.
            </DialogDescription>
          </DialogHeader>

          {selectedMemberForPayment && selectedMovementForPayment && (
            <div className="space-y-4">
              {/* Información de la cuota */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Socio:</span> {selectedMemberForPayment.razon_social}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Concepto:</span> {selectedMovementForPayment.concepto}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Monto Original:</span> ${selectedMovementForPayment.monto.toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Saldo Pendiente:</span>
                  <span className="text-red-600 font-bold ml-1">
                    ${selectedMovementForPayment.saldo.toLocaleString()}
                  </span>
                </div>
                {selectedMovementForPayment.fecha_vencimiento && (
                  <div className="text-sm">
                    <span className="font-medium">Vencimiento:</span> {formatDateForDisplay(selectedMovementForPayment.fecha_vencimiento)}
                  </div>
                )}
              </div>

              {/* Formulario de pago */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-amount">Monto a Pagar</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedMovementForPayment.saldo}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="mt-1"
                    placeholder="Ingrese el monto a pagar"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Máximo: ${selectedMovementForPayment.saldo.toLocaleString()}
                  </div>
                </div>

                {/* Método de Pago */}
                <div>
                  <Label htmlFor="payment-metodo">Método de Pago <span className="text-red-500">*</span></Label>
                  <Select
                    value={paymentMetodoPago}
                    onValueChange={(value) => {
                      setPaymentMetodoPago(value)
                      setPaymentCuentaDestino("") // Reset cuenta destino cuando cambia método
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar método de pago..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {metodosPago.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cuenta.nombre}</span>
                            <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                              {cuenta.tipo}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cuenta Destino (solo aparece si hay método seleccionado) */}
                {paymentMetodoPago && (
                  <div>
                    <Label htmlFor="payment-cuenta-destino">Cuenta Destino <span className="text-red-500">*</span></Label>
                    <Select
                      value={paymentCuentaDestino}
                      onValueChange={setPaymentCuentaDestino}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar cuenta destino..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {cuentasDestino
                          .filter((cuenta) => {
                            const metodoPagoSeleccionado = metodosPago.find(c => c.id.toString() === paymentMetodoPago)
                            if (!metodoPagoSeleccionado) return false
                            // Si el método de pago es Efectivo, solo mostrar cuentas de tipo Efectivo
                            if (metodoPagoSeleccionado.tipo === 'Efectivo') {
                              return cuenta.tipo === 'Efectivo'
                            }
                            // Si el método de pago es Transferencia, solo mostrar cuentas de tipo Bancaria
                            if (metodoPagoSeleccionado.tipo === 'Transferencia') {
                              return cuenta.tipo === 'Bancaria'
                            }
                            // Para otros tipos, mostrar todas las cuentas
                            return true
                          })
                          .map((cuenta) => (
                            <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{cuenta.nombre}</span>
                                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                                  {cuenta.tipo}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="payment-reference">Referencia (Opcional)</Label>
                  <Input
                    id="payment-reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="mt-1"
                    placeholder="Número de recibo, transferencia, etc."
                  />
                </div>

                {/* Tipo de pago */}
                {paymentAmount && parseFloat(paymentAmount) > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800">
                      {parseFloat(paymentAmount) >= selectedMovementForPayment.saldo
                        ? "✅ Pago Total - La cuota quedará como COBRADA"
                        : "⚠️ Pago Parcial - Saldo restante: $" + (selectedMovementForPayment.saldo - parseFloat(paymentAmount)).toLocaleString()
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentDialogOpen(false)
                setSelectedMemberForPayment(null)
                setSelectedMovementForPayment(null)
                setPaymentAmount("")
                setPaymentReference("")
                setPaymentMetodoPago("")
                setPaymentCuentaDestino("")
              }}
              disabled={isProcessingPayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={
                isProcessingPayment ||
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                parseFloat(paymentAmount) > (selectedMovementForPayment?.saldo || 0) ||
                !paymentMetodoPago ||
                !paymentCuentaDestino
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <PaymentIcon className="mr-2 h-4 w-4" />
                  Registrar Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para ver detalles del registro */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-white flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles del Registro
            </DialogTitle>
            <DialogDescription>
              Información completa del movimiento seleccionado
            </DialogDescription>
          </DialogHeader>

          {selectedMovementForDetail && (
            <div className="flex-1 overflow-y-auto pr-2 min-h-0">
              <div className="space-y-3">
                {/* Información del socio */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-sm mb-3 text-gray-800 border-b border-gray-200 pb-2">
                    👤 Información del Socio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Razón Social</label>
                      <p className="text-gray-900 font-medium">
                        {members.find(m => m.id === selectedMovementForDetail.fk_id_socio)?.razon_social || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">CUIT</label>
                      <p className="text-gray-900">
                        {members.find(m => m.id === selectedMovementForDetail.fk_id_socio)?.cuit || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-gray-900 truncate">
                        {members.find(m => m.id === selectedMovementForDetail.fk_id_socio)?.mail || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información del movimiento */}
                <div className="bg-blue-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-sm mb-3 text-blue-800 border-b border-blue-200 pb-2">
                    📋 Detalles del Movimiento
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-1">ID</label>
                      <p className="font-mono text-xs bg-white px-2 py-1 rounded border">
                        {selectedMovementForDetail.id}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-1">Tipo</label>
                      <Badge
                        variant={selectedMovementForDetail.tipo === "Cargo" ? "destructive" : "default"}
                        className={`text-xs ${selectedMovementForDetail.tipo === "Cargo" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                      >
                        {selectedMovementForDetail.tipo}
                      </Badge>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-1">Fecha</label>
                      <p className="text-gray-900">{formatDateForDisplay(selectedMovementForDetail.fecha)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-1">Estado</label>
                      <Badge
                        variant={
                          selectedMovementForDetail.estado === "Cobrada" ? "default" :
                          selectedMovementForDetail.estado === "Pendiente" ? "secondary" :
                          selectedMovementForDetail.estado === "Vencida" ? "destructive" : "outline"
                        }
                        className={`text-xs ${
                          selectedMovementForDetail.estado === "Cobrada" ? "bg-green-100 text-green-800" :
                          selectedMovementForDetail.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                          selectedMovementForDetail.estado === "Vencida" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedMovementForDetail.estado}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Información financiera */}
                <div className="bg-green-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-sm mb-3 text-green-800 border-b border-green-200 pb-2">
                    💰 Información Financiera
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-white p-3 rounded border">
                      <label className="block text-xs font-medium text-green-600 mb-1">Monto Original</label>
                      <p className="text-lg font-bold text-green-700">
                        ${selectedMovementForDetail.monto.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center bg-white p-3 rounded border">
                      <label className="block text-xs font-medium text-green-600 mb-1">Saldo Actual</label>
                      <p className={`text-lg font-bold ${
                        selectedMovementForDetail.saldo > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${selectedMovementForDetail.saldo.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center bg-white p-3 rounded border">
                      <label className="block text-xs font-medium text-green-600 mb-1">Pagado</label>
                      <p className="text-lg font-bold text-blue-600">
                        ${(selectedMovementForDetail.monto - selectedMovementForDetail.saldo).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalles adicionales */}
                <div className="bg-indigo-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-sm mb-3 text-indigo-800 border-b border-indigo-200 pb-2">
                    📝 Detalles Adicionales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-indigo-600 mb-1">Concepto</label>
                      <div className="bg-white p-2 rounded border min-h-[2.5rem] break-words">
                        {selectedMovementForDetail.concepto}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-indigo-600 mb-1">Comprobante</label>
                      <div className="bg-white p-2 rounded border font-mono text-xs">
                        {selectedMovementForDetail.comprobante}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-indigo-600 mb-1">Vencimiento</label>
                      <div className="bg-white p-2 rounded border">
                        {selectedMovementForDetail.fecha_vencimiento ?
                          formatDateForDisplay(selectedMovementForDetail.fecha_vencimiento) :
                          'Sin vencimiento'
                        }
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-indigo-600 mb-1">Método de Pago</label>
                      <div className="bg-white p-2 rounded border">
                        {selectedMovementForDetail.metodo_pago || 'No especificado'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cargo asociado */}
                {selectedMovementForDetail.fk_id_cargo && (
                  <div className="bg-purple-50 p-4 rounded-lg border">
                    <h3 className="font-semibold text-sm mb-3 text-purple-800 border-b border-purple-200 pb-2">
                      🏷️ Cargo Asociado
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="block text-xs font-medium text-purple-600 mb-1">ID del Cargo</label>
                        <div className="bg-white p-2 rounded border font-mono text-xs">
                          {selectedMovementForDetail.fk_id_cargo}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-600 mb-1">Nombre</label>
                        <div className="bg-white p-2 rounded border">
                          {cargos.find(c => c.id === selectedMovementForDetail.fk_id_cargo)?.nombre || 'No encontrado'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Referencia */}
                {selectedMovementForDetail.referencia && (
                  <div className="bg-orange-50 p-4 rounded-lg border">
                    <h3 className="font-semibold text-sm mb-3 text-orange-800 border-b border-orange-200 pb-2">
                      🔗 Referencia
                    </h3>
                    <div className="bg-white p-3 rounded border text-sm break-words">
                      {selectedMovementForDetail.referencia}
                    </div>
                  </div>
                )}

                {/* Auditoría */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-sm mb-3 text-gray-800 border-b border-gray-200 pb-2">
                    🕒 Información de Auditoría
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de Creación</label>
                      <div className="bg-white p-2 rounded border">
                        {formatDateForDisplay(selectedMovementForDetail.created_at.split('T')[0])}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Última Actualización</label>
                      <div className="bg-white p-2 rounded border">
                        {formatDateForDisplay(selectedMovementForDetail.updated_at.split('T')[0])}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDetailModalOpen(false)
                setSelectedMovementForDetail(null)
              }}
              className="w-full"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para envío de email */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Enviar por Email
            </DialogTitle>
            <DialogDescription>
              Envíe los detalles de la cuenta por correo electrónico
            </DialogDescription>
          </DialogHeader>

          {selectedMovementForEmail && (
            <div className="space-y-4">
              {/* Información del registro */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Registro a enviar:</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Socio:</span> {members.find(m => m.id === selectedMovementForEmail.fk_id_socio)?.razon_social}
                  </div>
                  <div>
                    <span className="font-medium">Concepto:</span> {selectedMovementForEmail.concepto}
                  </div>
                  <div>
                    <span className="font-medium">Monto:</span> ${selectedMovementForEmail.monto.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Saldo:</span> ${selectedMovementForEmail.saldo.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Formulario de email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sender-email">Email Remitente *</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="email@camarahaedo.com"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="recipient-email">Email Destinatario *</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="destinatario@email.com"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email-subject">Asunto</Label>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="mt-1"
                  placeholder="Asunto del email"
                />
              </div>

              <div>
                <Label htmlFor="email-message">Mensaje</Label>
                <textarea
                  id="email-message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Mensaje del email"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">📧 El email incluirá:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Información completa del registro seleccionado</li>
                    <li>Datos del socio y estado de cuenta</li>
                    <li>Información financiera detallada</li>
                    <li>Mensaje personalizado que escriba arriba</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEmailModalOpen(false)
                setSelectedMovementForEmail(null)
                setSenderEmail("")
                setRecipientEmail("")
                setEmailSubject("")
                setEmailMessage("")
              }}
              disabled={isSendingEmail}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !senderEmail || !recipientEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSendingEmail ? (
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