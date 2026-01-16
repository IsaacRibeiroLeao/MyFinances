import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useLanguage } from '../contexts/LanguageContext'

export default function ExpenseCalendar({ expenses }) {
  const { t } = useLanguage()
  const [viewMode, setViewMode] = useState('chart')

  const monthlyData = useMemo(() => {
    if (expenses.length === 0) return []

    const expensesByMonth = expenses.reduce((acc, expense) => {
      const month = format(parseISO(expense.date), 'yyyy-MM')
      if (!acc[month]) {
        acc[month] = { month, total: 0, count: 0 }
      }
      acc[month].total += expense.amount
      acc[month].count += 1
      return acc
    }, {})

    return Object.values(expensesByMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        month: format(parseISO(item.month + '-01'), 'MMM yyyy'),
        total: parseFloat(item.total.toFixed(2)),
        count: item.count,
      }))
  }, [expenses])

  const categoryData = useMemo(() => {
    const expensesByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0
      }
      acc[expense.category] += expense.amount
      return acc
    }, {})

    return Object.entries(expensesByCategory)
      .map(([category, total]) => ({
        category,
        total: parseFloat(total.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('spendingOverview')}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'chart'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('monthly')}
          </button>
          <button
            onClick={() => setViewMode('category')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'category'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('categories')}
          </button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>{t('noExpenses')}</p>
        </div>
      ) : (
        <>
          {viewMode === 'chart' && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `$${value.toFixed(2)}`}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#4f46e5" name={t('totalSpent')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {viewMode === 'category' && (
            <div className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={120} />
                    <Tooltip 
                      formatter={(value) => `$${value.toFixed(2)}`}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Bar dataKey="total" fill="#4f46e5" name={t('totalSpent')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('categoryBreakdown')}</h3>
                <div className="space-y-2">
                  {categoryData.map((item) => {
                    const totalSpending = categoryData.reduce((sum, cat) => sum + cat.total, 0)
                    const percentage = (item.total / totalSpending) * 100
                    return (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                            <p className="text-sm text-gray-600">{t('totalSpent')} ${item.total.toFixed(2)}</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="ml-4 text-sm text-gray-500 w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
