import { useState, useEffect } from 'react'
import { ShoppingBag, Sparkles, Zap, Crown, Gift, Lock, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { getShopDiscount, getLevelInfo } from '../lib/levelSystem'
import { activateBoost, openMysteryBox } from '../lib/boostSystem'

export default function PointsShop() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [items, setItems] = useState([])
  const [userPoints, setUserPoints] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadShopData()
  }, [user])

  async function loadShopData() {
    try {
      setLoading(true)
      
      // Load shop items
      const { data: itemsData, error: itemsError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })
      
      if (itemsError) throw itemsError
      setItems(itemsData || [])
      
      // Load user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('total_points, level')
        .eq('user_id', user.id)
        .single()
      
      if (statsError && statsError.code !== 'PGRST116') throw statsError
      if (statsData) {
        setUserPoints(statsData.total_points || 0)
        setUserLevel(statsData.level || 1)
      }
      
      // Load user purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('user_purchases')
        .select('item_id')
        .eq('user_id', user.id)
      
      if (purchasesError) throw purchasesError
      setPurchases(purchasesData?.map(p => p.item_id) || [])
      
    } catch (error) {
      console.error('Error loading shop:', error)
    } finally {
      setLoading(false)
    }
  }

  async function purchaseItem(item) {
    try {
      const discount = getShopDiscount(userLevel)
      const finalPrice = Math.floor(item.price * (1 - discount / 100))
      
      if (userPoints < finalPrice) {
        setMessage(t('insufficientPoints'))
        setTimeout(() => setMessage(''), 3000)
        return
      }
      
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_item_id: item.id
      })
      
      if (error) throw error
      
      if (data.success) {
        setMessage(t('purchaseSuccess'))
        setUserPoints(data.remaining_points)
        setPurchases([...purchases, item.id])
        
        // Handle special item types
        if (item.category === 'boost') {
          await activateBoost(user.id, item.id, item.metadata)
        } else if (item.category === 'special' && item.name.includes('Mystery Box')) {
          const isLegendary = item.name.includes('Legendary')
          const boxResult = await openMysteryBox(user.id, data.purchase_id, isLegendary)
          
          if (boxResult.success) {
            const reward = boxResult.reward
            let rewardMsg = ''
            if (reward.type === 'points') {
              rewardMsg = `${t('youWon')} ${reward.value} ${t('pts')}!`
            } else if (reward.type === 'theme') {
              rewardMsg = `${t('youWon')} ${reward.name}!`
            } else {
              rewardMsg = `${t('youWon')} ${reward.name}!`
            }
            setMessage(`${t('purchaseSuccess')} ${rewardMsg}`)
          }
        } else {
          setMessage(t('purchaseSuccess'))
        }
        
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.error || t('purchaseError'))
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error purchasing item:', error)
      setMessage(t('purchaseError'))
      setTimeout(() => setMessage(''), 3000)
    }
  }

  function getCategoryIcon(category) {
    const icons = {
      visual: <Sparkles className="w-5 h-5" />,
      functional: <Zap className="w-5 h-5" />,
      boost: <Crown className="w-5 h-5" />,
      special: <Gift className="w-5 h-5" />
    }
    return icons[category] || <ShoppingBag className="w-5 h-5" />
  }

  const categories = [
    { id: 'all', name: t('allItems'), icon: '🛍️' },
    { id: 'visual', name: t('visualItems'), icon: '🎨' },
    { id: 'functional', name: t('functionalItems'), icon: '⚙️' },
    { id: 'boost', name: t('boostItems'), icon: '⚡' },
    { id: 'special', name: t('specialItems'), icon: '✨' }
  ]

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory)

  const discount = getShopDiscount(userLevel)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">{t('pointsShop')}</h2>
              <p className="text-purple-100 text-sm">{t('spendPointsOnRewards')}</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
            <p className="text-sm text-purple-100">{t('yourPoints')}</p>
            <p className="text-3xl font-bold">{userPoints.toLocaleString()}</p>
            {discount > 0 && (
              <p className="text-xs text-yellow-300 mt-1">🏷️ {discount}% {t('discount')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes(t('success')) || message.includes('Success')
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const isPurchased = purchases.includes(item.id)
          const finalPrice = Math.floor(item.price * (1 - discount / 100))
          const canAfford = userPoints >= finalPrice
          
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-md border-2 transition-all hover:shadow-lg ${
                isPurchased ? 'border-green-500' : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="p-6">
                {/* Item Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.category === 'visual' ? 'bg-pink-100 text-pink-700' :
                    item.category === 'functional' ? 'bg-blue-100 text-blue-700' :
                    item.category === 'boost' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {getCategoryIcon(item.category)}
                  </div>
                </div>

                {/* Item Info */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                {/* Stock Info */}
                {item.stock !== null && (
                  <p className="text-xs text-gray-500 mb-2">
                    📦 {t('stock')}: {item.stock}
                  </p>
                )}

                {/* Price & Button */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div>
                    {discount > 0 && (
                      <p className="text-xs text-gray-400 line-through">{item.price}</p>
                    )}
                    <p className="text-2xl font-bold text-purple-600">
                      {finalPrice}
                      <span className="text-sm ml-1">{t('pts')}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => purchaseItem(item)}
                    disabled={isPurchased || !canAfford || (item.stock !== null && item.stock <= 0)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isPurchased
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : !canAfford || (item.stock !== null && item.stock <= 0)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isPurchased ? (
                      <span className="flex items-center space-x-1">
                        <Check className="w-4 h-4" />
                        <span>{t('owned')}</span>
                      </span>
                    ) : !canAfford ? (
                      <span className="flex items-center space-x-1">
                        <Lock className="w-4 h-4" />
                        <span>{t('locked')}</span>
                      </span>
                    ) : (
                      t('buy')
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>{t('noItemsInCategory')}</p>
        </div>
      )}
    </div>
  )
}
