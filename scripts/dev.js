const { spawn } = require('node:child_process');

const commands = [
  { name: 'backend', command: 'npm', args: ['run', 'dev', '--prefix', 'backend'] },
  { name: 'frontend', command: 'npm', args: ['run', 'dev', '--prefix', 'frontend', '--', '--host', '127.0.0.1'] },
];

const children = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      process.exitCode = code;
    }
  });

  return child;
});

const shutdown = () => {
  for (const child of children) child.kill();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
