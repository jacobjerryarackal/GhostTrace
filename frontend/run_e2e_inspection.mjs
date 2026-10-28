import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function waitForHttp(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
            resolve(true);
          } else {
            setTimeout(check, 500);
          }
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timeout waiting for ${url}`));
          } else {
            setTimeout(check, 500);
          }
        });
    }
    check();
  });
}

async function main() {
  console.log('>>> [1/4] Starting FastAPI backend on http://127.0.0.1:8000 ...');
  const pythonBin = 'D:\\PythonInstaller\\python.exe';
  const backendProc = spawn(
    pythonBin,
    ['-m', 'uvicorn', 'app.main:app', '--port', '8000', '--host', '127.0.0.1'],
    {
      cwd: path.join(rootDir, 'backend'),
      env: { ...process.env, PYTHONPATH: path.join(rootDir, 'backend') },
      stdio: ['ignore', 'inherit', 'inherit'],
    }
  );

  try {
    await waitForHttp('http://127.0.0.1:8000/health', 15000);
    console.log('>>> [Backend Online] http://127.0.0.1:8000/health is healthy');
  } catch (e) {
    console.error('Failed to connect to backend:', e.message);
    backendProc.kill();
    process.exit(1);
  }

  console.log('>>> [2/4] Starting Next.js production server on http://localhost:3000 ...');
  const frontendProc = spawn(
    'node',
    [path.join(rootDir, 'frontend', 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', '3000'],
    {
      cwd: path.join(rootDir, 'frontend'),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  frontendProc.stderr.on('data', (d) => {
    const s = d.toString();
    if (s.includes('error')) console.error(`Frontend: ${s.trim()}`);
  });

  try {
    await waitForHttp('http://localhost:3000', 20000);
    console.log('>>> [Frontend Online] http://localhost:3000 is ready');
  } catch (e) {
    console.error('Failed to connect to frontend:', e.message);
    backendProc.kill();
    frontendProc.kill();
    process.exit(1);
  }

  console.log('>>> [3/4] Launching Playwright Inspection Suites (Graph Visuals + Safety Confirmations) ...');
  let testSuccess = false;
  try {
    // 1. Graph visual inspection
    console.log('>>> Executing Suite 1: Graph Visual Inspection across 1440px, 768px, 390px ...');
    const visualProc = spawn('node', [path.join(rootDir, 'frontend', 'test-graph-playwright.mjs')], {
      cwd: path.join(rootDir, 'frontend'),
      stdio: 'inherit',
    });

    const visualExitCode = await new Promise((resolve) => {
      visualProc.on('exit', (code) => resolve(code));
    });

    if (visualExitCode !== 0) {
      throw new Error(`Visual suite failed with exit code ${visualExitCode}`);
    }

    // 2. Safety and confirmation inspection
    console.log('\n>>> Executing Suite 2: Reset Demo & Revocation Blast Radius Preview Safety Suite ...');
    const safetyProc = spawn('node', [path.join(rootDir, 'frontend', 'test-safety-playwright.mjs')], {
      cwd: path.join(rootDir, 'frontend'),
      stdio: 'inherit',
    });

    const safetyExitCode = await new Promise((resolve) => {
      safetyProc.on('exit', (code) => resolve(code));
    });

    if (safetyExitCode !== 0) {
      throw new Error(`Safety suite failed with exit code ${safetyExitCode}`);
    }

    testSuccess = true;
  } catch (err) {
    console.error('Test execution threw error:', err.message);
  } finally {
    console.log('>>> [4/4] Shutting down test servers...');
    backendProc.kill('SIGTERM');
    frontendProc.kill('SIGTERM');
    // On Windows, force kill if still lingering
    setTimeout(() => {
      try {
        backendProc.kill();
        frontendProc.kill();
      } catch {}
    }, 1000);
  }

  if (!testSuccess) {
    console.error('Playwright visual test run failed!');
    process.exit(1);
  } else {
    console.log('All visual tests passed successfully!');
  }
}

main().catch((err) => {
  console.error('Orchestration failed:', err);
  process.exit(1);
});
