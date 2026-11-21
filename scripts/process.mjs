import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localDotnet = path.join(root, '.tools', 'dotnet', process.platform === 'win32' ? 'dotnet.exe' : 'dotnet');
export const dotnet = existsSync(localDotnet) ? localDotnet : 'dotnet';
const dockerDesktop = process.platform === 'win32' && process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'Programs', 'DockerDesktop', 'resources', 'bin', 'docker.exe')
  : '';
export const docker = dockerDesktop && existsSync(dockerDesktop) ? dockerDesktop : 'docker';

export function run(command, args, options = {}) {
  const isNpm = process.platform === 'win32' && command === 'npm';
  const executable = isNpm ? (process.env.ComSpec || 'cmd.exe') : command;
  const commandArgs = isNpm ? ['/d', '/s', '/c', 'npm', ...args] : args;
  console.log(`> ${path.basename(command)} ${args.join(' ')}`);
  const childEnv = { ...process.env, ...(existsSync(localDotnet) ? { DOTNET_ROOT: path.dirname(localDotnet) } : {}), ...options.env };
  if (dockerDesktop && existsSync(dockerDesktop)) {
    // Docker also launches docker-credential-desktop and CLI plugins by name.
    const pathKey = Object.keys(childEnv).find((key) => key.toLowerCase() === 'path') || 'PATH';
    childEnv[pathKey] = `${path.dirname(dockerDesktop)}${path.delimiter}${childEnv[pathKey] || ''}`;
  }
  const child = spawn(executable, commandArgs, {
    cwd: options.cwd || root,
    env: childEnv,
    stdio: 'inherit',
    windowsHide: true,
  });
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${signal || code}.`)));
  });
}
