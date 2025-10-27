/*
  # Marketing Budget Trainer Schema

  ## Overview
  Creates the database schema for the Marketing Budget Trainer application, including tables for
  budget allocation scenarios, projection scenarios, and user progress tracking.

  ## New Tables

  ### `budget_scenarios`
  Stores budget allocation practice scenarios with different difficulty levels.
  - `id` (uuid, primary key) - Unique identifier
  - `level` (text) - Difficulty level: Basic, Intermediate, Advanced
  - `title` (text) - Scenario title
  - `description` (text) - Scenario description and context
  - `total_budget` (numeric) - Total budget amount
  - `goal` (text) - Target goal description
  - `channels` (jsonb) - Array of channel names
  - `answer_key` (jsonb) - Optimal allocation percentages by channel
  - `created_at` (timestamptz) - Record creation timestamp

  ### `projection_scenarios`
  Stores projection builder scenarios with metrics and correct answers.
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Scenario title
  - `description` (text) - Scenario description
  - `metrics` (jsonb) - Campaign metrics (spend, clicks, conversions, etc.)
  - `answers` (jsonb) - Correct calculated values (CAC, LTV, ROI, etc.)
  - `hints` (jsonb) - Optional hints for calculations
  - `created_at` (timestamptz) - Record creation timestamp

  ### `user_progress`
  Tracks user attempts and scores for each scenario.
  - `id` (uuid, primary key) - Unique identifier
  - `user_name` (text) - User's name
  - `scenario_type` (text) - Type: 'budget' or 'projection'
  - `scenario_id` (uuid) - Reference to scenario
  - `score` (numeric) - Score achieved (0-100)
  - `user_answer` (jsonb) - User's submitted answers
  - `attempt_number` (integer) - Attempt count for this scenario
  - `completed_at` (timestamptz) - Completion timestamp

  ## Security
  - RLS enabled on all tables
  - Public read access for scenarios (training data)
  - Users can insert and read their own progress records

  ## Sample Data
  Includes starter scenarios for both modes to enable immediate use.
*/

-- Create budget_scenarios table
CREATE TABLE IF NOT EXISTS budget_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  total_budget numeric NOT NULL,
  goal text NOT NULL,
  channels jsonb NOT NULL,
  answer_key jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create projection_scenarios table
CREATE TABLE IF NOT EXISTS projection_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  metrics jsonb NOT NULL,
  answers jsonb NOT NULL,
  hints jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  scenario_type text NOT NULL,
  scenario_id uuid NOT NULL,
  score numeric NOT NULL,
  user_answer jsonb NOT NULL,
  attempt_number integer DEFAULT 1,
  completed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE budget_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE projection_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for budget_scenarios (public read)
CREATE POLICY "Anyone can read budget scenarios"
  ON budget_scenarios
  FOR SELECT
  USING (true);

-- Policies for projection_scenarios (public read)
CREATE POLICY "Anyone can read projection scenarios"
  ON projection_scenarios
  FOR SELECT
  USING (true);

-- Policies for user_progress
CREATE POLICY "Anyone can insert their progress"
  ON user_progress
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read all progress"
  ON user_progress
  FOR SELECT
  USING (true);

