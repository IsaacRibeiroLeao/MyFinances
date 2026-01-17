import { useState, useEffect } from 'react'
import { Zap, Shield, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { getActiveBoosts } from '../lib/boostSystem'

export default function ActiveBoosts() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [boosts, setBoosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadBoosts()
      // Refresh every minute
      const interval = setInterval(loadBoosts, 60000)
      return () => clearInterval(interval)
    }
  }, [user])

  async function loadBoosts() {
    try {
      const activeBoosts = await getActiveBoosts(user.id)
      setBoosts(activeBoosts)
    } catch (error) {
      console.error('Error loading boosts:', error)
    } finally {
      setLoading(false)
    }
  }

  function getTimeRemaining(expiresAt) {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires - now
    
    if (diff <= 0) return t('expired')
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  function getBoostIcon(boostName) {
    if (boostName.includes('Points Boost')) return <Zap className="w-5 h-5" />
    if (boostName.includes('Streak Shield')) return <Shield className="w-5 h-5" />
    return <Clock className="w-5 h-5" />
  }

  if (loading || boosts.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <Zap className="w-5 h-5 text-yellow-600" />
        <h3 className="font-bold text-gray-900">{t('activeBoosts')}</h3>
      </div>
      
      <div className="space-y-2">
        {boosts.map((boost) => {
          const item = boost.shop_items
          return (
            <div
              key={boost.id}
              className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-200"
            >
              <div className="flex items-center space-x-3">
                <div className="text-yellow-600">
                  {getBoostIcon(item.name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                  {item.metadata?.multiplier && (
                    <p className="text-xs text-yellow-600">
                      {item.metadata.multiplier}x {t('pointsMultiplier')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeRemaining(boost.expires_at)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
