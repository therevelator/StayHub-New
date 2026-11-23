import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cancellationInfo, money } from './consoleUtils';

// A5 — Confirmed (Booking Console concept 1a).

const asDate = (value) => (value ? new Date(value) : null);
const fmt = (date, opts) => (date ? date.toLocaleDateString('en-GB', opts) : '');
const hhmm = (time) => (time ? String(time).slice(0, 5) : null);
const icsDay = (date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

export default function Confirmed() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [booking, setBooking] = useState(null);
  const [property, setProperty] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    api.get('/bookings/guest')
      .then(async (res) => {
        if (cancelled) return;
        const found = (res.data?.data || []).find((b) => b.booking_reference === ref);
        if (!found) { setStatus('missing'); return; }
        setBooking(found);
        setStatus('ready');
        if (found.property_id) {
          try {
            const prop = await api.get(`/properties/${found.property_id}`);
            if (!cancelled) setProperty(prop.data?.data || null);
          } catch { /* the card works without the house times */ }
        }
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [isAuthenticated, ref]);

  if (!isAuthenticated) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (status !== 'ready') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-10 text-ink-700">
        <div className="text-[14px] text-center flex flex-col gap-3 items-center">
          <div>
            {status === 'loading' && 'Loading your booking…'}
            {status === 'missing' && `We could not find a booking with reference ${ref} on this account.`}
            {status === 'error' && 'We could not load your booking.'}
          </div>
          {status !== 'loading' && (
            <button type="button" className="underline text-primary-600" onClick={() => navigate('/myreservations')}>See my reservations</button>
          )}
        </div>
      </div>
    );
  }

  const checkIn = asDate(booking.check_in_date);
  const checkOut = asDate(booking.check_out_date);
  const roomName = booking.room?.name || booking.room_name || booking.name || 'Room';
  const propertyName = booking.property?.name || booking.property_name || '';
  const propertyLocation = booking.property?.location || booking.property_location || '';
  const place = [propertyName, propertyLocation.split(',')[0].trim()].filter(Boolean).join(', ');
  const dayOpts = { weekday: 'short', day: 'numeric', month: 'short' };
  const shortOpts = { day: 'numeric', month: 'short' };
  const cancel = cancellationInfo(property?.cancellation_policy);
  const cancelled = booking.status === 'cancelled';

  const timeline = [
    ['Now', `Your room is held under reference ${booking.booking_reference}. Nothing has been charged.`],
    [fmt(checkIn, shortOpts), `Check-in${hhmm(property?.check_in_time) ? ` from ${hhmm(property.check_in_time)}` : ''}. Give the desk the name on the booking and pay ${money(booking.total_price)} there.`],
    [fmt(checkOut, shortOpts), `Check-out${hhmm(property?.check_out_time) ? ` by ${hhmm(property.check_out_time)}` : ''}.`],
  ];

  const addToCalendar = () => {
    if (!checkIn || !checkOut) return;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StayHub//Booking//EN', 'BEGIN:VEVENT',
      `UID:${booking.booking_reference}@stayhub`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${icsDay(checkIn)}`,
      `DTEND;VALUE=DATE:${icsDay(checkOut)}`,
      `SUMMARY:${`Stay at ${propertyName || 'StayHub'}`.replace(/[,;]/g, ' ')}`,
      `LOCATION:${propertyLocation.replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${`${roomName} - reference ${booking.booking_reference}`.replace(/[,;]/g, ' ')}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `stayhub-${booking.booking_reference}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const outlined = 'flex-1 border border-gray-300 hover:border-primary-500 hover:text-primary-600 text-[13px] font-semibold rounded-[9px] px-3 py-[11px] transition-colors min-h-[44px]';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-[26px] p-5 sm:p-10 text-ink-700">
      <div className="w-full max-w-[520px] bg-white border border-gray-200 rounded-[16px] overflow-hidden">
        <div className="px-6 py-[22px] text-white" style={{ background: '#0E2A26' }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-primary-400">
            {cancelled ? 'Cancelled' : 'Confirmed'} · {booking.booking_reference}
          </div>
          <h1 className="text-[22px] font-bold tracking-[-.02em] mt-1.5">{place || 'Your stay'}</h1>
          <div className="text-[13px] text-white/65 mt-1">
            {fmt(checkIn, dayOpts)} → {fmt(checkOut, dayOpts)} · {roomName} · {money(booking.total_price)}
          </div>
        </div>
        <div className="px-6 py-5 flex flex-col">
          {timeline.map(([when, what], i) => (
            <div key={when + i} className={`flex gap-4 py-3 ${i ? 'border-t border-dashed border-gray-200' : ''}`}>
              <div className="w-14 flex-none font-mono text-[11px] uppercase tracking-[0.06em] text-primary-500 pt-0.5">{when}</div>
              <div className="text-[13px] leading-[1.55]">{what}</div>
            </div>
          ))}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button type="button" onClick={addToCalendar} className={outlined}>Add to calendar</button>
            <button type="button" onClick={() => navigate('/myreservations')} className={outlined}>My reservations</button>
            <button type="button" onClick={() => navigate('/')} className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-semibold rounded-[9px] px-3 py-[11px] transition-colors min-h-[44px]">
              Book another stay
            </button>
          </div>
        </div>
      </div>
      <p className="text-[13px] text-ink-500 text-center">
        {property?.cancellation_policy ? `${cancel.label} · ` : ''}No charge yet — you pay at the property
      </p>
    </div>
  );
}
