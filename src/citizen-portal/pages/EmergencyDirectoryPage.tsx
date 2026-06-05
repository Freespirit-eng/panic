import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Phone,
  Search,
  Shield,
  Flame,
  Droplets,
  HeartPulse,
  Radio,
  Zap,
  Truck,
  Building2,
  AlertCircle,
  Globe,
  MapPin,
  X,
  ExternalLink,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

type CategoryKey =
  | 'Police'
  | 'Fire'
  | 'Medical'
  | 'Flood Relief'
  | 'Disaster Mgmt'
  | 'Utilities'
  | 'Transport'
  | 'National';

interface ContactEntry {
  id: string;
  name: string;
  number: string;
  alt?: string;
  area: string;
  category: CategoryKey;
  available: '24/7' | 'Business Hours' | 'Emergency Only';
  description: string;
}

const DIRECTORY: ContactEntry[] = [
  // Police
  {
    id: 'p1', name: 'National Emergency Number', number: '112', area: 'Pan-India',
    category: 'Police', available: '24/7', description: 'Unified emergency helpline — Police, Fire, Ambulance',
  },
  {
    id: 'p2', name: 'Police Control Room', number: '100', area: 'Pan-India',
    category: 'Police', available: '24/7', description: 'Direct line to nearest police station',
  },
  {
    id: 'p3', name: 'Women Safety Helpline', number: '1091', area: 'Pan-India',
    category: 'Police', available: '24/7', description: 'Dedicated helpline for women in distress',
  },
  {
    id: 'p4', name: 'Child Helpline', number: '1098', area: 'Pan-India',
    category: 'Police', available: '24/7', description: 'Emergency assistance for children in danger',
  },
  // Fire
  {
    id: 'f1', name: 'Fire Emergency', number: '101', area: 'Pan-India',
    category: 'Fire', available: '24/7', description: 'Fire brigade emergency response',
  },
  {
    id: 'f2', name: 'Forest Fire Control', number: '1800-180-0011', area: 'National',
    category: 'Fire', available: '24/7', description: 'Ministry of Environment — forest fire reporting',
  },
  // Medical
  {
    id: 'm1', name: 'Ambulance Services', number: '108', area: 'Pan-India',
    category: 'Medical', available: '24/7', description: 'Emergency medical ambulance dispatch',
  },
  {
    id: 'm2', name: 'Blood Bank Helpline', number: '1910', area: 'Pan-India',
    category: 'Medical', available: '24/7', description: 'Emergency blood availability and transport',
  },
  {
    id: 'm3', name: 'Poison Control Centre', number: '1800-116-117', area: 'National',
    category: 'Medical', available: '24/7', description: 'Immediate guidance for poisoning emergencies',
  },
  {
    id: 'm4', name: 'Mental Health Helpline', number: 'iCall: 9152987821', area: 'National',
    category: 'Medical', available: 'Business Hours', description: 'NIMHANS tele-mental health support',
  },
  // Flood Relief
  {
    id: 'fl1', name: 'NDRF Helpline', number: '0120-2309539', area: 'National',
    category: 'Flood Relief', available: '24/7', description: 'National Disaster Response Force — flood rescue',
  },
  {
    id: 'fl2', name: 'CWC Flood Monitoring', number: '1800-180-1551', area: 'National',
    category: 'Flood Relief', available: '24/7', description: 'Central Water Commission — river flood alerts',
  },
  {
    id: 'fl3', name: 'IMD Weather Warnings', number: '1800-180-1717', area: 'National',
    category: 'Flood Relief', available: '24/7', description: 'India Meteorological Dept — severe weather alerts',
  },
  // Disaster Management
  {
    id: 'd1', name: 'NDMA Control Room', number: '1078', area: 'National',
    category: 'Disaster Mgmt', available: '24/7', description: 'National Disaster Management Authority',
  },
  {
    id: 'd2', name: 'State Disaster Helpline', number: '1070', area: 'State Level',
    category: 'Disaster Mgmt', available: '24/7', description: 'State-level disaster management control room',
  },
  {
    id: 'd3', name: 'SDRF Rescue Team', number: '0120-2309540', area: 'State Level',
    category: 'Disaster Mgmt', available: '24/7', description: 'State Disaster Response Force rapid deployment',
  },
  // Utilities
  {
    id: 'u1', name: 'Power Outage (Electricity Board)', number: '1912', area: 'Regional',
    category: 'Utilities', available: '24/7', description: 'Report electrical hazards or power supply failures',
  },
  {
    id: 'u2', name: 'Gas Leak Emergency', number: '1906', area: 'Pan-India',
    category: 'Utilities', available: '24/7', description: 'LPG/PNG gas leak emergency response',
  },
  {
    id: 'u3', name: 'Water Supply Emergency', number: '1916', area: 'Municipal',
    category: 'Utilities', available: '24/7', description: 'Report water supply disruptions or contamination',
  },
  // Transport
  {
    id: 't1', name: 'Highway Accident Helpline', number: '1033', area: 'National Highways',
    category: 'Transport', available: '24/7', description: 'NHAI — road accident rescue and medical assistance',
  },
  {
    id: 't2', name: 'Railway Emergency', number: '182', area: 'Pan-India',
    category: 'Transport', available: '24/7', description: 'Indian Railways accident and security helpline',
  },
  {
    id: 't3', name: 'Aviation Emergency', number: '1800-111-407', area: 'National',
    category: 'Transport', available: '24/7', description: 'DGCA — aviation emergency and safety hotline',
  },
  // National Portals
  {
    id: 'n1', name: 'PM Relief Fund', number: 'pmcares@gov.in', area: 'National',
    category: 'National', available: '24/7', description: 'PM-CARES Fund — national disaster relief',
  },
  {
    id: 'n2', name: 'National Crisis Mgmt', number: '011-23438252', area: 'National',
    category: 'National', available: '24/7', description: 'Cabinet Secretariat — national crisis coordination',
  },
];

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORIES: Record<
  CategoryKey,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  Police: {
    icon: <Shield className="w-5 h-5" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
  },
  Fire: {
    icon: <Flame className="w-5 h-5" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
  },
  Medical: {
    icon: <HeartPulse className="w-5 h-5" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
  },
  'Flood Relief': {
    icon: <Droplets className="w-5 h-5" />,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/25',
  },
  'Disaster Mgmt': {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/25',
  },
  Utilities: {
    icon: <Zap className="w-5 h-5" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/25',
  },
  Transport: {
    icon: <Truck className="w-5 h-5" />,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
  },
  National: {
    icon: <Globe className="w-5 h-5" />,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/25',
  },
};

