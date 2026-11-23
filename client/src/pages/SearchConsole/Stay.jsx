import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { roomImage } from '../../services/countryImages';
import {
  bedsLabel, cancellationInfo, TONE_TEXT, isRoomFree, money, nightsList, readTrip, roomNightly,
  stayImage, stayTotal, toArray, tripQuery, typeLabel,
} from './consoleUtils';
import { BackLink, Mono, StayImg, Toolbar } from './ConsoleUI';

// A3 — Rooms compare (Booking Console concept 1a).
// Choose a room from a spec sheet, not a carousel.

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const countWord = (n) => COUNT_WORDS[n] ?? String(n);
const hhmm = (time) => (time ? String(time).slice(0, 5) : null);
const pretty = (text) => String(text || '').replace(/_/g, ' ');

const GRID = 'md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_150px] md:items-center';

const Cell = ({ label, children, className = '' }) => (
  <div className={`flex md:block items-baseline justify-between gap-3 py-1 md:py-0 ${className}`}>
    <Mono className="text-gray-500 md:hidden">{label}</Mono>
    <div>{children}</div>
  </div>
);

export default function Stay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const trip = useMemo(() => readTrip(searchParams), [searchParams]);
  const nights = useMemo(() => nightsList(trip.checkIn, trip.checkOut), [trip.checkIn, trip.checkOut]);

  const [property, setProperty] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | missing
  const [availability, setAvailability] = useState(null); // { [roomId]: { [date]: {status, price} } } | null
  const [selectedId, setSelectedId] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api.get(`/properties/${id}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.data) { setProperty(res.data.data); setStatus('ready'); } else setStatus('missing');
      })
      .catch((err) => { if (!cancelled) setStatus(err.response?.status === 404 ? 'missing' : 'error'); });
    return () => { cancelled = true; };
  }, [id]);

  const rooms = useMemo(() => toArray(property?.rooms).filter((r) => r && r.id), [property]);

  // Per-night availability and prices for every room of this stay (needs a signed-in guest).
  useEffect(() => {
    setAvailability(null);
    if (!isAuthenticated || !rooms.length || nights.length === 0) return undefined;
    let cancelled = false;
    api.get(`/properties/${id}/rooms/${rooms[0].id}/availability`, { params: { startDate: trip.checkIn, endDate: trip.checkOut } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        const map = {};
        [data?.requested_room, ...(data?.other_rooms || [])].filter(Boolean).forEach((r) => { map[r.id] = r.availability || {}; });
        setAvailability(map);
      })
      .catch(() => { if (!cancelled) setAvailability(null); });
    return () => { cancelled = true; };
  }, [id, isAuthenticated, rooms, nights, trip.checkIn, trip.checkOut]);

  const rows = useMemo(() => rooms.map((room) => {
    const nightly = roomNightly(room);
    const known = availability !== null && nights.length > 0;
    const free = known ? isRoomFree(availability[room.id], nights) : true;
    const total = nights.length > 0 && nightly !== null ? stayTotal(room, availability?.[room.id], nights) : null;
    return { room, nightly, free, total, fits: (room.max_occupancy || 0) >= trip.guests };
  }), [rooms, availability, nights, trip.guests]);

  // Default selection: the first free room that sleeps the party.
  useEffect(() => {
    if (!rows.length) return;
    const current = rows.find((r) => r.room.id === selectedId);
    if (current && current.free) return;
    const pick = rows.find((r) => r.free && r.fits) || rows.find((r) => r.free) || null;
    setSelectedId(pick ? pick.room.id : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const selected = rows.find((r) => r.room.id === selectedId) || null;
  const freeCount = rows.filter((r) => r.free).length;
  const availabilityKnown = availability !== null && nights.length > 0;

  const setTripParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  if (status === 'loading') {
    return (
      <div className="h-screen flex flex-col bg-white">
        <Toolbar><BackLink onClick={() => navigate(-1)}>Results</BackLink></Toolbar>
        <div className="p-5 flex flex-col gap-4 animate-pulse" aria-hidden="true">
          <div className="h-[190px] bg-gray-100 rounded-[10px]" />
          <div className="h-5 w-1/3 bg-gray-100 rounded" />
          <div className="h-48 bg-gray-100 rounded-[12px]" />
        </div>
      </div>
    );
  }
  if (status !== 'ready' || !property) {
    return (
      <div className="h-screen flex flex-col bg-white text-ink-700">
        <Toolbar><BackLink onClick={() => navigate(`/search?${tripQuery(searchParams)}`)}>Results</BackLink></Toolbar>
        <div className="p-8 text-[14px]">
          {status === 'missing' ? 'This stay is no longer listed.' : 'We could not load this stay.'}{' '}
          {status === 'error' && <button type="button" className="underline" onClick={() => window.location.reload()}>Retry</button>}
        </div>
      </div>
    );
  }

  const stars = parseFloat(property.star_rating);
  const meta = [
    stars > 0 ? `${stars}-star` : null,
    typeLabel(property.property_type),
    hhmm(property.check_in_time) ? `check-in from ${hhmm(property.check_in_time)}` : null,
  ].filter(Boolean).join(' · ');

  const gallery = [
    ...toArray(property.photos).map((p) => ({ src: typeof p === 'string' ? p : p?.url, label: (p && p.caption) || 'photo' })),
    ...rooms.map((r) => ({ src: roomImage(r, 640, 420), label: r.name })),
  ].filter((g) => g.src);
  if (!gallery.length) gallery.push({ src: stayImage(property, 960, 420), label: typeLabel(property.property_type) });
  while (gallery.length < 3) gallery.push({ src: null, label: 'no photo yet' });

  const amenityNames = toArray(property.amenities).map((a) => (typeof a === 'string' ? a : a?.amenity)).filter(Boolean);
  const hasAmenity = (re) => amenityNames.some((a) => re.test(a));
  const facts = [
    ['Check-in', hhmm(property.check_in_time) ? `From ${hhmm(property.check_in_time)}` : null],
    ['Check-out', hhmm(property.check_out_time) ? `Until ${hhmm(property.check_out_time)}` : null],
    ['Minimum stay', property.min_stay ? `${property.min_stay} night${property.min_stay === 1 ? '' : 's'}` : null],
    ['Air conditioning', hasAmenity(/air.?con/i) ? 'Yes' : null],
    ['Wi-Fi', hasAmenity(/wi-?fi|internet/i) ? 'Yes' : null],
    ['Parking', hasAmenity(/parking/i) ? 'On site' : null],
    ['Languages', toArray(property.languages_spoken).slice(0, 3).join(', ') || null],
  ].filter(([, v]) => v);

  const policies = [
    property.cancellation_policy ? { text: cancellationInfo(property.cancellation_policy).label, tone: cancellationInfo(property.cancellation_policy).tone } : null,
    property.pet_policy ? { text: `Pets: ${pretty(property.pet_policy)}`, tone: /^(no|not)/i.test(property.pet_policy) ? 'bad' : 'good' } : null,
    property.event_policy ? { text: `Events: ${pretty(property.event_policy)}`, tone: /^(no|not)/i.test(property.event_policy) ? 'bad' : 'good' } : null,
  ].filter(Boolean);
  const chipTone = { good: 'bg-primary-50 text-primary-600', bad: 'bg-secondary-50 text-secondary-600', muted: 'bg-gray-100 text-gray-700' };

  const sameNightly = selected && nights.length > 0 && selected.total !== null && selected.nightly !== null
    && Math.abs(selected.total - selected.nightly * nights.length) < 0.005;
  const cancel = selected ? cancellationInfo(selected.room.cancellation_policy || property.cancellation_policy) : null;
  const nightsText = `${nights.length} night${nights.length === 1 ? '' : 's'}`;
  const guestsText = `${trip.guests} guest${trip.guests === 1 ? '' : 's'}`;
  const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);

  let cta = { label: 'Book in 3 fields', disabled: false, onClick: () => navigate(`/book/${selected.room.id}?${tripQuery(searchParams, { property: id })}`) };
  if (!selected) cta = { label: 'No room free', disabled: true };
  else if (nights.length === 0) cta = { label: 'Pick your dates', disabled: true };
  else if (!isAuthenticated) cta = { label: 'Sign in to book', disabled: false, onClick: () => navigate(`/login?returnUrl=${returnUrl}`) };

  return (
    <div className="h-screen flex flex-col bg-white text-ink-700">
      <Toolbar>
        <BackLink onClick={() => navigate(`/search?${tripQuery(searchParams)}`)}>Results</BackLink>
        <span className="font-semibold">{property.name}{property.city ? ` · ${property.city}` : ''}</span>
        <span className="text-[13px] text-gray-600">{meta}</span>
      </Toolbar>

      <div className="flex-1 min-h-0 overflow-auto flex flex-col">
        <div className="flex-none px-5 py-[18px] flex flex-col gap-[18px]">
          {/* Gallery */}
          <div className="flex-none grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-[6px] h-[190px]">
            {gallery.slice(0, 3).map((g, i) => (
              <div key={i} className={`relative rounded-[10px] overflow-hidden ${i === 2 ? 'hidden md:block' : ''}`}>
                <StayImg src={g.src} alt="" label={g.label} className="absolute inset-0 w-full h-full" />
              </div>
            ))}
          </div>

          {/* Heading + trip controls */}
          <div className="flex-none flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-[19px] font-semibold tracking-[-.01em]">
                {availabilityKnown
                  ? `${countWord(freeCount)} ${freeCount === 1 ? 'room is' : 'rooms are'} free for your dates`
                  : `${countWord(rooms.length)} ${rooms.length === 1 ? 'room' : 'rooms'} at this stay`}
              </h1>
              <p className="text-[13px] text-gray-600">
                {nights.length === 0
                  ? 'Pick your dates to see totals and availability.'
                  : !isAuthenticated
                    ? <>Compare them like a spec sheet, not a carousel. <button type="button" className="underline text-primary-600" onClick={() => navigate(`/login?returnUrl=${returnUrl}`)}>Sign in</button> to check them against your dates.</>
                    : 'Compare them like a spec sheet, not a carousel.'}
              </p>
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <label className="flex flex-col gap-1">
                <Mono className="text-gray-500">Check in</Mono>
                <input type="date" value={trip.checkIn} onChange={(e) => setTripParam('checkIn', e.target.value)}
                  className="border border-gray-300 rounded-[8px] px-2 py-1.5 text-[13px] outline-none focus:border-primary-500" />
              </label>
              <label className="flex flex-col gap-1">
                <Mono className="text-gray-500">Check out</Mono>
                <input type="date" value={trip.checkOut} min={trip.checkIn || undefined} onChange={(e) => setTripParam('checkOut', e.target.value)}
                  className="border border-gray-300 rounded-[8px] px-2 py-1.5 text-[13px] outline-none focus:border-primary-500" />
              </label>
              <label className="flex flex-col gap-1">
                <Mono className="text-gray-500">Guests</Mono>
                <input type="number" min={1} max={20} value={trip.guests} onChange={(e) => setTripParam('guests', e.target.value)}
                  className="border border-gray-300 rounded-[8px] px-2 py-1.5 text-[13px] w-[72px] outline-none focus:border-primary-500" />
              </label>
            </div>
          </div>

          {/* Compare table (stacked cards below 760px) */}
          <div className="flex-none border border-gray-200 rounded-[12px] overflow-hidden">
            <div className={`hidden ${GRID} bg-surface-raised px-4 py-2.5 border-b border-gray-100`}>
              {['Room', 'Size', 'Sleeps', 'Cancellation', 'Breakfast', nights.length ? nightsText : 'Per night'].map((h, i) => (
                <Mono key={h} className={`text-gray-500 ${i === 5 ? 'md:text-right' : ''}`}>{h}</Mono>
              ))}
            </div>
            {rows.length === 0 && <div className="px-4 py-6 text-[14px] text-gray-600">This stay has no rooms listed yet.</div>}
            {rows.map(({ room, nightly, free, total }, index) => {
              const isSelected = room.id === selectedId;
              const policy = cancellationInfo(room.cancellation_policy || property.cancellation_policy);
              const sub = [bedsLabel(room), room.view_type && !/^no view$/i.test(room.view_type) ? pretty(room.view_type) : null].filter(Boolean).join(' · ');
              return (
                <div
                  key={room.id}
                  className={`${GRID} px-4 py-3 ${index ? 'border-t border-gray-100' : ''} ${isSelected ? 'bg-primary-50' : ''} ${free ? '' : 'opacity-60'}`}
                >
                  <div className="pb-1 md:pb-0">
                    <div className="text-[14px] font-semibold">{room.name}</div>
                    {sub && <div className="text-[12px] text-gray-600">{sub}</div>}
                    {room.max_occupancy < trip.guests && <div className="text-[12px] text-secondary-600">Sleeps fewer than your {guestsText}</div>}
                  </div>
                  <Cell label="Size"><span className="text-[13px]">{room.room_size ? `${room.room_size} m²` : '—'}</span></Cell>
                  <Cell label="Sleeps"><span className="text-[13px]">{room.max_occupancy} guest{room.max_occupancy === 1 ? '' : 's'}</span></Cell>
                  <Cell label="Cancellation"><span className={`text-[13px] ${TONE_TEXT[policy.tone]}`}>{policy.label}</span></Cell>
                  <Cell label="Breakfast">
                    <span className={`text-[13px] ${room.includes_breakfast ? 'text-primary-600' : 'text-gray-500'}`}>
                      {room.includes_breakfast ? 'Breakfast in' : 'Not included'}
                    </span>
                  </Cell>
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-1.5 pt-2 md:pt-0">
                    <div className="md:text-right">
                      {nightly === null ? (
                        <div className="text-[13px] text-gray-500">Price on request</div>
                      ) : total !== null ? (
                        <>
                          <div className="text-[11px] text-gray-500">{money(nightly)}/night</div>
                          <div className="text-[17px] font-bold leading-tight">
                            {money(total)}<span className="sr-only"> total for {nightsText}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[17px] font-bold leading-tight">{money(nightly)}<span className="sr-only"> per night</span></div>
                      )}
                    </div>
                    <button
                      type="button" disabled={!free || nightly === null}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedId(room.id)}
                      className={`text-[12px] font-semibold rounded-[7px] px-[13px] py-[7px] border transition-colors min-h-[32px] disabled:cursor-not-allowed ${
                        isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-gray-300 text-ink-700 hover:border-primary-500'
                      }`}
                    >
                      {!free ? 'Booked for these dates' : isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Good to know + house facts */}
          <div className="flex-none grid grid-cols-1 md:grid-cols-2 gap-[18px]">
            <section className="border border-gray-200 rounded-[12px] p-4 flex flex-col gap-3">
              <h2 className="text-[15px] font-semibold">Good to know</h2>
              {property.house_rules
                ? <p className="text-[13px] text-gray-700 leading-[1.6] whitespace-pre-line" style={{ textWrap: 'pretty' }}>{property.house_rules}</p>
                : <p className="text-[13px] text-gray-600">The host has not added house rules.</p>}
              {policies.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {policies.map((p) => (
                    <span key={p.text} className={`text-[12px] rounded-[6px] px-2 py-1 ${chipTone[p.tone]}`}>{p.text}</span>
                  ))}
                </div>
              )}
            </section>
            <section className="border border-gray-200 rounded-[12px] p-4 flex flex-col">
              <h2 className="text-[15px] font-semibold mb-1">House facts</h2>
              {facts.length === 0 && <p className="text-[13px] text-gray-600">No details listed yet.</p>}
              {facts.map(([k, v], i) => (
                <div key={k} className={`flex justify-between gap-4 py-2 text-[13px] ${i ? 'border-t border-dashed border-gray-200' : ''}`}>
                  <span className="text-gray-600">{k}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* Sticky booking bar: sticks to the bottom of the scroll container */}
        <div className="sticky bottom-0 mt-auto flex-none bg-white border-t border-gray-200 shadow-sticky-bar px-5 py-[14px] z-10">
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out ${breakdownOpen && selected && nights.length ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            aria-hidden={!breakdownOpen}
          >
            <div className="overflow-hidden">
              {selected && nights.length > 0 && (
                <div className="flex gap-[26px] flex-wrap pb-3 mb-3 border-b border-dashed border-gray-200 text-[13px]">
                  <div><div className="text-gray-600">{sameNightly ? `${nightsText} × ${money(selected.nightly)}` : `${nightsText}, priced per night`}</div><div className="font-semibold">{money(selected.total)}</div></div>
                  <div><div className="text-gray-600">StayHub service fee</div><div className="font-semibold text-primary-600">{money(0)}</div></div>
                  <div><div className="text-gray-600">Due today</div><div className="font-semibold text-secondary-600">{money(0)}</div></div>
                  <div><div className="text-gray-600">Pay at the property</div><div className="font-semibold">{money(selected.total)}</div></div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-[13px] text-gray-600 truncate">
                {selected ? [selected.room.name, nights.length ? nightsText : null, guestsText].filter(Boolean).join(' · ') : 'No room selected'}
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <div className="text-[24px] font-bold tracking-[-.02em] leading-tight">
                  {selected && selected.total !== null ? money(selected.total) : selected && selected.nightly !== null ? `${money(selected.nightly)}/night` : '—'}
                </div>
                {selected && nights.length > 0 && (
                  <button type="button" onClick={() => setBreakdownOpen((v) => !v)} aria-expanded={breakdownOpen} className="text-[12px] underline text-primary-600">
                    {breakdownOpen ? 'Hide the maths' : 'Show every line'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1" />
            {cancel && <div className={`text-[12px] max-w-[260px] text-right hidden sm:block ${TONE_TEXT[cancel.tone]}`}>{cancel.label}. Nothing is charged online — you pay at the property.</div>}
            <button
              type="button" disabled={cta.disabled} onClick={cta.onClick}
              className="bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[15px] font-semibold rounded-[10px] px-[30px] py-[14px] transition-colors whitespace-nowrap"
            >
              {cta.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
