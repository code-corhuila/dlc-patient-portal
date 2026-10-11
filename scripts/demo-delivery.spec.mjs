import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, stat, readdir } from 'node:fs/promises';
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
  assert.deepEqual(descriptor.navigation[0].visibility, { rolesAny: [], permissionsAll: [] });
  assert.equal(descriptor.navigation[0].label, 'Pacientes');
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

test('C01: the published release is accessible to the nginx runtime user',
  { skip: process.platform === 'win32' }, async t => {
    const { publishDemoRelease } = await import('./prepare-demo-release.mjs');
    const { source, destination } = await fixture(t);
    await publishDemoRelease(source, destination);
    const directory = await stat(join(destination, 'portals/patient/0.1.0-demo'));
    assert.equal(directory.mode & 0o005, 0o005, 'nginx requires read and traverse permissions');
  });

test('C01: recover a descriptor failure without deleting or changing published assets', async t => {
  const { publishDemoRelease, recoverDemoDescriptor } = await import('./prepare-demo-release.mjs');
  const { source, destination } = await fixture(t);
  const target = join(destination, 'patient-descriptor.json');
  await mkdir(target, { recursive: true });
  await assert.rejects(publishDemoRelease(source, destination));
  const release = join(destination, 'portals/patient/0.1.0-demo');
  const stored = JSON.parse(await readFile(join(release, 'patient-descriptor.json'), 'utf8'));
  assert.equal(stored.release, '0.1.0-demo');
  assert.equal(resolve(target), resolve(destination, 'patient-descriptor.json'));
  await rm(target, { recursive: true });
  await writeFile(join(source, 'entry.js'), 'changed unpublished source');
  await recoverDemoDescriptor(destination, '0.1.0-demo');
  assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), stored);
  assert.equal(await readFile(join(release, 'entry.js'), 'utf8'), 'export const portalId = "patient";');
  assert.deepEqual((await readdir(destination)).sort(), ['patient-descriptor.json', 'portals']);
  await assert.rejects(recoverDemoDescriptor(destination, '../escape'), /INVALID_RELEASE/);
});

test('C01: concurrent publishers preserve the winner and reject the loser as RELEASE_EXISTS', async t => {
  const { publishDemoRelease } = await import('./prepare-demo-release.mjs');
  const { source, destination } = await fixture(t);
  const results = await Promise.allSettled([
    publishDemoRelease(source, destination), publishDemoRelease(source, destination),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.match(results.find(result => result.status === 'rejected').reason.message, /RELEASE_EXISTS/);
  assert.equal(await readFile(join(destination, 'portals/patient/0.1.0-demo/entry.js'), 'utf8'),
    'export const portalId = "patient";');
  assert.deepEqual((await readdir(destination)).sort(), ['patient-descriptor.json', 'portals']);
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
