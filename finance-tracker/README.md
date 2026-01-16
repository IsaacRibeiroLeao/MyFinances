# Finance Tracker - Smart Spending Insights

A modern web application for tracking personal finances with AI-powered insights using Google's Gemini AI.

## Features

- 🔐 **Secure Authentication** - Login and registration with Supabase authentication
- 💰 **Expense Tracking** - Manually add expenses or bulk import via CSV
- 📊 **Visual Analytics** - Interactive charts showing monthly spending and category breakdowns
- 📅 **Calendar View** - Track spending trends over time
- 🤖 **AI Insights** - Get personalized recommendations to reduce spending using Gemini AI
- 📈 **Monthly Comparisons** - See how your spending changes month-to-month

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run this SQL to create the expenses table:

```sql
-- Create expenses table
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount decimal not null,
  category text not null,
  description text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table expenses enable row level security;

-- Create policy to allow users to see only their own expenses
create policy "Users can view their own expenses"
  on expenses for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own expenses
create policy "Users can insert their own expenses"
  on expenses for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own expenses
create policy "Users can update their own expenses"
  on expenses for update
  using (auth.uid() = user_id);

-- Create policy to allow users to delete their own expenses
create policy "Users can delete their own expenses"
  on expenses for delete
  using (auth.uid() = user_id);
```

4. Get your Supabase URL and anon key from **Project Settings > API**

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GEMINI_API_KEY=AIzaSyCDZPyjBJiwas_S9WM534r-u2PSj-bARd0
```

Replace the Supabase values with your actual credentials.

### 4. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## CSV Import Format

To import expenses via CSV, your file should have these columns:

- `amount` - The expense amount (e.g., 45.99)
- `category` - Category name (e.g., "Food & Dining")
- `date` - Date in YYYY-MM-DD format (e.g., 2025-01-15)
- `description` - Optional description

Example CSV:
```csv
amount,category,date,description
45.99,Food & Dining,2025-01-15,Lunch at restaurant
120.00,Bills & Utilities,2025-01-10,Electric bill
25.50,Transportation,2025-01-12,Gas
```

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Authentication and database
- **Google Gemini AI** - AI-powered insights
- **Recharts** - Data visualization
- **React Router** - Navigation
- **Papa Parse** - CSV parsing

## Security Notes

⚠️ **Important**: The `.env` file contains sensitive API keys and should never be committed to version control. It's already included in `.gitignore`.
