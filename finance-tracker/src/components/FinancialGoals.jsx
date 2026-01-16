import { useState, useEffect } from 'react'
import { Target, Plus, TrendingUp, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Trash2, Edit, Save, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  getUserGoals, 
  createGoal, 
  updateGoal, 
  deleteGoal,
  addContribution,
  getGoalContributions,
  calculateGoalRecommendations,
  getGoalCategoryIcon,
  getGoalPriorityColor
} from '../lib/goalsEngine'
import { format } from 'date-fns'

export default function FinancialGoals({ income, expenses }) {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [showRecommendations, setShowRecommendations] = useState(false)

  useEffect(() => {
    loadGoals()
  }, [user])

  async function loadGoals() {
    try {
      setLoading(true)
      const data = await getUserGoals(user.id)
      setGoals(data)
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }

  function openGoalDetails(goal) {
    setSelectedGoal(goal)
    setShowRecommendations(true)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Target className="w-8 h-8 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">{t('financialGoals')}</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>{t('createGoal')}</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">{t('noGoalsYet')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              {t('createFirstGoal')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onSelect={() => openGoalDetails(goal)}
                onDelete={async () => {
                  await deleteGoal(goal.id)
                  loadGoals()
                }}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateGoalModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (goalData) => {
            await createGoal(user.id, goalData)
            setShowCreateModal(false)
            loadGoals()
          }}
          t={t}
        />
      )}

      {showRecommendations && selectedGoal && (
        <GoalRecommendations
          goal={selectedGoal}
          income={income}
          expenses={expenses}
          onClose={() => {
            setShowRecommendations(false)
            setSelectedGoal(null)
          }}
          onAddContribution={async (amount, date, notes) => {
            await addContribution(selectedGoal.id, user.id, amount, date, notes)
            loadGoals()
          }}
          t={t}
          language={language}
        />
      )}
    </div>
  )
}

