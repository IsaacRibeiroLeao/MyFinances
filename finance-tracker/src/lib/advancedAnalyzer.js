import { format, parseISO, differenceInDays, addMonths } from 'date-fns'

export function detectAnomalies(expenses) {
  if (expenses.length < 10) return { anomalies: [], summary: 'Insufficient data for anomaly detection' }

  const anomalies = []
  
  const categoryStats = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = { amounts: [], dates: [] }
    }
    acc[exp.category].amounts.push(exp.amount)
    acc[exp.category].dates.push(exp.date)
    return acc
  }, {})

  Object.entries(categoryStats).forEach(([category, data]) => {
    if (data.amounts.length < 3) return

    const mean = data.amounts.reduce((sum, a) => sum + a, 0) / data.amounts.length
    const variance = data.amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / data.amounts.length
    const stdDev = Math.sqrt(variance)
    
    data.amounts.forEach((amount, index) => {
      const zScore = stdDev > 0 ? (amount - mean) / stdDev : 0
      
      if (Math.abs(zScore) > 2) {
        anomalies.push({
          category,
          amount,
          date: data.dates[index],
          type: zScore > 0 ? 'unusually_high' : 'unusually_low',
          deviation: ((amount - mean) / mean) * 100,
          severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
          description: `${category} expense of $${amount.toFixed(2)} is ${Math.abs(((amount - mean) / mean) * 100).toFixed(0)}% ${zScore > 0 ? 'higher' : 'lower'} than average ($${mean.toFixed(2)})`,
        })
      }
    })
  })

  const duplicateCheck = expenses.reduce((acc, exp) => {
    const key = `${exp.category}-${exp.amount}-${exp.date}`
    if (!acc[key]) acc[key] = []
    acc[key].push(exp)
    return acc
  }, {})

  Object.entries(duplicateCheck).forEach(([key, transactions]) => {
    if (transactions.length > 1) {
      anomalies.push({
        category: transactions[0].category,
        amount: transactions[0].amount,
        date: transactions[0].date,
        type: 'potential_duplicate',
        severity: 'medium',
        count: transactions.length,
        description: `Potential duplicate: ${transactions.length} identical transactions of $${transactions[0].amount.toFixed(2)} in ${transactions[0].category}`,
      })
    }
  })

  return {
    anomalies: anomalies.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    }),
    summary: anomalies.length > 0 
      ? `Found ${anomalies.length} anomalies requiring attention`
      : 'No significant anomalies detected',
  }
}

export function calculateSpendingVelocity(expenses) {
  if (expenses.length < 2) return null

  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date))
  const firstDate = new Date(sortedExpenses[0].date)
  const lastDate = new Date(sortedExpenses[sortedExpenses.length - 1].date)
  const daySpan = differenceInDays(lastDate, firstDate) || 1

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const dailyAverage = totalSpent / daySpan
  const weeklyAverage = dailyAverage * 7
  const monthlyAverage = dailyAverage * 30

  const recentExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date)
    const daysAgo = differenceInDays(new Date(), expDate)
    return daysAgo <= 7
  })
  const recentTotal = recentExpenses.reduce((sum, e) => sum + e.amount, 0)
  const recentDaily = recentTotal / 7

  const acceleration = ((recentDaily - dailyAverage) / dailyAverage) * 100

  const categoryVelocity = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = { total: 0, count: 0 }
    }
    acc[exp.category].total += exp.amount
    acc[exp.category].count += 1
    return acc
  }, {})

  const topCategories = Object.entries(categoryVelocity)
    .map(([category, data]) => ({
      category,
      dailyRate: data.total / daySpan,
      weeklyRate: (data.total / daySpan) * 7,
      monthlyRate: (data.total / daySpan) * 30,
      transactionFrequency: data.count / daySpan,
    }))
    .sort((a, b) => b.dailyRate - a.dailyRate)

  return {
    overall: {
      dailyAverage,
      weeklyAverage,
      monthlyAverage,
      recentDailyAverage: recentDaily,
      acceleration,
      trend: acceleration > 10 ? 'accelerating' : acceleration < -10 ? 'decelerating' : 'stable',
    },
    byCategory: topCategories,
    burnRate: {
      daily: dailyAverage,
      daysUntil1000: 1000 / dailyAverage,
      projectedMonthly: monthlyAverage,
    },
  }
}

