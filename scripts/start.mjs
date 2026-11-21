import { docker, run } from './process.mjs';

if (process.argv.length > 2) {
  console.error('Usage: node scripts/start.mjs');
  process.exit(1);
}
await run(process.execPath, ['scripts/setup.mjs']);
await run(docker, ['compose', 'up', '--build', '--detach', '--wait', '--wait-timeout', '180']);
await run(process.execPath, ['scripts/smoke.mjs']);
