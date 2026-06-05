import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Users, 
  Award,
  Layers,
  Flame,
  Anchor,
  Construction,
  AlertTriangle
} from 'lucide-react';
import { Incident } from '../types';

interface AnalyticsViewProps {
  incidents: Incident[];
}

export default function AnalyticsView({ incidents }: AnalyticsViewProps) {
  // Aggregate data from incidents
  const typeCounts = incidents.reduce((acc, inc) => {
    acc[inc.type] = (acc[inc.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalIncidents = incidents.length || 1;

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          SYSTEM METRIC LABS & RISK TELEMETRY
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">MODEL VERSION: COGNITIVE R-2 • VERIFICATION WEIGHTS: RE-BALANCED</p>
      </div>

      {/* Grid of 6 Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* 1. Disaster Type Distribution */}
        <div className="bg-card border border-gray-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest border-b border-gray-850 pb-2 mb-4">
              01 // RISK VECTOR QUANTITIES
            </h3>
            <div className="space-y-3">
              {['Flood', 'Fire', 'Road Collapse', 'Building Damage', 'Earthquake'].map((type) => {
                const count = typeCounts[type] || 0;
                const percentage = Math.round((count / totalIncidents) * 100) || 4;
                let color = 'bg-blue-600';
                if (type === 'Fire') color = 'bg-red-500';
                if (type === 'Road Collapse') color = 'bg-orange-500';
                if (type === 'Building Damage') color = 'bg-yellow-500';
                if (type === 'Earthquake') color = 'bg-purple-500';

                return (
                  <div key={type} className="text-xs">
                    <div className="flex justify-between items-center text-gray-300 font-mono">
                      <span>{type}</span>
                      <span className="font-bold">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-950 h-2 mt-1.5 rounded-full overflow-hidden border border-gray-900">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[10px] font-mono text-gray-500 mt-4 text-right">INGESTED SAMPLE: {totalIncidents} VECTOR FILES</div>
        </div>

        {/* 2. Response Time Trends */}
        <div className="bg-card border border-gray-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest border-b border-gray-850 pb-2 mb-4">
              02 // RESPONSE LAG SPECTRUM
            </h3>
            
            {/* Custom SVG Line graph showing response minutes over the day */}
            <div className="relative h-32 w-full mt-2">
              <svg className="w-full h-full stroke-blue-500/80 stroke-1.5 fill-none" viewBox="0 0 100 50">
                {/* Horizontal reference lines */}
                <line x1="0" y1="10" x2="100" y2="10" className="stroke-gray-850" strokeDasharray="2 2" />
                <line x1="0" y1="25" x2="100" y2="25" className="stroke-gray-850" strokeDasharray="2 2" />
                <line x1="0" y1="40" x2="100" y2="40" className="stroke-gray-850" strokeDasharray="2 2" />
                
                {/* Trend curve */}
                <path d="M 0,45 Q 20,42 40,22 T 80,12 T 100,8" className="stroke-blue-500" strokeWidth="2" />
                {/* Fill area */}
                <path d="M 0,45 Q 20,42 40,22 T 80,12 T 100,8 L 100,50 L 0,50 Z" className="fill-blue-950/20" />
                
                {/* Data point dots */}
                <circle cx="40" cy="22" r="2.5" className="fill-[#EA580C] stroke-[#ffffff]" />
                <circle cx="80" cy="12" r="2.5" className="fill-blue-400 stroke-[#ffffff]" />
              </svg>
              <div className="absolute top-2 left-2 text-[9px] text-[#16A34A] font-mono font-bold bg-[#0b1220]/80 px-1 border border-green-950">MIN REACTION: 8.2m</div>
              <div className="absolute top-9 right-2 text-[9px] text-[#EAB308] font-mono font-bold bg-[#0b1220]/80 px-1 border border-yellow-950">AVG RESPONSE: 11.4M</div>
            </div>
          </div>
          
          <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-3 border-t border-gray-850">
            <span>08:00 AM</span>
            <span>12:00 PM</span>
            <span>04:00 PM</span>
          </div>
        </div>

        {/* 3. District Risk Heatmap */}
        <div className="bg-card border border-gray-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest border-b border-gray-850 pb-2 mb-4">
              03 // DISTRICT THREAT MATRIX
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-[#1b1214] border border-red-950 p-2 rounded">
                <span className="text-gray-400">MG Road</span>
                <strong className="block text-red-500 font-extrabold mt-1">92 / CRITICAL</strong>
              </div>
              <div className="bg-[#1b1411] border border-orange-950 p-2 rounded">
                <span className="text-gray-400">Indiranagar</span>
                <strong className="block text-orange-400 font-extrabold mt-1">85 / HIGH</strong>
              </div>
              <div className="bg-[#101912] border border-green-950 p-2 rounded">
                <span className="text-gray-400">Whitefield</span>
                <strong className="block text-green-400 font-extrabold mt-1">54 / STABLE</strong>
              </div>
              <div className="bg-[#1b1911] border border-yellow-950 p-2 rounded">
                <span className="text-gray-400">Majestic Area</span>
                <strong className="block text-yellow-400 font-extrabold mt-1">79 / MODERATE</strong>
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-gray-500 text-center uppercase mt-3">COORDINATE HEAT SCANS: LIVE</div>
        </div>

        {/* 4. Verification Accuracy Archive */}
        <div className="bg-card border border-gray-800 rounded-lg p-4 flex flex-col justify-between mb-4 sm:mb-0">
          <div>
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest border-b border-gray-850 pb-2 mb-4">
              04 // COGNITIVE ACCURACY RATIO
            </h3>
            
            <div className="flex items-center justify-around h-32">
              {/* Pie/Radial Arc */}
              <div className="relative h-24 w-24">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                  {/* Background track circle */}
                  <path
                    className="stroke-gray-850"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Value progress indicator arc */}
                  <path
                    className="stroke-green-500"
                    strokeWidth="3.8"
                    strokeDasharray="94.2, 100"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-white font-extrabold text-sm font-bold">94.2%</span>
                  <span className="text-[7.5px] text-gray-500 font-bold tracking-tight">AI PREDICT ACC</span>
                </div>
              </div>

              <div className="text-xs font-mono text-gray-300 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Valid reports: 94.2%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>Ambiguous context: 4.1%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Decoy / duplicate: 1.7%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-gray-500 pt-3 border-t border-gray-850">INGESTED MODEL SAMPLES RE-VERIFIED IN REAL-TIME</div>
        </div>

        {/* 5. Incident Growth Curve */}
        <div className="bg-card border border-gray-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest border-b border-gray-850 pb-2 mb-4">
              05 // INCIDENT VELOCITY TRENDS
            </h3>
            
            {/* Area Curve representing cumulative incidents growth */}
            <div className="relative h-28 w-full mt-2 bg-gray-950/20 border border-gray-850 p-1.5 rounded">
              <svg className="w-full h-full fill-none" viewBox="0 0 100 40">
                <path d="M 0,35 L 20,32 L 40,25 L 60,18 L 80,10 L 100,4 L 100,40 L 0,40 Z" className="fill-red-950/25 pointer-events-none" />
                <path d="M 0,35 L 20,32 L 40,25 L 60,18 L 80,10 L 100,4" className="stroke-red-500 stroke-1.5 font-bold" />
                
                {/* High alert point annotation mark */}
                <circle cx="80" cy="10" r="2" className="fill-[#ffffff] stroke-[#DC2626] font-bold" />
              </svg>
              <div className="absolute top-2 left-2 text-[9px] text-[#DC2626] font-mono font-bold uppercase tracking-wider bg-red-950 px-1.5 py-0.5 rounded border border-red-900">INCIDENT GROWTH: SCALING +14% WEEK-OVER-WEEK</div>
            </div>
          </div>
          
          <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-3 border-t border-gray-855">
            <span>MON</span>
            <span>WED</span>
            <span>FRI</span>
            <span>SUN</span>
          </div>
        </div>

        {/* 6. Active Resource Utilization */}
        <div className="bg-card border border-gray-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest border-b border-gray-850 pb-2 mb-4">
              06 // ACTIVE FUEL & UNIT ENGAGEMENT
            </h3>
            
            <div className="space-y-3">
              {[
                { label: "Water Inflatables Reserve", deployed: 42, text: "9 / 12 Units deployed" },
                { label: "Aerial Fire Engines", deployed: 75, text: "6 / 8 Units deployed" },
                { label: "Structural K9 Teams", deployed: 30, text: "3 / 10 Units deployed" }
              ].map((res, i) => (
                <div key={i} className="text-xs font-mono">
                  <div className="flex justify-between text-gray-400">
                    <span>{res.label}</span>
                    <span className="text-white font-bold">{res.text}</span>
                  </div>
                  <div className="w-full bg-gray-950 h-1.5 mt-1 rounded-full overflow-hidden border border-gray-855">
                    <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${res.deployed}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-[10px] font-mono text-[#EAB308] pt-3 border-t border-gray-850 text-right font-extrabold uppercase tracking-wide">STAGE GEAR INDEX: LOAD 72%</div>
        </div>

      </div>
    </div>
  );
}
