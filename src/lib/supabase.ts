import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface BudgetScenario {
  id: string;
  level: string;
  title: string;
  description: string;
  total_budget: number;
  goal: string;
  channels: string[];
  answer_key: Record<string, number>;
  created_at: string;
}

export interface ProjectionScenario {
  id: string;
  title: string;
  description: string;
  metrics: Record<string, number>;
  answers: Record<string, number>;
  hints: Record<string, string>;
  created_at: string;
}

export interface UserProgress {
  id?: string;
  user_name: string;
  scenario_type: 'budget' | 'projection';
  scenario_id: string;
  score: number;
  user_answer: Record<string, number>;
  attempt_number: number;
  completed_at?: string;
}
