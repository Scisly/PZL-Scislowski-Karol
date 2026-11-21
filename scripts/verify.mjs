import path from 'node:path';
import { docker, dotnet, root, run } from './process.mjs';

const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => !['--compose', '--e2e'].includes(arg))) {
  console.error('Usage: node scripts/verify.mjs [--compose] [--e2e]');
  process.exit(1);
}

await run(dotnet, ['--version']);
await run(dotnet, ['restore', 'TaskFlow.slnx']);
await run(dotnet, ['tool', 'restore']);
await run(dotnet, ['build', 'TaskFlow.slnx', '--configuration', 'Release', '--no-restore']);
await run(dotnet, ['format', 'analyzers', 'TaskFlow.slnx', '--verify-no-changes', '--no-restore', '--severity', 'error']);
await run(dotnet, ['test', 'TaskFlow.slnx', '--configuration', 'Release', '--no-build', '--logger', 'trx', '--results-directory', 'artifacts/test-results']);
const web = path.join(root, 'web');
await run('npm', ['ci'], { cwd: web });
for (const task of ['typecheck', 'lint', 'test', 'build']) await run('npm', ['run', task], { cwd: web, env: { CI: 'true' } });

if (args.has('--compose') || args.has('--e2e')) {
  await run(process.execPath, ['scripts/setup.mjs']);
  await run(docker, ['compose', 'up', '--build', '--detach', '--wait', '--wait-timeout', '180']);
  await run(process.execPath, ['scripts/smoke.mjs']);
}
if (args.has('--e2e')) {
  await run('npm', ['exec', 'playwright', 'install', 'chromium'], { cwd: web });
  await run(process.execPath, ['scripts/e2e.mjs'], { env: { CI: 'true' } });
}
console.log('Verification completed successfully.');
