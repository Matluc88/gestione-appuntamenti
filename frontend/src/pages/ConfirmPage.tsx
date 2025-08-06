import React from 'react'
import { CheckCircle, Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

const ConfirmPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Prenotazione Confermata!
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          La sua prenotazione è stata registrata con successo.
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-800 mb-3">
            Cosa succede ora?
          </h2>
          <ul className="text-left text-green-700 space-y-2">
            <li className="flex items-start">
              <Mail className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              Riceverà una email di conferma con tutti i dettagli dell'appuntamento
            </li>
            <li className="flex items-start">
              <Mail className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              Un promemoria le sarà inviato 24 ore prima dell'appuntamento
            </li>
            <li className="flex items-start">
              <Phone className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              Per qualsiasi necessità può contattarci al 3204283508
            </li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Cancellazione
          </h3>
          <p className="text-blue-700">
            Se dovesse avere necessità di cancellare l'appuntamento, 
            può farlo utilizzando il link presente nell'email di conferma.
            <br />
            <strong>Attenzione:</strong> La cancellazione è possibile fino a 24 ore prima dell'appuntamento.
          </p>
        </div>
        
        <div className="border-t pt-6">
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
        
        <Link
          to="/"
          className="inline-block mt-6 bg-primary-600 text-white py-2 px-6 rounded-md hover:bg-primary-700 transition-colors"
        >
          Prenota un altro appuntamento
        </Link>
      </div>
    </div>
  )
}

export default ConfirmPage
