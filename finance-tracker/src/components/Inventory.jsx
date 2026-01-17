import { useState, useEffect } from 'react'
import { Package, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Inventory() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { equipItem, unequipItem, equippedFrame, equippedBadge, equippedTitle, currentTheme } = useTheme()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPurchases()
  }, [user])

  async function loadPurchases() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_purchases')
        .select(`
          *,
          shop_items (*)
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error('Error loading purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleEquip(item) {
    let itemType = ''
    let itemData = {}

    // Determine item type and data based on item name/metadata
    if (item.name.includes('Theme')) {
      itemType = 'theme'
      const themeMap = {
        'Ocean Theme': 'ocean',
        'Sunset Theme': 'sunset',
        'Forest Theme': 'forest'
      }
      itemData = { theme_id: themeMap[item.name] || 'default' }
    } else if (item.name.includes('Frame')) {
      itemType = 'frame'
      itemData = item.metadata || { frame: 'default', color: '#FFD700' }
    } else if (item.category === 'visual' && !item.name.includes('Theme') && !item.name.includes('Frame')) {
      // It's a badge/title
      if (item.name.includes('Badge') || item.name.includes('Champion')) {
        itemType = 'badge'
      } else {
        itemType = 'title'
      }
      itemData = item.metadata || { title: item.name, color: '#8B5CF6' }
    }

    if (itemType) {
      const result = await equipItem(itemType, itemData)
      if (result.success) {
        setMessage(t('itemEquipped'))
        setTimeout(() => setMessage(''), 3000)
      }
    }
  }

  async function handleUnequip(itemType) {
    const result = await unequipItem(itemType)
    if (result.success) {
      setMessage(t('itemUnequipped'))
      setTimeout(() => setMessage(''), 3000)
    }
  }

  function isEquipped(item) {
    if (item.name.includes('Theme')) {
      const themeMap = {
        'Ocean Theme': 'Ocean',
        'Sunset Theme': 'Sunset',
        'Forest Theme': 'Forest'
      }
      return currentTheme.name === themeMap[item.name]
    }
    if (item.name.includes('Frame')) {
      return equippedFrame && equippedFrame.frame === (item.metadata?.frame || 'default')
    }
    if (item.name.includes('Badge') || item.name.includes('Champion')) {
      return equippedBadge && equippedBadge.title === item.name
    }
    if (item.category === 'visual') {
      return equippedTitle && equippedTitle.title === item.name
    }
    return false
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('myInventory')}</h2>
            <p className="text-sm text-gray-600">{t('manageYourItems')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">{t('totalItems')}</p>
          <p className="text-2xl font-bold text-purple-600">{purchases.length}</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 border border-green-200">
          {message}
        </div>
      )}

      {purchases.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>{t('noItemsYet')}</p>
          <p className="text-sm mt-2">{t('visitShopToBuy')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.map((purchase) => {
            const item = purchase.shop_items
            const equipped = isEquipped(item)
            const canEquip = item.category === 'visual' && !item.name.includes('Boost') && !item.name.includes('Mystery')

            return (
              <div
                key={purchase.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  equipped
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{item.icon}</div>
                  {equipped && (
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>{t('equipped')}</span>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                <p className="text-xs text-gray-600 mb-3">{item.description}</p>

                <div className="text-xs text-gray-500 mb-3">
                  {t('purchased')}: {new Date(purchase.purchased_at).toLocaleDateString()}
                </div>

                {canEquip && (
                  <button
                    onClick={() => equipped ? handleUnequip(item.name.includes('Theme') ? 'theme' : item.name.includes('Frame') ? 'frame' : item.name.includes('Badge') ? 'badge' : 'title') : handleEquip(item)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                      equipped
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {equipped ? (
                      <span className="flex items-center justify-center space-x-1">
                        <X className="w-4 h-4" />
                        <span>{t('unequip')}</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-1">
                        <Check className="w-4 h-4" />
                        <span>{t('equip')}</span>
                      </span>
                    )}
                  </button>
                )}

                {!canEquip && item.category === 'boost' && (
                  <div className="text-center text-xs text-gray-500 italic">
                    {t('activeBoost')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
