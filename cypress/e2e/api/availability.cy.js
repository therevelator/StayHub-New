// Availability API — regression guard for the "check-out day is free" bug.
// A booking must occupy only the nights actually slept in [checkIn, checkOut);
// the check-out day itself stays available for a back-to-back check-in.
// Self-provisions its own property + room, so it needs no seed data.
import { fmt, addDays, futureBase } from '../../support/utils';

describe('API · Availability (check-out day is free)', () => {
  let token;
  let propertyId;
  let roomId;
  let created;

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

  it('occupies only the slept nights and leaves the check-out day available', () => {
    const start = futureBase(120);
    const d0 = start; // check-in / first night
    const d1 = addDays(start, 1); // second night
    const d2 = addDays(start, 2); // check-out day (should stay free)

    cy.bookRoom(token, { propertyId, roomId, checkIn: fmt(d0), checkOut: fmt(d2) }).then((res) => {
      expect(res.status, res.body?.message).to.eq(200);
      created.push(res.data.bookingId);

      cy.roomAvailability(token, {
        propertyId,
        roomId,
        start: fmt(addDays(start, -1)),
        end: fmt(addDays(start, 3)),
      }).then((av) => {
        expect(av[fmt(addDays(start, -1))].status, 'day before').to.eq('available');
        expect(av[fmt(d0)].status, 'first night').to.eq('occupied');
        expect(av[fmt(d1)].status, 'second night').to.eq('occupied');
        expect(av[fmt(d2)].status, 'check-out day').to.eq('available');
      });
    });
  });

  it('allows a back-to-back booking starting on the previous check-out day', () => {
    const start = futureBase(160);
    const d0 = start;
    const d2 = addDays(start, 2); // first booking checks out here
    const d3 = addDays(start, 3);

    cy.bookRoom(token, { propertyId, roomId, checkIn: fmt(d0), checkOut: fmt(d2) }).then((res) => {
      expect(res.status).to.eq(200);
      created.push(res.data.bookingId);

      cy.bookRoom(token, { propertyId, roomId, checkIn: fmt(d2), checkOut: fmt(d3) }).then((res2) => {
        expect(res2.status, res2.body?.message).to.eq(200);
        created.push(res2.data.bookingId);
      });
    });
  });
});
