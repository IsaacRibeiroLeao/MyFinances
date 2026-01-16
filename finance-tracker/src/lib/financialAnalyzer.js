import { format, parseISO, differenceInDays } from 'date-fns'
import { 
  detectAnomalies, 
  calculateSpendingVelocity, 
  generateForecast, 
  generateComparativeAnalysis,
  analyzeBehaviorPatterns 
} from './advancedAnalyzer'

export function analyzeFinancialData(expenses, income) {
  const analysis = {
    overview: calculateOverview(expenses, income),
    spendingPatterns: analyzeSpendingPatterns(expenses),
    incomeAnalysis: analyzeIncome(income),
    categoryInsights: analyzeCategorySpending(expenses),
    trends: analyzeTrends(expenses, income),
    recommendations: generateRecommendations(expenses, income),
    financialHealth: calculateFinancialHealth(expenses, income),
    budgetSuggestions: generateBudgetSuggestions(expenses, income),
    anomalies: detectAnomalies(expenses),
    spendingVelocity: calculateSpendingVelocity(expenses),
    forecast: generateForecast(expenses, income),
    comparativeAnalysis: generateComparativeAnalysis(expenses, income),
    behaviorPatterns: analyzeBehaviorPatterns(expenses),
  }

  return analysis
}

function calculateOverview(expenses, income) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0)
  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  return {
    totalExpenses,
    totalIncome,
    netSavings,
    savingsRate,
    expenseCount: expenses.length,
    incomeCount: income.length,
  }
}

function analyzeSpendingPatterns(expenses) {
  if (expenses.length === 0) return null

  const byCategory = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = { total: 0, count: 0, transactions: [] }
    }
    acc[exp.category].total += exp.amount
    acc[exp.category].count += 1
    acc[exp.category].transactions.push(exp)
    return acc
  }, {})

  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const categoryBreakdown = Object.entries(byCategory).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    average: data.total / data.count,
    percentage: (data.total / totalSpending) * 100,
    trend: calculateCategoryTrend(data.transactions),
  })).sort((a, b) => b.total - a.total)

  const averageTransaction = totalSpending / expenses.length
  const largestExpense = Math.max(...expenses.map(e => e.amount))
  const smallestExpense = Math.min(...expenses.map(e => e.amount))

  return {
    categoryBreakdown,
    averageTransaction,
    largestExpense,
    smallestExpense,
    totalCategories: Object.keys(byCategory).length,
  }
}

function calculateCategoryTrend(transactions) {
  if (transactions.length < 2) return 'stable'
  
  const sorted = transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
  const midpoint = Math.floor(sorted.length / 2)
  const firstHalf = sorted.slice(0, midpoint)
  const secondHalf = sorted.slice(midpoint)
  
  const firstAvg = firstHalf.reduce((sum, t) => sum + t.amount, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, t) => sum + t.amount, 0) / secondHalf.length
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (change > 10) return 'increasing'
  if (change < -10) return 'decreasing'
  return 'stable'
}

function analyzeIncome(income) {
  if (income.length === 0) return null

  const bySource = income.reduce((acc, inc) => {
    if (!acc[inc.source]) {
      acc[inc.source] = { total: 0, count: 0 }
    }
    acc[inc.source].total += inc.amount
    acc[inc.source].count += 1
    return acc
  }, {})

  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0)

  const sourceBreakdown = Object.entries(bySource).map(([source, data]) => ({
    source,
    total: data.total,
    count: data.count,
    average: data.total / data.count,
    percentage: (data.total / totalIncome) * 100,
  })).sort((a, b) => b.total - a.total)

  const averageIncome = totalIncome / income.length
  const consistency = calculateIncomeConsistency(income)

  return {
    sourceBreakdown,
    averageIncome,
    consistency,
    totalSources: Object.keys(bySource).length,
  }
}

function calculateIncomeConsistency(income) {
  if (income.length < 2) return 'insufficient_data'
  
  const amounts = income.map(i => i.amount)
  const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
  const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = (stdDev / avg) * 100
  
  if (coefficientOfVariation < 10) return 'very_consistent'
  if (coefficientOfVariation < 25) return 'consistent'
  if (coefficientOfVariation < 50) return 'moderate'
  return 'variable'
}

function analyzeCategorySpending(expenses) {
  if (expenses.length === 0) return []

  const categories = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = []
    }
    acc[exp.category].push(exp)
    return acc
  }, {})

  return Object.entries(categories).map(([category, transactions]) => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0)
    const avg = total / transactions.length
    const max = Math.max(...transactions.map(t => t.amount))
    const min = Math.min(...transactions.map(t => t.amount))
    
    return {
      category,
      total,
      count: transactions.length,
      average: avg,
      max,
      min,
      frequency: calculateFrequency(transactions),
      insight: generateCategoryInsight(category, total, transactions.length, avg),
    }
  }).sort((a, b) => b.total - a.total)
}

