import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ExpenseInput from './ExpenseInput'
import ExpenseCalendar from './ExpenseCalendar'
import IncomeInput from './IncomeInput'
import IncomeOverview from './IncomeOverview'
import FinancialAnalysis from './FinancialAnalysis'
import GamificationStatus from './GamificationStatus'
import Leaderboard from './Leaderboard'
import Achievements from './Achievements'
import FinancialGoals from './FinancialGoals'
import UserProfile from './UserProfile'
import { LogOut, TrendingDown, TrendingUp, DollarSign, Wallet, Globe } from 'lucide-react'
import { format } from 'date-fns'
import { initializeUserStats, updateMonthlyPerformance, checkAchievements, unlockAchievement } from '../lib/gamification'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { t, language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('expenses')
  const [newAchievements, setNewAchievements] = useState([])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    initializeGamification()
    loadData()
  }, [user, navigate])

  useEffect(() => {
    if (expenses.length > 0 || income.length > 0) {
      updateGamification()
    }
  }, [expenses, income])

  async function initializeGamification() {
    await initializeUserStats(user.id)
  }

  async function updateGamification() {
    try {
      await updateMonthlyPerformance(user.id, expenses, income)
      const achievements = await checkAchievements(user.id, expenses, income)
      
      if (achievements.length > 0) {
        setNewAchievements(achievements)
        for (const achievement of achievements) {
          await unlockAchievement(user.id, achievement.id, achievement.points)
        }
        setTimeout(() => setNewAchievements([]), 5000)
      }
    } catch (error) {
      console.error('Error updating gamification:', error)
    }
  }

  async function loadData() {
    await Promise.all([loadExpenses(), loadIncome()])
  }

  async function loadExpenses() {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadIncome() {
    try {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setIncome(data || [])
    } catch (error) {
      console.error('Error loading income:', error)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const currentMonth = new Date()
  const currentMonthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date)
    return expDate.getMonth() === currentMonth.getMonth() && 
           expDate.getFullYear() === currentMonth.getFullYear()
  })

  const currentMonthIncome = income.filter(inc => {
    const incDate = new Date(inc.date)
    return incDate.getMonth() === currentMonth.getMonth() && 
           incDate.getFullYear() === currentMonth.getFullYear()
  })

  const currentMonthExpenseTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const currentMonthIncomeTotal = currentMonthIncome.reduce((sum, inc) => sum + inc.amount, 0)
  const currentMonthNetSavings = currentMonthIncomeTotal - currentMonthExpenseTotal

  const previousMonth = new Date(currentMonth)
  previousMonth.setMonth(previousMonth.getMonth() - 1)
  const previousMonthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date)
    return expDate.getMonth() === previousMonth.getMonth() && 
           expDate.getFullYear() === previousMonth.getFullYear()
  })
  const previousMonthTotal = previousMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  const monthlyChange = previousMonthTotal > 0 
    ? ((currentMonthExpenseTotal - previousMonthTotal) / previousMonthTotal) * 100 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-base sm:text-xl font-bold text-white">{t('appName')}</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition font-semibold backdrop-blur-sm"
                title={language === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm sm:text-base">{language === 'en' ? 'PT' : 'EN'}</span>
              </button>
              <span className="hidden md:inline text-sm text-white/90">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 text-white hover:bg-white/20 rounded-lg transition backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('signOut')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">{t('expensesLabel')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 truncate">${currentMonthExpenseTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{format(currentMonth, 'MMM yyyy')}</p>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-red-200 p-2 sm:p-3 rounded-xl ml-2">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">{t('incomeLabel')}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 truncate">${currentMonthIncomeTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{format(currentMonth, 'MMM yyyy')}</p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 sm:p-3 rounded-xl ml-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 border-l-4 ${currentMonthNetSavings >= 0 ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">{t('netSavings')}</p>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-bold truncate ${currentMonthNetSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${currentMonthNetSavings.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{format(currentMonth, 'MMM yyyy')}</p>
              </div>
              <div className={`bg-gradient-to-br p-2 sm:p-3 rounded-xl ml-2 ${currentMonthNetSavings >= 0 ? 'from-green-100 to-green-200' : 'from-red-100 to-red-200'}`}>
                <Wallet className={`w-5 h-5 sm:w-6 sm:h-6 ${currentMonthNetSavings >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 border-l-4 ${monthlyChange > 0 ? 'border-red-500' : 'border-green-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">{t('expenseChange')}</p>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${monthlyChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('vsLastMonth')}</p>
              </div>
              <div className={`bg-gradient-to-br p-2 sm:p-3 rounded-xl ml-2 ${monthlyChange > 0 ? 'from-red-100 to-red-200' : 'from-green-100 to-green-200'}`}>
                {monthlyChange > 0 ? (
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <GamificationStatus compact={true} />
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'expenses'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <span className="text-sm sm:text-base">{t('expenses')}</span>
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'income'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <span className="text-sm sm:text-base">{t('income')}</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <span className="text-sm sm:text-base">🏆 {t('leaderboard')}</span>
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'achievements'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <span className="text-sm sm:text-base">🏅 {t('achievements')}</span>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'goals'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <span className="text-sm sm:text-base">🎯 {t('goals')}</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <span className="text-sm sm:text-base">👤 {t('profile')}</span>
            </button>
          </div>
        </div>

        {activeTab === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div>
              <ExpenseInput onExpenseAdded={loadExpenses} />
            </div>
            
            <div>
              <ExpenseCalendar expenses={expenses} />
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div>
              <IncomeInput onIncomeAdded={loadIncome} />
            </div>
            
            <div>
              <IncomeOverview income={income} />
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div>
            <Leaderboard />
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            <Achievements />
          </div>
        )}

        {activeTab === 'goals' && (
          <div>
            <FinancialGoals income={income} expenses={expenses} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <UserProfile />
          </div>
        )}

        {(activeTab === 'expenses' || activeTab === 'income') && (
          <div className="mt-6 sm:mt-8 lg:mt-12">
            <FinancialAnalysis expenses={expenses} income={income} />
          </div>
        )}

        {newAchievements.length > 0 && (
          <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 space-y-2 max-w-[calc(100vw-1rem)] sm:max-w-sm">
            {newAchievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-2xl p-3 sm:p-4 animate-bounce"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div>
                    <p className="font-bold text-lg">{t('achievementUnlocked')}</p>
                    <p className="text-sm">{language === 'pt' ? achievement.name_pt : achievement.name_en}</p>
                    <p className="text-xs opacity-90">+{achievement.points} {t('points')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
