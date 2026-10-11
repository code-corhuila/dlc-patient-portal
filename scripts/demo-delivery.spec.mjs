import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { once } from 'node:events';

async function fixture(t) {
  const prefix = join(tmpdir(), 'patient-demo-');
  const root = await mkdtemp(prefix);
  t.after(async () => {
    assert.ok(resolve(root).startsWith(resolve(prefix)));
    await rm(root, { recursive: true, force: true });
  });
  const source = join(root, 'browser');
  await mkdir(source);
  await writeFile(join(source, 'entry.js'), 'export const portalId = "patient";');
  await writeFile(join(source, 'chunk-DEMO.js'), 'export const data = [];');
  return { root, source, destination: join(root, 'demo') };
}

test('C01: publish the complete bundle under the versioned patient descriptor', async t => {
  const { publishDemoRelease } = await import('./prepare-demo-release.mjs');
  const { source, destination } = await fixture(t);
  const descriptor = await publishDemoRelease(source, destination, '0.1.0-demo');
  assert.equal(descriptor.portalId, 'patient');
  assert.equal(descriptor.repository, 'dlc-patient-portal');
  assert.equal(descriptor.entryUrl, '/portals/patient/0.1.0-demo/entry.js');
  const release = join(destination, 'portals/patient/0.1.0-demo');
  assert.match(await readFile(join(release, 'entry.js'), 'utf8'), /portalId/);
  assert.equal(await readFile(join(release, 'chunk-DEMO.js'), 'utf8'), 'export const data = [];');
  assert.deepEqual(JSON.parse(await readFile(join(destination, 'patient-descriptor.json'), 'utf8')), descriptor);
  await writeFile(join(source, 'entry.js'), 'export const portalId = "patient"; // changed');
  await assert.rejects(publishDemoRelease(source, destination, '0.1.0-demo'), /RELEASE_EXISTS/);
  assert.equal(await readFile(join(release, 'entry.js'), 'utf8'), 'export const portalId = "patient";');
  const next = await publishDemoRelease(source, destination, '0.2.0-demo');
  assert.equal(next.entryUrl, '/portals/patient/0.2.0-demo/entry.js');
  assert.equal(await readFile(join(release, 'entry.js'), 'utf8'), 'export const portalId = "patient";');
});

test('C01: invalid releases and missing entry cannot publish a descriptor', async t => {
  const { publishDemoRelease } = await import('./prepare-demo-release.mjs');
  const { source, destination } = await fixture(t);
  for (const release of ['..', '../other', 'a/b', '']) {
    await assert.rejects(publishDemoRelease(source, destination, release), /INVALID_RELEASE/);
  }
  await assert.rejects(readFile(join(destination, 'patient-descriptor.json')));
  await assert.rejects(publishDemoRelease(join(source, 'missing'), destination, '0.2.0-demo'));
});

test('C01: local hosting sends no-store, proper module MIME and real asset errors', async t => {
  const { publishDemoRelease } = await import('./prepare-demo-release.mjs');
  const { createDemoServer } = await import('./demo-server.mjs');
  const { source, destination } = await fixture(t);
  await publishDemoRelease(source, destination, '0.1.0-demo');
  const server = createDemoServer(destination);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve()); server.closeAllConnections();
  }));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const entry = '/portals/patient/0.1.0-demo/entry.js';
  const response = await fetch(origin + entry);
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('content-type'), /javascript/); assert.match(await response.text(), /portalId/);
  assert.equal((await fetch(origin + entry, { method: 'HEAD' })).status, 200);
  assert.equal((await fetch(origin + entry, { method: 'POST' })).status, 405);
  for (const path of ['/app/patients', '/api/v1/patients', '/portals/patient/0.1.0-demo/missing.js', '/portals/patient/0.1.0-demo/%2e%2e%2fentry.js']) {
    const missing = await fetch(origin + path);
    assert.equal(missing.status, 404); assert.equal(missing.headers.get('cache-control'), 'no-store');
    assert.doesNotMatch(await missing.text(), /<html/i);
  }
});
