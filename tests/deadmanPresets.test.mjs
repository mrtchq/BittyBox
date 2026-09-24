import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'src/components/stage/LockConfigModal.tsx'), 'utf8');

test('DMS check-in cadence offers the requested 24h–30d presets and a custom value', () => {
  for (const [label, minutes] of [['24h', 1440], ['3d', 4320], ['7d', 10080], ['14d', 20160], ['30d', 43200]]) {
    assert.ok(source.includes(`label: '${label}', minutes: ${minutes}`), `missing ${label} preset`);
  }
  assert.ok(source.includes('type="number"'), 'custom interval input should remain available');
});
