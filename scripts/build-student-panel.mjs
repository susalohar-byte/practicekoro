// Builds the Student Web Panel (student-web/) into dist/dashboard/, so one upload of dist/ to
// public_html/ ships the site, the admin console at /admin and the panel at /dashboard together.
// Runs after the main `vite build`, which empties dist/ first.
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const panel = 'student-web';

if (!existsSync(join(panel, 'node_modules'))) {
  console.log('Installing the student panel dependencies…');
  execSync('npm ci', { cwd: panel, stdio: 'inherit' });
}
execSync('npm run build -- --outDir ../dist/dashboard --emptyOutDir', {
  cwd: panel,
  stdio: 'inherit',
});

// The panel does not link to the APK (the site root serves it), and Play Store bundles (.aab)
// are upload files, never downloads. Untracked copies in public/ must not reach the server.
rmSync(join('dist', 'dashboard', 'PracticeKoro.apk'), { force: true });
// Local notes of build settings are not for the public site either.
rmSync(join('dist', 'env.txt'), { force: true });
const dropBundles = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) dropBundles(path);
    else if (name.endsWith('.aab')) rmSync(path);
  }
};
dropBundles('dist');

if (
  !existsSync(join('dist', 'dashboard', 'index.html')) ||
  !existsSync(join('dist', 'dashboard', '.htaccess'))
) {
  throw new Error('dist/dashboard is missing index.html or .htaccess');
}
console.log('Student panel built into dist/dashboard/');