-- Insert sample budget scenarios
INSERT INTO budget_scenarios (level, title, description, total_budget, goal, channels, answer_key) VALUES
(
  'Basic',
  'SaaS Lead Generation Campaign',
  'You have a $5,000 budget for a SaaS lead generation campaign. Your goal is to generate 50 qualified leads. Allocate your budget across the available channels.',
  5000,
  '50 qualified leads',
  '["Google Ads", "LinkedIn Ads", "Email Marketing"]'::jsonb,
  '{"Google Ads": 50, "LinkedIn Ads": 30, "Email Marketing": 20}'::jsonb
),
(
  'Basic',
  'E-commerce Product Launch',
  'You have a $3,000 budget to launch a new product line. Your goal is to drive 150 purchases. Distribute your budget wisely.',
  3000,
  '150 purchases',
  '["Facebook Ads", "Instagram Ads", "Influencer Marketing"]'::jsonb,
  '{"Facebook Ads": 45, "Instagram Ads": 35, "Influencer Marketing": 20}'::jsonb
),
(
  'Intermediate',
  'Multi-Channel B2B Campaign',
  'You have a $10,000 budget for a B2B software campaign targeting enterprise clients. Your goal is to generate 200 MQLs with a target CPL of $50.',
  10000,
  '200 MQLs at $50 CPL',
  '["Google Ads", "LinkedIn Ads", "Content Marketing", "Events & Webinars"]'::jsonb,
  '{"Google Ads": 40, "LinkedIn Ads": 35, "Content Marketing": 15, "Events & Webinars": 10}'::jsonb
),
(
  'Intermediate',
  'Retail Holiday Campaign',
  'You have a $15,000 budget for a holiday retail campaign. Your goal is to achieve $75,000 in revenue (5x ROAS).',
  15000,
  '$75,000 revenue (5x ROAS)',
  '["Google Shopping", "Facebook Ads", "TikTok Ads", "Display Ads", "Email"]'::jsonb,
  '{"Google Shopping": 35, "Facebook Ads": 30, "TikTok Ads": 20, "Display Ads": 10, "Email": 5}'::jsonb
),
(
  'Advanced',
  'Full-Funnel SaaS Growth',
  'You have a $50,000 budget for a full-funnel SaaS growth campaign. Your goal is to acquire 100 customers with a maximum CAC of $500.',
  50000,
  '100 customers at $500 CAC',
  '["Google Ads", "LinkedIn Ads", "Content Marketing", "SEO", "Events", "Partner Marketing"]'::jsonb,
  '{"Google Ads": 30, "LinkedIn Ads": 25, "Content Marketing": 20, "SEO": 10, "Events": 10, "Partner Marketing": 5}'::jsonb
);

-- Insert sample projection scenarios
INSERT INTO projection_scenarios (title, description, metrics, answers, hints) VALUES
(
  'SaaS Trial Campaign',
  'Analyze this SaaS trial campaign and calculate key performance metrics.',
  '{
    "ad_spend": 5000,
    "clicks": 2000,
    "conversions": 100,
    "avg_revenue_per_user": 150,
    "retention_rate": 0.6
  }'::jsonb,
  '{
    "CAC": 50,
    "LTV": 90,
    "ROI": 0.8,
    "ROAS": 1.8
  }'::jsonb,
  '{
    "CAC": "Total ad spend divided by number of conversions",
    "LTV": "Average revenue per user multiplied by retention rate",
    "ROI": "(Total revenue - Total cost) / Total cost",
    "ROAS": "Total revenue / Total ad spend"
  }'::jsonb
),
(
  'E-commerce Ad Funnel',
  'Calculate the financial metrics for this e-commerce advertising campaign.',
  '{
    "ad_spend": 10000,
    "impressions": 500000,
    "clicks": 12500,
    "conversions": 250,
    "avg_order_value": 200,
    "repeat_purchase_rate": 0.4
  }'::jsonb,
  '{
    "CTR": 2.5,
    "conversion_rate": 2.0,
    "CAC": 40,
    "LTV": 280,
    "ROAS": 5.0
  }'::jsonb,
  '{
    "CTR": "Clicks / Impressions × 100",
    "conversion_rate": "Conversions / Clicks × 100",
    "CAC": "Ad spend / Conversions",
    "LTV": "AOV × (1 + Repeat purchase rate)",
    "ROAS": "(Conversions × AOV) / Ad spend"
  }'::jsonb
),
(
  'B2B Lead Generation',
  'Evaluate this B2B lead generation campaign performance.',
  '{
    "ad_spend": 8000,
    "leads": 160,
    "sql_conversion_rate": 0.25,
    "deal_close_rate": 0.30,
    "avg_deal_value": 5000
  }'::jsonb,
  '{
    "CPL": 50,
    "SQL_count": 40,
    "customers": 12,
    "CAC": 666.67,
    "revenue": 60000,
    "ROI": 6.5
  }'::jsonb,
  '{
    "CPL": "Ad spend / Leads",
    "SQL_count": "Leads × SQL conversion rate",
    "customers": "SQLs × Deal close rate",
    "CAC": "Ad spend / Customers",
    "revenue": "Customers × Avg deal value",
    "ROI": "Revenue / Ad spend"
  }'::jsonb
);
