export type CameraStatus = 'active' | 'inactive' | 'error';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Camera {
  id: string;
  name: string;
  location: string;
  rtsp_url: string;
  status: CameraStatus;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  zones?: Zone[];
}

export interface Zone {
  id: string;
  camera_id: string;
  name: string;
  risk_level: RiskLevel;
  coordinates: { x: number; y: number; width: number; height: number };
  created_at: string;
}

export interface SecurityEvent {
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
}

export interface Alert {
  id: string;
  event_id: string | null;
  camera_id: string | null;
  camera_name: string;
  event_type: string;
  zone: string;
  risk_level: RiskLevel;
  confidence: number;
  is_read: boolean;
  timestamp: string;
  created_at: string;
}

export interface MLIngestPayload {
  camera_id: string;
  event_type: string;
  zone: string;
  duration?: number;
  confidence: number;
  timestamp: string;
}

export interface DashboardStats {
  totalCameras: number;
  activeCameras: number;
  alertsToday: number;
  highRiskAlerts: number;
  unreadAlerts: number;
}
