import { supabase } from './supabase'

// Check if user has active boosts
export async function getActiveBoosts(userId) {
  try {
    const now = new Date()
    
    const { data, error } = await supabase
      .from('user_purchases')
      .select(`
        *,
        shop_items (*)
      `)
      .eq('user_id', userId)
      .eq('shop_items.category', 'boost')
      .gte('expires_at', now.toISOString())
      .order('purchased_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error getting active boosts:', error)
    return []
  }
}

// Apply boost when purchased
export async function activateBoost(userId, itemId, itemMetadata) {
  try {
    const now = new Date()
    const durationDays = itemMetadata.duration_days || 7
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

    // Update the purchase record with expiration
    const { error } = await supabase
      .from('user_purchases')
      .update({ 
        expires_at: expiresAt.toISOString(),
        metadata: {
          ...itemMetadata,
          activated_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        }
      })
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .order('purchased_at', { ascending: false })
      .limit(1)

    if (error) throw error

    return { success: true, expiresAt }
  } catch (error) {
    console.error('Error activating boost:', error)
    return { success: false, error }
  }
}

// Calculate point multiplier from active boosts
export async function getPointMultiplier(userId) {
  const boosts = await getActiveBoosts(userId)
  let multiplier = 1

  boosts.forEach(boost => {
    const item = boost.shop_items
    if (item.name.includes('2x Points Boost')) {
      multiplier = Math.max(multiplier, 2)
    }
  })

  return multiplier
}

// Check if user has streak protection
export async function hasStreakProtection(userId) {
  try {
    const { data, error } = await supabase
      .from('user_purchases')
      .select(`
        *,
        shop_items (*)
      `)
      .eq('user_id', userId)
      .eq('shop_items.name', 'Streak Shield')
      .is('used_at', null)
      .order('purchased_at', { ascending: false })
      .limit(1)

    if (error) throw error

    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error checking streak protection:', error)
    return null
  }
}

// Use streak protection
export async function useStreakProtection(userId) {
  try {
    const protection = await hasStreakProtection(userId)
    
    if (!protection) {
      return { success: false, error: 'No streak protection available' }
    }

    const { error } = await supabase
      .from('user_purchases')
      .update({ 
        used_at: new Date().toISOString(),
        metadata: {
          ...protection.metadata,
          used_at: new Date().toISOString()
        }
      })
      .eq('id', protection.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error using streak protection:', error)
    return { success: false, error }
  }
}

// Check if user has unlocked a feature
export async function hasUnlockedFeature(userId, featureType) {
  try {
    const { data, error } = await supabase
      .from('user_purchases')
      .select(`
        *,
        shop_items (*)
      `)
      .eq('user_id', userId)
      .eq('shop_items.category', 'functional')

    if (error) throw error

    if (!data) return false

    return data.some(purchase => {
      const metadata = purchase.shop_items.metadata
      return metadata && metadata.type === featureType
    })
  } catch (error) {
    console.error('Error checking feature unlock:', error)
    return false
  }
}

// Get extra goal slots count
export async function getExtraGoalSlots(userId) {
  try {
    const { data, error } = await supabase
      .from('user_purchases')
      .select(`
        *,
        shop_items (*)
      `)
      .eq('user_id', userId)
      .eq('shop_items.name', 'Extra Goal Slot')

    if (error) throw error

    return data ? data.length : 0
  } catch (error) {
    console.error('Error getting extra goal slots:', error)
    return 0
  }
}

// Open mystery box
export async function openMysteryBox(userId, purchaseId, isLegendary = false) {
  try {
    // Define possible rewards
    const rewards = isLegendary ? [
      { type: 'points', value: 1000, weight: 30 },
      { type: 'points', value: 2000, weight: 20 },
      { type: 'theme', item: 'random', weight: 25 },
      { type: 'boost', item: '2x Points Boost (7 days)', weight: 15 },
      { type: 'frame', item: 'Gold Frame', weight: 10 }
    ] : [
      { type: 'points', value: 100, weight: 40 },
      { type: 'points', value: 300, weight: 30 },
      { type: 'boost', item: 'Streak Shield', weight: 20 },
      { type: 'theme', item: 'random', weight: 10 }
    ]

    // Weighted random selection
    const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0)
    let random = Math.random() * totalWeight
    let selectedReward = rewards[0]

    for (const reward of rewards) {
      random -= reward.weight
      if (random <= 0) {
        selectedReward = reward
        break
      }
    }

    // Apply reward
    let rewardResult = {}

    if (selectedReward.type === 'points') {
      const { error } = await supabase
        .from('user_stats')
        .update({ total_points: supabase.raw(`total_points + ${selectedReward.value}`) })
        .eq('user_id', userId)

      if (error) throw error
      rewardResult = { type: 'points', value: selectedReward.value }
    } else if (selectedReward.type === 'theme') {
      const themes = ['Ocean Theme', 'Sunset Theme', 'Forest Theme']
      const randomTheme = themes[Math.floor(Math.random() * themes.length)]
      
      const { data: themeItem } = await supabase
        .from('shop_items')
        .select('id')
        .eq('name', randomTheme)
        .single()

      if (themeItem) {
        await supabase
          .from('user_purchases')
          .insert({
            user_id: userId,
            item_id: themeItem.id,
            metadata: { source: 'mystery_box' }
          })
      }
      rewardResult = { type: 'theme', name: randomTheme }
    } else if (selectedReward.type === 'boost' || selectedReward.type === 'frame') {
      const { data: item } = await supabase
        .from('shop_items')
        .select('id')
        .eq('name', selectedReward.item)
        .single()

      if (item) {
        await supabase
          .from('user_purchases')
          .insert({
            user_id: userId,
            item_id: item.id,
            metadata: { source: 'mystery_box' }
          })
      }
      rewardResult = { type: selectedReward.type, name: selectedReward.item }
    }

    // Mark mystery box as opened
    await supabase
      .from('user_purchases')
      .update({ 
        used_at: new Date().toISOString(),
        metadata: { 
          opened_at: new Date().toISOString(),
          reward: rewardResult
        }
      })
      .eq('id', purchaseId)

    return { success: true, reward: rewardResult }
  } catch (error) {
    console.error('Error opening mystery box:', error)
    return { success: false, error }
  }
}
