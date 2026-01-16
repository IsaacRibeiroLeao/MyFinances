import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { DollarSign } from 'lucide-react'

export default function Login() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      setError('')
      setLoading(true)
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(t('error') + ': ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-full">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">{t('welcomeBack')}</h2>
        <p className="text-center text-gray-600 mb-8">{t('signInDesc')}</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? t('signingIn') : t('signIn')}</span>
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-600">
          {t('noAccount')}{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            {t('signUp')}
          </button>
        </p>
      </div>
    </div>
  )
}
