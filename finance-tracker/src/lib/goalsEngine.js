import { supabase } from './supabase'

// Calculate goal recommendations based on income and expenses
export function calculateGoalRecommendations(goal, income, expenses) {
  const targetAmount = parseFloat(goal.target_amount)
  const currentAmount = parseFloat(goal.current_amount || 0)
  const remaining = targetAmount - currentAmount
  
  // Calculate monthly income and expenses
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
  const monthlySavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0
  
  // Calculate deadline
  const deadline = goal.deadline ? new Date(goal.deadline) : null
  const today = new Date()
  const monthsUntilDeadline = deadline 
    ? Math.max(1, Math.ceil((deadline - today) / (1000 * 60 * 60 * 24 * 30)))
    : null
  
  // Calculate required monthly savings
  const requiredMonthlySavings = monthsUntilDeadline 
    ? remaining / monthsUntilDeadline 
    : null
  
  // Calculate estimated months to complete (based on current savings rate)
  const estimatedMonths = monthlySavings > 0 
    ? Math.ceil(remaining / monthlySavings) 
    : null
  
  // Calculate progress
  const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
  
  // Generate recommendations
  const recommendations = []
  const warnings = []
  const tips = []
  
  // Check if goal is achievable with current savings
  if (monthlySavings <= 0) {
    warnings.push({
      type: 'critical',
      message: 'noSavings',
      icon: '⚠️'
    })
    recommendations.push({
      title: 'increaseIncome',
      description: 'increaseIncomeDesc',
      priority: 'high',
      icon: '💼'
    })
    recommendations.push({
      title: 'reduceExpenses',
      description: 'reduceExpensesDesc',
      priority: 'high',
      icon: '✂️'
    })
  } else {
    // Check if on track for deadline
    if (monthsUntilDeadline && requiredMonthlySavings > monthlySavings) {
      const shortfall = requiredMonthlySavings - monthlySavings
      const shortfallPercentage = (shortfall / totalIncome) * 100
      
      warnings.push({
        type: 'warning',
        message: 'behindSchedule',
        icon: '⏰',
        details: {
          required: requiredMonthlySavings,
          current: monthlySavings,
          shortfall: shortfall
        }
      })
      
      // Recommend increasing savings
      recommendations.push({
        title: 'increaseSavings',
        description: 'increaseSavingsDesc',
        priority: 'high',
        icon: '📈',
        amount: shortfall,
        percentage: shortfallPercentage
      })
      
      // Suggest specific expense categories to cut
      const expensesByCategory = {}
      expenses.forEach(expense => {
        expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount
      })
      
      const sortedCategories = Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
      
      sortedCategories.forEach(([category, amount]) => {
        const potentialSavings = amount * 0.2 // Suggest 20% reduction
        if (potentialSavings >= shortfall * 0.3) {
          recommendations.push({
            title: 'reduceCategorySpending',
            description: 'reduceCategorySpendingDesc',
            priority: 'medium',
            icon: '🎯',
            category: category,
            currentAmount: amount,
            suggestedReduction: potentialSavings
          })
        }
      })
    } else if (monthsUntilDeadline) {
      warnings.push({
        type: 'success',
        message: 'onTrack',
        icon: '✅'
      })
    }
    
    // Calculate optimal savings strategies
    const strategies = []
    
    // Strategy 1: Aggressive (30% of income)
    const aggressiveSavings = totalIncome * 0.30
    if (aggressiveSavings > monthlySavings) {
      const aggressiveMonths = Math.ceil(remaining / aggressiveSavings)
      strategies.push({
        name: 'aggressive',
        percentage: 30,
        monthlyAmount: aggressiveSavings,
        months: aggressiveMonths,
        completionDate: new Date(today.getTime() + aggressiveMonths * 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    // Strategy 2: Moderate (20% of income)
    const moderateSavings = totalIncome * 0.20
    if (moderateSavings > 0) {
      const moderateMonths = Math.ceil(remaining / moderateSavings)
      strategies.push({
        name: 'moderate',
        percentage: 20,
        monthlyAmount: moderateSavings,
        months: moderateMonths,
        completionDate: new Date(today.getTime() + moderateMonths * 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    // Strategy 3: Conservative (10% of income)
    const conservativeSavings = totalIncome * 0.10
    if (conservativeSavings > 0) {
      const conservativeMonths = Math.ceil(remaining / conservativeSavings)
      strategies.push({
        name: 'conservative',
        percentage: 10,
        monthlyAmount: conservativeSavings,
        months: conservativeMonths,
        completionDate: new Date(today.getTime() + conservativeMonths * 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    recommendations.push({
      title: 'savingsStrategies',
      description: 'savingsStrategiesDesc',
      priority: 'medium',
      icon: '📊',
      strategies: strategies
    })
  }
  
  // General tips based on goal category
  switch (goal.category) {
    case 'wedding':
      tips.push({
        title: 'weddingTip1',
        description: 'weddingTip1Desc',
        icon: '💒'
      })
      tips.push({
        title: 'weddingTip2',
        description: 'weddingTip2Desc',
        icon: '📋'
      })
      break
    case 'house':
      tips.push({
        title: 'houseTip1',
        description: 'houseTip1Desc',
        icon: '🏠'
      })
      tips.push({
        title: 'houseTip2',
        description: 'houseTip2Desc',
        icon: '💰'
      })
      break
    case 'car':
      tips.push({
        title: 'carTip1',
        description: 'carTip1Desc',
        icon: '🚗'
      })
      break
    case 'vacation':
      tips.push({
        title: 'vacationTip1',
        description: 'vacationTip1Desc',
        icon: '✈️'
      })
      break
    case 'emergency_fund':
      tips.push({
        title: 'emergencyTip1',
        description: 'emergencyTip1Desc',
        icon: '🛡️'
      })
      break
  }
  
  // Add general savings tips
  if (savingsRate < 10) {
    tips.push({
      title: 'increaseSavingsRate',
      description: 'increaseSavingsRateDesc',
      icon: '💡'
    })
  }
  
  return {
    progress: {
      current: currentAmount,
      target: targetAmount,
      remaining: remaining,
      percentage: progressPercentage
    },
    timeline: {
      deadline: deadline,
      monthsUntilDeadline: monthsUntilDeadline,
      estimatedMonths: estimatedMonths,
      requiredMonthlySavings: requiredMonthlySavings
    },
    financial: {
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      monthlySavings: monthlySavings,
      savingsRate: savingsRate
    },
    recommendations: recommendations,
    warnings: warnings,
    tips: tips
  }
}

// Get all goals for a user
export async function getUserGoals(userId) {
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching goals:', error)
    return []
  }
}

// Create a new goal
export async function createGoal(userId, goalData) {
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .insert({
        user_id: userId,
        ...goalData
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating goal:', error)
    return null
  }
}

// Update a goal
export async function updateGoal(goalId, updates) {
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating goal:', error)
    return null
  }
}

// Delete a goal
export async function deleteGoal(goalId) {
  try {
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', goalId)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting goal:', error)
    return false
  }
}

// Add contribution to a goal
export async function addContribution(goalId, userId, amount, date, notes = '') {
  try {
    const { data, error } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: goalId,
        user_id: userId,
        amount: amount,
        contribution_date: date,
        notes: notes
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding contribution:', error)
    return null
  }
}

// Get contributions for a goal
export async function getGoalContributions(goalId) {
  try {
    const { data, error } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .order('contribution_date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching contributions:', error)
    return []
  }
}

// Get milestones for a goal
export async function getGoalMilestones(goalId) {
  try {
    const { data, error } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goalId)
      .order('percentage', { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return []
  }
}

// Get goal category icon
export function getGoalCategoryIcon(category) {
  const icons = {
    wedding: '💒',
    house: '🏠',
    car: '🚗',
    vacation: '✈️',
    emergency_fund: '🛡️',
    education: '🎓',
    retirement: '🏖️',
    other: '🎯'
  }
  return icons[category] || '🎯'
}

// Get goal priority color
export function getGoalPriorityColor(priority) {
  const colors = {
    low: 'text-gray-600 bg-gray-100',
    medium: 'text-blue-600 bg-blue-100',
    high: 'text-red-600 bg-red-100'
  }
  return colors[priority] || colors.medium
}
