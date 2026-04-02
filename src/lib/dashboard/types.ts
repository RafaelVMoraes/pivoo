export type ActivityFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ActivityTimeOfDay = 'morning' | 'afternoon' | 'night' | 'whole_day';
export type GoalPriority = 'gold' | 'silver' | 'bronze';

export interface DashboardGoalSummary {
  id: string;
  title: string;
  priority: GoalPriority;
  start_date?: string;
}

export interface DashboardActivity {
  id: string;
  goal_id: string;
  title: string;
  status: 'active' | 'completed';
  frequency_type?: ActivityFrequency;
  days_of_week?: string[];
  day_of_month?: number;
  time_of_day?: ActivityTimeOfDay;
  created_at: string;
  end_date?: string;
  goal: DashboardGoalSummary;
}

export interface DashboardCheckIn {
  activity_id: string;
  date: string;
  progress_value: string;
}
