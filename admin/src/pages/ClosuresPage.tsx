import React, { useState, useEffect } from 'react'
import { X, Plus, Calendar, Clock, AlertTriangle } from 'lucide-react'
import axios from 'axios'

interface Closure {
  id: number
  closure_type: string
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  reason?: string
  is_recurring: boolean
  recurring_pattern?: string
  email_sent: boolean
  affected_appointments: number
  created_at: string
}

const ClosuresPage: React.FC = () => {
  const [closures, setClosures] = useState<Closure[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    closure_type: 'full_day',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: '',
    is_recurring: false,
    recurring_pattern: ''
  })

  useEffect(() => {
    fetchClosures()
  }, [])

  const fetchClosures = async () => {
    try {
      const response = await axios.get('/api/closures')
      setClosures(response.data.closures)
    } catch (error) {
      console.error('Error fetching closures:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/closures', formData)
      setShowForm(false)
      setFormData({
        closure_type: 'full_day',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        reason: '',
        is_recurring: false,
        recurring_pattern: ''
      })
      fetchClosures()
    } catch (error) {
      console.error('Error creating closure:', error)
      alert('Errore nella creazione della chiusura')
    }
  }

  const handleEmergencyClose = async () => {
    if (!confirm('Sei sicuro di voler chiudere oggi per emergenza? Tutti gli appuntamenti di oggi verranno cancellati.')) {
      return
    }

    try {
      await axios.post('/api/closures', {
        closure_type: 'emergency',
        start_date: new Date().toISOString().split('T')[0],
        reason: 'Chiusura di emergenza'
      })
      fetchClosures()
      alert('Chiusura di emergenza attivata. Le email di notifica sono state inviate.')
    } catch (error) {
      console.error('Error creating emergency closure:', error)
      alert('Errore nella chiusura di emergenza')
    }
  }

  const deleteClosure = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa chiusura?')) {
      return
    }

    try {
      await axios.delete(`/api/closures/${id}`)
      fetchClosures()
    } catch (error) {
      console.error('Error deleting closure:', error)
      alert('Errore nell\'eliminazione della chiusura')
    }
  }

  const getClosureTypeText = (type: string) => {
    switch (type) {
      case 'full_day':
        return 'Giorno Intero'
      case 'partial':
        return 'Parziale'
      case 'emergency':
        return 'Emergenza'
      case 'recurring':
        return 'Ricorrente'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Chiusure</h1>
          <p className="text-gray-600">Programma chiusure e gestisci gli appuntamenti</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleEmergencyClose}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Chiudi Oggi</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Chiusura</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Nuova Chiusura</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Chiusura
                </label>
                <select
                  value={formData.closure_type}
                  onChange={(e) => setFormData({...formData, closure_type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="full_day">Giorno Intero</option>
                  <option value="partial">Parziale</option>
                  <option value="recurring">Ricorrente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inizio
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {formData.closure_type === 'full_day' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fine (opzionale)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.closure_type === 'partial' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ora Inizio
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ora Fine
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Descrivi il motivo della chiusura..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Crea Chiusura
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Chiusure Programmate
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : closures.length === 0 ? (
            <div className="text-center py-8">
              <X className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna chiusura</h3>
              <p className="mt-1 text-sm text-gray-500">
                Non ci sono chiusure programmate.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {closures.map((closure) => (
                <div key={closure.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {getClosureTypeText(closure.closure_type)}
                        </h4>
                        {closure.email_sent && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Email Inviate
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(closure.start_date).toLocaleDateString('it-IT')}
                            {closure.end_date && ` - ${new Date(closure.end_date).toLocaleDateString('it-IT')}`}
                          </div>
                          {closure.start_time && closure.end_time && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-4 h-4 mr-2" />
                              {closure.start_time} - {closure.end_time}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {closure.reason && (
                            <p className="text-sm text-gray-600">
                              <strong>Motivo:</strong> {closure.reason}
                            </p>
                          )}
                          {closure.affected_appointments > 0 && (
                            <p className="text-sm text-red-600">
                              <strong>Appuntamenti cancellati:</strong> {closure.affected_appointments}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteClosure(closure.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClosuresPage
