import { access, chmod, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_DEMO_RELEASE = '0.1.0-demo';

function validateRelease(release) {
  if (typeof release !== 'string' || !/^[A-Za-z0-9._-]+$/.test(release) || /^\.+$/.test(release)) throw new Error('INVALID_RELEASE');
}

function descriptorFor(release) {
  return { portalId: 'patient', repository: 'dlc-patient-portal', release,
    entryUrl: `/portals/patient/${release}/entry.js`, navigation: [{ id: 'patients', label: 'Pacientes',
      path: '/app/patients', visibility: { rolesAny: [], permissionsAll: [] } }] };
}

async function removeTemporaryDirectory(root, path) {
  if (dirname(resolve(path)) !== root) throw new Error('INVALID_STAGING_PATH');
  await rm(path, { recursive: true, force: true });
}

async function publishDescriptor(root, descriptor) {
  const temporary = await mkdtemp(join(root, '.patient-descriptor-'));
  try {
    const file = join(temporary, 'patient-descriptor.json');
    await writeFile(file, JSON.stringify(descriptor, null, 2) + '\n');
    await rename(file, join(root, 'patient-descriptor.json'));
  } finally { await removeTemporaryDirectory(root, temporary); }
}

export async function recoverDemoDescriptor(output, release) {
  validateRelease(release);
  const root = resolve(output);
  const directory = join(root, 'portals', 'patient', release);
  const descriptor = JSON.parse(await readFile(join(directory, 'patient-descriptor.json'), 'utf8'));
  if (descriptor.portalId !== 'patient' || descriptor.release !== release || descriptor.entryUrl !== descriptorFor(release).entryUrl) throw new Error('INVALID_DESCRIPTOR');
  await readFile(join(directory, 'entry.js'));
  await publishDescriptor(root, descriptor);
  return descriptor;
}

async function requireNewRelease(path) {
  try { await access(path); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw new Error('RELEASE_EXISTS: choose a new release; published releases cannot be overwritten.');
}

export async function publishDemoRelease(source, output, release = DEFAULT_DEMO_RELEASE) {
  validateRelease(release);
  await readFile(join(source, 'entry.js'));
  const root = resolve(output);
  const destination = join(root, 'portals', 'patient', release);
  await requireNewRelease(destination);
  await mkdir(dirname(destination), { recursive: true });
  const staging = await mkdtemp(join(root, '.patient-stage-'));
  const descriptor = descriptorFor(release);
  try {
    await cp(source, staging, { recursive: true });
    await chmod(staging, 0o755);
    await writeFile(join(staging, 'patient-descriptor.json'), JSON.stringify(descriptor, null, 2) + '\n');
    try { await rename(staging, destination); }
    catch (error) { await requireNewRelease(destination); throw error; }
  } finally {
    await removeTemporaryDirectory(root, staging);
  }
  await publishDescriptor(root, descriptor);
  return descriptor;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] === '--recover') {
    await recoverDemoDescriptor('dist/demo', process.argv[3]);
    console.log('Recovered the descriptor without changing published assets.');
  } else {
    const workspace = JSON.parse(await readFile(new URL('../angular.json', import.meta.url), 'utf8'));
    const { name } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    const source = join(workspace.projects[name].architect.build.configurations.portal.outputPath, 'browser');
    const descriptor = await publishDemoRelease(source, 'dist/demo', process.argv[2] ?? DEFAULT_DEMO_RELEASE);
    console.log(`Prepared ${descriptor.entryUrl}; registry/proxy integration remains pending.`);
  }
}
