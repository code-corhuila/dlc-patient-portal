import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('HU-PAT-001: package the entry at the configured Angular output path', async () => {
  const prefix = join(tmpdir(), 'patient-entry-');
  const workspace = await mkdtemp(prefix);
  try {
    const output = join(workspace, 'dist', 'custom-release', 'browser');
    await mkdir(output, { recursive: true });
    await mkdir(join(workspace, 'scripts'));
    await copyFile(new URL('./prepare-portal-entry.mjs', import.meta.url),
      join(workspace, 'scripts', 'prepare-portal-entry.mjs'));
    await writeFile(join(workspace, 'package.json'), JSON.stringify({ name: 'dlc-patient-portal' }));
    await writeFile(join(workspace, 'angular.json'), JSON.stringify({
      projects: { 'dlc-patient-portal': { architect: { build: { configurations: {
        portal: { outputPath: 'dist/custom-release' },
      } } } } },
    }));
    const entry = 'export const portalId = "patient";';
    await writeFile(join(output, 'main-DEMO1234.js'), entry);

    const result = spawnSync(process.execPath, ['scripts/prepare-portal-entry.mjs'], {
      cwd: workspace, encoding: 'utf8',
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(await readFile(join(output, 'entry.js'), 'utf8'), entry);
  } finally {
    assert.ok(resolve(workspace).startsWith(resolve(prefix)));
    await rm(workspace, { recursive: true, force: true });
  }
});