const ALL_CATEGORIES = Object.keys(CATEGORIES) as CategoryKey[];

const AVAILABILITY_COLOR: Record<ContactEntry['available'], string> = {
  '24/7': 'text-green-400 bg-green-500/10 border-green-500/25',
  'Business Hours': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
  'Emergency Only': 'text-orange-400 bg-orange-500/10 border-orange-500/25',
};

// ─── Contact Card ──────────────────────────────────────────────────────────────

function ContactCard({ entry }: { key?: React.Key; entry: ContactEntry }) {
  const cat = CATEGORIES[entry.category];

  const isDialable = entry.number.match(/^[\d\s\-+()]+$/) !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`bg-[#111827] border ${cat.border} rounded-xl overflow-hidden group cursor-default`}
    >
      {/* Category stripe */}
      <div className={`h-0.5 w-full ${cat.bg.replace('/10', '')}`} style={{ background: 'currentColor' }}>
        <div className={`h-full w-full ${cat.color.replace('text-', 'bg-')}`} />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg ${cat.bg} border ${cat.border} flex items-center justify-center shrink-0`}>
            <span className={cat.color}>{cat.icon}</span>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              AVAILABILITY_COLOR[entry.available]
            }`}
          >
            {entry.available}
          </span>
        </div>

        <h3 className="text-sm font-mono font-bold text-white mb-1 leading-tight">{entry.name}</h3>
        <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{entry.description}</p>

        {/* Phone Number */}
        <div className="flex items-center justify-between gap-2">
          {isDialable ? (
            <a
              href={`tel:${entry.number.replace(/\s/g, '')}`}
              className={`flex items-center gap-2 text-base font-mono font-bold ${cat.color} hover:opacity-80 transition`}
            >
              <Phone className="w-3.5 h-3.5" />
              {entry.number}
            </a>
          ) : (
            <span className={`flex items-center gap-2 text-sm font-mono font-bold ${cat.color}`}>
              <Radio className="w-3.5 h-3.5" />
              {entry.number}
            </span>
          )}

          <div className="flex items-center gap-1 text-[10px] text-gray-600 font-mono">
            <MapPin className="w-3 h-3" />
            {entry.area}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="skeleton w-8 h-8 rounded-lg" />
        <div className="skeleton w-16 h-4 rounded" />
      </div>
      <div className="skeleton w-3/4 h-4 rounded" />
      <div className="skeleton w-full h-3 rounded" />
      <div className="skeleton w-5/6 h-3 rounded" />
      <div className="skeleton w-1/2 h-5 rounded mt-1" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmergencyDirectoryPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'All'>('All');
  const [showSkeletons] = useState(false); // set true to preview loading state

  // Filter logic
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return DIRECTORY.filter((c) => {
      const matchCat = activeCategory === 'All' || c.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.number.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  // Group by category for display
  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return null;
    const map: Partial<Record<CategoryKey, ContactEntry[]>> = {};
    filtered.forEach((c) => {
      if (!map[c.category]) map[c.category] = [];
      map[c.category]!.push(c);
    });
    return map;
  }, [filtered, activeCategory]);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-green-400" />
          </div>
          <h2 className="text-base font-mono font-bold text-white tracking-widest uppercase">
            Emergency Directory
          </h2>
          <span className="text-[10px] font-mono bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-0.5 rounded">
            {DIRECTORY.length} CONTACTS
          </span>
        </div>
        <p className="text-xs text-gray-500 ml-11 font-mono">
          National emergency hotlines · Tap any number to call instantly
        </p>
      </motion.div>

      {/* Search + Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-3 mb-6"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            id="directory-search"
            type="text"
            placeholder="Search by name, number, area…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-gray-800 text-white text-sm rounded-xl pl-10 pr-10 py-2.5 placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            id="cat-all"
            type="button"
            onClick={() => setActiveCategory('All')}
            className={`text-[11px] font-mono font-bold px-3 py-1.5 rounded-full border transition ${
              activeCategory === 'All'
                ? 'bg-green-600/20 border-green-500/50 text-green-300'
                : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            ALL
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const cfg = CATEGORIES[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                id={`cat-${cat.toLowerCase().replace(/\s/g, '-')}`}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 text-[11px] font-mono font-bold px-3 py-1.5 rounded-full border transition ${
                  isActive
                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                    : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                }`}
              >
                <span className={isActive ? cfg.color : 'text-gray-600'}>{cfg.icon}</span>
                {cat.toUpperCase()}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-gray-600 font-mono">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
          {search ? ` for "${search}"` : ''}
        </p>
        {(search || activeCategory !== 'All') && (
          <button
            type="button"
            onClick={() => { setSearch(''); setActiveCategory('All'); }}
            className="text-[11px] font-mono text-gray-500 hover:text-green-400 transition"
          >
            Clear filters ×
          </button>
        )}
      </div>

      {/* Skeletons */}
      {showSkeletons && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* No results */}
      {!showSkeletons && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 gap-4 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
            <Search className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-sm font-mono text-gray-500">No contacts match your search</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setActiveCategory('All'); }}
            className="text-xs font-mono text-green-400 hover:text-green-300 transition"
          >
            Clear search
          </button>
        </motion.div>
      )}

      {/* Grouped view (All categories) */}
      {!showSkeletons && grouped && (
        <div className="space-y-8">
          {ALL_CATEGORIES.filter((cat) => grouped[cat]?.length).map((cat) => {
            const cfg = CATEGORIES[cat];
            const entries = grouped[cat]!;
            return (
              <motion.section
                key={cat}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-7 h-7 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                    <span className={cfg.color}>{cfg.icon}</span>
                  </div>
                  <h3 className={`text-xs font-mono font-bold tracking-widest uppercase ${cfg.color}`}>
                    {cat}
                  </h3>
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-[10px] text-gray-600 font-mono">{entries.length}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <AnimatePresence>
                    {entries.map((e) => (
                      <ContactCard key={e.id} entry={e} />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      {/* Filtered flat view (single category or search) */}
      {!showSkeletons && !grouped && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((e) => (
              <ContactCard key={e.id} entry={e} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 bg-[#111827] border border-gray-800 rounded-xl p-4 flex items-start gap-3"
      >
        <ExternalLink className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-mono font-bold text-gray-500 mb-0.5">DATA SOURCE</p>
          <p className="text-xs text-gray-600">
            Contact information sourced from Government of India official portals —
            NDMA, MHA, Ministry of Health & Family Welfare. Verify numbers with local
            authorities before use in non-emergency situations.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
