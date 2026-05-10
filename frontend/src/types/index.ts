/**
 * Tipos das entidades principais do Framily.
 * Mantidos sincronizados com os Resources do backend.
 *
 * Endpoints reais são implementados nas Fases 2+; estes tipos servem como
 * contrato de design enquanto a API ainda não retorna dados.
 */

export type Role = 'owner' | 'admin' | 'adult' | 'child';

export type DifficultyKey = 'easy' | 'medium' | 'hard' | 'challenge';

export type MissionType =
  | 'single_task'
  | 'recurring_task'
  | 'streak'
  | 'count'
  | 'collective'
  | 'custom';

export type PointStatus = 'pending' | 'confirmed' | 'cancelled';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue';

export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'specific_dates';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  name: string;
  email: string | null;
  role: Role;
  locale: string;
  avatar_url: string | null;
  is_active: boolean;
}

export interface Household {
  id: number;
  name: string;
  slug: string;
  invite_code: string;
  owner_id: number;
}

export interface HouseholdMember {
  id: number;
  household_id: number;
  user_id: number;
  role: Role;
  user: User;
}

export interface DifficultyPreset {
  id: number;
  key: DifficultyKey;
  name_key: string;
  base_points: number;
  color: string | null;
  household_id: number | null;
}

export interface Task {
  id: number;
  household_id: number;
  title: string;
  description: string | null;
  difficulty: DifficultyPreset;
  priority: 'low' | 'normal' | 'high';
  frequency: TaskFrequency;
  frequency_days: number[];
  frequency_dates: string[];
  status: TaskStatus;
  due_at: string | null;
  completed_at: string | null;
  assignees: User[];
  requires_approval?: boolean;
  pending_completions_count?: number;
  points_for_completion?: number;
  last_completion?: TaskCompletion;
}

export interface TaskCompletion {
  id: number;
  task_id: number;
  completed_by_user_id: number;
  completed_at: string;
  status: ApprovalStatus;
  approved_by_user_id: number | null;
  approved_at: string | null;
  points_awarded: number;
  note: string | null;
  completed_by?: User;
}

export interface MissionTemplate {
  id: number;
  key: string;
  name_key: string;
  description_key: string | null;
  mission_type: MissionType;
  difficulty: DifficultyPreset;
  default_target: number | null;
  default_frequency: string | null;
  is_collective: boolean;
}

export interface Mission {
  id: number;
  household_id: number;
  template_id: number | null;
  name: string;
  description: string | null;
  mission_type: MissionType;
  difficulty: DifficultyPreset;
  points_override: number | null;
  points_for_completion?: number;
  frequency: string | null;
  start_at: string | null;
  end_at: string | null;
  target_value: number | null;
  current_value: number | null;
  requires_approval: boolean;
  is_collective: boolean;
  status: 'active' | 'completed' | 'cancelled';
  reward_id: number | null;
  participants: User[];
}

export interface PointTransaction {
  id: number;
  user_id: number;
  household_id: number;
  source_type: 'task' | 'mission' | 'reward' | 'manual';
  source_id: number | null;
  points: number;
  status: PointStatus;
  reason_key: string | null;
  created_at: string;
}

export interface Reward {
  id: number;
  household_id: number;
  name: string;
  description: string | null;
  points_cost: number;
  stock: number | null;
  requires_approval: boolean;
  image: string | null;
  is_active: boolean;
  is_available?: boolean;
  pending_redemptions_count?: number;
}

export type RedemptionStatus = 'pending' | 'approved' | 'denied' | 'delivered' | 'cancelled';

export interface RewardRedemption {
  id: number;
  reward_id: number;
  household_id: number;
  requested_by_user_id: number;
  status: RedemptionStatus;
  approved_by_user_id: number | null;
  approved_at: string | null;
  points_spent: number;
  note: string | null;
  created_at: string;
  reward?: Reward;
  requested_by?: User;
}

export interface RankingEntry {
  position: number;
  user_id: number;
  name: string;
  role: Role;
  avatar_url: string | null;
  points: number;
}

export interface Achievement {
  id: number;
  key: string;
  name_key: string;
  description_key: string;
  icon: string | null;
}

export interface AchievementWithStatus {
  id: number;
  key: string;
  name_key: string;
  description_key: string | null;
  icon: string | null;
  criteria: Record<string, unknown> | null;
  unlocked: boolean;
  unlocked_at: string | null;
}

export type ReminderStatus = 'scheduled' | 'sent' | 'cancelled';

export interface Reminder {
  id: number;
  household_id: number;
  title: string;
  body: string | null;
  remind_at: string;
  related_type: string | null;
  related_id: number | null;
  status: ReminderStatus;
  created_by_user_id: number;
}

export type BillStatus = 'open' | 'paid' | 'overdue';

export interface BillSplit {
  id: number;
  bill_id: number;
  user_id: number;
  share_amount: number;
  status: 'pending' | 'paid';
  paid_at: string | null;
  user?: User;
}

export interface Bill {
  id: number;
  household_id: number;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  category: string | null;
  status: BillStatus;
  paid_at: string | null;
  splits?: BillSplit[];
}

export interface ShoppingItem {
  id: number;
  shopping_list_id: number;
  name: string;
  quantity: number;
  category: string | null;
  status: 'open' | 'bought';
  bought_by_user_id: number | null;
  bought_at: string | null;
}

export interface ShoppingList {
  id: number;
  household_id: number;
  name: string;
  status: 'open' | 'archived';
  allow_children: boolean;
  created_by_user_id: number;
  items_count?: number;
  open_items_count?: number;
  items?: ShoppingItem[];
}

export type CalendarEventType = 'task' | 'mission' | 'reminder' | 'bill';

export interface CalendarEvent {
  type: CalendarEventType;
  id: number;
  title: string;
  date: string;
  status: string;
  meta: Record<string, unknown>;
}

export interface CalendarResponse {
  from: string;
  to: string;
  types: CalendarEventType[];
  events: CalendarEvent[];
}

export interface ApiError {
  error: {
    code: string;
    message_key?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
}
