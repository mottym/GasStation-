export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'super_admin' | 'company_admin' | 'attendant' | 'customer';
export type InvoiceStatus = 'draft' | 'sent' | 'failed';
export type FuelType = 'regular' | 'midgrade' | 'premium' | 'diesel' | 'other';

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          billing_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          billing_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };
      stations: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          address: string | null;
          default_price_per_gallon: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          address?: string | null;
          default_price_per_gallon?: number;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['stations']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          billing_email: string;
          billing_address: string | null;
          weekly_invoice_day: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          billing_email: string;
          billing_address?: string | null;
          weekly_invoice_day?: number;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          company_id: string | null;
          customer_id: string | null;
          station_id: string | null;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          company_id?: string | null;
          customer_id?: string | null;
          station_id?: string | null;
          full_name?: string | null;
          phone?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      vehicles: {
        Row: {
          id: string;
          customer_id: string;
          company_id: string;
          license_plate: string;
          license_plate_normalized: string;
          make: string | null;
          model: string | null;
          year: number | null;
          fuel_type: FuelType;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          company_id: string;
          license_plate: string;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          fuel_type?: FuelType;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
      };
      fuelings: {
        Row: {
          id: string;
          company_id: string;
          station_id: string;
          attendant_id: string;
          vehicle_id: string;
          customer_id: string;
          driver_name: string | null;
          driver_id: string | null;
          gallons: number;
          price_per_gallon: number;
          total_cents: number;
          fuel_type: FuelType;
          odometer: number | null;
          pump_photo_path: string | null;
          signature_path: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          station_id: string;
          attendant_id: string;
          vehicle_id: string;
          customer_id: string;
          driver_name?: string | null;
          gallons: number;
          price_per_gallon: number;
          fuel_type?: FuelType;
          odometer?: number | null;
          pump_photo_path?: string | null;
          signature_path?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['fuelings']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          customer_id: string;
          company_id: string;
          period_start: string;
          period_end: string;
          total_cents: number;
          pdf_path: string | null;
          status: InvoiceStatus;
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          company_id: string;
          period_start: string;
          period_end: string;
          total_cents?: number;
          pdf_path?: string | null;
          status?: InvoiceStatus;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      drivers: {
        Row: {
          id: string;
          customer_id: string;
          name: string;
          phone: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          name: string;
          phone?: string | null;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['drivers']['Insert']>;
      };
      invoice_items: {
        Row: { invoice_id: string; fueling_id: string };
        Insert: { invoice_id: string; fueling_id: string };
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>;
      };
    };
    Functions: {
      lookup_vehicle_by_plate: {
        Args: { p_plate: string; p_company_id: string };
        Returns: {
          vehicle_id: string;
          license_plate: string;
          make: string | null;
          model: string | null;
          customer_id: string;
          customer_name: string;
        }[];
      };
      company_fueling_stats: {
        Args: { p_company_id: string; p_since?: string };
        Returns: {
          total_gallons: number;
          total_cents: number;
          fueling_count: number;
        }[];
      };
    };
  };
}
