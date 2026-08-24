export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: string;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: string;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          assignee_id: string | null;
          created_by: string | null;
          project_id: string | null;
          due_date: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assignee_id?: string | null;
          created_by?: string | null;
          project_id?: string | null;
          due_date?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assignee_id?: string | null;
          created_by?: string | null;
          project_id?: string | null;
          due_date?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: string;
          progress: number;
          start_date: string;
          end_date: string | null;
          budget: number | null;
          spent: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: string;
          progress?: number;
          start_date: string;
          end_date?: string | null;
          budget?: number | null;
          spent?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          progress?: number;
          start_date?: string;
          end_date?: string | null;
          budget?: number | null;
          spent?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          content: string;
          sender_id: string | null;
          channel: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          sender_id?: string | null;
          channel?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          sender_id?: string | null;
          channel?: string;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          type: string;
          amount: number;
          category: string;
          description: string | null;
          transaction_date: string;
          status: string;
          created_by: string | null;
          approved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          amount: number;
          category: string;
          description?: string | null;
          transaction_date: string;
          status?: string;
          created_by?: string | null;
          approved_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          amount?: number;
          category?: string;
          description?: string | null;
          transaction_date?: string;
          status?: string;
          created_by?: string | null;
          approved_by?: string | null;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          client_name: string;
          client_email: string | null;
          client_address: string | null;
          subtotal: number;
          tax: number;
          total: number;
          status: string;
          issue_date: string;
          due_date: string;
          paid_date: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          client_name: string;
          client_email?: string | null;
          client_address?: string | null;
          subtotal: number;
          tax?: number;
          total: number;
          status?: string;
          issue_date: string;
          due_date: string;
          paid_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          client_name?: string;
          client_email?: string | null;
          client_address?: string | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          status?: string;
          issue_date?: string;
          due_date?: string;
          paid_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          type: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          type?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          type?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