function calculateFrequency(transactions) {
  if (transactions.length < 2) return 'occasional'
  
  const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a - b)
  const daysBetween = []
  
  for (let i = 1; i < dates.length; i++) {
    daysBetween.push(differenceInDays(dates[i], dates[i - 1]))
  }
  
  const avgDays = daysBetween.reduce((sum, d) => sum + d, 0) / daysBetween.length
  
  if (avgDays < 3) return 'daily'
  if (avgDays < 10) return 'weekly'
  if (avgDays < 35) return 'monthly'
  return 'occasional'
}

function generateCategoryInsight(category, total, count, average) {
  const insights = []
  
  if (category === 'Food & Dining') {
    if (average > 30) insights.push('High average per meal - consider cooking at home more')
    if (count > 20) insights.push('Frequent dining out - meal prep could save money')
  } else if (category === 'Shopping') {
    if (average > 50) insights.push('Large shopping transactions - review necessity of purchases')
    if (count > 15) insights.push('Frequent shopping - implement a waiting period before purchases')
  } else if (category === 'Entertainment') {
    if (total > 200) insights.push('High entertainment spending - explore free alternatives')
  } else if (category === 'Transportation') {
    if (average > 40) insights.push('High transportation costs - consider carpooling or public transit')
  } else if (category === 'Credit Card') {
    insights.push('Focus on paying down credit card debt to reduce interest charges')
  }
  
  return insights.length > 0 ? insights : ['Monitor this category for optimization opportunities']
}

function analyzeTrends(expenses, income) {
  const monthlyExpenses = groupByMonth(expenses)
  const monthlyIncome = groupByMonth(income)
  
  const months = [...new Set([...Object.keys(monthlyExpenses), ...Object.keys(monthlyIncome)])].sort()
  
  const trendData = months.map(month => {
    const expenseTotal = monthlyExpenses[month]?.reduce((sum, e) => sum + e.amount, 0) || 0
    const incomeTotal = monthlyIncome[month]?.reduce((sum, i) => sum + i.amount, 0) || 0
    
    return {
      month,
      expenses: expenseTotal,
      income: incomeTotal,
      savings: incomeTotal - expenseTotal,
      savingsRate: incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0,
    }
  })
  
  const trend = calculateOverallTrend(trendData)
  
  return {
    monthlyData: trendData,
    trend,
    bestMonth: findBestMonth(trendData),
    worstMonth: findWorstMonth(trendData),
  }
}

function groupByMonth(items) {
  return items.reduce((acc, item) => {
    const month = format(parseISO(item.date), 'yyyy-MM')
    if (!acc[month]) acc[month] = []
    acc[month].push(item)
    return acc
  }, {})
}

function calculateOverallTrend(trendData) {
  if (trendData.length < 2) return 'insufficient_data'
  
  const recentMonths = trendData.slice(-3)
  const avgRecent = recentMonths.reduce((sum, m) => sum + m.savings, 0) / recentMonths.length
  
  const olderMonths = trendData.slice(0, -3)
  if (olderMonths.length === 0) return 'new_data'
  
  const avgOlder = olderMonths.reduce((sum, m) => sum + m.savings, 0) / olderMonths.length
  
  const change = avgOlder !== 0 ? ((avgRecent - avgOlder) / Math.abs(avgOlder)) * 100 : 0
  
  if (change > 15) return 'improving'
  if (change < -15) return 'declining'
  return 'stable'
}

function findBestMonth(trendData) {
  if (trendData.length === 0) return null
  return trendData.reduce((best, current) => 
    current.savings > best.savings ? current : best
  )
}

function findWorstMonth(trendData) {
  if (trendData.length === 0) return null
  return trendData.reduce((worst, current) => 
    current.savings < worst.savings ? current : worst
  )
}

