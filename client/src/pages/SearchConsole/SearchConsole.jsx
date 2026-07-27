import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// A1 — Search (Booking Console concept 1a).
// Full-bleed dark hero: state the shape of the trip in one bar, land on a short list.
const MONO = 'font-mono uppercase text-[10px] tracking-[0.10em]';

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const QUICK_CHIPS = [
  'Tonight, under €100',
  'Same hotel as May',
  'Near the office, quiet',
  'Two rooms, one floor',
];

export default function SearchConsole() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('Bucharest, Romania');
  const [suggestions, setSuggestions] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [panel, setPanel] = useState(null); // 'loc' | 'when' | 'who' | null
  const [loading, setLoading] = useState(false);
  const barRef = useRef(null);
  const locTimer = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (barRef.current && !barRef.current.contains(e.target)) setPanel(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const queryLoc = (q) => {
    if (locTimer.current) clearTimeout(locTimer.current);
    if (!q || q.trim().length < 3) { setSuggestions([]); return; }
    locTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await r.json();
        const seen = new Set();
        const opts = [];
        for (const d of data) {
          const a = d.address || {};
          const place = a.city || a.town || a.village || a.municipality || a.county || d.name;
          const label = [place, a.country].filter(Boolean).join(', ') || d.display_name;
          if (place && !seen.has(label)) { seen.add(label); opts.push(label); }
        }
        setSuggestions(opts);
      } catch { /* ignore */ }
    }, 300);
  };

  const runSearch = async (overrideLocation) => {
    const loc = (overrideLocation || location).trim();
    if (!loc) return;
    setLoading(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(loc)}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const d = await r.json();
      const params = new URLSearchParams();
      params.set('location', loc);
      if (d[0]) { params.set('lat', d[0].lat); params.set('lon', d[0].lon); }
      params.set('radius', '25');
      params.set('guests', String(adults));
      params.set('rooms', String(rooms));
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
      navigate(`/search?${params.toString()}`);
    } catch {
      navigate(`/search?location=${encodeURIComponent(loc)}&guests=${adults}`);
    } finally {
      setLoading(false);
    }
  };

  const whenLabel = checkIn && checkOut ? `${fmtDate(checkIn)} → ${fmtDate(checkOut)}` : 'Add dates';
  const whoLabel = `${adults} adult${adults > 1 ? 's' : ''} · ${rooms} room${rooms > 1 ? 's' : ''}`;

  const Field = ({ flex, active, label, value, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      style={{ flex }}
      className={`text-left px-4 py-3 flex flex-col gap-[3px] rounded-[8px] ${active ? 'bg-gray-50' : ''}`}
    >
      <span className={`${MONO} text-gray-400`}>{label}</span>
      {value !== undefined
        ? <span className="text-[15px] font-semibold text-ink-700 truncate">{value}</span>
        : children}
    </button>
  );

  const Stepper = ({ label, value, set, min }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-[14px] text-ink-700">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:border-primary-500 disabled:opacity-40"
          disabled={value <= min}>−</button>
        <span className="w-5 text-center text-[15px] font-semibold text-ink-700">{value}</span>
        <button type="button" onClick={() => set(value + 1)}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:border-primary-500">+</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col text-white" style={{ background: '#0E2A26' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-[34px] py-[22px] border-b border-white/[0.08]">
        <div className="text-[17px] font-bold tracking-[-.01em]">StayHub</div>
        <div className="flex gap-[26px] text-[13px] text-white/[0.62]">
          <span className="text-white">Stays</span>
          <span onClick={() => navigate('/trips')} className="cursor-pointer hover:text-white">Trips</span>
          <span className="cursor-pointer hover:text-white">Saved</span>
          <span onClick={() => navigate('/login')} className="text-white cursor-pointer">Ana P.</span>
        </div>
      </div>

      {/* Center block */}
      <div className="flex-1 flex flex-col justify-center px-[34px] gap-[34px] w-full max-w-[1080px]">
        <div className="max-w-[760px] flex flex-col gap-3">
          <h1 className="text-[clamp(30px,7vw,44px)] leading-[1.05] font-bold tracking-[-.03em]" style={{ textWrap: 'pretty' }}>
            Tell us the shape of the trip. We'll cut the list to eleven.
          </h1>
          <p className="text-[15px] text-white/60 max-w-[520px]">
            No infinite scroll, no 400 results. Every field you fill deletes hotels that were never going to work.
          </p>
        </div>

        {/* Search bar */}
        <div ref={barRef} className="relative bg-white rounded-[14px] p-2 flex flex-col sm:flex-row items-stretch gap-1 sm:gap-px max-w-[1000px] shadow-hero-search">
          {/* Where */}
          <div style={{ flex: 2.1 }} className="relative px-4 py-3 flex flex-col gap-[3px]">
            <span className={`${MONO} text-gray-400`}>Where</span>
            <input
              value={location}
              onFocus={() => setPanel('loc')}
              onChange={(e) => { setLocation(e.target.value); queryLoc(e.target.value); setPanel('loc'); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPanel(null); runSearch(); } }}
              placeholder="Where to?"
              className="text-[15px] font-semibold text-ink-700 outline-none bg-transparent w-full placeholder:text-gray-300 placeholder:font-normal"
            />
            {panel === 'loc' && suggestions.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white rounded-[10px] shadow-lg border border-gray-200 max-h-56 overflow-auto text-ink-700">
                {suggestions.map((s, i) => (
                  <button key={i} type="button"
                    onClick={() => { setLocation(s); setSuggestions([]); setPanel(null); }}
                    className="w-full text-left px-3 py-2 text-[14px] hover:bg-gray-50">{s}</button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:block w-px bg-gray-200 my-2" />

          {/* When */}
          <Field flex={2} active={panel === 'when'} label="When" value={whenLabel}
            onClick={() => setPanel(panel === 'when' ? null : 'when')} />

          <div className="hidden sm:block w-px bg-gray-200 my-2" />

          {/* Who */}
          <Field flex={1.4} active={panel === 'who'} label="Who" value={whoLabel}
            onClick={() => setPanel(panel === 'who' ? null : 'who')} />

          {/* Submit */}
          <button type="button" onClick={() => runSearch()} disabled={loading}
            className="flex-none m-1 rounded-[10px] bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-[15px] font-semibold px-6 py-3 whitespace-nowrap transition-colors">
            {loading ? 'Cutting…' : 'Cut the list'}
          </button>

          {/* When popover */}
          {panel === 'when' && (
            <div className="absolute z-20 top-full left-2 right-2 sm:left-auto sm:right-auto sm:w-[360px] mt-2 bg-white rounded-[12px] shadow-lg border border-gray-200 p-4 text-ink-700"
              style={{ left: 'clamp(8px, 34%, 40%)' }}>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className={`${MONO} text-gray-400`}>Check in</span>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                    className="border border-gray-300 rounded-[8px] px-2 py-2 text-[14px] outline-none focus:border-primary-500" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={`${MONO} text-gray-400`}>Check out</span>
                  <input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)}
                    className="border border-gray-300 rounded-[8px] px-2 py-2 text-[14px] outline-none focus:border-primary-500" />
                </label>
              </div>
              <button type="button" onClick={() => setPanel(null)}
                className="mt-3 w-full bg-primary-500 hover:bg-primary-600 text-white text-[14px] font-semibold rounded-[8px] py-2">Done</button>
            </div>
          )}

          {/* Who popover */}
          {panel === 'who' && (
            <div className="absolute z-20 top-full right-2 sm:right-[110px] mt-2 w-[260px] bg-white rounded-[12px] shadow-lg border border-gray-200 p-4 text-ink-700">
              <Stepper label="Adults" value={adults} set={setAdults} min={1} />
              <div className="border-t border-gray-100" />
              <Stepper label="Rooms" value={rooms} set={setRooms} min={1} />
              <button type="button" onClick={() => setPanel(null)}
                className="mt-3 w-full bg-primary-500 hover:bg-primary-600 text-white text-[14px] font-semibold rounded-[8px] py-2">Done</button>
            </div>
          )}
        </div>

        {/* Quick chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`${MONO} text-white/60`}>Start from</span>
          {QUICK_CHIPS.map((c) => (
            <button key={c} type="button" onClick={() => runSearch('Bucharest, Romania')}
              className="border border-white/[0.18] rounded-full px-[15px] py-2 text-[13px] hover:bg-white/10 transition-colors">
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Footer strip */}
      <div className="px-[34px] py-[18px] border-t border-white/[0.08] flex gap-[38px] text-[12px] text-white/[0.45] flex-wrap">
        <span>Guests pay no StayHub service fee</span>
        <span>Prices include VAT</span>
        <span>Free cancellation shown before you click, not after</span>
      </div>
    </div>
  );
}
