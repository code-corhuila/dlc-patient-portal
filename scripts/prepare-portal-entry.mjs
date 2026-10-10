import { readFile, readdir, rename } from 'node:fs/promises';
import { join } from 'node:path';

const { name } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const workspace = JSON.parse(await readFile(new URL('../angular.json', import.meta.url), 'utf8'));
const outputPath = workspace.projects[name]?.architect.build.configurations.portal.outputPath;
if (typeof outputPath !== 'string') throw new Error('Missing portal output path.');
const directory = join(outputPath, 'browser');
const entries = (await readdir(directory)).filter(name => /^main-[\w-]+\.js$/.test(name));
if (entries.length !== 1) throw new Error('Expected exactly one portal entry bundle.');
await rename(join(directory, entries[0]), join(directory, 'entry.js'));