function GoalCard({ goal, onSelect, onDelete, t }) {
  const progress = goal.target_amount > 0 
    ? (goal.current_amount / goal.target_amount) * 100 
    : 0
  
  const remaining = goal.target_amount - goal.current_amount
  const icon = getGoalCategoryIcon(goal.category)
  const priorityColor = getGoalPriorityColor(goal.priority)

  return (
    <div 
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">{icon}</div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{goal.title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${priorityColor}`}>
              {t(goal.priority)}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(t('confirmDeleteGoal'))) {
              onDelete()
            }
          }}
          className="text-red-500 hover:text-red-700 transition"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">{t('progress')}</span>
            <span className="font-bold text-indigo-600">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t('saved')}</span>
          <span className="font-bold text-green-600">
            ${goal.current_amount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t('remaining')}</span>
          <span className="font-bold text-gray-900">
            ${remaining.toLocaleString()}
          </span>
        </div>

        {goal.deadline && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 pt-2 border-t">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(goal.deadline), 'MMM dd, yyyy')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateGoalModal({ onClose, onSave, t }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    deadline: '',
    category: 'wedding',
    priority: 'medium'
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      ...formData,
      target_amount: parseFloat(formData.target_amount)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{t('createNewGoal')}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('goalTitle')} *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder={t('goalTitlePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('goalCategory')} *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="wedding">💒 {t('wedding')}</option>
              <option value="house">🏠 {t('house')}</option>
              <option value="car">🚗 {t('car')}</option>
              <option value="vacation">✈️ {t('vacation')}</option>
              <option value="emergency_fund">🛡️ {t('emergencyFund')}</option>
              <option value="education">🎓 {t('education')}</option>
              <option value="retirement">🏖️ {t('retirement')}</option>
              <option value="other">🎯 {t('other')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('targetAmount')} *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('deadline')}
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('priority')}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="low">{t('low')}</option>
              <option value="medium">{t('medium')}</option>
              <option value="high">{t('high')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder={t('goalDescriptionPlaceholder')}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              {t('createGoal')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GoalRecommendations({ goal, income, expenses, onClose, onAddContribution, t, language }) {
  const [showContributionForm, setShowContributionForm] = useState(false)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().split('T')[0])
  const [contributionNotes, setContributionNotes] = useState('')

  const recommendations = calculateGoalRecommendations(goal, income, expenses)

  function handleAddContribution(e) {
    e.preventDefault()
    onAddContribution(parseFloat(contributionAmount), contributionDate, contributionNotes)
    setShowContributionForm(false)
    setContributionAmount('')
    setContributionNotes('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{getGoalCategoryIcon(goal.category)}</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{goal.title}</h3>
                <p className="text-sm text-gray-600">{t('intelligentRecommendations')}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Progress Overview */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
            <h4 className="font-bold text-lg mb-4">{t('goalProgress')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t('current')}</p>
                <p className="text-2xl font-bold text-green-600">
                  ${recommendations.progress.current.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('target')}</p>
                <p className="text-2xl font-bold text-indigo-600">
                  ${recommendations.progress.target.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('remaining')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${recommendations.progress.remaining.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(recommendations.progress.percentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-center mt-2 font-bold text-indigo-600">
                {recommendations.progress.percentage.toFixed(1)}% {t('complete')}
              </p>
            </div>
          </div>

          {/* Warnings */}
          {recommendations.warnings.length > 0 && (
            <div className="space-y-2">
              {recommendations.warnings.map((warning, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-4 rounded-lg ${
                    warning.type === 'critical' ? 'bg-red-50 border border-red-200' :
                    warning.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-green-50 border border-green-200'
                  }`}
                >
                  <span className="text-2xl">{warning.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{t(warning.message)}</p>
                    {warning.details && (
                      <div className="mt-2 text-sm space-y-1">
                        <p>{t('requiredMonthlySavings')}: ${warning.details.required.toFixed(2)}</p>
                        <p>{t('currentMonthlySavings')}: ${warning.details.current.toFixed(2)}</p>
                        <p className="font-bold text-red-600">
                          {t('shortfall')}: ${warning.details.shortfall.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {recommendations.recommendations.length > 0 && (
            <div>
              <h4 className="font-bold text-lg mb-3">{t('recommendations')}</h4>
              <div className="space-y-3">
                {recommendations.recommendations.map((rec, index) => (
                  <div key={index} className="bg-white border-2 border-indigo-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-bold text-gray-900">{t(rec.title)}</h5>
                        <p className="text-sm text-gray-600 mt-1">{t(rec.description)}</p>
                        
                        {rec.strategies && (
                          <div className="mt-3 space-y-2">
                            {rec.strategies.map((strategy, idx) => (
                              <div key={idx} className="bg-gray-50 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold">{t(strategy.name)}</span>
                                  <span className="text-sm text-indigo-600 font-bold">
                                    {strategy.percentage}% {t('ofIncome')}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>{t('monthlyContribution')}: ${strategy.monthlyAmount.toFixed(2)}</p>
                                  <p>{t('timeToComplete')}: {strategy.months} {t('months')}</p>
                                  <p>{t('completionDate')}: {format(strategy.completionDate, 'MMM yyyy')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {rec.category && (
                          <div className="mt-2 text-sm">
                            <p className="font-semibold">{t('category')}: {rec.category}</p>
                            <p>{t('currentSpending')}: ${rec.currentAmount.toFixed(2)}</p>
                            <p className="text-green-600 font-bold">
                              {t('suggestedReduction')}: ${rec.suggestedReduction.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {recommendations.tips.length > 0 && (
            <div>
              <h4 className="font-bold text-lg mb-3">{t('tips')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.tips.map((tip, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <span className="text-xl">{tip.icon}</span>
                      <div>
                        <h5 className="font-semibold text-gray-900">{t(tip.title)}</h5>
                        <p className="text-sm text-gray-600 mt-1">{t(tip.description)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Contribution Button */}
          <div className="pt-4 border-t">
            {!showContributionForm ? (
              <button
                onClick={() => setShowContributionForm(true)}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>{t('addContribution')}</span>
              </button>
            ) : (
              <form onSubmit={handleAddContribution} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('amount')}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('date')}
                    </label>
                    <input
                      type="date"
                      required
                      value={contributionDate}
                      onChange={(e) => setContributionDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('notes')} ({t('optional')})
                  </label>
                  <input
                    type="text"
                    value={contributionNotes}
                    onChange={(e) => setContributionNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContributionForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
