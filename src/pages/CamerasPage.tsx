import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Camera as CameraIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CameraCard } from '../components/cameras/CameraCard';
import { AddCameraModal } from '../components/cameras/AddCameraModal';
import { ZoneEditor } from '../components/cameras/ZoneEditor';
import type { Camera, Zone } from '../lib/types';

export function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [zones, setZones] = useState<Record<string, Zone[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchData = useCallback(async () => {
    const [camRes, zoneRes] = await Promise.all([
      supabase.from('cameras').select('*').order('created_at', { ascending: false }),
      supabase.from('zones').select('*'),
    ]);
    const cams = (camRes.data ?? []) as Camera[];
    setCameras(cams);
    const zoneMap: Record<string, Zone[]> = {};
    (zoneRes.data ?? []).forEach((z) => {
      if (!zoneMap[z.camera_id]) zoneMap[z.camera_id] = [];
      zoneMap[z.camera_id].push(z as Zone);
    });
    setZones(zoneMap);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = cameras.filter((cam) => {
    const matchesSearch = cam.name.toLowerCase().includes(search.toLowerCase()) ||
      cam.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cameras..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors ml-auto"
        >
          <Plus className="w-4 h-4" />
          Add Camera
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="aspect-video bg-gray-100 animate-pulse"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <CameraIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {cameras.length === 0 ? 'No cameras yet' : 'No cameras match your filter'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {cameras.length === 0 ? 'Add your first camera to start monitoring' : 'Try adjusting your search or filters'}
          </p>
          {cameras.length === 0 && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Camera
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((cam) => (
            <CameraCard
              key={cam.id}
              camera={cam}
              zones={zones[cam.id] ?? []}
              onConfigureZones={() => setEditingCamera(cam)}
              onRefresh={fetchData}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddCameraModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchData(); }}
        />
      )}

      {editingCamera && (
        <ZoneEditor
          camera={editingCamera}
          zones={zones[editingCamera.id] ?? []}
          onClose={() => setEditingCamera(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
