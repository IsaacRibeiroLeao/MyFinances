import { useState, useEffect } from 'react'
import { Award, Lock, Sparkles, Target, TrendingUp, Flame, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export default function Achievements() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [achievements, setAchievements] = useState([])
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAchievements()
  }, [user])

  async function loadAchievements() {
    try {
      setLoading(true)

      // Get all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true })

      // Get user's unlocked achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id)

      const unlockedIds = new Set(userAchievements?.map(a => a.achievement_id) || [])
      
      setAchievements(allAchievements || [])
      setUnlockedAchievements(unlockedIds)
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  function getCategoryIcon(category) {
    switch (category) {
      case 'beginner':
        return <Target className="w-5 h-5" />
      case 'savings':
        return <TrendingUp className="w-5 h-5" />
      case 'streak':
        return <Flame className="w-5 h-5" />
      case 'level':
        return <Star className="w-5 h-5" />
      case 'budget':
        return <Award className="w-5 h-5" />
      default:
        return <Sparkles className="w-5 h-5" />
    }
  }

  function getCategoryColor(category) {
    switch (category) {
      case 'beginner':
        return 'text-blue-600 bg-blue-100'
      case 'savings':
        return 'text-green-600 bg-green-100'
      case 'streak':
        return 'text-orange-600 bg-orange-100'
      case 'level':
        return 'text-purple-600 bg-purple-100'
      case 'budget':
        return 'text-indigo-600 bg-indigo-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const unlockedCount = unlockedAchievements.size
  const totalCount = achievements.length
  const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center space-x-3 mb-6">
        <Award className="w-8 h-8 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">{t('achievements')}</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {t('progress')}: {unlockedCount} / {totalCount}
          </span>
          <span className="text-sm font-bold text-indigo-600">
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>{t('noAchievements')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.has(achievement.id)
            const name = language === 'pt' ? achievement.name_pt : achievement.name_en
            const description = language === 'pt' ? achievement.description_pt : achievement.description_en

            return (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-md'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                {!isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-200'
                    }`}
                  >
                    {achievement.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3
                        className={`font-bold text-lg ${
                          isUnlocked ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {name}
                      </h3>
                    </div>

                    <p
                      className={`text-sm mb-2 ${
                        isUnlocked ? 'text-gray-700' : 'text-gray-500'
                      }`}
                    >
                      {description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(achievement.category)}`}>
                        {getCategoryIcon(achievement.category)}
                        <span className="capitalize">{t(achievement.category)}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Sparkles className={`w-4 h-4 ${isUnlocked ? 'text-yellow-500' : 'text-gray-400'}`} />
                        <span className={`text-sm font-bold ${isUnlocked ? 'text-indigo-600' : 'text-gray-500'}`}>
                          +{achievement.points}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
