# Income Tracking Setup

## Database Setup

Run this SQL in your Supabase SQL Editor to create the income table:

```sql
-- Create income table
create table income (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount decimal not null,
  currency text not null default 'USD',
  source text not null,
  description text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table income enable row level security;

-- Create policy to allow users to see only their own income
create policy "Users can view their own income"
  on income for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own income
create policy "Users can insert their own income"
  on income for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own income
create policy "Users can update their own income"
  on income for update
  using (auth.uid() = user_id);

-- Create policy to allow users to delete their own income
create policy "Users can delete their own income"
  on income for delete
  using (auth.uid() = user_id);

-- Create user settings table for default currency
create table user_settings (
  user_id uuid references auth.users primary key,
  default_currency text not null default 'USD',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table user_settings enable row level security;

-- Create policies for user settings
create policy "Users can view their own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update
  using (auth.uid() = user_id);
```

After running this SQL, the income tracking feature will be fully functional.