function generateRecommendations(expenses, income) {
  const recommendations = []
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0)
  
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {})
  
  Object.entries(categoryTotals).forEach(([category, amount]) => {
    const percentage = (amount / totalExpenses) * 100
    
    if (category === 'Food & Dining' && percentage > 20) {
      recommendations.push({
        priority: 'high',
        category,
        issue: `${percentage.toFixed(1)}% of spending on food & dining`,
        suggestion: 'Reduce dining out by 50% through meal planning',
        potentialSavings: amount * 0.3,
      })
    }
    
    if (category === 'Shopping' && percentage > 15) {
      recommendations.push({
        priority: 'high',
        category,
        issue: `${percentage.toFixed(1)}% on shopping`,
        suggestion: 'Implement 48-hour rule before non-essential purchases',
        potentialSavings: amount * 0.25,
      })
    }
    
    if (category === 'Entertainment' && percentage > 12) {
      recommendations.push({
        priority: 'medium',
        category,
        issue: `${percentage.toFixed(1)}% on entertainment`,
        suggestion: 'Explore free community events and streaming alternatives',
        potentialSavings: amount * 0.4,
      })
    }
    
    if (category === 'Credit Card' && amount > 0) {
      recommendations.push({
        priority: 'critical',
        category,
        issue: 'Credit card payments detected',
        suggestion: 'Prioritize paying off high-interest debt',
        potentialSavings: amount * 0.15,
      })
    }
  })
  
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
  
  if (savingsRate < 10) {
    recommendations.push({
      priority: 'critical',
      category: 'Overall',
      issue: `Only ${savingsRate.toFixed(1)}% savings rate`,
      suggestion: 'Aim for at least 20% savings rate - review all categories',
      potentialSavings: totalIncome * 0.2 - (totalIncome - totalExpenses),
    })
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

function calculateFinancialHealth(expenses, income) {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0)
  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
  
  let score = 0
  const factors = []
  
  if (savingsRate >= 20) {
    score += 30
    factors.push({ factor: 'Savings Rate', status: 'excellent', points: 30 })
  } else if (savingsRate >= 10) {
    score += 20
    factors.push({ factor: 'Savings Rate', status: 'good', points: 20 })
  } else if (savingsRate >= 0) {
    score += 10
    factors.push({ factor: 'Savings Rate', status: 'fair', points: 10 })
  } else {
    factors.push({ factor: 'Savings Rate', status: 'poor', points: 0 })
  }
  
  const incomeConsistency = calculateIncomeConsistency(income)
  if (incomeConsistency === 'very_consistent' || incomeConsistency === 'consistent') {
    score += 25
    factors.push({ factor: 'Income Stability', status: 'excellent', points: 25 })
  } else if (incomeConsistency === 'moderate') {
    score += 15
    factors.push({ factor: 'Income Stability', status: 'good', points: 15 })
  } else {
    score += 5
    factors.push({ factor: 'Income Stability', status: 'fair', points: 5 })
  }
  
  const categoryCount = new Set(expenses.map(e => e.category)).size
  if (categoryCount <= 5) {
    score += 20
    factors.push({ factor: 'Spending Discipline', status: 'excellent', points: 20 })
  } else if (categoryCount <= 7) {
    score += 15
    factors.push({ factor: 'Spending Discipline', status: 'good', points: 15 })
  } else {
    score += 5
    factors.push({ factor: 'Spending Discipline', status: 'needs_improvement', points: 5 })
  }
  
  const hasDebt = expenses.some(e => e.category === 'Credit Card')
  if (!hasDebt) {
    score += 25
    factors.push({ factor: 'Debt Status', status: 'excellent', points: 25 })
  } else {
    score += 10
    factors.push({ factor: 'Debt Status', status: 'needs_attention', points: 10 })
  }
  
  let rating
  if (score >= 85) rating = 'excellent'
  else if (score >= 70) rating = 'good'
  else if (score >= 50) rating = 'fair'
  else rating = 'needs_improvement'
  
  return {
    score,
    rating,
    factors,
    maxScore: 100,
  }
}

function generateBudgetSuggestions(expenses, income) {
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0)
  
  if (totalIncome === 0) return null
  
  const rule503020 = {
    needs: totalIncome * 0.5,
    wants: totalIncome * 0.3,
    savings: totalIncome * 0.2,
  }
  
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {})
  
  const needsCategories = ['Bills & Utilities', 'Healthcare', 'Transportation']
  const wantsCategories = ['Food & Dining', 'Shopping', 'Entertainment']
  
  const currentNeeds = Object.entries(categoryTotals)
    .filter(([cat]) => needsCategories.includes(cat))
    .reduce((sum, [, amt]) => sum + amt, 0)
  
  const currentWants = Object.entries(categoryTotals)
    .filter(([cat]) => wantsCategories.includes(cat))
    .reduce((sum, [, amt]) => sum + amt, 0)
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currentSavings = totalIncome - totalExpenses
  
  return {
    recommended: rule503020,
    current: {
      needs: currentNeeds,
      wants: currentWants,
      savings: currentSavings,
    },
    adjustments: {
      needs: rule503020.needs - currentNeeds,
      wants: rule503020.wants - currentWants,
      savings: rule503020.savings - currentSavings,
    },
  }
}
