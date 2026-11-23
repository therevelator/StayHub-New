import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { roomImage } from '../../services/countryImages';
import {
  cancellationInfo, TONE_TEXT, fmtDay, isRoomFree, money, nightsList, readTrip, roomNightly,
  stayTotal, toArray, tripQuery,
} from './consoleUtils';
import { BackLink, Mono, StayImg, Toolbar } from './ConsoleUI';

// A4 — Checkout (Booking Console concept 1a).
// Finish in three fields. No card is collected: the stay is paid at the property.

const ARRIVAL_TIMES = ['Before 15:00', '15:00 – 18:00', '18:00 – 21:00', 'After 21:00', 'Not sure yet'];

const Field = ({ label, hint, children }) => (
  <label className="flex flex-col gap-1.5">
    <Mono className="text-gray-500">{label}</Mono>
    {children}
    {hint && <span className="text-[12px] text-ink-500">{hint}</span>}
  </label>
);
const inputClass =
  'border border-gray-300 rounded-[9px] px-[14px] py-[13px] text-[15px] text-ink-700 outline-none transition-colors hover:border-primary-300 focus:border-primary-500 bg-white w-full';

export default function Checkout() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const trip = useMemo(() => readTrip(searchParams), [searchParams]);
  const propertyId = searchParams.get('property');
  const nights = useMemo(() => nightsList(trip.checkIn, trip.checkOut), [trip.checkIn, trip.checkOut]);

  const [property, setProperty] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [guestName, setGuestName] = useState(() => [user?.firstName, user?.lastName].filter(Boolean).join(' '));
  const [arrival, setArrival] = useState(ARRIVAL_TIMES[1]);
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !propertyId) return undefined;
    let cancelled = false;
    setStatus('loading');
    Promise.all([
      api.get(`/properties/${propertyId}`),
      nights.length
        ? api.get(`/properties/${propertyId}/rooms/${roomId}/availability`, { params: { startDate: trip.checkIn, endDate: trip.checkOut } })
        : Promise.resolve(null),
    ])
      .then(([prop, avail]) => {
        if (cancelled) return;
        setProperty(prop.data?.data || null);
        setAvailability(avail?.data?.data?.requested_room?.availability || null);
        setStatus(prop.data?.data ? 'ready' : 'error');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [isAuthenticated, propertyId, roomId, nights.length, trip.checkIn, trip.checkOut]);

  if (!isAuthenticated) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  }

  const backToStay = () => navigate(propertyId ? `/stay/${propertyId}?${tripQuery(searchParams)}` : '/console');
  const room = toArray(property?.rooms).find((r) => String(r.id) === String(roomId)) || null;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white">
        <Toolbar><BackLink onClick={backToStay}>Rooms</BackLink></Toolbar>
        <div className="p-10 max-w-[520px] flex flex-col gap-4 animate-pulse" aria-hidden="true">
          <div className="h-8 w-2/3 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded-[9px]" />
          <div className="h-12 bg-gray-100 rounded-[9px]" />
          <div className="h-12 bg-gray-100 rounded-[9px]" />
        </div>
      </div>
    );
  }
  if (status === 'error' || !property || !room || nights.length === 0) {
    return (
      <div className="min-h-screen bg-white text-ink-700">
        <Toolbar><BackLink onClick={backToStay}>Rooms</BackLink></Toolbar>
        <div className="p-10 text-[14px]">
          {nights.length === 0 ? 'Pick your dates before booking.' : 'We could not load this booking.'}{' '}
          <button type="button" className="underline text-primary-600" onClick={backToStay}>Back to the rooms</button>
        </div>
      </div>
    );
  }

  const nightly = roomNightly(room);
  const total = stayTotal(room, availability, nights);
  const free = isRoomFree(availability, nights);
  const sameNightly = nightly !== null && Math.abs(total - nightly * nights.length) < 0.005;
  const nightsText = `${nights.length} night${nights.length === 1 ? '' : 's'}`;
  const cancel = cancellationInfo(room.cancellation_policy || property.cancellation_policy);
  const canSubmit = free && guestName.trim() && /\S+@\S+\.\S+/.test(email) && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/properties/${propertyId}/rooms/${roomId}/book`, {
        checkInDate: trip.checkIn,
        checkOutDate: trip.checkOut,
        numberOfGuests: trip.guests,
        specialRequests: `Guest: ${guestName.trim()} · Arrival: ${arrival}`,
        contactEmail: email.trim(),
      });
      const reference = res.data?.data?.bookingReference;
      if (!reference) throw new Error('missing reference');
      navigate(`/trips/${encodeURIComponent(reference)}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'The booking did not go through. Nothing was reserved — please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink-700">
      <Toolbar>
        <BackLink onClick={backToStay}>Rooms</BackLink>
        <span className="font-semibold">{property.name}{property.city ? ` · ${property.city}` : ''}</span>
      </Toolbar>

      <div className="flex-1 flex flex-col lg:flex-row">
        <form onSubmit={submit} className="flex-1 px-5 sm:px-10 py-[34px] flex flex-col gap-6">
          <div className="flex flex-col gap-2 max-w-[520px]">
            <h1 className="text-[28px] font-bold tracking-[-.02em] leading-tight">Three fields and you’re in.</h1>
            <p className="text-[14px] text-gray-600">
              Signed in as {user?.email}. Your dates, room and party of {trip.guests} are already filled in from your search.
            </p>
          </div>

          <div className="flex flex-col gap-[14px] max-w-[520px]">
            <Field label="Who is sleeping there" hint="The name the desk will ask for at check-in.">
              <input className={inputClass} value={guestName} onChange={(e) => setGuestName(e.target.value)} autoComplete="name" required />
            </Field>
            <Field label="Arrival time" hint={property.check_in_time ? `Check-in opens at ${String(property.check_in_time).slice(0, 5)}.` : undefined}>
              <select className={inputClass} value={arrival} onChange={(e) => setArrival(e.target.value)}>
                {ARRIVAL_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Contact e-mail" hint="Where the property can reach you about this stay.">
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </Field>
          </div>

          <div className="flex items-start gap-3 max-w-[520px] text-[13px] text-gray-700">
            <span aria-hidden="true" className="mt-0.5 w-[34px] h-5 rounded-full bg-primary-500 flex-none relative">
              <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
            </span>
            <span>No card needed. Nothing is charged today — you pay {money(total)} at the property.</span>
          </div>

          {!free && (
            <div className="max-w-[520px] text-[13px] text-secondary-600 bg-secondary-50 rounded-[9px] px-3 py-2.5">
              This room was just taken for those dates.{' '}
              <button type="button" className="underline" onClick={backToStay}>Choose another room</button>
            </div>
          )}
          {error && <div role="alert" className="max-w-[520px] text-[13px] text-secondary-600 bg-secondary-50 rounded-[9px] px-3 py-2.5">{error}</div>}

          <div className="max-w-[520px] flex flex-col gap-2">
            <button
              type="submit" disabled={!canSubmit}
              className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-[11px] p-4 transition-colors"
            >
              {submitting ? 'Confirming…' : `Confirm — ${money(total)} at the property`}
            </button>
            <p className={`text-[12px] text-center ${TONE_TEXT[cancel.tone]}`}>{cancel.label}</p>
          </div>
        </form>

        <aside className="lg:w-[360px] flex-none bg-surface-raised border-t lg:border-t-0 lg:border-l border-gray-200 px-[26px] py-[34px] flex flex-col gap-4">
          <div className="relative h-[130px] rounded-[10px] overflow-hidden">
            <StayImg src={roomImage(room, 720, 300)} alt="" label={room.name} className="absolute inset-0 w-full h-full" />
          </div>
          <div>
            <div className="text-[16px] font-semibold">{property.name}</div>
            <div className="text-[13px] text-gray-600">{fmtDay(trip.checkIn)} → {fmtDay(trip.checkOut)} · {room.name}</div>
            <div className="text-[13px] text-gray-600">{trip.guests} guest{trip.guests === 1 ? '' : 's'}</div>
          </div>
          <div className="flex flex-col text-[13px]">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">{sameNightly ? `${nightsText} × ${money(nightly)}` : `${nightsText}, priced per night`}</span>
              <span>{money(total)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-dashed border-gray-200">
              <span className="text-gray-600">StayHub service fee</span><span className="text-primary-600">{money(0)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-dashed border-gray-200">
              <span className="text-gray-600">Due today</span><span className="text-secondary-600">{money(0)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-gray-200">
              <span className="font-semibold">Total</span>
              <span className="text-[22px] font-bold tracking-[-.02em]">{money(total)}<span className="sr-only"> total for {nightsText}</span></span>
            </div>
          </div>
          <div className="bg-primary-50 text-primary-700 text-[12px] rounded-[9px] px-3 py-2.5 leading-[1.5]">
            The total is the sum of the nightly prices for your dates. StayHub adds no guest fee, and you settle the bill with the property.
          </div>
        </aside>
      </div>
    </div>
  );
}
