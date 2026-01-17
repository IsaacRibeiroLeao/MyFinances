import { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { LEVEL_SYSTEM, getLevelInfo, getBenefitDescription } from '../lib/levelSystem'

export default function LevelInfo({ userPoints, userLevel }) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  
  const levelInfo = getLevelInfo(userPoints)
  const { current, next, progressPercentage, pointsNeeded } = levelInfo

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Current Level Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">{current.icon}</div>
            <div>
              <p className="text-sm text-indigo-100">{t('currentLevel')}</p>
              <h3 className="text-2xl font-bold">{t(current.nameKey)}</h3>
              <p className="text-sm text-indigo-100">{t('level')} {userLevel}</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Progress to Next Level */}
        {userLevel < 10 && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{t('progressToNextLevel')}</span>
              <span>{pointsNeeded} {t('pointsNeeded')}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-indigo-100">
              <span>{current.pointsRequired} pts</span>
              <span className="font-bold">{Math.round(progressPercentage)}%</span>
              <span>{next.pointsRequired} pts</span>
            </div>
          </div>
        )}

        {userLevel === 10 && (
          <div className="mt-4 text-center">
            <p className="text-yellow-300 font-bold text-lg">🎉 {t('maxLevelReached')} 🎉</p>
          </div>
        )}
      </div>

      {/* Current Benefits */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <Info className="w-5 h-5 text-indigo-600" />
          <span>{t('yourBenefits')}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {current.benefits.map((benefit, index) => {
            const benefitInfo = getBenefitDescription(benefit)
            return (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                <span>{benefitInfo.icon}</span>
                <span>{t(benefitInfo.key)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* All Levels (Expanded) */}
      {expanded && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-4">{t('allLevels')}</h4>
          <div className="space-y-3">
            {Object.entries(LEVEL_SYSTEM).map(([level, info]) => {
              const levelNum = parseInt(level)
              const isUnlocked = userLevel >= levelNum
              const isCurrent = userLevel === levelNum
              
              return (
                <div
                  key={level}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-50'
                      : isUnlocked
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{info.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-bold text-gray-900">{t(info.nameKey)}</h5>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                              {t('current')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{t(info.description)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {info.pointsRequired} {t('pointsRequired')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Benefits */}
                  <div className="mt-3 pl-12">
                    <p className="text-xs font-semibold text-gray-700 mb-2">{t('benefits')}:</p>
                    <div className="flex flex-wrap gap-2">
                      {info.benefits.map((benefit, idx) => {
                        const benefitInfo = getBenefitDescription(benefit)
                        return (
                          <span
                            key={idx}
                            className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                          >
                            {benefitInfo.icon} {t(benefitInfo.key)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
