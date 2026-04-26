import { supabase } from './supabase';

const EVENT_TYPES = ['LOITERING', 'INTRUSION', 'TAILGATING', 'CROWD_GATHERING', 'PERIMETER_BREACH', 'SUSPICIOUS_ACTIVITY', 'UNATTENDED_OBJECT'];
const ZONES = ['cash_counter', 'main_entrance', 'parking_lot', 'server_room', 'warehouse', 'lobby', 'exit_gate'];
const CAMERA_NAMES = ['Front Entrance Cam', 'Parking Lot A', 'Cash Counter', 'Server Room', 'Warehouse Bay'];
const LOCATIONS = ['Main Building - Ground Floor', 'Parking Area A', 'Finance Department', 'IT Infrastructure Room', 'Warehouse Section B'];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRiskLevel(eventType: string): 'low' | 'medium' | 'high' {
  const highRisk = ['INTRUSION', 'PERIMETER_BREACH'];
  const mediumRisk = ['LOITERING', 'TAILGATING', 'SUSPICIOUS_ACTIVITY'];
  if (highRisk.includes(eventType)) return 'high';
  if (mediumRisk.includes(eventType)) return 'medium';
  return 'low';
}

export async function generateDummyCameras(): Promise<string[]> {
  const camerasToInsert = CAMERA_NAMES.map((name, i) => ({
    name,
    location: LOCATIONS[i],
    rtsp_url: `rtsp://192.168.1.${10 + i}:554/stream1`,
    status: Math.random() > 0.15 ? 'active' : 'inactive' as 'active' | 'inactive',
    thumbnail_url: `https://images.pexels.com/photos/${[1036808, 449609, 1624895, 325229, 260931][i]}/pexels-photo-${[1036808, 449609, 1624895, 325229, 260931][i]}.jpeg?auto=compress&cs=tinysrgb&w=400`,
  }));

  const { data, error } = await supabase.from('cameras').insert(camerasToInsert).select('id');
  if (error) throw error;
  return data?.map((c) => c.id) ?? [];
}

export async function generateDummyZones(cameraIds: string[]): Promise<void> {
  const zonesToInsert = cameraIds.flatMap((cameraId) => {
    const count = Math.floor(randomBetween(1, 4));
    return Array.from({ length: count }, (_, i) => ({
      camera_id: cameraId,
      name: randomElement(ZONES),
      risk_level: randomElement(['low', 'medium', 'high'] as const),
      coordinates: {
        x: Math.round(randomBetween(0, 50)),
        y: Math.round(randomBetween(0, 50)),
        width: Math.round(randomBetween(20, 50)),
        height: Math.round(randomBetween(20, 50)),
      },
    }));
  });

  const { error } = await supabase.from('zones').insert(zonesToInsert);
  if (error) throw error;
}

export async function generateDummyEvents(cameraIds: string[]): Promise<void> {
  const now = new Date();
  const eventsToInsert = [];
  const alertsToInsert = [];

  for (let i = 0; i < 120; i++) {
    const hoursAgo = randomBetween(0, 72);
    const timestamp = new Date(now.getTime() - hoursAgo * 3600000);
    const eventType = randomElement(EVENT_TYPES);
    const zone = randomElement(ZONES);
    const cameraId = randomElement(cameraIds);
    const confidence = parseFloat(randomBetween(0.55, 0.99).toFixed(2));
    const duration = Math.round(randomBetween(5, 120));

    eventsToInsert.push({
      camera_id: cameraId,
      camera_uuid: cameraId,
      event_type: eventType,
      zone,
      duration,
      confidence,
      timestamp: timestamp.toISOString(),
      raw_payload: { source: 'dummy_generator', version: '1.0' },
    });

    alertsToInsert.push({
      camera_id: cameraId,
      camera_name: CAMERA_NAMES[cameraIds.indexOf(cameraId)] ?? 'Unknown Camera',
      event_type: eventType,
      zone,
      risk_level: getRiskLevel(eventType),
      confidence,
      is_read: Math.random() > 0.4,
      timestamp: timestamp.toISOString(),
    });
  }

  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .insert(eventsToInsert)
    .select('id');
  if (eventError) throw eventError;

  const alertsWithEventIds = alertsToInsert.map((alert, i) => ({
    ...alert,
    event_id: eventData?.[i]?.id ?? null,
  }));

  const { error: alertError } = await supabase.from('alerts').insert(alertsWithEventIds);
  if (alertError) throw alertError;
}

export async function runFullDummyDataGeneration(): Promise<void> {
  const cameraIds = await generateDummyCameras();
  await generateDummyZones(cameraIds);
  await generateDummyEvents(cameraIds);
}
