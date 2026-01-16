import { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Flame, Crown, Medal, Award, User } from 'lucide-react'
import { getLeaderboard, getUserRank } from '../lib/gamification'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export default function Leaderboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [user])

  async function loadLeaderboard() {
    try {
      setLoading(true)
      const data = await getLeaderboard(10)
      setLeaderboard(data)

      if (user) {
        const rank = await getUserRank(user.id)
        setUserRank(rank)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  function getRankIcon(position) {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-500">#{position}</span>
    }
  }

  function getRankColor(position) {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300'
      default:
        return 'bg-white border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">{t('leaderboard')}</h2>
        </div>
        {userRank && (
          <div className="text-right">
            <p className="text-sm text-gray-600">{t('yourRank')}</p>
            <p className="text-2xl font-bold text-indigo-600">#{userRank}</p>
          </div>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>{t('noLeaderboardData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const position = index + 1
            const isCurrentUser = user && entry.username === user.email?.split('@')[0]

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  getRankColor(position)
                } ${isCurrentUser ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0 w-12 flex items-center justify-center">
                    {getRankIcon(position)}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-200 bg-gradient-to-br from-indigo-100 to-purple-100">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.username || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-semibold text-gray-900 truncate">
                        {entry.username || t('anonymous')}
                      </p>
                      {isCurrentUser && (
                        <span className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full">
                          {t('you')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{t('level')} {entry.level}</span>
                      </span>
                      {entry.current_streak > 0 && (
                        <span className="flex items-center space-x-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>{entry.current_streak} {t('months')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">
                    {entry.total_points.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{t('points')}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          {t('leaderboardInfo')}
        </p>
      </div>
    </div>
  )
}
