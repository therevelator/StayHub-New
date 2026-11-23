import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './console.css';
import api from '../../services/api';
import {
  FILTERS, FILTER_GROUPS, filterById, amenityTags, cancellationInfo, TONE_TEXT, distanceKm,
  firstSentence, lowestNightly, money, readTrip, stayImage, tripQuery, tripSummary, typeLabel,
} from './consoleUtils';
import { BackLink, ConsoleCheckbox, Mono, StayImg, ToggleChip, Toolbar } from './ConsoleUI';

// A2 — Results (Booking Console concept 1a).
// One surface where the list and the map are the same query.

const useIsWide = () => {
  const query = '(min-width: 1100px)';
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setWide(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
};

const list = (value) => (value ? value.split(',').filter(Boolean) : []);

// ---- map ---------------------------------------------------------------------
const pinIcon = (label, active) =>
  L.divIcon({
    className: 'console-pin',
    iconSize: [0, 0],
    html: `<div style="display:inline-block;transform:translate(-50%,-50%);white-space:nowrap;border-radius:99px;padding:5px 10px;font:600 12px Inter,system-ui,sans-serif;box-shadow:0 4px 10px -4px rgba(0,0,0,.3);border:1px solid ${
      active ? '#0E2A26' : '#DEE2E6'
    };background:${active ? '#0E2A26' : '#fff'};color:${active ? '#fff' : '#1B1F1D'}">${label}</div>`,
  });

const MapBehaviour = ({ points, fitKey, visibleKey, onDragEnd }) => {
  const map = useMap();
  useMapEvents({ dragend: () => onDragEnd(map.getCenter()) });

  // Leaflet needs a nudge when its container changes size or becomes visible.
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [map, visibleKey]);

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);
  return null;
};

const ResultsMap = ({ stays, hoveredId, onHover, onOpen, onDragEnd, center, visibleKey }) => {
  const points = stays.map((s) => [s.lat, s.lon]);
  const fitKey = stays.map((s) => s.id).join(',');
  return (
    <div className="relative h-full w-full bg-map-base">
      <MapContainer center={center} zoom={12} className="h-full w-full" zoomControl={false} attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBehaviour points={points.length ? points : [center]} fitKey={fitKey} visibleKey={visibleKey} onDragEnd={onDragEnd} />
        {stays.map((s) => (
          <Marker
            key={`${s.id}-${hoveredId === s.id}`}
            position={[s.lat, s.lon]}
            icon={pinIcon(s.shownPrice !== null ? money(s.shownPrice) : s.name, hoveredId === s.id)}
            zIndexOffset={hoveredId === s.id ? 1000 : 0}
            eventHandlers={{
              click: () => onOpen(s.id),
              mouseover: () => onHover(s.id),
              mouseout: () => onHover(null),
            }}
          />
        ))}
      </MapContainer>
      <div className="absolute left-3 bottom-6 z-[500] bg-white border border-gray-200 rounded-[10px] px-3 py-2 text-[12px] text-gray-700 shadow-map-pin max-w-[240px] pointer-events-none">
        Drag the map and the list reorders by distance from its centre
      </div>
    </div>
  );
};

// ---- filters (the rail is the docked variant of the sheet) ----------------------
const PriceRange = ({ bounds, value, onChange, median, city }) => {
  const [lo, hi] = value;
  const span = Math.max(1, bounds[1] - bounds[0]);
  const pct = (v) => ((v - bounds[0]) / span) * 100;
  return (
    <div className="flex flex-col gap-2">
      <Mono className="text-gray-500">Nightly price</Mono>
      <div className="text-[13px] font-semibold text-ink-700">{money(lo)} — {money(hi)}</div>
      <div className="relative h-4">
        <div className="absolute left-0 right-0 top-[6px] h-1 rounded-full bg-gray-200" />
        <div className="absolute top-[6px] h-1 rounded-full bg-primary-500" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range" aria-label="Minimum nightly price" className="console-range"
          min={bounds[0]} max={bounds[1]} value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
        />
        <input
          type="range" aria-label="Maximum nightly price" className="console-range"
          min={bounds[0]} max={bounds[1]} value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        />
      </div>
      {median !== null && (
        <div className="text-[11px] text-gray-500">Median{city ? ` in ${city}` : ''}: {money(median)}</div>
      )}
    </div>
  );
};

