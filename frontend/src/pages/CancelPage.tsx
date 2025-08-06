import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const CancelPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'too_late'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) {
      cancelAppointment(token)
    }
  }, [token])

  const cancelAppointment = async (cancelToken: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/appointments/cancel/${cancelToken}`)
      setStatus('success')
      setMessage('Appuntamento cancellato con successo')
    } catch (error: any) {
      console.error('Cancel error:', error)
      if (error.response?.status === 400) {
        setStatus('too_late')
        setMessage('Impossibile cancellare con meno di 24 ore di anticipo')
      } else if (error.response?.status === 404) {
        setStatus('error')
        setMessage('Appuntamento non trovato o già cancellato')
      } else {
        setStatus('error')
        setMessage('Errore durante la cancellazione')
      }
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cancellazione in corso...
            </h1>
            <p className="text-gray-600">
              Stiamo elaborando la sua richiesta di cancellazione.
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Cancellazione Completata
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-700">
                Riceverà una email di conferma della cancellazione.
                <br />
                Per prenotare un nuovo appuntamento può utilizzare il nostro sistema online.
              </p>
            </div>
          </div>
        )

      case 'too_late':
        return (
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Cancellazione Non Possibile
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-700">
                Per cancellazioni dell'ultimo momento, la preghiamo di contattarci direttamente:
                <br />
                <strong>Tel. 3204283508</strong>
                <br />
                <strong>Email: nicovillano@libero.it</strong>
              </p>
            </div>
          </div>
        )

      case 'error':
      default:
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Errore nella Cancellazione
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700">
                Se il problema persiste, la preghiamo di contattarci:
                <br />
                <strong>Tel. 3204283508</strong>
                <br />
                <strong>Email: nicovillano@libero.it</strong>
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {renderContent()}
        
        <div className="mt-8 text-center border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Contatti
          </h3>
          <p className="text-gray-600">
            <strong>Nico Villano</strong><br />
            Via Corigliano 6<br />
            Tel. 3204283508<br />
            Email: nicovillano@libero.it
          </p>
        </div>
      </div>
    </div>
  )
}

export default CancelPage
