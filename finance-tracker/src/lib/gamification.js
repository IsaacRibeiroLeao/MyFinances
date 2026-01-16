import { supabase } from './supabase'

// Calculate points based on financial performance
export function calculateMonthlyPoints(income, expenses, previousMonth = null) {
  let points = 0
  const savings = income - expenses
  const savingsRate = income > 0 ? (savings / income) * 100 : 0

  // Base points for positive savings
  if (savings > 0) {
    points += 50
  }

  // Bonus points for savings rate
  if (savingsRate >= 20) points += 100
  else if (savingsRate >= 15) points += 75
  else if (savingsRate >= 10) points += 50
  else if (savingsRate >= 5) points += 25

  // Bonus for high savings amounts
  if (savings >= 5000) points += 150
  else if (savings >= 1000) points += 75
  else if (savings >= 500) points += 30

  // Bonus for improvement over previous month
  if (previousMonth && savings > previousMonth.savings) {
    const improvement = ((savings - previousMonth.savings) / Math.abs(previousMonth.savings)) * 100
    if (improvement >= 20) points += 50
    else if (improvement >= 10) points += 25
  }

  // Penalty for negative savings
  if (savings < 0) {
    points = Math.max(0, points - 25)
  }

  return Math.floor(points)
}

// Calculate level based on total points
export function calculateLevel(totalPoints) {
  return Math.floor(Math.sqrt(totalPoints / 100)) + 1
}

// Check which achievements should be unlocked
export async function checkAchievements(userId, expenses, income) {
  const achievements = []
  
  try {
    // Get user stats
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get already unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || [])

    // Get all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')

    if (!allAchievements) return []

    // Check first expense
    if (expenses.length >= 1 && !hasAchievement(unlockedIds, allAchievements, 'first_expense')) {
      achievements.push(allAchievements.find(a => a.code === 'first_expense'))
    }

    // Check first income
    if (income.length >= 1 && !hasAchievement(unlockedIds, allAchievements, 'first_income')) {
      achievements.push(allAchievements.find(a => a.code === 'first_income'))
    }

    // Get monthly performance
    const { data: monthlyPerf } = await supabase
      .from('monthly_performance')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })

    if (monthlyPerf && monthlyPerf.length > 0) {
      const latestMonth = monthlyPerf[0]

      // Check positive month
      if (latestMonth.was_positive && !hasAchievement(unlockedIds, allAchievements, 'positive_month')) {
        achievements.push(allAchievements.find(a => a.code === 'positive_month'))
      }

      // Check savings milestones
      if (latestMonth.savings >= 1000 && !hasAchievement(unlockedIds, allAchievements, 'saver_1000')) {
        achievements.push(allAchievements.find(a => a.code === 'saver_1000'))
      }

      if (latestMonth.savings >= 5000 && !hasAchievement(unlockedIds, allAchievements, 'saver_5000')) {
        achievements.push(allAchievements.find(a => a.code === 'saver_5000'))
      }
    }

    // Check streak achievements
    if (userStats) {
      if (userStats.current_streak >= 3 && !hasAchievement(unlockedIds, allAchievements, 'streak_3')) {
        achievements.push(allAchievements.find(a => a.code === 'streak_3'))
      }

      if (userStats.current_streak >= 6 && !hasAchievement(unlockedIds, allAchievements, 'streak_6')) {
        achievements.push(allAchievements.find(a => a.code === 'streak_6'))
      }

      if (userStats.current_streak >= 12 && !hasAchievement(unlockedIds, allAchievements, 'streak_12')) {
        achievements.push(allAchievements.find(a => a.code === 'streak_12'))
      }

      // Check level achievements
      if (userStats.level >= 5 && !hasAchievement(unlockedIds, allAchievements, 'level_5')) {
        achievements.push(allAchievements.find(a => a.code === 'level_5'))
      }

      if (userStats.level >= 10 && !hasAchievement(unlockedIds, allAchievements, 'level_10')) {
        achievements.push(allAchievements.find(a => a.code === 'level_10'))
      }
    }

    return achievements.filter(a => a !== undefined)
  } catch (error) {
    console.error('Error checking achievements:', error)
    return []
  }
}

function hasAchievement(unlockedIds, allAchievements, code) {
  const achievement = allAchievements.find(a => a.code === code)
  return achievement && unlockedIds.has(achievement.id)
}

// Unlock achievement for user
export async function unlockAchievement(userId, achievementId, points) {
  try {
    // Add achievement to user
    await supabase
      .from('user_achievements')
      .insert({ user_id: userId, achievement_id: achievementId })

    // Update user points
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('total_points')
      .eq('user_id', userId)
      .single()

    const newPoints = (userStats?.total_points || 0) + points
    const newLevel = calculateLevel(newPoints)

    await supabase
      .from('user_stats')
      .update({ 
        total_points: newPoints,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    return true
  } catch (error) {
    console.error('Error unlocking achievement:', error)
    return false
  }
}

// Update monthly performance and calculate streak
export async function updateMonthlyPerformance(userId, expenses, income) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
    const savings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0
    const wasPositive = savings > 0

    // Get previous month data
    const { data: previousMonths } = await supabase
      .from('monthly_performance')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(1)

    const previousMonth = previousMonths?.[0]
    const points = calculateMonthlyPoints(totalIncome, totalExpenses, previousMonth)

    // Upsert monthly performance
    await supabase
      .from('monthly_performance')
      .upsert({
        user_id: userId,
        month: currentMonth,
        income: totalIncome,
        expenses: totalExpenses,
        savings,
        savings_rate: savingsRate,
        points_earned: points,
        was_positive: wasPositive
      }, { onConflict: 'user_id,month' })

    // Update user stats
    const { data: allMonths } = await supabase
      .from('monthly_performance')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })

    // Calculate streak
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let monthsPositive = 0

    for (const month of allMonths || []) {
      if (month.was_positive) {
        monthsPositive++
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Current streak is from most recent positive months
    for (const month of allMonths || []) {
      if (month.was_positive) {
        currentStreak++
      } else {
        break
      }
    }

    // Get current stats
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    const totalPoints = (currentStats?.total_points || 0) + points
    const level = calculateLevel(totalPoints)

    await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_points: totalPoints,
        current_streak: currentStreak,
        longest_streak: Math.max(longestStreak, currentStats?.longest_streak || 0),
        months_positive: monthsPositive,
        level,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    return { points, level, currentStreak, wasPositive }
  } catch (error) {
    console.error('Error updating monthly performance:', error)
    return null
  }
}

// Get leaderboard
export async function getLeaderboard(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('username, total_points, level, current_streak, months_positive')
      .order('total_points', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}

// Get user rank
export async function getUserRank(userId) {
  try {
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('total_points')
      .eq('user_id', userId)
      .single()

    if (!userStats) return null

    const { count } = await supabase
      .from('user_stats')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', userStats.total_points)

    return (count || 0) + 1
  } catch (error) {
    console.error('Error fetching user rank:', error)
    return null
  }
}

// Initialize user stats
export async function initializeUserStats(userId, username = null) {
  try {
    const { data: existing } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) return existing

    const { data, error } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        username: username || `User${userId.slice(0, 8)}`,
        total_points: 0,
        current_streak: 0,
        longest_streak: 0,
        months_positive: 0,
        level: 1
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error initializing user stats:', error)
    return null
  }
}
