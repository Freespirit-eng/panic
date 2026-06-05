import React, { useState } from 'react';
import { Sliders, Shield, Volume2, Map, Users, RefreshCw } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function SettingsPage() {
  const { addToast } = useToast();
  const [config, setConfig] = useState({
    refreshInterval: 10,
    audioAlerts: true,
    mapGrid: true,
    pulseMarkers: true,
    cipherLevel: '512',
    operatorRole: 'operator_adam',
  });

  const handleSave = () => {
    addToast('mission', 'Configuration Saved', 'EOC system settings updated successfully.');
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-white font-mono tracking-wide">EOC DIVISION SETTINGS</h1>
        <p className="text-xs text-gray-500 font-mono">Operations Center System Controls &amp; Security Configurations</p>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-6">
        {/* Section 1: Refresh & Alerts */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Operations &amp; Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                Data Pull Interval (seconds)
              </label>
              <select
                value={config.refreshInterval}
                onChange={e => setConfig(p => ({ ...p, refreshInterval: Number(e.target.value) }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-600 transition-colors"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900/40 border border-gray-800 rounded-lg">
              <span className="text-xs text-gray-400 font-mono">Audio Warnings on Breach</span>
              <button
                onClick={() => setConfig(p => ({ ...p, audioAlerts: !p.audioAlerts }))}
                className={`relative w-9 h-5 rounded-full transition-colors border ${config.audioAlerts ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.audioAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: GIS Tactical Map */}
        <div className="space-y-4 pt-4 border-t border-gray-800/60">
          <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <Map className="w-4 h-4" />
            GIS Display Protocols
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-900/40 border border-gray-800 rounded-lg">
              <span className="text-xs text-gray-400 font-mono">Visible Coordinate Grid</span>
              <button
                onClick={() => setConfig(p => ({ ...p, mapGrid: !p.mapGrid }))}
                className={`relative w-9 h-5 rounded-full transition-colors border ${config.mapGrid ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.mapGrid ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900/40 border border-gray-800 rounded-lg">
              <span className="text-xs text-gray-400 font-mono">Pulsing Severity Nodes</span>
              <button
                onClick={() => setConfig(p => ({ ...p, pulseMarkers: !p.pulseMarkers }))}
                className={`relative w-9 h-5 rounded-full transition-colors border ${config.pulseMarkers ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.pulseMarkers ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Cyber Security & Role */}
        <div className="space-y-4 pt-4 border-t border-gray-800/60">
          <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Cryptography &amp; Authorization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                Crypto Cipher Strength
              </label>
              <select
                value={config.cipherLevel}
                onChange={e => setConfig(p => ({ ...p, cipherLevel: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-600 transition-colors"
              >
                <option value="512">AES-512 SECURE [FIPS]</option>
                <option value="256">AES-256 LEGACY</option>
                <option value="none">PLAIN TEXT (UNENCRYPTED)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                Active EOC Operator Identity
              </label>
              <select
                value={config.operatorRole}
                onChange={e => setConfig(p => ({ ...p, operatorRole: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-600 transition-colors"
              >
                <option value="operator_adam">operator_adam (EOC Commander)</option>
                <option value="operator_eve">operator_eve (Dispatch Manager)</option>
                <option value="admin_root">admin_root (System Admin)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Sliders className="w-4 h-4" />
          SAVE CHANGES
        </button>
      </div>
    </div>
  );
}
