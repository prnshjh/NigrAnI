export interface Database {
  public: {
    Tables: {
      cameras: {
        Row: {
          id: string;
          name: string;
          location: string;
          rtsp_url: string;
          status: 'active' | 'inactive' | 'error';
          thumbnail_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string;
          rtsp_url?: string;
          status?: 'active' | 'inactive' | 'error';
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          rtsp_url?: string;
          status?: 'active' | 'inactive' | 'error';
          thumbnail_url?: string | null;
          updated_at?: string;
        };
      };
      zones: {
        Row: {
          id: string;
          camera_id: string;
          name: string;
          risk_level: 'low' | 'medium' | 'high';
          coordinates: { x: number; y: number; width: number; height: number };
          created_at: string;
        };
        Insert: {
          id?: string;
          camera_id: string;
          name: string;
          risk_level?: 'low' | 'medium' | 'high';
          coordinates?: { x: number; y: number; width: number; height: number };
          created_at?: string;
        };
        Update: {
          name?: string;
          risk_level?: 'low' | 'medium' | 'high';
          coordinates?: { x: number; y: number; width: number; height: number };
        };
      };
      events: {
        Row: {
          id: string;
          camera_id: string;
          camera_uuid: string | null;
          event_type: string;
          zone: string;
          duration: number;
          confidence: number;
          timestamp: string;
          raw_payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          camera_id: string;
          camera_uuid?: string | null;
          event_type: string;
          zone?: string;
          duration?: number;
          confidence?: number;
          timestamp?: string;
          raw_payload?: Record<string, unknown>;
          created_at?: string;
        };
        Update: never;
      };
      alerts: {
        Row: {
          id: string;
          event_id: string | null;
          camera_id: string | null;
          camera_name: string;
          event_type: string;
          zone: string;
          risk_level: 'low' | 'medium' | 'high';
          confidence: number;
          is_read: boolean;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          camera_id?: string | null;
          camera_name?: string;
          event_type: string;
          zone?: string;
          risk_level?: 'low' | 'medium' | 'high';
          confidence?: number;
          is_read?: boolean;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
    };
  };
}
