import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import { TrendingUp, Plus } from 'lucide-react'

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
]

export default function IncomeInput({ onIncomeAdded }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [source, setSource] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('income')
        .insert([
          {
            user_id: user.id,
            amount: parseFloat(amount),
            currency,
            source,
            description,
            date,
          },
        ])

      if (error) throw error

      setMessage(t('incomeAdded'))
      setAmount('')
      setSource('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      onIncomeAdded()
    } catch (error) {
      setMessage(t('error') + ': ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-200">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">{t('addIncome')}</h2>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-100 border border-green-300 text-green-800'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('amount')}
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('selectCurrency')}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('date')}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('source')}
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="">{t('selectSource')}</option>
            <option value="Salary">{t('salary')}</option>
            <option value="Freelance">{t('freelance')}</option>
            <option value="Investment">{t('investment')}</option>
            <option value="Other">{t('other')}</option>
            <option value="Gift">{t('gift')}</option>
            <option value="Bonus">{t('bonus')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('description')}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder={t('optionalDescription')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>{loading ? t('adding') : t('addIncomeButton')}</span>
        </button>
      </form>
    </div>
  )
}
