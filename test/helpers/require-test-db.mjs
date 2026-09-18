/**
 * Refuse to run a database-touching test against a production database.
 *
 * There is no separate test database configured on this host, and several tests
 * write through the real store (test/lock-apply.test.mjs creates boxes from the
 * live store path; tests/credit-costs.test.mjs calls registerUser). Pointed at
 * production they silently create real users and boxes.
 *
 * Opting in is explicit: BITTYBOX_ALLOW_PROD_TESTS=1. Everything else aborts.
 */
import process from 'node:process';

export function assertTestDatabase({ suite } = {}) {
  const db = process.env.BITTYBOX_PG_DATABASE || '';
  const env = process.env.NODE_ENV || '';
  const optedIn = process.env.BITTYBOX_ALLOW_PROD_TESTS === '1';
  const looksProduction = env === 'production' || db === 'bittybox_app';
  const looksTest = /test/i.test(db);

  if (optedIn || looksTest) return { db, mode: optedIn ? 'opted-in' : 'test-db' };
  if (!db) return { db, mode: 'no-db' }; // pure/unit path, nothing to write to

  if (looksProduction) {
    throw new Error(
      `Refusing to run ${suite || 'this suite'} against the production database ` +
      `(BITTYBOX_PG_DATABASE=${db}, NODE_ENV=${env}). It writes real rows. ` +
      'Set BITTYBOX_ALLOW_PROD_TESTS=1 only if you truly intend that.',
    );
  }
  return { db, mode: 'other' };
}
