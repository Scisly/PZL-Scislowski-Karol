import { readLocalEnvironment } from './environment.mjs';

const localEnv = await readLocalEnvironment();
const baseUrl = (process.env.TASKFLOW_BASE_URL || `http://localhost:${process.env.TASKFLOW_PORT || localEnv.TASKFLOW_PORT || '8080'}`).replace(/\/$/, '');
const checks = [
  { path: '/api/health', status: 200 },
  { path: '/api/health/ready', status: 200 },
  { path: '/', status: 200, html: true },
  { path: '/api/projects', status: 401 },
  { path: '/api/this-endpoint-does-not-exist', status: 404 },
];

for (const check of checks) {
  const response = await fetch(baseUrl + check.path, { signal: AbortSignal.timeout(10_000), redirect: 'manual' });
  if (response.status !== check.status) {
    throw new Error(`${check.path}: expected HTTP ${check.status}, received ${response.status}.`);
  }
  if (check.html) {
    if (!response.headers.get('content-type')?.includes('text/html')) {
      throw new Error(`${check.path}: frontend HTML was not served.`);
    }
    const body = await response.text();
    if (!body.includes('<div id="root"')) throw new Error('The React application root was not found.');
  }
  console.log(`PASS ${check.path} (HTTP ${response.status})`);
}
