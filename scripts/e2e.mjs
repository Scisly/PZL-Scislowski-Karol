import path from 'node:path';
import { readLocalEnvironment } from './environment.mjs';
import { root, run } from './process.mjs';

const localEnv = await readLocalEnvironment();
const password = process.env.DEMO_PASSWORD || localEnv.DEMO_PASSWORD;
if (!password) throw new Error('Run node scripts/setup.mjs first or set DEMO_PASSWORD.');
const baseUrl = process.env.TASKFLOW_BASE_URL || process.env.E2E_BASE_URL || `http://localhost:${process.env.TASKFLOW_PORT || localEnv.TASKFLOW_PORT || '8080'}`;
await run('npm', ['run', 'test:e2e'], {
  cwd: path.join(root, 'web'),
  env: { DEMO_PASSWORD: password, TASKFLOW_BASE_URL: baseUrl, E2E_BASE_URL: baseUrl },
});