export function generateForecast(expenses, income) {
  if (expenses.length < 5 || income.length < 2) {
    return { available: false, reason: 'Insufficient historical data for forecasting' }
  }

  const monthlyExpenses = groupByMonth(expenses)
  const monthlyIncome = groupByMonth(income)
  
  const months = Object.keys(monthlyExpenses).sort()
  if (months.length < 3) {
    return { available: false, reason: 'Need at least 3 months of data' }
  }

  const recentMonths = months.slice(-3)
  const avgMonthlyExpense = recentMonths.reduce((sum, month) => {
    return sum + monthlyExpenses[month].reduce((s, e) => s + e.amount, 0)
  }, 0) / recentMonths.length

  const avgMonthlyIncome = recentMonths.reduce((sum, month) => {
    const monthIncome = monthlyIncome[month] || []
    return sum + monthIncome.reduce((s, i) => s + i.amount, 0)
  }, 0) / recentMonths.length

  const expenseTrend = calculateTrendSlope(recentMonths.map(m => 
    monthlyExpenses[m].reduce((s, e) => s + e.amount, 0)
  ))

  const incomeTrend = calculateTrendSlope(recentMonths.map(m => {
    const monthIncome = monthlyIncome[m] || []
    return monthIncome.reduce((s, i) => s + i.amount, 0)
  }))

  const nextMonthExpense = avgMonthlyExpense + expenseTrend
  const nextMonthIncome = avgMonthlyIncome + incomeTrend
  const nextMonthSavings = nextMonthIncome - nextMonthExpense

  const next3Months = []
  for (let i = 1; i <= 3; i++) {
    const projectedExpense = avgMonthlyExpense + (expenseTrend * i)
    const projectedIncome = avgMonthlyIncome + (incomeTrend * i)
    const projectedSavings = projectedIncome - projectedExpense
    
    next3Months.push({
      month: format(addMonths(new Date(), i), 'MMM yyyy'),
      projectedExpense,
      projectedIncome,
      projectedSavings,
      savingsRate: projectedIncome > 0 ? (projectedSavings / projectedIncome) * 100 : 0,
    })
  }

  const categoryForecasts = Object.keys(expenses.reduce((acc, e) => {
    acc[e.category] = true
    return acc
  }, {})).map(category => {
    const categoryExpenses = expenses.filter(e => e.category === category)
    const categoryMonthly = groupByMonth(categoryExpenses)
    const recentAvg = recentMonths.reduce((sum, month) => {
      const monthData = categoryMonthly[month] || []
      return sum + monthData.reduce((s, e) => s + e.amount, 0)
    }, 0) / recentMonths.length

    return {
      category,
      projectedMonthly: recentAvg,
      confidence: categoryExpenses.length >= 10 ? 'high' : categoryExpenses.length >= 5 ? 'medium' : 'low',
    }
  }).sort((a, b) => b.projectedMonthly - a.projectedMonthly)

  return {
    available: true,
    nextMonth: {
      expense: nextMonthExpense,
      income: nextMonthIncome,
      savings: nextMonthSavings,
      savingsRate: nextMonthIncome > 0 ? (nextMonthSavings / nextMonthIncome) * 100 : 0,
    },
    next3Months,
    categoryForecasts,
    trends: {
      expenseTrend: expenseTrend > 0 ? 'increasing' : expenseTrend < 0 ? 'decreasing' : 'stable',
      incomeTrend: incomeTrend > 0 ? 'increasing' : incomeTrend < 0 ? 'decreasing' : 'stable',
      outlook: nextMonthSavings > 0 ? 'positive' : 'concerning',
    },
  }
}

