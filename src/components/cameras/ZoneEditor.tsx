import { useState, useRef, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Camera, Zone } from '../../lib/types';

interface ZoneEditorProps {
  camera: Camera;
  zones: Zone[];
  onClose: () => void;
  onSaved: () => void;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const RISK_COLORS = {
  low: { border: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'bg-emerald-500' },
  medium: { border: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'bg-amber-500' },
  high: { border: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'bg-red-500' },
};

export function ZoneEditor({ camera, zones, onClose, onSaved }: ZoneEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState<DrawingState>({ isDrawing: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const [pendingZone, setPendingZone] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneRisk, setNewZoneRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getRelativePos = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!pendingZone) {
      const pos = getRelativePos(e);
      setDrawing({ isDrawing: true, startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing.isDrawing) return;
    const pos = getRelativePos(e);
    setDrawing((d) => ({ ...d, currentX: pos.x, currentY: pos.y }));
  };

  const handleMouseUp = () => {
    if (!drawing.isDrawing) return;
    const x = Math.min(drawing.startX, drawing.currentX);
    const y = Math.min(drawing.startY, drawing.currentY);
    const w = Math.abs(drawing.currentX - drawing.startX);
    const h = Math.abs(drawing.currentY - drawing.startY);
    setDrawing((d) => ({ ...d, isDrawing: false }));
    if (w > 3 && h > 3) {
      setPendingZone({ x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)), width: parseFloat(w.toFixed(1)), height: parseFloat(h.toFixed(1)) });
    }
  };

  const handleSaveZone = async () => {
    if (!pendingZone || !newZoneName.trim()) return;
    setSaving(true);
    await supabase.from('zones').insert({
      camera_id: camera.id,
      name: newZoneName.trim(),
      risk_level: newZoneRisk,
      coordinates: pendingZone,
    });
    setSaving(false);
    setPendingZone(null);
    setNewZoneName('');
    onSaved();
  };

  const handleDeleteZone = async (zoneId: string) => {
    setDeletingId(zoneId);
    await supabase.from('zones').delete().eq('id', zoneId);
    setDeletingId(null);
    onSaved();
  };

  const drawingRect = drawing.isDrawing ? {
    x: Math.min(drawing.startX, drawing.currentX),
    y: Math.min(drawing.startY, drawing.currentY),
    width: Math.abs(drawing.currentX - drawing.startX),
    height: Math.abs(drawing.currentY - drawing.startY),
  } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Zone Configuration</h2>
            <p className="text-xs text-gray-500 mt-0.5">{camera.name} &bull; Draw zones on the camera view</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-4 overflow-hidden">
            <div
              ref={canvasRef}
              className="relative w-full bg-gray-900 rounded-xl overflow-hidden select-none"
              style={{ aspectRatio: '16/9', cursor: pendingZone ? 'default' : 'crosshair' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {camera.thumbnail_url ? (
                <img src={camera.thumbnail_url} alt={camera.name} className="w-full h-full object-cover opacity-70" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">Camera Preview Unavailable</div>
              )}

              {zones.map((zone) => {
                const colors = RISK_COLORS[zone.risk_level];
                return (
                  <div
                    key={zone.id}
                    className="absolute"
                    style={{
                      left: `${zone.coordinates.x}%`,
                      top: `${zone.coordinates.y}%`,
                      width: `${zone.coordinates.width}%`,
                      height: `${zone.coordinates.height}%`,
                      border: `2px solid ${colors.border}`,
                      backgroundColor: colors.bg,
                    }}
                  >
                    <span className={`absolute -top-5 left-0 text-white text-xs px-1.5 py-0.5 rounded-t ${colors.label} whitespace-nowrap`}>
                      {zone.name}
                    </span>
                  </div>
                );
              })}

              {drawingRect && (
                <div
                  className="absolute"
                  style={{
                    left: `${drawingRect.x}%`,
                    top: `${drawingRect.y}%`,
                    width: `${drawingRect.width}%`,
                    height: `${drawingRect.height}%`,
                    border: '2px dashed #3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.15)',
                  }}
                />
              )}

              {pendingZone && (
                <div
                  className="absolute"
                  style={{
                    left: `${pendingZone.x}%`,
                    top: `${pendingZone.y}%`,
                    width: `${pendingZone.width}%`,
                    height: `${pendingZone.height}%`,
                    border: '2px solid #3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.2)',
                  }}
                />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Click and drag to draw a zone</p>
          </div>

          <div className="w-64 border-l border-gray-200 flex flex-col overflow-hidden">
            {pendingZone && (
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <p className="text-xs font-semibold text-blue-800 mb-3 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> New Zone
                </p>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Zone name (e.g. cash_counter)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <select
                  value={newZoneRisk}
                  onChange={(e) => setNewZoneRisk(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setPendingZone(null)} className="flex-1 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">Discard</button>
                  <button onClick={handleSaveZone} disabled={saving || !newZoneName.trim()} className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Zones ({zones.length})
              </p>
              {zones.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-4">No zones defined yet. Draw on the camera view.</p>
              ) : (
                <div className="space-y-2">
                  {zones.map((zone) => {
                    const colors = RISK_COLORS[zone.risk_level];
                    return (
                      <div key={zone.id} className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-lg">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.border }}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{zone.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{zone.risk_level} risk</p>
                        </div>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          disabled={deletingId === zone.id}
                          className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