const DockedFilters = ({ items, active, toggleFilter, types, toggleType, priceBounds, price, setPrice, median, city }) => {
  const typeCounts = useMemo(() => {
    const counts = {};
    items.forEach((p) => { counts[p.property_type] = (counts[p.property_type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [items]);
  return (
    <>
      {priceBounds && priceBounds[1] > priceBounds[0] && (
        <PriceRange bounds={priceBounds} value={price} onChange={setPrice} median={median} city={city} />
      )}
      <div className="flex flex-col gap-1">
        <Mono className="text-gray-500 mb-1">Deal-breakers</Mono>
        {FILTERS.filter((f) => f.rail).map((f) => (
          <ConsoleCheckbox
            key={f.id} label={f.label} checked={active.includes(f.id)}
            onChange={() => toggleFilter(f.id)} count={items.filter(f.test).length}
          />
        ))}
      </div>
      {typeCounts.length > 0 && (
        <div className="flex flex-col gap-1">
          <Mono className="text-gray-500 mb-1">Property type</Mono>
          {typeCounts.map(([type, count]) => (
            <ConsoleCheckbox
              key={type} label={`${typeLabel(type)}s`} checked={types.includes(type)}
              onChange={() => toggleType(type)} count={count}
            />
          ))}
        </div>
      )}
    </>
  );
};

const FiltersSheet = ({ onClose, onClear, matchCount, active, toggleFilter, items, children }) => {
  // When the docked filters are shown inside the sheet (narrow screens), the
  // deal-breakers are already there as checkboxes: do not repeat them as chips.
  const chips = FILTERS.filter((f) => !(children && f.rail));
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement;
    el?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !el) return;
      const focusable = el.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1200] flex items-end" style={{ background: 'rgba(14,42,38,.34)' }} onMouseDown={onClose}>
      <div
        ref={ref} role="dialog" aria-modal="true" aria-label="Filters" tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-[16px] max-h-[82%] overflow-auto px-[26px] pt-[22px] pb-[26px] shadow-filters-sheet outline-none flex flex-col gap-5"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[19px] font-semibold text-ink-700 tracking-[-.01em]">What would ruin the stay?</h2>
          <button type="button" onClick={onClose} className="text-[13px] text-gray-600 hover:bg-gray-100 rounded-[7px] px-2 py-1.5">Close</button>
        </div>

        {children && <div className="flex flex-col gap-5 max-w-[360px]">{children}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
          {FILTER_GROUPS.filter((group) => chips.some((f) => f.group === group)).map((group) => (
            <div key={group} className="flex flex-col gap-2.5">
              <Mono className="text-gray-500">{group}</Mono>
              <div className="flex flex-wrap gap-2">
                {chips.filter((f) => f.group === group).map((f) => (
                  <ToggleChip key={f.id} on={active.includes(f.id)} onClick={() => toggleFilter(f.id)}>
                    {f.label} <span className="text-gray-400">· {items.filter(f.test).length}</span>
                  </ToggleChip>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap pt-1">
          <button type="button" onClick={onClear} className="text-[13px] underline text-gray-600 hover:text-ink-700">Clear everything</button>
          <div className="flex-1" />
          <span className="text-[13px] text-gray-600" aria-live="polite">
            {matchCount} {matchCount === 1 ? 'stay matches' : 'stays match'}
          </span>
          <button type="button" onClick={onClose} className="bg-primary-500 hover:bg-primary-600 text-white text-[14px] font-semibold rounded-[9px] px-[22px] py-[11px] transition-colors">
            Show them
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- list ----------------------------------------------------------------------
const SkeletonCard = () => (
  <div className="flex flex-col sm:flex-row border border-gray-200 rounded-[12px] overflow-hidden flex-none animate-pulse" aria-hidden="true">
    <div className="w-full h-40 sm:w-[176px] sm:h-[132px] bg-gray-100 flex-none" />
    <div className="flex-1 p-[14px] flex flex-col gap-2.5">
      <div className="h-4 w-2/5 bg-gray-100 rounded" />
      <div className="h-3 w-1/3 bg-gray-100 rounded" />
      <div className="h-3 w-4/5 bg-gray-100 rounded" />
    </div>
    <div className="sm:w-[150px] p-[14px] flex sm:flex-col items-end justify-center gap-2">
      <div className="h-5 w-16 bg-gray-100 rounded" />
      <div className="h-3 w-20 bg-gray-100 rounded" />
    </div>
  </div>
);

const ResultCard = ({ stay, nights, hovered, onHover, onOpen }) => {
  const cancel = cancellationInfo(stay.cancellation_policy);
  const tags = amenityTags(stay);
  const stars = parseFloat(stay.star_rating);
  return (
    <article
      role="link" tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      onMouseEnter={() => onHover(stay.id)} onMouseLeave={() => onHover(null)}
      className={`flex flex-col sm:flex-row border rounded-[12px] overflow-hidden bg-white cursor-pointer flex-none transition-[border-color,box-shadow] duration-[120ms] outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${
        hovered ? 'border-primary-300 shadow-card-hover' : 'border-gray-200 hover:border-primary-300 hover:shadow-card-hover'
      }`}
    >
      <div className="relative w-full h-40 sm:w-[176px] sm:h-auto flex-none">
        <StayImg src={stayImage(stay, 480, 320)} alt="" label={typeLabel(stay.property_type)} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="flex-1 min-w-0 p-[14px] flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[15px] font-semibold text-ink-700">{stay.name}</h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-gray-600 border border-gray-200 rounded-[4px] px-1.5 py-0.5">
            {typeLabel(stay.property_type)}
          </span>
        </div>
        <div className="text-[13px] text-gray-600">
          {[stay.city, stay.country].filter(Boolean).join(', ')}
          {stay.distance_km != null && ` · ${Number(stay.distance_km).toFixed(1)} km from your search`}
        </div>
        {stay.description && (
          <p className="text-[13px] text-gray-700 leading-[1.5]" style={{ textWrap: 'pretty' }}>{firstSentence(stay.description)}</p>
        )}
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-auto pt-1">
            {tags.map((t) => (
              <span key={t} className="text-[11px] text-primary-600 bg-primary-50 rounded-[5px] px-1.5 py-0.5">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="sm:w-[150px] flex-none border-t sm:border-t-0 sm:border-l border-gray-100 p-[14px] flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 sm:text-right">
        {stars > 0 && <div className="text-[13px] font-semibold text-ink-700">{stars}-star</div>}
        <div className="sm:text-right">
          {stay.shownPrice !== null ? (
            <>
              <div className="text-[21px] font-bold tracking-[-.02em] text-ink-700 leading-tight">
                {money(stay.shownPrice)}
                <span className="sr-only">{nights > 0 ? ` total for ${nights} night${nights === 1 ? '' : 's'}, lowest-priced room` : ' per night, lowest-priced room'}</span>
              </div>
              <div className="text-[11px] text-gray-500">{nights > 0 ? `from, ${nights} night${nights === 1 ? '' : 's'}` : 'from, per night'}</div>
            </>
          ) : (
            <div className="text-[13px] text-gray-500">Price on request</div>
          )}
          <div className={`text-[11px] mt-0.5 ${TONE_TEXT[cancel.tone]}`}>{cancel.label}</div>
        </div>
      </div>
    </article>
  );
};

// ---- screen ----------------------------------------------------------------------
export default function Results() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isWide = useIsWide();
  const trip = useMemo(() => readTrip(searchParams), [searchParams]);

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [hoveredId, setHoveredId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [note, setNote] = useState('');
  const [sortCenter, setSortCenter] = useState(null);

  const view = ['split', 'list', 'map'].includes(searchParams.get('view')) ? searchParams.get('view') : 'split';
  const shownView = isWide ? view : view === 'map' ? 'map' : 'list';
  const active = list(searchParams.get('f')).filter(filterById);
  const types = list(searchParams.get('types'));

  const setParams = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // ---- data
  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const params = { guests: trip.guests, radius: trip.radius };
      if (trip.lat !== null && trip.lon !== null) { params.lat = trip.lat; params.lon = trip.lon; }
      else if (trip.location) params.location = trip.location.split(',')[0].trim();
      const res = await api.get('/properties/search', { params });
      setItems(Array.isArray(res.data?.data) ? res.data.data : []);
      setStatus('ready');
    } catch {
      setStatus('error'); // keep the last good results on screen
    }
  }, [trip.guests, trip.radius, trip.lat, trip.lon, trip.location]);

  useEffect(() => { load(); }, [load]);

  const stays = useMemo(() => items.map((p) => {
    const nightly = lowestNightly(p);
    return {
      ...p,
      lat: parseFloat(p.latitude),
      lon: parseFloat(p.longitude),
      nightly,
      shownPrice: nightly === null ? null : trip.nights > 0 ? nightly * trip.nights : nightly,
    };
  }), [items, trip.nights]);

  const prices = useMemo(() => stays.map((s) => s.nightly).filter((n) => n !== null).sort((a, b) => a - b), [stays]);
  const priceBounds = prices.length ? [Math.floor(prices[0]), Math.ceil(prices[prices.length - 1])] : null;
  const median = prices.length ? prices[Math.floor((prices.length - 1) / 2)] : null;
  const price = priceBounds
    ? [
        Math.max(priceBounds[0], Number(searchParams.get('pmin') ?? priceBounds[0])),
        Math.min(priceBounds[1], Number(searchParams.get('pmax') ?? priceBounds[1])),
      ]
    : [0, 0];
  const priceNarrowed = priceBounds && (price[0] > priceBounds[0] || price[1] < priceBounds[1]);

  const filtered = useMemo(() => stays.filter((s) =>
    active.every((id) => filterById(id).test(s)) &&
    (types.length === 0 || types.includes(s.property_type)) &&
    (!priceNarrowed || s.nightly === null || (s.nightly >= price[0] && s.nightly <= price[1]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [stays, active.join(','), types.join(','), priceNarrowed, price[0], price[1]]);

  const sorted = useMemo(() => {
    if (!sortCenter) return filtered;
    const d = (s) => distanceKm(sortCenter.lat, sortCenter.lng, s.lat, s.lon);
    return [...filtered].sort((a, b) => d(a) - d(b));
  }, [filtered, sortCenter]);

  // Never a dead end: when the filters empty the list, drop the newest one and say so.
  useEffect(() => {
    if (status !== 'ready' || stays.length === 0 || filtered.length > 0) return;
    if (active.length) {
      const dropped = active[active.length - 1];
      setNote(`No stay has all of that — dropped “${filterById(dropped).label}”.`);
      setParams({ f: active.slice(0, -1).join(',') });
    } else if (types.length) {
      setNote('No stay of that type in this price range — showing every type.');
      setParams({ types: '' });
    } else if (priceNarrowed) {
      setNote('No stay in that price range — showing every price.');
      setParams({ pmin: '', pmax: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stays.length, filtered.length]);

  // ---- actions
  const toggleFilter = (id) => {
    setNote('');
    setParams({ f: (active.includes(id) ? active.filter((x) => x !== id) : [...active, id]).join(',') });
  };
  const toggleType = (type) => {
    setNote('');
    setParams({ types: (types.includes(type) ? types.filter((x) => x !== type) : [...types, type]).join(',') });
  };
  const setPrice = ([lo, hi]) => {
    setNote('');
    setParams({ pmin: lo > priceBounds[0] ? lo : '', pmax: hi < priceBounds[1] ? hi : '' });
  };
  const clearAll = () => { setNote(''); setParams({ f: '', types: '', pmin: '', pmax: '' }); };
  const openStay = (id) => navigate(`/stay/${id}?${tripQuery(searchParams)}`);

  const filterCount = active.length + types.length + (priceNarrowed ? 1 : 0);
  const city = trip.location ? trip.location.split(',')[0] : '';
  const mapCenter = trip.lat !== null && trip.lon !== null ? [trip.lat, trip.lon] : stays[0] ? [stays[0].lat, stays[0].lon] : [45.9432, 24.9668];
  const docked = (
    <DockedFilters
      items={stays} active={active} toggleFilter={toggleFilter} types={types} toggleType={toggleType}
      priceBounds={priceBounds} price={price} setPrice={setPrice} median={median} city={city}
    />
  );
  const views = isWide ? ['split', 'list', 'map'] : ['list', 'map'];
  const showSkeleton = status === 'loading' && items.length === 0;

  return (
    <div className="h-screen flex flex-col bg-white text-ink-700">
      <Toolbar>
        <BackLink onClick={() => navigate(`/console?${tripQuery(searchParams)}`)}>Edit search</BackLink>
        <span className="font-semibold">{tripSummary(trip)}</span>
        <span className="text-[13px] text-gray-600" aria-live="polite">
          {showSkeleton ? 'Cutting the list…' : `${sorted.length} ${sorted.length === 1 ? 'stay' : 'stays'} left after your filters`}
        </span>
        {status === 'error' && (
          <span className="text-[13px] text-secondary-600">
            Couldn’t refresh the list.{' '}
            <button type="button" onClick={load} className="underline">Retry</button>
          </span>
        )}
        <div className="flex-1" />
        <button
          type="button" onClick={() => setSheetOpen(true)}
          className="text-[13px] border border-gray-300 rounded-[8px] px-[13px] py-[7px] hover:border-primary-500 hover:text-primary-600 transition-colors"
        >
          Filters · {filterCount}
        </button>
        <div className="bg-gray-100 rounded-[8px] p-[3px] flex" role="tablist" aria-label="View">
          {views.map((v) => (
            <button
              key={v} type="button" role="tab" aria-selected={shownView === v}
              onClick={() => setParams({ view: v === 'split' ? '' : v })}
              className={`text-[13px] px-3 py-[5px] rounded-[6px] capitalize transition-colors ${
                shownView === v ? 'bg-white text-ink-700 shadow-sm' : 'text-gray-600 hover:text-ink-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </Toolbar>

      {(note || sortCenter) && (
        <div className="flex-none flex items-center gap-3 px-5 py-2 text-[12px] border-b border-gray-200 bg-surface-raised text-gray-700">
          {note && <span className="text-secondary-600">{note}</span>}
          {sortCenter && (
            <span>
              Sorted by distance from the map centre.{' '}
              <button type="button" className="underline" onClick={() => setSortCenter(null)}>Back to distance from your search</button>
            </span>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        {isWide && (
          <aside className="w-[212px] flex-none border-r border-gray-200 bg-surface-raised px-4 py-[18px] overflow-auto flex flex-col gap-5">
            {docked}
          </aside>
        )}

        <main className={`flex-1 min-w-0 overflow-auto p-[14px] flex-col gap-[10px] ${shownView === 'map' ? 'hidden' : 'flex'}`}>
          {showSkeleton && [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          {!showSkeleton && sorted.map((s) => (
            <ResultCard
              key={s.id} stay={s} nights={trip.nights}
              hovered={hoveredId === s.id} onHover={setHoveredId} onOpen={() => openStay(s.id)}
            />
          ))}
          {status === 'ready' && stays.length === 0 && (
            <div className="border border-gray-200 rounded-[12px] p-6 text-[14px] text-gray-700 flex flex-col gap-3 items-start">
              <div className="font-semibold text-ink-700">
                Nothing within {trip.radius} km{city ? ` of ${city}` : ''} sleeps {trip.guests}.
              </div>
              <div className="flex gap-2 flex-wrap">
                {trip.radius < 75 && (
                  <button type="button" onClick={() => setParams({ radius: 75 })} className="bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-semibold rounded-[8px] px-4 py-2">
                    Widen to 75 km
                  </button>
                )}
                {trip.guests > 1 && (
                  <button type="button" onClick={() => setParams({ guests: 1 })} className="border border-gray-300 hover:border-primary-500 text-[13px] rounded-[8px] px-4 py-2">
                    Search for 1 guest
                  </button>
                )}
                <button type="button" onClick={() => navigate(`/console?${tripQuery(searchParams)}`)} className="border border-gray-300 hover:border-primary-500 text-[13px] rounded-[8px] px-4 py-2">
                  Edit search
                </button>
              </div>
            </div>
          )}
        </main>

        <div className={shownView === 'list' ? 'hidden' : shownView === 'map' ? 'flex-1 min-w-0' : 'w-[420px] flex-none border-l border-gray-200'}>
          <ResultsMap
            stays={sorted} hoveredId={hoveredId} onHover={setHoveredId} onOpen={openStay}
            onDragEnd={setSortCenter} center={mapCenter} visibleKey={`${shownView}-${isWide}`}
          />
        </div>
      </div>

      {sheetOpen && (
        <FiltersSheet
          onClose={() => setSheetOpen(false)} onClear={clearAll} matchCount={sorted.length}
          active={active} toggleFilter={toggleFilter} items={stays}
        >
          {!isWide ? docked : null}
        </FiltersSheet>
      )}
    </div>
  );
}
