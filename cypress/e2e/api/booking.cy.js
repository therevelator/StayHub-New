// Booking API — regression guards for the night-count and booking-reference bugs.
// Self-provisions its own property + room, so it needs no seed data.
import { fmt, addDays, futureBase } from '../../support/utils';

describe('API · Booking', () => {
  let token;
  let propertyId;
  let roomId;
  let created; // booking ids to clean up

  beforeEach(() => {
    created = [];
    cy.ensureBookableRoom().then((ctx) => {
      token = ctx.token;
      propertyId = ctx.propertyId;
      roomId = ctx.roomId;
    });
  });

  afterEach(() => {
    created.forEach((id) => cy.cancelBooking(token, id));
  });

  it('counts a single night as 1 (25→26 must not be 0 nights)', () => {
    const start = futureBase(1);
    cy.bookRoom(token, {
      propertyId,
      roomId,
      checkIn: fmt(start),
      checkOut: fmt(addDays(start, 1)),
    }).then((res) => {
      expect(res.status, res.body?.message).to.eq(200);
      expect(res.data.numberOfNights).to.eq(1);
      created.push(res.data.bookingId);
    });
  });

  it('counts two nights as 2 (25→27)', () => {
    const start = futureBase(20);
    cy.bookRoom(token, {
      propertyId,
      roomId,
      checkIn: fmt(start),
      checkOut: fmt(addDays(start, 2)),
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.data.numberOfNights).to.eq(2);
      created.push(res.data.bookingId);
    });
  });

  it('generates a phone-friendly reference with no ambiguous characters', () => {
    const start = futureBase(40);
    cy.bookRoom(token, {
      propertyId,
      roomId,
      checkIn: fmt(start),
      checkOut: fmt(addDays(start, 1)),
    }).then((res) => {
      expect(res.status).to.eq(200);
      const ref = res.data.bookingReference;
      // Grouped SH-XXX-XXX, drawn from an unambiguous charset (no 0/O/1/I/L).
      expect(ref).to.match(/^SH-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/);
      expect(ref).to.not.match(/[01ILO]/);
      created.push(res.data.bookingId);
    });
  });

  it('rejects an overlapping booking on the same nights', () => {
    const start = futureBase(60);
    cy.bookRoom(token, {
      propertyId,
      roomId,
      checkIn: fmt(start),
      checkOut: fmt(addDays(start, 2)),
    }).then((res) => {
      expect(res.status).to.eq(200);
      created.push(res.data.bookingId);

      // Overlaps the middle night -> must be refused.
      cy.bookRoom(token, {
        propertyId,
        roomId,
        checkIn: fmt(addDays(start, 1)),
        checkOut: fmt(addDays(start, 3)),
      }).then((res2) => {
        expect(res2.status).to.eq(400);
        if (res2.data?.bookingId) created.push(res2.data.bookingId);
      });
    });
  });
});
