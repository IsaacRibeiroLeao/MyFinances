import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function IncomeOverview({ income, currencySymbol = '$' }) {
  const { t } = useLanguage()
  const monthlyData = useMemo(() => {
    if (income.length === 0) return []

    const incomeByMonth = income.reduce((acc, item) => {
      const month = format(parseISO(item.date), 'yyyy-MM')
      if (!acc[month]) {
        acc[month] = { month, total: 0, count: 0 }
      }
      acc[month].total += item.amount
      acc[month].count += 1
      return acc
    }, {})

    return Object.values(incomeByMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        month: format(parseISO(item.month + '-01'), 'MMM yyyy'),
        total: parseFloat(item.total.toFixed(2)),
        count: item.count,
      }))
  }, [income])

  const sourceData = useMemo(() => {
    const incomeBySource = income.reduce((acc, item) => {
      if (!acc[item.source]) {
        acc[item.source] = 0
      }
      acc[item.source] += item.amount
      return acc
    }, {})

    return Object.entries(incomeBySource)
      .map(([source, total]) => ({
        source,
        total: parseFloat(total.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total)
  }, [income])

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">{t('incomeOverview')}</h2>
      </div>

      {income.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>{t('noIncomeYet')}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">{t('totalIncome')}</p>
            <p className="text-3xl font-bold text-green-600">
              {currencySymbol} {totalIncome.toFixed(2)}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">{t('monthlyIncome')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `${currencySymbol} ${value.toFixed(2)}`}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#10b981" name={t('totalIncome')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('incomeBySource')}</h3>
            <div className="space-y-2">
              {sourceData.map((item) => {
                const percentage = (item.total / totalIncome) * 100
                return (
                  <div key={item.source} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.source}</span>
                        <span className="text-sm text-gray-600">{currencySymbol} {item.total.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
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
        </>
      )}
    </div>
  )
}
