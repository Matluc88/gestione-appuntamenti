import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, Phone, Mail, FileText, Upload } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

interface Service {
  id: number
  name: string
  slug: string
  requires_upload: boolean
  requires_notes: boolean
  has_options: boolean
  service_options: string[]
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_surname: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
    patronato_service: ''
  })
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchServices = async () => {
    try {
      console.log('API Base URL:', API_BASE_URL)
      console.log('Fetching services at:', new Date().toISOString())
      const response = await axios.get(`${API_BASE_URL}/api/services`)
      setServices(response.data.services)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchAvailableSlots = async (date: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/appointments/availability/${date}`)
      setAvailableSlots(response.data.available_slots)
      setSelectedTime('')
    } catch (error) {
      console.error('Error fetching availability:', error)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (files.length > 5) {
      alert('Massimo 5 file consentiti')
      return
    }

    const formData = new FormData()
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} troppo grande (max 10MB)`)
        return
      }
      formData.append('files', file)
    })

    try {
      setLoading(true)
      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadedFiles(response.data.files)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Errore durante il caricamento dei file')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedService || !selectedDate || !selectedTime) {
      alert('Seleziona servizio, data e orario')
      return
    }

    try {
      setLoading(true)
      const appointmentData = {
        service_type: selectedService.name,
        ...formData,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        files_uploaded: uploadedFiles
      }

      if (selectedService.has_options && formData.patronato_service) {
        appointmentData.patronato_service = formData.patronato_service
      }

      await axios.post(`${API_BASE_URL}/api/appointments`, appointmentData)
      navigate('/conferma')
    } catch (error: any) {
      console.error('Booking error:', error)
      alert(error.response?.data?.error || 'Errore nella prenotazione')
    } finally {
      setLoading(false)
    }
  }

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 15)
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prenota un Appuntamento
          </h1>
          <p className="text-gray-600">
            Nico Villano - Via Corigliano 6 - Tel. 3204283508
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Tipo di Servizio
            </label>
            <select
              value={selectedService?.id || ''}
              onChange={(e) => {
                const service = services.find(s => s.id === parseInt(e.target.value))
                setSelectedService(service || null)
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Seleziona un servizio</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {selectedService?.has_options && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo di Servizio Patronato
              </label>
              <select
                value={formData.patronato_service}
                onChange={(e) => setFormData({...formData, patronato_service: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Seleziona</option>
                {selectedService.service_options.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Nome
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cognome
              </label>
              <input
                type="text"
                value={formData.customer_surname}
                onChange={(e) => setFormData({...formData, customer_surname: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-1" />
                Telefono
              </label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Data
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Orario
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                disabled={!selectedDate}
              >
                <option value="">Seleziona orario</option>
                {availableSlots.map(slot => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedService?.requires_upload && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="inline w-4 h-4 mr-1" />
                Carica File (max 5 file, 10MB ciascuno)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.heic"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-green-600">
                    {uploadedFiles.length} file caricati con successo
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (opzionale)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Inserisci eventuali note o richieste specifiche..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Prenotazione in corso...' : 'Prenota Appuntamento'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Orari di ricevimento:</p>
          <p>Lunedì, Martedì, Giovedì: 16:00-19:00</p>
          <p>Mercoledì, Venerdì: 09:00-12:00</p>
        </div>
      </div>
    </div>
  )
}

export default HomePage
