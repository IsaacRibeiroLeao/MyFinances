import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import Papa from 'papaparse'
import { Upload, Plus } from 'lucide-react'

export default function ExpenseInput({ onExpenseAdded }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
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
        .from('expenses')
        .insert([
          {
            user_id: user.id,
            amount: parseFloat(amount),
            category,
            description,
            date,
          },
        ])

      if (error) throw error

      setMessage(t('expenseAdded'))
      setAmount('')
      setCategory('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      onExpenseAdded()
    } catch (error) {
      setMessage(t('error') + ': ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCSVUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setMessage('')

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const expenses = results.data
            .filter(row => row.amount && row.category && row.date)
            .map(row => ({
              user_id: user.id,
              amount: parseFloat(row.amount),
              category: row.category,
              description: row.description || '',
              date: row.date,
            }))

          if (expenses.length === 0) {
            setMessage(t('error') + ': No valid expenses found in CSV')
            setLoading(false)
            return
          }

          const { error } = await supabase
            .from('expenses')
            .insert(expenses)

          if (error) throw error

          setMessage(`${t('success')}: ${expenses.length} expenses imported`)
          onExpenseAdded()
        } catch (error) {
          setMessage(t('error') + ': ' + error.message)
        } finally {
          setLoading(false)
        }
      },
      error: (error) => {
        setMessage(t('error') + ': ' + error.message)
        setLoading(false)
      },
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('addExpense')}</h2>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.includes('Error') || message.includes('No valid')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('description')} <span className="text-gray-400 text-xs">({t('optional')})</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder={t('descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('category')}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">{t('selectCategory')}</option>
            <option value="Food & Dining">{t('foodDining')}</option>
            <option value="Shopping">{t('shopping')}</option>
            <option value="Entertainment">{t('entertainment')}</option>
            <option value="Transportation">{t('transportation')}</option>
            <option value="Bills & Utilities">{t('billsUtilities')}</option>
            <option value="Healthcare">{t('healthcare')}</option>
            <option value="Other">{t('other')}</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>{loading ? t('adding') : t('addExpenseButton')}</span>
        </button>
      </form>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('uploadCSV')}</h3>
        <p className="text-sm text-gray-600 mb-3">
          {t('csvFormatDesc')}
        </p>
        <label className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition cursor-pointer flex items-center justify-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>{t('uploadCSVButton')}</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}
