import React, { useState, useEffect } from 'react'
import { Calendar, Search, Filter, Download, Eye, Trash2, ChevronLeft, ChevronRight, Mail, RefreshCw } from 'lucide-react'
import axios from 'axios'

interface Appointment {
  id: number
  service_type: string
  customer_name: string
  customer_surname: string
  customer_phone: string
  customer_email: string
  notes?: string
  appointment_date: string
  appointment_time: string
  status: string
  cancelled_by?: string
  patronato_service?: string
  created_at: string
}

interface Service {
  id: number
  name: string
  slug: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailAppointment, setEmailAppointment] = useState<Appointment | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null)
  
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    service_id: '',
    status: '',
    search: ''
  })
  
  const [sort, setSort] = useState({ field: 'appointment_date', order: 'DESC' })

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [filters, pagination.page, sort])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAppointments()
      }, 30000)
      setRefreshInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [autoRefresh])

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services')
      setServices(response.data.services)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      params.append('sort', sort.field)
      params.append('order', sort.order)

      const response = await axios.get(`/api/admin/appointments?${params}`)
      setAppointments(response.data.appointments)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/api/admin/appointments/${id}/status`, { status })
      fetchAppointments()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Errore nell\'aggiornamento dello stato')
    }
  }

  const deleteAppointment = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo appuntamento?')) return
    
    try {
      await axios.delete(`/api/admin/appointments/${id}`)
      fetchAppointments()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('Errore nell\'eliminazione dell\'appuntamento')
    }
  }

  const sendCancellationEmail = async () => {
    if (!emailAppointment || !cancellationReason.trim()) return
    
    setSendingEmail(true)
    try {
      await axios.post(`/api/admin/appointments/${emailAppointment.id}/send-cancellation-email`, {
        reason: cancellationReason
      })
      alert('Email di cancellazione inviata con successo!')
      setShowEmailModal(false)
      setCancellationReason('')
      setEmailAppointment(null)
    } catch (error) {
      console.error('Error sending cancellation email:', error)
      alert('Errore nell\'invio dell\'email di cancellazione')
    } finally {
      setSendingEmail(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Data', 'Orario', 'Servizio', 'Cliente', 'Telefono', 'Email', 'Stato', 'Note']
    const csvData = appointments.map(apt => [
      apt.appointment_date,
      apt.appointment_time,
      apt.service_type,
      `${apt.customer_name} ${apt.customer_surname}`,
      apt.customer_phone,
      apt.customer_email,
      getStatusText(apt.status, apt.cancelled_by),
      apt.notes || ''
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `appuntamenti_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      service_id: '',
      status: '',
      search: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'DESC' ? 'ASC' : 'DESC'
    }))
  }

  const handleManualRefresh = () => {
    fetchAppointments()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string, cancelledBy?: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confermato'
      case 'cancelled':
        return cancelledBy === 'client' ? 'Cancellato da Cliente' : 'Cancellato'
      case 'completed':
        return 'Completato'
      default:
        return status
    }
  }

  const getDatePreset = (preset: string) => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1))
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    switch (preset) {
      case 'today':
        return {
          date_from: new Date().toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0]
        }
      case 'week':
        return {
          date_from: startOfWeek.toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0]
        }
      case 'month':
        return {
          date_from: startOfMonth.toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0]
        }
      default:
        return { date_from: '', date_to: '' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Appuntamenti</h1>
          <p className="text-gray-600">Visualizza e gestisci tutti gli appuntamenti</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Esporta CSV</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtri Avanzati
          </h3>
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Reset Filtri
          </button>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {loading ? 'Aggiornamento...' : 'Aggiorna'}
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-aggiornamento (30s)
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Da
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data A
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servizio
            </label>
            <select
              value={filters.service_id}
              onChange={(e) => setFilters(prev => ({ ...prev, service_id: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tutti i Servizi</option>
              {services.map(service => (
                <option key={service.id} value={service.name}>{service.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tutti gli Stati</option>
              <option value="confirmed">Confermato</option>
              <option value="cancelled">Cancellato</option>
              <option value="completed">Completato</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ricerca Cliente
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Nome, telefono, email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, ...getDatePreset('today') }))}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Oggi
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, ...getDatePreset('week') }))}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Questa Settimana
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, ...getDatePreset('month') }))}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Questo Mese
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun appuntamento</h3>
            <p className="mt-1 text-sm text-gray-500">
              Non ci sono appuntamenti per i filtri selezionati.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('appointment_date')}
                    >
                      Data {sort.field === 'appointment_date' && (sort.order === 'DESC' ? '↓' : '↑')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('appointment_time')}
                    >
                      Orario {sort.field === 'appointment_time' && (sort.order === 'DESC' ? '↓' : '↑')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('service_type')}
                    >
                      Servizio {sort.field === 'service_type' && (sort.order === 'DESC' ? '↓' : '↑')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('customer_name')}
                    >
                      Cliente {sort.field === 'customer_name' && (sort.order === 'DESC' ? '↓' : '↑')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      Stato {sort.field === 'status' && (sort.order === 'DESC' ? '↓' : '↑')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.appointment_date ? 
                          `${formatDate(appointment.appointment_date)} ${appointment.appointment_time}` :
                          <span className="text-blue-600 font-medium">Richiesta Info</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.customer_name} {appointment.customer_surname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.customer_phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.customer_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status, appointment.cancelled_by)}
                          </span>
                          <select
                            value={appointment.status}
                            onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-1 py-0.5"
                          >
                            <option value="confirmed">Confermato</option>
                            <option value="completed">Completato</option>
                            <option value="cancelled">Cancellato</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment)
                              setShowModal(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                            title="Visualizza dettagli"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {appointment.status === 'cancelled' && (
                            <button
                              onClick={() => {
                                setEmailAppointment(appointment)
                                setShowEmailModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Invia email cancellazione"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Elimina appuntamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Precedente
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Successiva
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> di{' '}
                    <span className="font-medium">{pagination.total}</span> risultati
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Dettagli Appuntamento</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Chiudi</span>
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAppointment.customer_name} {selectedAppointment.customer_surname}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Servizio</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.service_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data e Ora</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAppointment.appointment_date ? 
                      `${formatDate(selectedAppointment.appointment_date)} alle ${selectedAppointment.appointment_time}` :
                      <span className="text-blue-600 font-medium">Richiesta Informazioni (senza appuntamento)</span>
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stato</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                    {getStatusText(selectedAppointment.status, selectedAppointment.cancelled_by)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefono</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.customer_phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.customer_email}</p>
                </div>
              </div>
              
              {selectedAppointment.patronato_service && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Servizio Patronato</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.patronato_service}</p>
                </div>
              )}
              
              {selectedAppointment.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Note</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedAppointment.notes}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Data Creazione</label>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDateTime(selectedAppointment.created_at)}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && emailAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Invia Email di Cancellazione</h3>
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setCancellationReason('')
                  setEmailAppointment(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Chiudi</span>
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appuntamento
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {emailAppointment.customer_name} {emailAppointment.customer_surname} - {emailAppointment.service_type}
                  <br />
                  {formatDate(emailAppointment.appointment_date)} alle {emailAppointment.appointment_time}
                  <br />
                  Email: {emailAppointment.customer_email}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo della cancellazione *
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Inserisci il motivo della cancellazione..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setCancellationReason('')
                  setEmailAppointment(null)
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                disabled={sendingEmail}
              >
                Annulla
              </button>
              <button
                onClick={sendCancellationEmail}
                disabled={!cancellationReason.trim() || sendingEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmail ? 'Invio in corso...' : 'Invia Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage
