export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          full_name: string;
          phone_primary: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone_primary: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          receipt_number: string | null;
          customer_id: string;
          status: string;
          grand_total: string;
          balance_due: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          receipt_number?: string | null;
          customer_id: string;
          status: string;
          grand_total: string;
          balance_due: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_receipt_number: {
        Args: { p_prefix: string; p_year: number; p_starting_serial?: number };
        Returns: string;
      };
      create_order_from_payload: {
        Args: { p_payload: Json };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
