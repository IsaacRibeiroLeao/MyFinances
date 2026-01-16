import { useState, useEffect } from 'react'
import { Trophy, Flame, Star, TrendingUp, Zap, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { calculateLevel } from '../lib/gamification'

export default function GamificationStatus({ compact = false }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [user])

  async function loadStats() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setStats(data)
    } catch (error) {
      console.error('Error loading gamification stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return null
  }

  const currentLevel = stats.level
  const currentPoints = stats.total_points
  const pointsForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100
  const pointsForNextLevel = Math.pow(currentLevel, 2) * 100
  const pointsInLevel = currentPoints - pointsForCurrentLevel
  const pointsNeeded = pointsForNextLevel - pointsForCurrentLevel
  const levelProgress = (pointsInLevel / pointsNeeded) * 100

  if (compact) {
    return (
      <div className="flex items-center space-x-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-xs text-gray-600">{t('level')}</p>
            <p className="text-lg font-bold text-indigo-600">{currentLevel}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-xs text-gray-600">{t('points')}</p>
            <p className="text-lg font-bold text-yellow-600">{currentPoints.toLocaleString()}</p>
          </div>
        </div>

        {stats.current_streak > 0 && (
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-gray-600">{t('streak')}</p>
              <p className="text-lg font-bold text-orange-600">{stats.current_streak}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{t('level')} {currentLevel}</h3>
            <p className="text-indigo-100 text-sm">{stats.username || t('player')}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold">{currentPoints.toLocaleString()}</p>
          <p className="text-indigo-100 text-sm">{t('totalPoints')}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span>{t('progressToLevel')} {currentLevel + 1}</span>
          <span className="font-semibold">
            {pointsInLevel} / {pointsNeeded} {t('xp')}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
            style={{ width: `${Math.min(levelProgress, 100)}%` }}
          >
            {levelProgress > 10 && (
              <Zap className="w-3 h-3 text-white animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <Flame className="w-6 h-6 mx-auto mb-1 text-orange-300" />
          <p className="text-2xl font-bold">{stats.current_streak}</p>
          <p className="text-xs text-indigo-100">{t('currentStreak')}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <Target className="w-6 h-6 mx-auto mb-1 text-green-300" />
          <p className="text-2xl font-bold">{stats.months_positive}</p>
          <p className="text-xs text-indigo-100">{t('positiveMonths')}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-300" />
          <p className="text-2xl font-bold">{stats.longest_streak}</p>
          <p className="text-xs text-indigo-100">{t('bestStreak')}</p>
        </div>
      </div>
    </div>
  )
}
