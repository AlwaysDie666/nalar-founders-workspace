export type UserRole = 'ceo' | 'cto' | 'cpo' | 'cmo' | 'cfo' | 'coo' | 'kreatif';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive?: boolean;
  needsPasswordChange?: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  needs_password_change?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: User;
  dueDate?: Date;
  createdAt: Date;
  tags?: string[];
  subtasks?: Subtask[];
  comments?: Comment[];
}

export interface Milestone {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  progress: number;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  spent?: number;
  team: User[];
  milestones?: Milestone[];
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  timestamp: Date;
  channel: string;
  reactions?: { emoji: string; users: User[] }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'deadline' | 'event' | 'reminder';
  attendees?: User[];
}

export interface KPI {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
}
