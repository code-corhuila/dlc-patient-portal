import { readdir, rename } from 'node:fs/promises';
import { join } from 'node:path';

const directory = 'dist/dlc-patients-portal/portal/browser';
const entries = (await readdir(directory)).filter(name => /^main-[\w-]+\.js$/.test(name));
if (entries.length !== 1) throw new Error('Expected exactly one portal entry bundle.');
await rename(join(directory, entries[0]), join(directory, 'entry.js'));
