-- Gamification Tables for Finance Tracker

-- User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  months_positive INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_pt TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_pt TEXT NOT NULL,
  icon TEXT NOT NULL,
  points INTEGER NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Monthly Performance Table
CREATE TABLE IF NOT EXISTS monthly_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  income DECIMAL(10, 2) DEFAULT 0,
  expenses DECIMAL(10, 2) DEFAULT 0,
  savings DECIMAL(10, 2) DEFAULT 0,
  savings_rate DECIMAL(5, 2) DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  was_positive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view all stats" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Users can insert own stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view all achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for monthly_performance
CREATE POLICY "Users can view own performance" ON monthly_performance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own performance" ON monthly_performance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own performance" ON monthly_performance FOR UPDATE USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO achievements (code, name_en, name_pt, description_en, description_pt, icon, points, category) VALUES
  ('first_expense', 'First Step', 'Primeiro Passo', 'Add your first expense', 'Adicione sua primeira despesa', '🎯', 10, 'beginner'),
  ('first_income', 'Money Maker', 'Gerador de Renda', 'Record your first income', 'Registre sua primeira receita', '💰', 10, 'beginner'),
  ('positive_month', 'In the Green', 'No Azul', 'Finish a month with positive savings', 'Termine um mês com economia positiva', '✅', 50, 'savings'),
  ('streak_3', 'Hot Streak', 'Sequência Quente', 'Maintain positive savings for 3 months', 'Mantenha economia positiva por 3 meses', '🔥', 100, 'streak'),
  ('streak_6', 'Half Year Hero', 'Herói do Semestre', 'Maintain positive savings for 6 months', 'Mantenha economia positiva por 6 meses', '⭐', 250, 'streak'),
  ('streak_12', 'Year Champion', 'Campeão do Ano', 'Maintain positive savings for 12 months', 'Mantenha economia positiva por 12 meses', '🏆', 500, 'streak'),
  ('saver_1000', 'Thousand Club', 'Clube dos Mil', 'Save $1,000 in a single month', 'Economize $1.000 em um único mês', '💎', 150, 'savings'),
  ('saver_5000', 'Five Grand', 'Cinco Mil', 'Save $5,000 in a single month', 'Economize $5.000 em um único mês', '💍', 300, 'savings'),
  ('budget_master', 'Budget Master', 'Mestre do Orçamento', 'Maintain 50/30/20 budget for 3 months', 'Mantenha orçamento 50/30/20 por 3 meses', '📊', 200, 'budget'),
  ('frugal_hero', 'Frugal Hero', 'Herói Frugal', 'Reduce expenses by 20% compared to previous month', 'Reduza despesas em 20% comparado ao mês anterior', '🦸', 100, 'savings'),
  ('level_5', 'Rising Star', 'Estrela em Ascensão', 'Reach level 5', 'Alcance o nível 5', '🌟', 50, 'level'),
  ('level_10', 'Financial Guru', 'Guru Financeiro', 'Reach level 10', 'Alcance o nível 10', '🧙', 100, 'level'),
  ('consistent_tracker', 'Consistent Tracker', 'Rastreador Consistente', 'Log expenses for 30 consecutive days', 'Registre despesas por 30 dias consecutivos', '📅', 75, 'habit'),
  ('debt_free', 'Debt Free', 'Livre de Dívidas', 'Maintain positive balance for 3 months', 'Mantenha saldo positivo por 3 meses', '🎊', 200, 'savings');

-- Create indexes for better performance
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_user_stats_total_points ON user_stats(total_points DESC);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_monthly_performance_user_id ON monthly_performance(user_id);
CREATE INDEX idx_monthly_performance_month ON monthly_performance(month);
