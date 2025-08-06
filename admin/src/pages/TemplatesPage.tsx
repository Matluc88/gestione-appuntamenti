import React, { useState, useEffect } from 'react'
import { Mail, Edit, Save, X } from 'lucide-react'
import axios from 'axios'

interface EmailTemplate {
  id: number
  template_name: string
  subject: string
  body: string
  variables: string[]
  is_active: boolean
  updated_at: string
}

const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/email-templates')
      setTemplates(response.data.templates)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      subject: template.subject,
      body: template.body
    })
  }

  const cancelEditing = () => {
    setEditingTemplate(null)
    setFormData({ subject: '', body: '' })
  }

  const saveTemplate = async () => {
    if (!editingTemplate) return

    try {
      await axios.put(`/api/email-templates/${editingTemplate.id}`, formData)
      setEditingTemplate(null)
      setFormData({ subject: '', body: '' })
      fetchTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Errore nell\'aggiornamento del template')
    }
  }

  const getTemplateDisplayName = (templateName: string) => {
    switch (templateName) {
      case 'confirmation':
        return 'Conferma Prenotazione'
      case 'reminder':
        return 'Promemoria Appuntamento'
      case 'cancellation':
        return 'Cancellazione Appuntamento'
      case 'closure_emergency':
        return 'Annullamento per Emergenza'
      case 'closure_planned':
        return 'Annullamento Programmato'
      case 'closure_vacation':
        return 'Annullamento per Vacanze'
      default:
        return templateName
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Template Email</h1>
        <p className="text-gray-600">Gestisci i template per le email automatiche</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">
          Variabili Disponibili
        </h3>
        <p className="text-sm text-yellow-700">
          Puoi utilizzare queste variabili nei tuoi template: <strong>[Nome]</strong>, <strong>[Servizio]</strong>, 
          <strong>[Data]</strong>, <strong>[Ora]</strong>, <strong>[Link]</strong>, <strong>[Motivo]</strong>, <strong>[DataRiapertura]</strong>
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      {getTemplateDisplayName(template.template_name)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Ultimo aggiornamento: {new Date(template.updated_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  {editingTemplate?.id === template.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={saveTemplate}
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center space-x-1"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salva</span>
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 flex items-center space-x-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Annulla</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(template)}
                      className="bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Modifica</span>
                    </button>
                  )}
                </div>

                {editingTemplate?.id === template.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Oggetto
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Corpo del Messaggio
                      </label>
                      <textarea
                        value={formData.body}
                        onChange={(e) => setFormData({...formData, body: e.target.value})}
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Oggetto:</h4>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {template.subject}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Corpo del Messaggio:</h4>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                        {template.body}
                      </p>
                    </div>
                    {template.variables.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Variabili utilizzate:</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {template.variables.map((variable, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TemplatesPage
