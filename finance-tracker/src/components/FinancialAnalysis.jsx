import { useState, useMemo } from 'react'
import { analyzeFinancialData } from '../lib/financialAnalyzer'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, 
  DollarSign, Target, BarChart3, PieChart, Calendar,
  Award, AlertTriangle, Info
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function FinancialAnalysis({ expenses, income }) {
  const [showDetails, setShowDetails] = useState(false)
  const { t } = useLanguage()

  const analysis = useMemo(() => {
    if (expenses.length === 0 && income.length === 0) return null
    return analyzeFinancialData(expenses, income)
  }, [expenses, income])

  if (!analysis) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm p-8 border border-gray-200 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('startTracking')}</h3>
        <p className="text-gray-500">{t('startTrackingDesc')}</p>
      </div>
    )
  }

  const { financialHealth, overview } = analysis
  const score = financialHealth.score
  const savingsRate = overview.savingsRate

  let statusMessage = ''
  let statusEmoji = ''
  let statusColor = ''
  let bgGradient = ''

  if (score >= 85) {
    statusMessage = t('doingAmazing')
    statusEmoji = '🌟'
    statusColor = 'text-green-600'
    bgGradient = 'from-green-50 to-emerald-50'
  } else if (score >= 70) {
    statusMessage = t('doingGreat')
    statusEmoji = '�'
    statusColor = 'text-blue-600'
    bgGradient = 'from-blue-50 to-indigo-50'
  } else if (score >= 50) {
    statusMessage = t('rightTrack')
    statusEmoji = '👍'
    statusColor = 'text-yellow-600'
    bgGradient = 'from-yellow-50 to-orange-50'
  } else {
    statusMessage = t('improveTogether')
    statusEmoji = '💪'
    statusColor = 'text-orange-600'
    bgGradient = 'from-orange-50 to-red-50'
  }

  return (
    <div className="space-y-4">
      <div className={`bg-gradient-to-r ${bgGradient} rounded-xl shadow-lg p-8 border-2 ${statusColor.replace('text', 'border')}`}>
        <div className="text-center">
          <div className="text-7xl mb-4">{statusEmoji}</div>
          <h2 className={`text-3xl font-bold ${statusColor} mb-2`}>{statusMessage}</h2>
          <p className="text-gray-700 text-lg mb-6">
            {t('financialHealthScore')} <span className="font-bold">{score}/100</span>
          </p>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-full h-6 shadow-inner mb-4">
              <div 
                className={`h-6 rounded-full transition-all duration-1000 ${statusColor.replace('text', 'bg')}`}
                style={{ width: `${score}%` }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">{t('savingsRate')}</p>
                <p className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {savingsRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">{t('netSavings')}</p>
                <p className={`text-2xl font-bold ${overview.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(overview.netSavings).toFixed(0)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">{t('rating')}</p>
                <p className={`text-xl font-bold ${statusColor} capitalize`}>
                  {financialHealth.rating.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-6 px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition"
          >
            {showDetails ? `▲ ${t('hideDetails')}` : `▼ ${t('viewDetails')}`}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <InsightsSection analysis={analysis} />
        </div>
      )}
    </div>
  )
}

function OverviewSection({ analysis }) {
  const { overview, spendingPatterns, incomeAnalysis } = analysis

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('totalIncome')}
          value={`$${overview.totalIncome.toFixed(2)}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Total Expenses"
          value={`$${overview.totalExpenses.toFixed(2)}`}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Net Savings"
          value={`$${overview.netSavings.toFixed(2)}`}
          icon={DollarSign}
          color={overview.netSavings >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="Savings Rate"
          value={`${overview.savingsRate.toFixed(1)}%`}
          icon={Target}
          color={overview.savingsRate >= 20 ? 'green' : overview.savingsRate >= 10 ? 'yellow' : 'red'}
        />
      </div>

      {spendingPatterns && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('quickStats')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">{t('avgTransaction')}</p>
              <p className="text-xl font-bold text-gray-900">${spendingPatterns.averageTransaction.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Categories</p>
              <p className="text-xl font-bold text-gray-900">{spendingPatterns.totalCategories}</p>
            </div>
            <div>
              <p className="text-gray-600">Transactions</p>
              <p className="text-xl font-bold text-gray-900">{overview.expenseCount}</p>
            </div>
            {incomeAnalysis && (
              <div>
                <p className="text-gray-600">{t('incomeSources')}</p>
                <p className="text-xl font-bold text-gray-900">{incomeAnalysis.totalSources}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function HealthSection({ analysis }) {
  const { financialHealth } = analysis

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score) => {
    if (score >= 85) return 'bg-green-100'
    if (score >= 70) return 'bg-blue-100'
    if (score >= 50) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBg(financialHealth.score)} mb-4`}>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(financialHealth.score)}`}>
              {financialHealth.score}
            </div>
            <div className="text-sm text-gray-600">/ {financialHealth.maxScore}</div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 capitalize">{financialHealth.rating.replace('_', ' ')}</h3>
        <p className="text-gray-600 mt-2">{t('overallHealthScore')}</p>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">{t('scoreBreakdown')}</h4>
        {financialHealth.factors.map((factor, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{factor.factor}</span>
              <span className={`font-bold ${getScoreColor(factor.points)}`}>
                {factor.points} pts
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {factor.status === 'excellent' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {factor.status === 'good' && <Info className="w-4 h-4 text-blue-600" />}
              {(factor.status === 'fair' || factor.status === 'needs_improvement') && <AlertCircle className="w-4 h-4 text-yellow-600" />}
              {(factor.status === 'poor' || factor.status === 'needs_attention') && <AlertTriangle className="w-4 h-4 text-red-600" />}
              <span className="text-sm text-gray-600 capitalize">{factor.status.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SpendingSection({ analysis }) {
  const { categoryInsights } = analysis

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{t('categoryAnalysis')}</h3>
      {categoryInsights.map((category, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{category.category}</h4>
            <span className="text-lg font-bold text-indigo-600">${category.total.toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
            <div>
              <p className="text-gray-600">Transactions</p>
              <p className="font-semibold text-gray-900">{category.count}</p>
            </div>
            <div>
              <p className="text-gray-600">Average</p>
              <p className="font-semibold text-gray-900">${category.average.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Frequency</p>
              <p className="font-semibold text-gray-900 capitalize">{category.frequency}</p>
            </div>
            <div>
              <p className="text-gray-600">Range</p>
              <p className="font-semibold text-gray-900">${category.min.toFixed(0)} - ${category.max.toFixed(0)}</p>
            </div>
          </div>

          <div className="bg-white rounded p-3 space-y-1">
            <p className="text-xs font-semibold text-gray-700 uppercase">Insights</p>
            {category.insight.map((insight, i) => (
              <p key={i} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2">•</span>
                <span>{insight}</span>
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TrendsSection({ analysis }) {
  const { trends } = analysis

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-600" />
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-600" />
    return <div className="w-5 h-5 text-gray-600">—</div>
  }

  const getTrendText = (trend) => {
    if (trend === 'improving') return 'Improving'
    if (trend === 'declining') return 'Declining'
    if (trend === 'stable') return 'Stable'
    return 'Insufficient Data'
  }

  const getTrendColor = (trend) => {
    if (trend === 'improving') return 'text-green-600'
    if (trend === 'declining') return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-2">
          {getTrendIcon(trends.trend)}
          <h3 className="text-xl font-bold text-gray-900">{t('overallTrend')}</h3>
        </div>
        <p className={`text-2xl font-bold ${getTrendColor(trends.trend)}`}>
          {getTrendText(trends.trend)}
        </p>
      </div>

      {trends.bestMonth && trends.worstMonth && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">{t('bestMonth')}</h4>
            </div>
            <p className="text-sm text-green-700 mb-1">{format(parseISO(trends.bestMonth.month + '-01'), 'MMMM yyyy')}</p>
            <p className="text-2xl font-bold text-green-600">${trends.bestMonth.savings.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">{t('savingsRate')}: {trends.bestMonth.savingsRate.toFixed(1)}%</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-900">{t('needsWork')}</h4>
            </div>
            <p className="text-sm text-red-700 mb-1">{format(parseISO(trends.worstMonth.month + '-01'), 'MMMM yyyy')}</p>
            <p className="text-2xl font-bold text-red-600">${trends.worstMonth.savings.toFixed(2)}</p>
            <p className="text-xs text-red-600 mt-1">{t('savingsRate')}: {trends.worstMonth.savingsRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Monthly Breakdown</h4>
        <div className="space-y-2">
          {trends.monthlyData.slice(-6).reverse().map((month, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">
                  {format(parseISO(month.month + '-01'), 'MMMM yyyy')}
                </span>
                <span className={`font-bold ${month.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${month.savings.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Income</p>
                  <p className="font-semibold text-gray-900">${month.income.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expenses</p>
                  <p className="font-semibold text-gray-900">${month.expenses.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Rate</p>
                  <p className="font-semibold text-gray-900">{month.savingsRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InsightsSection({ analysis }) {
  const { t } = useLanguage()
  const { recommendations, anomalies, spendingVelocity, trends, budgetSuggestions, categoryInsights, spendingPatterns } = analysis

  const topRecommendations = recommendations.slice(0, 3)
  const criticalAnomalies = anomalies?.anomalies.filter(a => a.severity === 'high').slice(0, 2) || []
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">💡 {t('detailedAnalysis')}</h3>
        <p className="text-gray-600">{t('detailedAnalysisDesc')}</p>
      </div>

      {categoryInsights && categoryInsights.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xl font-bold text-gray-900">📊 {t('categoryBreakdown')}</h4>
          {categoryInsights.map((category, index) => (
            <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h5 className="text-xl font-bold text-gray-900 mb-1">{category.category}</h5>
                  <p className="text-sm text-gray-600 capitalize">{t('frequency')}: {t(category.frequency.toLowerCase())}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-indigo-600">${category.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{category.count} {t('transactions')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">{t('average')}</p>
                  <p className="text-lg font-bold text-gray-900">${category.average.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">{t('highest')}</p>
                  <p className="text-lg font-bold text-gray-900">${category.max.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">{t('lowest')}</p>
                  <p className="text-lg font-bold text-gray-900">${category.min.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">{t('percentOfTotal')}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {spendingPatterns ? ((category.total / spendingPatterns.categoryBreakdown.reduce((sum, c) => sum + c.total, 0)) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              {category.insight && category.insight.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-900 uppercase mb-2">💡 {t('insightsRecommendations')}</p>
                  <ul className="space-y-1">
                    {category.insight.map((insight, i) => (
                      <li key={i} className="text-sm text-blue-800 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {topRecommendations.length > 0 && (
        <div className="bg-white border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">{t('quickWins')}</h4>
              <p className="text-sm text-gray-600">{t('quickWinsDesc')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {topRecommendations.map((rec, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-gray-900">{rec.category}</span>
                  <span className="text-lg font-bold text-green-600">+${rec.potentialSavings.toFixed(0)}/mo</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rec.suggestion}</p>
                <p className="text-xs text-gray-500">{rec.issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {spendingVelocity && spendingVelocity.overall.trend !== 'stable' && (
        <div className={`border-2 rounded-lg p-6 ${spendingVelocity.overall.trend === 'accelerating' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-3 rounded-full ${spendingVelocity.overall.trend === 'accelerating' ? 'bg-red-100' : 'bg-green-100'}`}>
              <TrendingUp className={`w-6 h-6 ${spendingVelocity.overall.trend === 'accelerating' ? 'text-red-600' : 'text-green-600'}`} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">{t('spendingTrend')}</h4>
              <p className="text-sm text-gray-600">{t('spendingTrendDesc')}</p>
            </div>
          </div>
          <p className="text-gray-700 mb-2">
            {t('yourSpendingIs')} <span className={`font-bold ${spendingVelocity.overall.trend === 'accelerating' ? 'text-red-600' : 'text-green-600'}`}>
              {t(spendingVelocity.overall.trend)}
            </span> - {t('youreSpending')} <span className="font-bold">
              ${Math.abs(spendingVelocity.overall.acceleration).toFixed(0)}% {spendingVelocity.overall.acceleration > 0 ? t('more') : t('less')}
            </span> {t('thanUsual')}.
          </p>
          <div className="bg-white rounded p-3 text-sm">
            <p className="text-gray-600">{t('dailyAverage')}: <span className="font-bold text-gray-900">${spendingVelocity.overall.dailyAverage.toFixed(2)}</span></p>
            <p className="text-gray-600">{t('monthlyProjection')}: <span className="font-bold text-gray-900">${spendingVelocity.overall.monthlyAverage.toFixed(2)}</span></p>
          </div>
        </div>
      )}

      {criticalAnomalies.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">{t('unusualActivity')}</h4>
              <p className="text-sm text-gray-600">{t('unusualActivityDesc')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {criticalAnomalies.map((anomaly, index) => (
              <div key={index} className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{anomaly.category}</span>
                  <span className="text-sm text-gray-600">{format(parseISO(anomaly.date), 'MMM dd')}</span>
                </div>
                <p className="text-sm text-gray-700">{anomaly.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {trends && trends.trend !== 'stable' && (
        <div className={`border-2 rounded-lg p-6 ${trends.trend === 'improving' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-3 rounded-full ${trends.trend === 'improving' ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {trends.trend === 'improving' ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">{t('overallTrend')}</h4>
              <p className="text-sm text-gray-600">{t('overallTrendDesc')}</p>
            </div>
          </div>
          <p className="text-gray-700 mb-3">
            {t('yourFinancialSituation')} <span className={`font-bold capitalize ${trends.trend === 'improving' ? 'text-green-600' : 'text-yellow-600'}`}>
              {t(trends.trend)}
            </span>
          </p>
          {trends.bestMonth && trends.worstMonth && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded p-3">
                <p className="text-xs text-gray-600 mb-1">{t('bestMonth')}</p>
                <p className="font-bold text-green-600">${trends.bestMonth.savings.toFixed(0)}</p>
                <p className="text-xs text-gray-500">{format(parseISO(trends.bestMonth.month + '-01'), 'MMM yyyy')}</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-xs text-gray-600 mb-1">{t('needsWork')}</p>
                <p className="font-bold text-gray-900">${trends.worstMonth.savings.toFixed(0)}</p>
                <p className="text-xs text-gray-500">{format(parseISO(trends.worstMonth.month + '-01'), 'MMM yyyy')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {budgetSuggestions && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">{t('budgetBalance')}</h4>
              <p className="text-sm text-gray-600">{t('budgetBalanceDesc')}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{t('needs')} (50%)</span>
                <span className={`font-bold ${budgetSuggestions.adjustments.needs > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {budgetSuggestions.adjustments.needs > 0 ? t('over') : t('under')} ${Math.abs(budgetSuggestions.adjustments.needs).toFixed(0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${budgetSuggestions.current.needs > budgetSuggestions.recommended.needs ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((budgetSuggestions.current.needs / budgetSuggestions.recommended.needs) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{t('wants')} (30%)</span>
                <span className={`font-bold ${budgetSuggestions.adjustments.wants > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {budgetSuggestions.adjustments.wants > 0 ? t('over') : t('under')} ${Math.abs(budgetSuggestions.adjustments.wants).toFixed(0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${budgetSuggestions.current.wants > budgetSuggestions.recommended.wants ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((budgetSuggestions.current.wants / budgetSuggestions.recommended.wants) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{t('savings')} (20%)</span>
                <span className={`font-bold ${budgetSuggestions.adjustments.savings < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {budgetSuggestions.adjustments.savings < 0 ? t('short') : t('extra')} ${Math.abs(budgetSuggestions.adjustments.savings).toFixed(0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${budgetSuggestions.current.savings < budgetSuggestions.recommended.savings ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((budgetSuggestions.current.savings / budgetSuggestions.recommended.savings) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {recommendations.length === 0 && !criticalAnomalies.length && (!spendingVelocity || spendingVelocity.overall.trend === 'stable') && (
        <div className="text-center py-12">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('doingGreatExclaim')}</h3>
          <p className="text-gray-600">{t('financesGoodShape')}</p>
        </div>
      )}
    </div>
  )
}

function RecommendationsSection({ analysis }) {
  const { recommendations } = analysis

  const getPriorityColor = (priority) => {
    if (priority === 'critical') return 'bg-red-100 border-red-300 text-red-900'
    if (priority === 'high') return 'bg-orange-100 border-orange-300 text-orange-900'
    if (priority === 'medium') return 'bg-yellow-100 border-yellow-300 text-yellow-900'
    return 'bg-blue-100 border-blue-300 text-blue-900'
  }

  const getPriorityIcon = (priority) => {
    if (priority === 'critical') return <AlertTriangle className="w-5 h-5" />
    if (priority === 'high') return <AlertCircle className="w-5 h-5" />
    return <Info className="w-5 h-5" />
  }

  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Potential Monthly Savings</h3>
        <p className="text-4xl font-bold text-green-600">${totalPotentialSavings.toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-1">If all recommendations are followed</p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className={`border-2 rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
            <div className="flex items-start space-x-3">
              {getPriorityIcon(rec.priority)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold uppercase text-xs">{rec.priority} Priority</span>
                  <span className="font-bold">${rec.potentialSavings.toFixed(2)}/mo</span>
                </div>
                <h4 className="font-semibold mb-1">{rec.category}</h4>
                <p className="text-sm mb-2">⚠️ {rec.issue}</p>
                <p className="text-sm font-medium">💡 {rec.suggestion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Great Job!</h3>
          <p className="text-gray-600">Your spending is well-balanced. Keep it up!</p>
        </div>
      )}
    </div>
  )
}

function BudgetSection({ analysis }) {
  const { budgetSuggestions } = analysis

  if (!budgetSuggestions) {
    return (
      <div className="text-center py-8">
        <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Add income data to see budget recommendations</p>
      </div>
    )
  }

  const { recommended, current, adjustments } = budgetSuggestions

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">50/30/20 Budget Rule</h3>
        <p className="text-sm text-gray-600">A balanced approach: 50% Needs, 30% Wants, 20% Savings</p>
      </div>

      <div className="space-y-4">
        <BudgetCategory
          label="Needs (50%)"
          recommended={recommended.needs}
          current={current.needs}
          adjustment={adjustments.needs}
          description={t('needsDesc')}
        />
        <BudgetCategory
          label="Wants (30%)"
          recommended={recommended.wants}
          current={current.wants}
          adjustment={adjustments.wants}
          description={t('wantsDesc')}
        />
        <BudgetCategory
          label="Savings (20%)"
          recommended={recommended.savings}
          current={current.savings}
          adjustment={adjustments.savings}
          description={t('savingsDesc')}
        />
      </div>
    </div>
  )
}

function BudgetCategory({ label, recommended, current, adjustment, description }) {
  const isOver = current > recommended
  const percentage = recommended > 0 ? (current / recommended) * 100 : 0

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{label}</h4>
        <span className={`font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
          {isOver ? '+' : ''}{adjustment.toFixed(2)}
        </span>
      </div>
      <p className="text-xs text-gray-600 mb-3">{description}</p>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Recommended:</span>
          <span className="font-semibold text-gray-900">${recommended.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current:</span>
          <span className="font-semibold text-gray-900">${current.toFixed(2)}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
          <div
            className={`h-3 rounded-full ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 text-right">{percentage.toFixed(0)}% of recommended</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    blue: 'bg-blue-100 text-blue-600',
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function AnomaliesSection({ analysis }) {
  const { t } = useLanguage()
  const { anomalies } = analysis

  if (!anomalies || anomalies.anomalies.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('allClear')}</h3>
        <p className="text-gray-600">{anomalies?.summary || t('noAnomalies')}</p>
      </div>
    )
  }

  const getSeverityColor = (severity) => {
    if (severity === 'high') return 'border-red-300 bg-red-50'
    if (severity === 'medium') return 'border-orange-300 bg-orange-50'
    return 'border-yellow-300 bg-yellow-50'
  }

  const getSeverityIcon = (severity) => {
    if (severity === 'high') return <AlertTriangle className="w-5 h-5 text-red-600" />
    return <AlertCircle className="w-5 h-5 text-orange-600" />
  }

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-semibold text-orange-900 mb-2">Anomaly Detection</h3>
        <p className="text-sm text-orange-700">{anomalies.summary}</p>
      </div>

      <div className="space-y-4">
        {anomalies.anomalies.map((anomaly, index) => (
          <div key={index} className={`border-2 rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}>
            <div className="flex items-start space-x-3">
              {getSeverityIcon(anomaly.severity)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm uppercase">{anomaly.severity} Severity</span>
                  <span className="text-sm text-gray-600">{format(parseISO(anomaly.date), 'MMM dd, yyyy')}</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{anomaly.category}</h4>
                <p className="text-sm text-gray-700 mb-2">{anomaly.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span className="font-medium">{t('type')}: {anomaly.type.replace(/_/g, ' ')}</span>
                  {anomaly.count && <span>{t('count')}: {anomaly.count}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VelocitySection({ analysis }) {
  const { spendingVelocity } = analysis

  if (!spendingVelocity) {
    return (
      <div className="text-center py-8">
        <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Need more transaction data to calculate spending velocity</p>
      </div>
    )
  }

  const { overall, byCategory, burnRate } = spendingVelocity

  const getTrendColor = (trend) => {
    if (trend === 'accelerating') return 'text-red-600'
    if (trend === 'decelerating') return 'text-green-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className={`bg-gradient-to-r ${overall.trend === 'accelerating' ? 'from-red-50 to-orange-50' : overall.trend === 'decelerating' ? 'from-green-50 to-emerald-50' : 'from-gray-50 to-slate-50'} rounded-lg p-6 border ${overall.trend === 'accelerating' ? 'border-red-200' : overall.trend === 'decelerating' ? 'border-green-200' : 'border-gray-200'}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Velocity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Daily Average</p>
            <p className="text-2xl font-bold text-gray-900">${overall.dailyAverage.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Weekly Average</p>
            <p className="text-2xl font-bold text-gray-900">${overall.weeklyAverage.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Projected</p>
            <p className="text-2xl font-bold text-gray-900">${overall.monthlyAverage.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Trend</p>
            <p className={`text-xl font-bold capitalize ${getTrendColor(overall.trend)}`}>{overall.trend}</p>
          </div>
        </div>
        {overall.acceleration !== 0 && (
          <div className="mt-4 p-3 bg-white rounded">
            <p className="text-sm text-gray-700">
              Recent spending is <span className={`font-bold ${overall.acceleration > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.abs(overall.acceleration).toFixed(1)}% {overall.acceleration > 0 ? 'higher' : 'lower'}
              </span> than your average
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Burn Rate Analysis</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Daily Burn</p>
            <p className="font-bold text-gray-900">${burnRate.daily.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">Days to $1000</p>
            <p className="font-bold text-gray-900">{burnRate.daysUntil1000.toFixed(0)} days</p>
          </div>
          <div>
            <p className="text-gray-600">Projected Monthly</p>
            <p className="font-bold text-gray-900">${burnRate.projectedMonthly.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Category Velocity</h4>
        {byCategory.slice(0, 5).map((cat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-gray-900">{cat.category}</h5>
              <span className="text-lg font-bold text-indigo-600">${cat.dailyRate.toFixed(2)}/day</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div>
                <p>Weekly: ${cat.weeklyRate.toFixed(2)}</p>
              </div>
              <div>
                <p>Monthly: ${cat.monthlyRate.toFixed(2)}</p>
              </div>
              <div>
                <p>Frequency: {cat.transactionFrequency.toFixed(2)}/day</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ForecastSection({ analysis }) {
  const { forecast } = analysis

  if (!forecast || !forecast.available) {
    return (
      <div className="text-center py-8">
        <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Forecast Unavailable</h3>
        <p className="text-gray-600">{forecast?.reason || 'Need more historical data for forecasting'}</p>
      </div>
    )
  }

  const { nextMonth, next3Months, categoryForecasts, trends } = forecast

  return (
    <div className="space-y-6">
      <div className={`bg-gradient-to-r ${trends.outlook === 'positive' ? 'from-green-50 to-emerald-50 border-green-200' : 'from-red-50 to-orange-50 border-red-200'} rounded-lg p-6 border`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Month Forecast</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Projected Income</p>
            <p className="text-2xl font-bold text-green-600">${nextMonth.income.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Projected Expenses</p>
            <p className="text-2xl font-bold text-red-600">${nextMonth.expense.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Projected Savings</p>
            <p className={`text-2xl font-bold ${nextMonth.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${nextMonth.savings.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Savings Rate</p>
            <p className="text-2xl font-bold text-gray-900">{nextMonth.savingsRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <span className="text-gray-700">Outlook: <span className={`font-bold ${trends.outlook === 'positive' ? 'text-green-600' : 'text-red-600'}`}>{trends.outlook}</span></span>
          <span className="text-gray-700">Expense Trend: <span className="font-bold capitalize">{trends.expenseTrend}</span></span>
          <span className="text-gray-700">Income Trend: <span className="font-bold capitalize">{trends.incomeTrend}</span></span>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">3-Month Projection</h4>
        {next3Months.map((month, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-gray-900">{month.month}</h5>
              <span className={`font-bold ${month.projectedSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${month.projectedSavings.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Income</p>
                <p className="font-semibold text-gray-900">${month.projectedIncome.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Expenses</p>
                <p className="font-semibold text-gray-900">${month.projectedExpense.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Savings Rate</p>
                <p className="font-semibold text-gray-900">{month.savingsRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Category Forecasts</h4>
        {categoryForecasts.slice(0, 6).map((cat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{cat.category}</p>
              <p className="text-xs text-gray-600">Confidence: <span className="capitalize">{cat.confidence}</span></p>
            </div>
            <p className="text-lg font-bold text-indigo-600">${cat.projectedMonthly.toFixed(2)}/mo</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BehaviorSection({ analysis }) {
  const { behaviorPatterns } = analysis

  if (!behaviorPatterns) {
    return (
      <div className="text-center py-8">
        <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Need more transaction data to analyze behavior patterns</p>
      </div>
    )
  }

  const { dayOfWeekPatterns, weekdayVsWeekend, impulseBuying, largePurchases, recurringExpenses } = behaviorPatterns

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Behavior Analysis</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Spending Preference</p>
            <p className="text-xl font-bold text-indigo-600 capitalize">{weekdayVsWeekend.preference.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Impulse Buying Rate</p>
            <p className="text-xl font-bold text-gray-900">{impulseBuying.percentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Weekday Spending</h4>
          <p className="text-2xl font-bold text-gray-900 mb-1">${weekdayVsWeekend.weekday.total.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{weekdayVsWeekend.weekday.count} transactions</p>
          <p className="text-sm text-gray-600">Avg: ${weekdayVsWeekend.weekday.average.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Weekend Spending</h4>
          <p className="text-2xl font-bold text-gray-900 mb-1">${weekdayVsWeekend.weekend.total.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{weekdayVsWeekend.weekend.count} transactions</p>
          <p className="text-sm text-gray-600">Avg: ${weekdayVsWeekend.weekend.average.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Day of Week Patterns</h4>
        {dayOfWeekPatterns.map((day, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">{day.day}</span>
              <span className="text-lg font-bold text-indigo-600">${day.averageSpending.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{day.totalTransactions} transactions</span>
              <span>Total: ${day.totalSpent.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-semibold text-orange-900 mb-2">Impulse Buying Analysis</h4>
        <p className="text-sm text-orange-700 mb-3">{impulseBuying.insight}</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-orange-700">Count</p>
            <p className="font-bold text-orange-900">{impulseBuying.count}</p>
          </div>
          <div>
            <p className="text-orange-700">Total</p>
            <p className="font-bold text-orange-900">${impulseBuying.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-orange-700">Percentage</p>
            <p className="font-bold text-orange-900">{impulseBuying.percentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {largePurchases.count > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-3">Large Purchases ($200+)</h4>
          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
            <div>
              <p className="text-purple-700">Count</p>
              <p className="font-bold text-purple-900">{largePurchases.count}</p>
            </div>
            <div>
              <p className="text-purple-700">Total</p>
              <p className="font-bold text-purple-900">${largePurchases.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-purple-700">Average</p>
              <p className="font-bold text-purple-900">${largePurchases.average.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-xs text-purple-700">Categories: {largePurchases.categories.join(', ')}</p>
        </div>
      )}

      {recurringExpenses.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">{t('recurringExpenses')}</h4>
          {recurringExpenses.map((expense, index) => (
            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-900">{expense.category}</span>
                <span className="text-lg font-bold text-blue-600">${expense.amount}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-blue-700">
                <span className="capitalize">{t('frequency')}: {t(expense.frequency.toLowerCase())}</span>
                <span>{t('every')} ~{expense.avgDaysBetween} {t('days')}</span>
                <span className="capitalize">{t('consistency')}: {expense.consistency.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
