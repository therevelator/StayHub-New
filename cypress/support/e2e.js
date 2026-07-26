// Cypress e2e support file (referenced by cypress.config.js).
// Loads custom commands before every spec.
import './commands';

// Self-clean: after the whole run, delete every user the suite created (all on
// the @stayhub.test domain) and everything they own. Keeps a shared dev DB tidy
// without any manual SQL. Cleanup failures never fail the run.
after(() => {
  cy.task('cleanTestData', {}, { log: true }).then((res) => {
    if (res && res.ok === false) {
      // eslint-disable-next-line no-console
      cy.log(`Test data cleanup skipped: ${res.error}`);
    }
  });
});
