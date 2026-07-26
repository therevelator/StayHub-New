const { defineConfig } = require('cypress')
const path = require('path')

// Load DB creds from server/.env for local runs; in CI they come from the job env.
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') })

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stayhub',
  port: Number(process.env.DB_PORT) || 3306,
  multipleStatements: true,
}

// Every user the suite creates lives on the @stayhub.test domain, so we can
// safely remove them and everything they own. Real users never use that domain.
const CLEANUP_SQL = `
  DELETE b FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN properties p ON r.property_id = p.id
    JOIN users u ON p.host_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
    WHERE u.email LIKE '%@stayhub.test';
  DELETE b FROM bookings b
    JOIN users u ON b.user_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
    WHERE u.email LIKE '%@stayhub.test';
  DELETE ra FROM room_availability ra
    JOIN rooms r ON ra.room_id = r.id
    JOIN properties p ON r.property_id = p.id
    JOIN users u ON p.host_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
    WHERE u.email LIKE '%@stayhub.test';
  DELETE r FROM rooms r
    JOIN properties p ON r.property_id = p.id
    JOIN users u ON p.host_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
    WHERE u.email LIKE '%@stayhub.test';
  DELETE p FROM properties p
    JOIN users u ON p.host_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
    WHERE u.email LIKE '%@stayhub.test';
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
          const mysql = require('mysql2/promise')
          let conn
          try {
            conn = await mysql.createConnection(dbConfig)
            await conn.query(CLEANUP_SQL)
            return { ok: true }
          } catch (err) {
            // Never fail the run on cleanup problems — just report.
            return { ok: false, error: err.message }
          } finally {
            if (conn) await conn.end()
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