function calculateTrendSlope(values) {
  if (values.length < 2) return 0
  
  const n = values.length
  const sumX = (n * (n - 1)) / 2
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

function groupByMonth(items) {
  return items.reduce((acc, item) => {
    const month = format(parseISO(item.date), 'yyyy-MM')
    if (!acc[month]) acc[month] = []
    acc[month].push(item)
    return acc
  }, {})
}

export function generateComparativeAnalysis(expenses, income) {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0)

  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {})

  const benchmarks = {
    'Food & Dining': { ideal: 15, acceptable: 20, warning: 25 },
    'Transportation': { ideal: 10, acceptable: 15, warning: 20 },
    'Shopping': { ideal: 10, acceptable: 15, warning: 20 },
    'Entertainment': { ideal: 5, acceptable: 10, warning: 15 },
    'Bills & Utilities': { ideal: 20, acceptable: 25, warning: 30 },
    'Healthcare': { ideal: 5, acceptable: 10, warning: 15 },
  }

  const comparisons = Object.entries(categoryTotals).map(([category, amount]) => {
    const percentage = (amount / totalExpenses) * 100
    const benchmark = benchmarks[category]
    
    let status = 'no_benchmark'
    let recommendation = 'No standard benchmark available'
    
    if (benchmark) {
      if (percentage <= benchmark.ideal) {
        status = 'excellent'
        recommendation = 'Spending is within ideal range'
      } else if (percentage <= benchmark.acceptable) {
        status = 'good'
        recommendation = 'Spending is acceptable but could be optimized'
      } else if (percentage <= benchmark.warning) {
        status = 'warning'
        recommendation = `Consider reducing spending - ${(percentage - benchmark.acceptable).toFixed(1)}% above recommended`
      } else {
        status = 'critical'
        recommendation = `Significantly overspending - ${(percentage - benchmark.warning).toFixed(1)}% above warning threshold`
      }
    }

    return {
      category,
      amount,
      percentage,
      status,
      benchmark: benchmark || null,
      recommendation,
    }
  }).sort((a, b) => b.percentage - a.percentage)

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
  
  let savingsStatus = 'poor'
  let savingsRecommendation = 'Critical: Aim for at least 10% savings rate'
  
  if (savingsRate >= 30) {
    savingsStatus = 'excellent'
    savingsRecommendation = 'Outstanding savings rate! Consider investment opportunities'
  } else if (savingsRate >= 20) {
    savingsStatus = 'good'
    savingsRecommendation = 'Good savings rate, maintain this discipline'
  } else if (savingsRate >= 10) {
    savingsStatus = 'fair'
    savingsRecommendation = 'Adequate savings, try to increase to 20%'
  }

  return {
    categoryComparisons: comparisons,
    savingsAnalysis: {
      rate: savingsRate,
      status: savingsStatus,
      recommendation: savingsRecommendation,
      benchmarkComparison: {
        excellent: 30,
        good: 20,
        fair: 10,
        current: savingsRate,
      },
    },
    overallScore: calculateOverallScore(comparisons, savingsRate),
  }
}

function calculateOverallScore(comparisons, savingsRate) {
  let score = 0
  
  comparisons.forEach(comp => {
    if (comp.status === 'excellent') score += 10
    else if (comp.status === 'good') score += 7
    else if (comp.status === 'warning') score += 4
    else if (comp.status === 'critical') score += 0
  })

  if (savingsRate >= 30) score += 30
  else if (savingsRate >= 20) score += 25
  else if (savingsRate >= 10) score += 15
  else if (savingsRate >= 0) score += 5

  const maxScore = (comparisons.length * 10) + 30
  return {
    score,
    maxScore,
    percentage: (score / maxScore) * 100,
    rating: score / maxScore >= 0.8 ? 'excellent' : score / maxScore >= 0.6 ? 'good' : score / maxScore >= 0.4 ? 'fair' : 'needs_improvement',
  }
}

