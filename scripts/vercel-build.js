/**
 * Vercel build script — Cross-platform, reliable build runner.
 * Steps:
 *   1. Run `prisma generate` with schema in `server/prisma/schema.prisma`
 *   2. Run `vite build` from `client/` directory
 */

const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(label, cmd, cwd) {
  console.log(`\n▶ [${new Date().toISOString()}] ${label}`);
  console.log(`  $ ${cmd}  (cwd: ${cwd})`);
  try {
    execSync(cmd, {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        PRISMA_GENERATE_DATAPROXY: 'false',
      },
    });
    console.log(`✓ ${label} succeeded`);
  } catch (err) {
    console.error(`\n❌ Error during "${label}":`, err.message);
    throw err;
  }
}

try {
  // ── Step 1: Generate Prisma Client ──────────────────────────────────────────
  run(
    'prisma generate',
    'npx prisma generate --schema=server/prisma/schema.prisma',
    root
  );

  // ── Step 2: Build Vite Frontend ─────────────────────────────────────────────
  run(
    'vite build',
    'npx vite build',
    path.join(root, 'client')
  );

  console.log('\n✨ ✅ Vercel build completed successfully! client/dist is ready for deployment.\n');
} catch (error) {
  console.error('\n🚨 Build failed with error:', error);
  process.exit(1);
}
