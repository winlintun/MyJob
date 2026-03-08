export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

export interface Job {
  id: number;
  user_id: number;
  name: string;
  hourly_rate: number;
  hours_per_day: number;
  color: string;
}

export interface IncomeRecord {
  id: number;
  user_id: number;
  job_id: number;
  job_name?: string;
  date: string;
  amount: number;
}

export interface Target {
  id: number;
  user_id: number;
  month: string;
  amount: number;
}
