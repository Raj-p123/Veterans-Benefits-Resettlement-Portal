import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

console.log('Testing "npm start" launched from root directory:', rootDir);

const child = spawn('npm', ['start'], {
  cwd: rootDir,
  shell: true,
  env: { ...process.env, PORT: '5001' },
});

let serverReady = false;

child.stdout.on('data', async (d) => {
  const str = d.toString();
  process.stdout.write(str);

  if (str.includes('Server URL') && !serverReady) {
    serverReady = true;

    try {
      // 1. Check GET /
      const resRoot = await fetch('http://localhost:5001/');
      const textRoot = await resRoot.text();
      console.log('\n----------------------------------------');
      console.log('GET / Status:', resRoot.status);
      console.log('GET / Content-Type:', resRoot.headers.get('content-type'));
      console.log('GET / Contains <div id="root">:', textRoot.includes('id="root"'));

      // 2. Check GET /api/health
      const resHealth = await fetch('http://localhost:5001/api/health');
      const jsonHealth = await resHealth.json();
      console.log('GET /api/health Status:', resHealth.status);
      console.log('GET /api/health Response:', jsonHealth);

      // 3. Check GET /veteran/dashboard (client-side route)
      const resDash = await fetch('http://localhost:5001/veteran/dashboard');
      const textDash = await resDash.text();
      console.log('GET /veteran/dashboard Status:', resDash.status);
      console.log('GET /veteran/dashboard Contains <div id="root">:', textDash.includes('id="root"'));
      console.log('----------------------------------------\n');

      if (resRoot.status === 200 && textRoot.includes('id="root"') && jsonHealth.status === 'ok') {
        console.log('✓ SUCCESS: Backend serves React frontend at / and API at /api/* correctly!');
      } else {
        console.error('✗ FAILED: Root or API check failed.');
        process.exitCode = 1;
      }
    } catch (err) {
      console.error('Error during test requests:', err);
      process.exitCode = 1;
    } finally {
      child.kill();
      process.exit(process.exitCode || 0);
    }
  }
});

child.stderr.on('data', (d) => {
  process.stderr.write(d.toString());
});

setTimeout(() => {
  if (!serverReady) {
    console.error('Timeout waiting for server startup.');
    child.kill();
    process.exit(1);
  }
}, 15000);