export function analyzeBehaviorPatterns(expenses) {
  if (expenses.length < 10) return null

  const dayOfWeekSpending = expenses.reduce((acc, exp) => {
    const day = new Date(exp.date).getDay()
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
    if (!acc[dayName]) acc[dayName] = { total: 0, count: 0 }
    acc[dayName].total += exp.amount
    acc[dayName].count += 1
    return acc
  }, {})

  const dayPatterns = Object.entries(dayOfWeekSpending).map(([day, data]) => ({
    day,
    averageSpending: data.total / data.count,
    totalTransactions: data.count,
    totalSpent: data.total,
  })).sort((a, b) => b.averageSpending - a.averageSpending)

  const timeBasedPatterns = {
    weekday: expenses.filter(e => {
      const day = new Date(e.date).getDay()
      return day >= 1 && day <= 5
    }),
    weekend: expenses.filter(e => {
      const day = new Date(e.date).getDay()
      return day === 0 || day === 6
    }),
  }

  const weekdayTotal = timeBasedPatterns.weekday.reduce((sum, e) => sum + e.amount, 0)
  const weekendTotal = timeBasedPatterns.weekend.reduce((sum, e) => sum + e.amount, 0)

  const impulseBuying = expenses.filter(exp => {
    const category = exp.category
    return ['Shopping', 'Entertainment'].includes(category) && exp.amount < 50
  })

  const largePurchases = expenses.filter(exp => exp.amount > 200)

  const recurringExpenses = detectRecurringExpenses(expenses)

  return {
    dayOfWeekPatterns: dayPatterns,
    weekdayVsWeekend: {
      weekday: {
        total: weekdayTotal,
        average: weekdayTotal / (timeBasedPatterns.weekday.length || 1),
        count: timeBasedPatterns.weekday.length,
      },
      weekend: {
        total: weekendTotal,
        average: weekendTotal / (timeBasedPatterns.weekend.length || 1),
        count: timeBasedPatterns.weekend.length,
      },
      preference: weekendTotal > weekdayTotal ? 'weekend_spender' : 'weekday_spender',
    },
    impulseBuying: {
      count: impulseBuying.length,
      total: impulseBuying.reduce((sum, e) => sum + e.amount, 0),
      percentage: (impulseBuying.length / expenses.length) * 100,
      insight: impulseBuying.length > expenses.length * 0.3 
        ? 'High frequency of small purchases - consider consolidating shopping trips'
        : 'Impulse buying is under control',
    },
    largePurchases: {
      count: largePurchases.length,
      total: largePurchases.reduce((sum, e) => sum + e.amount, 0),
      average: largePurchases.length > 0 
        ? largePurchases.reduce((sum, e) => sum + e.amount, 0) / largePurchases.length 
        : 0,
      categories: [...new Set(largePurchases.map(e => e.category))],
    },
    recurringExpenses,
  }
}

function detectRecurringExpenses(expenses) {
  const categoryAmounts = expenses.reduce((acc, exp) => {
    const key = `${exp.category}-${Math.round(exp.amount)}`
    if (!acc[key]) acc[key] = []
    acc[key].push(exp.date)
    return acc
  }, {})

  const recurring = []
  
  Object.entries(categoryAmounts).forEach(([key, dates]) => {
    if (dates.length >= 2) {
      const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b)
      const intervals = []
      
      for (let i = 1; i < sortedDates.length; i++) {
        intervals.push(differenceInDays(sortedDates[i], sortedDates[i - 1]))
      }
      
      const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length
      const stdDev = Math.sqrt(variance)
      const consistency = stdDev / avgInterval
      
      if (consistency < 0.3 && avgInterval < 45) {
        const [category, amount] = key.split('-')
        recurring.push({
          category,
          amount: parseInt(amount),
          frequency: avgInterval < 10 ? 'weekly' : avgInterval < 20 ? 'bi-weekly' : 'monthly',
          avgDaysBetween: Math.round(avgInterval),
          occurrences: dates.length,
          consistency: consistency < 0.1 ? 'very_high' : consistency < 0.2 ? 'high' : 'moderate',
        })
      }
    }
  })

  return recurring.sort((a, b) => b.amount - a.amount)
}
