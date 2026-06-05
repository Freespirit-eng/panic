import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  MapPin, 
  User, 
  Send, 
  ShieldAlert, 
  Clock, 
  AlertTriangle,
  X,
  Volume2,
  Construction,
  Anchor,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Alert } from '../types';

interface AlertCenterProps {
  alerts: Alert[];
  onBroadcastAlert: (alertData: Omit<Alert, 'id' | 'timestamp'>) => Promise<any>;
}

export default function AlertCenter({ alerts, onBroadcastAlert }: AlertCenterProps) {
  const [type, setType] = useState<Alert['type']>('Emergency Alert');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [area, setArea] = useState('');
  const [sentBy, setSentBy] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || !area) return;

    setIsSending(true);
    try {
      await onBroadcastAlert({
        type,
        title,
        message,
        area,
        sentBy: sentBy || 'EOC Senior Dispatcher'
      });
      
      // Reset form
      setTitle('');
      setMessage('');
      setArea('');
      setSentBy('');
      
      // Success banner
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);

    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const getAlertBadgeStyles = (alertType: Alert['type']) => {
    switch (alertType) {
      case 'Evacuation Notice':
        return 'bg-red-950 text-red-400 border border-red-900 animate-pulse';
      case 'Emergency Alert':
        return 'bg-orange-950 text-orange-400 border border-orange-900 font-bold';
      case 'Road Closure':
        return 'bg-yellow-950 text-yellow-500 border border-yellow-800';
      case 'Rescue Update':
        return 'bg-green-950 text-green-400 border border-green-900';
    }
  };

  const getAlertIcon = (alertType: Alert['type']) => {
    switch (alertType) {
      case 'Evacuation Notice': return <ShieldAlert className="h-4 w-4 animate-bounce" />;
      case 'Emergency Alert': return <Volume2 className="h-4 w-4 animate-pulse" />;
      case 'Road Closure': return <Construction className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Radio className="h-5 w-5 text-blue-500 animate-pulse" />
          CIVIL EMERGENCY BROADCAST REGULATOR
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">METROPOLITAN CIVIL DISPATCH WIRE • DIRECT CARRIER INGRESS PANEL</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Form Columns */}
        <div className="lg:col-span-5 bg-card border border-gray-800 rounded-lg p-5 relative overflow-hidden glow-red">
          <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-2.5 mb-4">
            COMPOSE EMERGENCY BROADCAST
          </h3>

          <AnimatePresence>
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-950/80 border border-green-900 text-green-400 text-xs p-3 rounded mb-4 font-sans flex items-center gap-2"
              >
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                <span>EOC Broadcast beamed successfully to all networks.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono text-gray-300">
            {/* Broadcast type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">01 // WAVE TYPE</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Alert['type'])}
                className="w-full bg-[#0B1220] border border-gray-850 rounded p-2 text-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Emergency Alert">EMERGENCY ALERT</option>
                <option value="Evacuation Notice">EVACUATION NOTICE</option>
                <option value="Road Closure">ROAD CLOSURE</option>
                <option value="Rescue Update">RESCUE UPDATE</option>
              </select>
            </div>

            {/* Broadcast Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">02 // ALIGNMENT TITLE</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Koramangala 4th Block High Inflow Danger"
                className="w-full bg-[#0B1220] border border-gray-850 rounded p-2 text-gray-200 focus:outline-none focus:border-blue-500 placeholder-gray-750 font-sans"
              />
            </div>

            {/* Ingress Message body */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">03 // EMERGENCY DESCRIPTION BODY</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe current road rules, diversion schedules, shelter coordinates, or active evacuations clearly."
                className="w-full bg-[#0B1220] border border-gray-855 rounded p-2 text-gray-200 focus:outline-none focus:border-blue-500 placeholder-gray-750 font-sans"
              />
            </div>

            {/* Target Area block */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block flex items-center gap-1">
                <MapPin className="h-3 w-3 text-blue-500" /> 
                04 // IMPACT RADIUS SECTOR
              </label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="E.g., Koramangala and HSR Layout sub-zones"
                className="w-full bg-[#0B1220] border border-gray-850 rounded p-2 text-gray-200 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            {/* Director Signoff credentials */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block flex items-center gap-1">
                <User className="h-3 w-3 text-blue-500" /> 
                05 // EOC COMMANDER AUTHORIZATION SIGNATURE
              </label>
              <input
                type="text"
                value={sentBy}
                onChange={(e) => setSentBy(e.target.value)}
                placeholder="E.g., Commander R. Deshmukh (Zone Chief Adviser)"
                className="w-full bg-[#0B1220] border border-gray-850 rounded p-2 text-gray-200 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            {/* Actions button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSending || !title || !message || !area}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-mono text-xs font-bold rounded transition flex items-center justify-center gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                {isSending ? 'EMBEDDING CARRIER BEACON...' : 'TRANSMIT BROADCAST SIRENS'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side Broadcast list panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>LIVE COMM-NET FEED REGISTRY</span>
            <span>{alerts.length} ALERTS LIVE</span>
          </div>

          <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
            {alerts.map((alr) => (
              <div 
                key={alr.id}
                className="bg-card border border-gray-850 rounded-lg p-4 relative flex items-start gap-3.5"
                id={`broadcast-card-${alr.id}`}
              >
                {/* Visual Icon Badge representing type */}
                <div className={`p-2 rounded mt-0.5 border ${getAlertBadgeStyles(alr.type)} shrink-0`}>
                  {getAlertIcon(alr.type)}
                </div>

                {/* Info block */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{alr.id}</span>
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(alr.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-white text-sm font-sans font-bold mt-2 tracking-tight leading-tight">
                    {alr.title}
                  </h4>

                  <p className="text-xs text-gray-300 mt-2 font-sans leading-relaxed select-text">
                    {alr.message}
                  </p>

                  <div className="mt-3.5 pt-2.5 border-t border-gray-850 flex flex-wrap items-center justify-between text-[10px] font-mono text-gray-400 gap-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500" /> Sector: <strong className="text-gray-200">{alr.area}</strong>
                    </span>
                    <span>AUTHORITY: <strong className="text-gray-200 text-[9px]">{alr.sentBy}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
