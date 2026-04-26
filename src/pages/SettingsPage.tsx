import { useState } from 'react';
import { Database, Zap, Code, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { runFullDummyDataGeneration } from '../lib/dummyData';
import { supabase } from '../lib/supabase';

const ML_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-event`;

const SAMPLE_PAYLOAD = {
  camera_id: "cam_front_entrance",
  event_type: "LOITERING",
  zone: "cash_counter",
  duration: 45,
  confidence: 0.87,
  timestamp: new Date().toISOString(),
};

export function SettingsPage() {
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [clearing, setClearing] = useState(false);
  const [clearStatus, setClearStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleGenerateDummy = async () => {
    setGenerating(true);
    setGenStatus('idle');
    try {
      await runFullDummyDataGeneration();
      setGenStatus('success');
    } catch {
      setGenStatus('error');
    }
    setGenerating(false);
  };

  const handleClearData = async () => {
    if (!confirm('This will delete ALL cameras, zones, events and alerts. This cannot be undone. Continue?')) return;
    setClearing(true);
    setClearStatus('idle');
    try {
      await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('zones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cameras').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setClearStatus('success');
    } catch {
      setClearStatus('error');
    }
    setClearing(false);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Demo Data</h3>
                <p className="text-xs text-gray-500">Populate the platform with realistic sample data</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Generate 5 cameras with zones, 120 security events, and corresponding alerts spread across the last 72 hours. Perfect for demonstrating the platform to stakeholders.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleGenerateDummy}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {generating ? 'Generating...' : 'Generate Dummy Data'}
              </button>
              {genStatus === 'success' && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Data generated successfully!
                </div>
              )}
              {genStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Generation failed. Check console.
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleClearData}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {clearing ? <Loader className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                {clearing ? 'Clearing...' : 'Clear All Data'}
              </button>
              {clearStatus === 'success' && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All data cleared.</p>}
              {clearStatus === 'error' && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed to clear data.</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">ML Service Integration</h3>
                <p className="text-xs text-gray-500">Endpoint for your ML microservice to push events</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ingest Endpoint</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">POST</span>
                <code className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-1 break-all">
                  {ML_ENDPOINT}
                </code>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Required Headers</p>
              <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-1">
                <p><span className="text-blue-400">Authorization:</span> Bearer {'<SUPABASE_ANON_KEY>'}</p>
                <p><span className="text-blue-400">Content-Type:</span> application/json</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sample Payload</p>
              <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-300">
                <pre className="overflow-x-auto">{JSON.stringify(SAMPLE_PAYLOAD, null, 2)}</pre>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-800 mb-1">Supported Event Types</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['LOITERING', 'INTRUSION', 'TAILGATING', 'CROWD_GATHERING', 'PERIMETER_BREACH', 'SUSPICIOUS_ACTIVITY', 'UNATTENDED_OBJECT'].map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-white border border-blue-200 text-blue-700 text-xs rounded font-mono">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Information</h3>
          <div className="space-y-3">
            {[
              { label: 'Platform Version', value: '1.0.0-MVP' },
              { label: 'Architecture', value: 'React + Supabase + Edge Functions' },
              { label: 'ML Integration', value: 'REST API (External Microservice)' },
              { label: 'Real-time Updates', value: 'Polling (15s interval)' },
              { label: 'Database', value: 'PostgreSQL via Supabase' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
