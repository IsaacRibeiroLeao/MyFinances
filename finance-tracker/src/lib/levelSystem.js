// Level System Configuration and Details

export const LEVEL_SYSTEM = {
  1: {
    name: 'Beginner',
    nameKey: 'levelBeginner',
    pointsRequired: 0,
    icon: '🌱',
    color: '#10B981',
    benefits: ['basicFeatures'],
    description: 'levelBeginnerDesc'
  },
  2: {
    name: 'Learner',
    nameKey: 'levelLearner',
    pointsRequired: 500,
    icon: '📚',
    color: '#3B82F6',
    benefits: ['basicFeatures', 'monthlyReports'],
    description: 'levelLearnerDesc'
  },
  3: {
    name: 'Tracker',
    nameKey: 'levelTracker',
    pointsRequired: 1200,
    icon: '📊',
    color: '#8B5CF6',
    benefits: ['basicFeatures', 'monthlyReports', 'categoryInsights'],
    description: 'levelTrackerDesc'
  },
  4: {
    name: 'Saver',
    nameKey: 'levelSaver',
    pointsRequired: 2200,
    icon: '💰',
    color: '#F59E0B',
    benefits: ['basicFeatures', 'monthlyReports', 'categoryInsights', 'goalTracking'],
    description: 'levelSaverDesc'
  },
  5: {
    name: 'Planner',
    nameKey: 'levelPlanner',
    pointsRequired: 3500,
    icon: '🎯',
    color: '#EC4899',
    benefits: ['basicFeatures', 'monthlyReports', 'categoryInsights', 'goalTracking', 'advancedAnalytics'],
    description: 'levelPlannerDesc'
  },
  6: {
    name: 'Expert',
    nameKey: 'levelExpert',
    pointsRequired: 5200,
    icon: '⭐',
    color: '#EF4444',
    benefits: ['basicFeatures', 'monthlyReports', 'categoryInsights', 'goalTracking', 'advancedAnalytics', 'shopDiscount10'],
    description: 'levelExpertDesc'
  },
  7: {
    name: 'Master',
    nameKey: 'levelMaster',
    pointsRequired: 7500,
    icon: '🏆',
    color: '#DC2626',
    benefits: ['basicFeatures', 'monthlyReports', 'categoryInsights', 'goalTracking', 'advancedAnalytics', 'shopDiscount15', 'exclusiveItems'],
    description: 'levelMasterDesc'
  },
  8: {
    name: 'Guru',
    nameKey: 'levelGuru',
    pointsRequired: 10500,
    icon: '🧙',
    color: '#7C3AED',
    benefits: ['basicFeatures', 'monthlyReports', 'categoryInsights', 'goalTracking', 'advancedAnalytics', 'shopDiscount20', 'exclusiveItems', 'prioritySupport'],
    description: 'levelGuruDesc'
  },
  9: {
    name: 'Legend',
    nameKey: 'levelLegend',
    pointsRequired: 15000,
    icon: '👑',
    color: '#FFD700',
    benefits: ['basicFeatures', 'monthlyReports', 'categoryInsights', 'goalTracking', 'advancedAnalytics', 'shopDiscount25', 'exclusiveItems', 'prioritySupport', 'customThemes'],
    description: 'levelLegendDesc'
  },
  10: {
    name: 'Titan',
    nameKey: 'levelTitan',
    pointsRequired: 20000,
    icon: '💎',
    color: '#B9F2FF',
    benefits: ['allFeatures', 'shopDiscount30', 'exclusiveItems', 'prioritySupport', 'customThemes', 'unlimitedGoals'],
    description: 'levelTitanDesc'
  }
}

export function getLevelInfo(points) {
  let currentLevel = 1
  let nextLevel = 2
  
  const levels = Object.keys(LEVEL_SYSTEM).map(Number).sort((a, b) => a - b)
  
  for (const level of levels) {
    if (points >= LEVEL_SYSTEM[level].pointsRequired) {
      currentLevel = level
    } else {
      nextLevel = level
      break
    }
  }
  
  if (currentLevel === 10) {
    nextLevel = 10
  }
  
  const current = LEVEL_SYSTEM[currentLevel]
  const next = LEVEL_SYSTEM[nextLevel]
  
  const pointsForNext = next.pointsRequired - current.pointsRequired
  const pointsProgress = points - current.pointsRequired
  const progressPercentage = currentLevel === 10 ? 100 : (pointsProgress / pointsForNext) * 100
  
  return {
    currentLevel,
    nextLevel,
    current,
    next,
    pointsForNext,
    pointsProgress,
    pointsNeeded: next.pointsRequired - points,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage))
  }
}

export function getBenefitDescription(benefitKey) {
  const benefits = {
    basicFeatures: { icon: '✅', key: 'benefitBasicFeatures' },
    monthlyReports: { icon: '📊', key: 'benefitMonthlyReports' },
    categoryInsights: { icon: '🔍', key: 'benefitCategoryInsights' },
    goalTracking: { icon: '🎯', key: 'benefitGoalTracking' },
    advancedAnalytics: { icon: '📈', key: 'benefitAdvancedAnalytics' },
    shopDiscount10: { icon: '🏷️', key: 'benefitShopDiscount10' },
    shopDiscount15: { icon: '🏷️', key: 'benefitShopDiscount15' },
    shopDiscount20: { icon: '🏷️', key: 'benefitShopDiscount20' },
    shopDiscount25: { icon: '🏷️', key: 'benefitShopDiscount25' },
    shopDiscount30: { icon: '🏷️', key: 'benefitShopDiscount30' },
    exclusiveItems: { icon: '✨', key: 'benefitExclusiveItems' },
    prioritySupport: { icon: '🚀', key: 'benefitPrioritySupport' },
    customThemes: { icon: '🎨', key: 'benefitCustomThemes' },
    unlimitedGoals: { icon: '∞', key: 'benefitUnlimitedGoals' },
    allFeatures: { icon: '🌟', key: 'benefitAllFeatures' }
  }
  
  return benefits[benefitKey] || { icon: '•', key: benefitKey }
}

export function getShopDiscount(level) {
  const discounts = {
    6: 10,
    7: 15,
    8: 20,
    9: 25,
    10: 30
  }
  return discounts[level] || 0
}
