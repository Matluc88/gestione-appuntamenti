import React, { useState, useEffect } from 'react'
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react'
import axios from 'axios'

interface Stats {
  total_appointments: number
  today_appointments: number
  service_stats: Array<{ service_type: string; count: string }>
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Panoramica del sistema di gestione appuntamenti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Appuntamenti Totali
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.total_appointments || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Appuntamenti Oggi
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.today_appointments || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Orari Disponibili
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Lun-Gio 16-19, Mer-Ven 9-12
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Servizi Attivi
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.service_stats?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats?.service_stats && stats.service_stats.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Statistiche per Servizio
            </h3>
            <div className="space-y-3">
              {stats.service_stats.map((service, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {service.service_type}
                  </span>
                  <span className="text-sm text-gray-500">
                    {service.count} appuntamenti
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Informazioni di Contatto
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Nico Villano</strong></p>
            <p>Via Corigliano 6</p>
            <p>Tel. 3204283508</p>
            <p>Email: nicovillano@libero.it</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
