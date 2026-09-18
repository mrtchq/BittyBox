import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_MAINNET,
  buildRouteConfig,
  payableBoxGuard,
  x402ConfigStatus,
} from '../lib/x402-payments.js';
import { compilePolicy } from '../lib/policy-engine.js';

const PAY_TO = '0x808E664A6bcE54bCF06E1C4DE83023DC7BC62cdB';

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('reports a production Base x402 configuration without exposing secrets', () => {
  const status = x402ConfigStatus({ payTo: PAY_TO, facilitatorUrl: 'https://facilitator.payai.network' });
  assert.deepEqual(status, {
    enabled: true,
    protocolVersion: 2,
    network: BASE_MAINNET,
    scheme: 'exact',
    asset: 'USDC',
    facilitatorOrigin: 'https://facilitator.payai.network',
    receiver: PAY_TO,
  });
});

test('dynamic x402 price is read from the box policy, never from query input', async () => {
  const box = { id: 'box1', published: true, policy: compilePolicy('pay-to-open-secret', { price: '$0.50' }) };
  const config = buildRouteConfig({ getBox: id => id === 'box1' ? box : null, payTo: PAY_TO });
  const accepts = config['GET /api/boxes/:id/x402/payload'].accepts;
  const context = { adapter: { getPath: () => '/api/boxes/box1/x402/payload', getQueryParam: () => '$0.01' } };
  assert.equal(await accepts.price(context), '$0.50');
  assert.equal(accepts.payTo, PAY_TO);
  assert.equal(accepts.network, BASE_MAINNET);
});

// The guard is async (getBox returns a promise in PostgreSQL mode, a plain value
// in file mode) and is mounted as plain Express middleware on Express 4, which
// does NOT await the returned promise. Every assertion below MUST await it
// before inspecting `res`, otherwise it observes the response before the guard
// has responded and a correct guard looks like it failed open.
test('guard fails closed for missing, unpublished, or unsupported-policy boxes', async () => {
  const next = () => { throw new Error('must not call next'); };

  let res = mockResponse();
  await payableBoxGuard({ getBox: () => null })({ params: { id: 'missing' } }, res, next);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.code, 'box_not_found');

  res = mockResponse();
  await payableBoxGuard({ getBox: () => ({ published: false }) })({ params: { id: 'draft' } }, res, next);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, 'box_not_published');

  res = mockResponse();
  await payableBoxGuard({ getBox: () => ({ published: true, policy: compilePolicy('metered-research-box', { maxPrice: '$1.00' }) }) })({ params: { id: 'metered' } }, res, next);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, 'x402_scheme_unavailable');
});

test('guard permits only an active exact x402 box', async () => {
  let called = false;
  const box = { published: true, policy: compilePolicy('pay-to-open-secret', { price: '$0.50' }) };
  const res = mockResponse();
  await payableBoxGuard({ getBox: () => box })({ params: { id: 'box1' } }, res, () => { called = true; });
  assert.equal(called, true, 'an exact x402 box must reach the handler');
  assert.equal(res.statusCode, 200, 'must not respond when handing off to next()');
});

test('guard supports an async getBox (PostgreSQL mode)', async () => {
  const box = { published: true, policy: compilePolicy('pay-to-open-secret', { price: '$0.50' }) };
  let called = false;
  await payableBoxGuard({ getBox: async id => (id === 'box1' ? box : null) })({ params: { id: 'box1' } }, mockResponse(), () => { called = true; });
  assert.equal(called, true);

  const res = mockResponse();
  await payableBoxGuard({ getBox: async () => null })({ params: { id: 'gone' } }, res, () => {});
  assert.equal(res.statusCode, 404, 'async getBox must still fail closed');
});

test('guard returns a promise and funnels getBox rejections to next(err)', async () => {
  const pending = payableBoxGuard({ getBox: () => null })({ params: { id: 'x' } }, mockResponse(), () => {});
  assert.ok(pending && typeof pending.then === 'function', 'guard must return a promise');

  // Express 4 ignores the returned promise, so a rejection must never escape:
  // it has to arrive at next(err) or it becomes an unhandled rejection.
  const boom = new Error('db down');
  let received = null;
  await payableBoxGuard({ getBox: () => Promise.reject(boom) })({ params: { id: 'x' } }, mockResponse(), err => { received = err; });
  assert.equal(received, boom);

  assert.throws(() => payableBoxGuard({}), /getBox is required/);
});
