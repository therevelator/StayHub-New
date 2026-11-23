const { defineConfig } = require('cypress')
const path = require('path')

// Load DB creds from server/.env for local runs; in CI they come from the job env.
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') })

const dbConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || process.env.USER || 'postgres',
      password: process.env.DB_PASSWORD || undefined,
      database: process.env.DB_NAME || 'stayhub',
      port: Number(process.env.DB_PORT) || 5432,
    }

// Every user the suite creates lives on the @stayhub.test domain, so we can
// safely remove them and everything they own. Real users never use that domain.
// Children are removed before their parents (availability -> bookings -> rooms
// -> properties -> users); profiles and security rows cascade with the user.
const CLEANUP_SQL = `
  DELETE FROM room_availability ra
    USING bookings b, users u
    WHERE ra.booking_id = b.id AND b.user_id = u.id AND u.email LIKE '%@stayhub.test';
  DELETE FROM room_availability ra
    USING rooms r, properties p, users u
    WHERE ra.room_id = r.id AND r.property_id = p.id AND p.host_id = u.id
      AND u.email LIKE '%@stayhub.test';
  DELETE FROM bookings b
    USING rooms r, properties p, users u
    WHERE b.room_id = r.id AND r.property_id = p.id AND p.host_id = u.id
      AND u.email LIKE '%@stayhub.test';
  DELETE FROM bookings b
    USING users u
    WHERE b.user_id = u.id AND u.email LIKE '%@stayhub.test';
  DELETE FROM rooms r
    USING properties p, users u
    WHERE r.property_id = p.id AND p.host_id = u.id AND u.email LIKE '%@stayhub.test';
  DELETE FROM properties p
    USING users u
    WHERE p.host_id = u.id AND u.email LIKE '%@stayhub.test';
  DELETE FROM users WHERE email LIKE '%@stayhub.test';
`

module.exports = defineConfig({
  e2e: {
    // App URL. If `cy.visit` returns 404 while the app clearly works in a
    // browser, another process is likely holding 127.0.0.1:3000 (Cypress/Node
    // resolve `localhost` to IPv4 first). Run the client on a free port and
    // override, e.g.: `cypress run --config baseUrl=http://127.0.0.1:3100`.
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    experimentalStudio: true,
    chromeWebSecurity: false,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    setupNodeEvents(on) {
      // Removes all data the suite created (users on @stayhub.test + everything
      // they own). Called from an after() hook so the suite self-cleans.
      on('task', {
        async cleanTestData() {
          const { Client } = require('pg')
          const client = new Client(dbConfig)
          try {
            await client.connect()
            await client.query(CLEANUP_SQL)
            return { ok: true }
          } catch (err) {
            // Never fail the run on cleanup problems — just report.
            return { ok: false, error: err.message }
          } finally {
            await client.end().catch(() => {})
          }
        },
      })
    },
  },
  env: {
    // Backend API base. The frontend talks to :5001; hitting it directly keeps
    // the API tests independent of the Vite dev proxy.
    apiUrl: 'http://localhost:5001/api',
  },
})
