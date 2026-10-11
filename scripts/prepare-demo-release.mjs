import { access, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_DEMO_RELEASE = '0.1.0-demo';

async function requireNewRelease(path) {
  try { await access(path); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw new Error('RELEASE_EXISTS: choose a new release; published releases cannot be overwritten.');
}

export async function publishDemoRelease(source, output, release = DEFAULT_DEMO_RELEASE) {
  if (!/^[A-Za-z0-9._-]+$/.test(release) || /^\.+$/.test(release)) throw new Error('INVALID_RELEASE');
  await readFile(join(source, 'entry.js'));
  const root = resolve(output);
  const destination = join(root, 'portals', 'patient', release);
  await requireNewRelease(destination);
  await mkdir(dirname(destination), { recursive: true });
  const staging = await mkdtemp(join(root, '.patient-stage-'));
  try {
    await cp(source, staging, { recursive: true });
    await rename(staging, destination);
  } finally {
    if (dirname(resolve(staging)) !== root) throw new Error('INVALID_STAGING_PATH');
    await rm(staging, { recursive: true, force: true });
  }
  const descriptor = { portalId: 'patient', repository: 'dlc-patient-portal', release,
    entryUrl: `/portals/patient/${release}/entry.js`, navigation: [{ id: 'patients', label: 'Pacientes',
      path: '/app/patients', visibility: { rolesAny: [], permissionsAll: [] } }] };
  await writeFile(join(root, 'patient-descriptor.json'), JSON.stringify(descriptor, null, 2) + '\n');
  return descriptor;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const workspace = JSON.parse(await readFile(new URL('../angular.json', import.meta.url), 'utf8'));
  const { name } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const source = join(workspace.projects[name].architect.build.configurations.portal.outputPath, 'browser');
  const descriptor = await publishDemoRelease(source, 'dist/demo', process.argv[2] ?? DEFAULT_DEMO_RELEASE);
  console.log(`Prepared ${descriptor.entryUrl}; registry/proxy integration remains pending.`);
}
