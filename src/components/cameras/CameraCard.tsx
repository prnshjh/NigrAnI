import { MapPin, Layers, MoreVertical, Power, Wifi, WifiOff, AlertCircle, CreditCard as Edit3 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Camera, Zone } from '../../lib/types';

interface CameraCardProps {
  camera: Camera;
  zones: Zone[];
  onConfigureZones: () => void;
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  active: { icon: Wifi, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Active' },
  inactive: { icon: WifiOff, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Inactive' },
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Error' },
};

const RISK_COLORS = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export function CameraCard({ camera, zones, onConfigureZones, onRefresh }: CameraCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const config = STATUS_CONFIG[camera.status];
  const StatusIcon = config.icon;

  const handleToggle = async () => {
    setToggling(true);
    setMenuOpen(false);
    const newStatus = camera.status === 'active' ? 'inactive' : 'active';
    await supabase.from('cameras').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', camera.id);
    setToggling(false);
    onRefresh();
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm(`Delete camera "${camera.name}"? This cannot be undone.`)) return;
    await supabase.from('cameras').delete().eq('id', camera.id);
    onRefresh();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {camera.thumbnail_url ? (
          <img
            src={camera.thumbnail_url}
            alt={camera.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-2">
                <Wifi className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-xs text-gray-500">No Preview</p>
            </div>
          </div>
        )}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} backdrop-blur-sm`}>
          <StatusIcon className={`w-3 h-3 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
        {zones.length > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            <Layers className="w-3 h-3" />
            {zones.length} zone{zones.length !== 1 ? 's' : ''}
          </div>
        )}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-40 z-10">
                <button
                  onClick={onConfigureZones}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Configure Zones
                </button>
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Power className="w-3.5 h-3.5" />
                  {camera.status === 'active' ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{camera.name}</h3>
        {camera.location && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-500 truncate">{camera.location}</p>
          </div>
        )}
        {camera.rtsp_url && (
          <p className="text-xs text-gray-400 font-mono truncate mt-1">{camera.rtsp_url}</p>
        )}

        {zones.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {zones.slice(0, 3).map((zone) => (
              <span key={zone.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[zone.risk_level]}`}>
                {zone.name}
              </span>
            ))}
            {zones.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                +{zones.length - 3}
              </span>
            )}
          </div>
        )}

        <button
          onClick={onConfigureZones}
          className="mt-3 w-full py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Configure Zones
        </button>
      </div>
    </div>
  );
}
