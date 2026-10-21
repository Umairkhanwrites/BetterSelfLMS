import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=======================================================');
console.log(' Starting BetterSelf LMS Unified Production Container');
console.log('=======================================================');

// 1. Start Backend API Server on Port 5000
const backendPort = process.env.BACKEND_PORT || '5000';
console.log(`[Runner] Launching Express Backend API on port ${backendPort}...`);

const backendProcess = spawn('node', ['src/server.js'], {
  cwd: path.join(__dirname, 'backend'),
  env: {
    ...process.env,
    PORT: backendPort,
    NODE_ENV: 'production'
  },
  stdio: 'inherit'
});

backendProcess.on('error', (err) => {
  console.error('[Backend Failed to Start]', err);
});

backendProcess.on('exit', (code, signal) => {
  console.log(`[Backend Exited] code: ${code}, signal: ${signal}`);
  if (code !== 0 && code !== null) {
    process.exit(code);
  }
});

// 2. Start Next.js Frontend Server on Port 3000 (CapRover default)
const frontendPort = process.env.PORT || '3000';
console.log(`[Runner] Launching Next.js Frontend on port ${frontendPort}...`);

const frontendProcess = spawn('npx', ['next', 'start', '-p', frontendPort, '-H', '0.0.0.0'], {
  cwd: path.join(__dirname, 'frontend'),
  env: {
    ...process.env,
    PORT: frontendPort,
    NODE_ENV: 'production'
  },
  stdio: 'inherit'
});

frontendProcess.on('error', (err) => {
  console.error('[Frontend Failed to Start]', err);
});

frontendProcess.on('exit', (code, signal) => {
  console.log(`[Frontend Exited] code: ${code}, signal: ${signal}`);
  if (code !== 0 && code !== null) {
    process.exit(code);
  }
});

// Clean shutdown handler
function shutdown(signal) {
  console.log(`[Runner] Received ${signal}. Shutting down cleanly...`);
  try { backendProcess.kill(signal); } catch {}
  try { frontendProcess.kill(signal); } catch {}
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
