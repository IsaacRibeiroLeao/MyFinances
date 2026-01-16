# 🎮 Gamification System - Finance Tracker

## Overview

The Finance Tracker now includes a complete gamification system that makes managing your finances fun and engaging! Earn points, unlock achievements, climb the leaderboard, and maintain streaks by keeping your finances healthy.

## 🌟 Features

### 1. **Points & Levels**
- Earn points based on your financial performance each month
- Level up as you accumulate more points
- Points are awarded for:
  - Maintaining positive savings (50 points base)
  - High savings rate (up to 100 bonus points)
  - Large savings amounts (up to 150 bonus points)
  - Improving over previous month (up to 50 bonus points)

### 2. **Achievements System**
14 unique achievements to unlock:

**Beginner Achievements:**
- 🎯 **First Step** - Add your first expense (10 points)
- 💰 **Money Maker** - Record your first income (10 points)

**Savings Achievements:**
- ✅ **In the Green** - Finish a month with positive savings (50 points)
- 💎 **Thousand Club** - Save $1,000 in a single month (150 points)
- 💍 **Five Grand** - Save $5,000 in a single month (300 points)
- 🦸 **Frugal Hero** - Reduce expenses by 20% vs previous month (100 points)
- 🎊 **Debt Free** - Maintain positive balance for 3 months (200 points)

**Streak Achievements:**
- 🔥 **Hot Streak** - 3 months of positive savings (100 points)
- ⭐ **Half Year Hero** - 6 months of positive savings (250 points)
- 🏆 **Year Champion** - 12 months of positive savings (500 points)

**Budget Achievements:**
- 📊 **Budget Master** - Maintain 50/30/20 budget for 3 months (200 points)

**Level Achievements:**
- 🌟 **Rising Star** - Reach level 5 (50 points)
- 🧙 **Financial Guru** - Reach level 10 (100 points)

**Habit Achievements:**
- 📅 **Consistent Tracker** - Log expenses for 30 consecutive days (75 points)

### 3. **Leaderboard**
- Global rankings based on total points
- See your rank compared to other users
- Real-time updates
- Top 3 players get special badges:
  - 👑 1st Place - Gold Crown
  - 🥈 2nd Place - Silver Medal
  - 🥉 3rd Place - Bronze Award

### 4. **Streaks**
- Track consecutive months with positive savings
- Current streak vs longest streak
- Streak counter displayed prominently
- 🔥 Fire emoji indicator for active streaks

### 5. **Stats Dashboard**
- Level and XP progress bar
- Total points accumulated
- Current streak counter
- Months with positive savings
- Best streak achieved

## 🚀 Setup Instructions

### Step 1: Database Setup

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the entire content from `GAMIFICATION_SETUP.sql`
4. Run the SQL script to create all necessary tables:
   - `user_stats` - Stores user points, levels, and streaks
   - `achievements` - Defines all available achievements
   - `user_achievements` - Tracks which achievements users have unlocked
   - `monthly_performance` - Records monthly financial performance

### Step 2: Verify Tables

After running the SQL script, verify that the following tables exist:
- ✅ user_stats
- ✅ achievements
- ✅ user_achievements
- ✅ monthly_performance

### Step 3: Check Achievements Data

The script automatically inserts 14 default achievements. Verify they were created:

```sql
SELECT * FROM achievements;
```

You should see all 14 achievements with both English and Portuguese names.

### Step 4: Test the System

1. Start your development server: `npm run dev`
2. Log in to your account
3. Add some expenses and income
4. Navigate to the 🏆 Leaderboard tab
5. Navigate to the 🏅 Achievements tab
6. Watch for achievement unlock notifications!

## 📊 How Points Are Calculated

### Monthly Points Formula:

```
Base Points (if savings > 0): 50 points

Savings Rate Bonus:
- ≥20%: +100 points
- ≥15%: +75 points
- ≥10%: +50 points
- ≥5%: +25 points

Savings Amount Bonus:
- ≥$5,000: +150 points
- ≥$1,000: +75 points
- ≥$500: +30 points

Improvement Bonus (vs previous month):
- ≥20% improvement: +50 points
- ≥10% improvement: +25 points

Penalty:
- Negative savings: -25 points (minimum 0)
```

### Level Calculation:

```
Level = floor(sqrt(totalPoints / 100)) + 1
```

Examples:
- 0-99 points = Level 1
- 100-399 points = Level 2
- 400-899 points = Level 3
- 900-1599 points = Level 4
- 1600-2499 points = Level 5

## 🎯 Tips to Maximize Points

1. **Maintain Positive Savings** - Always try to earn more than you spend
2. **Aim for 20%+ Savings Rate** - This gives you the maximum savings rate bonus
3. **Consistency is Key** - Build up your streak for achievement bonuses
4. **Track Regularly** - Add expenses and income consistently
5. **Improve Monthly** - Try to save more each month for improvement bonuses
6. **Set Goals** - Work towards specific achievements for extra motivation

## 🌐 Multilingual Support

All gamification features are fully translated:
- 🇺🇸 English
- 🇧🇷 Portuguese

Toggle between languages using the 🌐 button in the header.

## 🔧 Customization

### Adding New Achievements

To add new achievements, insert them into the `achievements` table:

```sql
INSERT INTO achievements (code, name_en, name_pt, description_en, description_pt, icon, points, category)
VALUES (
  'your_code',
  'English Name',
  'Nome em Português',
  'English description',
  'Descrição em português',
  '🎯',
  100,
  'category'
);
```

Then update the `checkAchievements` function in `src/lib/gamification.js` to include the logic for unlocking it.

### Adjusting Point Values

Edit the `calculateMonthlyPoints` function in `src/lib/gamification.js` to adjust:
- Base points for positive savings
- Savings rate thresholds and bonuses
- Savings amount thresholds and bonuses
- Improvement bonuses
- Penalties

## 🐛 Troubleshooting

### Achievements Not Unlocking
- Check that the SQL script ran successfully
- Verify the `achievements` table has data
- Check browser console for errors
- Ensure user_stats was initialized for your user

### Leaderboard Empty
- Make sure other users have added expenses/income
- Check that user_stats table has entries
- Verify RLS policies are set correctly

### Points Not Updating
- Check that monthly_performance is being updated
- Verify the updateMonthlyPerformance function is being called
- Look for errors in the browser console

## 📱 Mobile Responsive

All gamification components are fully responsive and work great on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers

## 🎨 UI Components

### GamificationStatus (Compact)
- Displayed at the top of the dashboard
- Shows level, points, and current streak
- Quick overview of your progress

### Leaderboard
- Full rankings page
- Top 10 players displayed
- Your rank highlighted
- Real-time updates

### Achievements
- Grid layout of all achievements
- Locked/unlocked states
- Progress bar showing completion percentage
- Category badges and point values

### Achievement Notifications
- Pop-up when you unlock an achievement
- Animated entrance
- Shows achievement icon, name, and points
- Auto-dismisses after 5 seconds

## 🎉 Have Fun!

The gamification system is designed to make financial tracking more engaging and rewarding. Compete with friends, unlock all achievements, and become a financial champion! 🏆

---

**Need Help?** Check the main README.md or open an issue on GitHub.
