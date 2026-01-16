-- Financial Goals Tables for Finance Tracker

-- Goals Table
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  deadline DATE,
  category TEXT NOT NULL, -- wedding, house, car, vacation, emergency_fund, education, retirement, other
  priority TEXT DEFAULT 'medium', -- low, medium, high
  status TEXT DEFAULT 'active', -- active, completed, paused, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Goal Contributions Table
CREATE TABLE IF NOT EXISTS goal_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES financial_goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  contribution_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal Milestones Table
CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES financial_goals(id) ON DELETE CASCADE NOT NULL,
  percentage INTEGER NOT NULL, -- 25, 50, 75, 100
  reached_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_goals
CREATE POLICY "Users can view own goals" ON financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON financial_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goal_contributions
CREATE POLICY "Users can view own contributions" ON goal_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contributions" ON goal_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contributions" ON goal_contributions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contributions" ON goal_contributions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goal_milestones
CREATE POLICY "Users can view milestones for own goals" ON goal_milestones FOR SELECT 
  USING (EXISTS (SELECT 1 FROM financial_goals WHERE financial_goals.id = goal_milestones.goal_id AND financial_goals.user_id = auth.uid()));
CREATE POLICY "Users can insert milestones for own goals" ON goal_milestones FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM financial_goals WHERE financial_goals.id = goal_milestones.goal_id AND financial_goals.user_id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_financial_goals_status ON financial_goals(status);
CREATE INDEX idx_financial_goals_deadline ON financial_goals(deadline);
CREATE INDEX idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX idx_goal_contributions_user_id ON goal_contributions(user_id);
CREATE INDEX idx_goal_milestones_goal_id ON goal_milestones(goal_id);

-- Function to automatically update goal current_amount when contribution is added
CREATE OR REPLACE FUNCTION update_goal_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE financial_goals
  SET 
    current_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM goal_contributions
      WHERE goal_id = NEW.goal_id
    ),
    updated_at = NOW()
  WHERE id = NEW.goal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update goal amount on contribution insert
CREATE TRIGGER trigger_update_goal_amount
AFTER INSERT ON goal_contributions
FOR EACH ROW
EXECUTE FUNCTION update_goal_amount();

-- Function to check and mark milestones
CREATE OR REPLACE FUNCTION check_goal_milestones()
RETURNS TRIGGER AS $$
DECLARE
  goal_record RECORD;
  progress_percentage INTEGER;
BEGIN
  SELECT * INTO goal_record FROM financial_goals WHERE id = NEW.goal_id;
  
  IF goal_record.target_amount > 0 THEN
    progress_percentage := FLOOR((goal_record.current_amount / goal_record.target_amount) * 100);
    
    -- Check and mark milestones
    IF progress_percentage >= 25 THEN
      INSERT INTO goal_milestones (goal_id, percentage, reached_at)
      VALUES (NEW.goal_id, 25, NOW())
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF progress_percentage >= 50 THEN
      INSERT INTO goal_milestones (goal_id, percentage, reached_at)
      VALUES (NEW.goal_id, 50, NOW())
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF progress_percentage >= 75 THEN
      INSERT INTO goal_milestones (goal_id, percentage, reached_at)
      VALUES (NEW.goal_id, 75, NOW())
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF progress_percentage >= 100 THEN
      INSERT INTO goal_milestones (goal_id, percentage, reached_at)
      VALUES (NEW.goal_id, 100, NOW())
      ON CONFLICT DO NOTHING;
      
      -- Mark goal as completed
      UPDATE financial_goals
      SET status = 'completed', completed_at = NOW()
      WHERE id = NEW.goal_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check milestones after goal amount update
CREATE TRIGGER trigger_check_milestones
AFTER UPDATE OF current_amount ON financial_goals
FOR EACH ROW
EXECUTE FUNCTION check_goal_milestones();
