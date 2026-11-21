import { readLocalEnvironment } from './environment.mjs';
import { docker, dotnet, run } from './process.mjs';

await run(process.execPath, ['scripts/setup.mjs']);
const values = await readLocalEnvironment();
await run(docker, ['compose', '--project-name', 'taskflow-dev', '-f', 'compose.yaml', '-f', 'compose.dev.yaml', 'up', '--detach', '--wait', 'postgres']);
const env = {
  ASPNETCORE_ENVIRONMENT: 'Development',
  ASPNETCORE_URLS: 'http://localhost:5080',
  ConnectionStrings__DefaultConnection: `Host=localhost;Port=${values.TASKFLOW_DB_PORT || '55432'};Database=taskflow;Username=taskflow;Password=${values.POSTGRES_PASSWORD}`,
  Jwt__Key: values.JWT_KEY,
  Demo__Enabled: values.DEMO_ENABLED || 'true',
  Demo__Password: values.DEMO_PASSWORD,
  HolidayApi__Mode: values.HOLIDAY_API_MODE || 'Stub',
  HolidayApi__StubScenario: values.HOLIDAY_API_STUB_SCENARIO || 'Success',
};
await run(dotnet, ['run', '--project', 'src/TaskFlow.Api', '--no-launch-profile', '--', '--migrate'], { env });
await run(dotnet, ['run', '--project', 'src/TaskFlow.Api', '--no-launch-profile'], { env });
