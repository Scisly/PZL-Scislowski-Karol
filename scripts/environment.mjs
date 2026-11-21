import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function readLocalEnvironment() {
  let content;
  try {
    content = await readFile(path.join(root, '.env'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
  return Object.fromEntries(content.split(/\r?\n/)
    .filter((line) => line.trim() && !line.trimStart().startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=');
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      return [key, value.replace(/^(["'])(.*)\1$/, '$2')];
    }));
}
