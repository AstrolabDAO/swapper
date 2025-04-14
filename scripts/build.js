#!/usr/bin/env bun

import dts from 'bun-plugin-dts';
import { join, resolve } from 'node:path';
import { copyFile, rm } from 'node:fs/promises';

const rootDir = resolve('.');

async function buildCore() {
  console.log('Building core package...');

  // Clean dist directory
  await rm(join(rootDir, 'packages/core/dist'), { recursive: true, force: true });

  // Build with declaration files
  const result = await Bun.build({
    entrypoints: [join(rootDir, 'packages/core/src/index.ts')],
    outdir: join(rootDir, 'packages/core/dist'),
    target: 'bun',
    format: 'esm',
    sourcemap: 'external',
    plugins: [
      dts({
        // You can provide additional options here if needed
      }),
    ],
  });

  if (!result.success) {
    console.error('Core build failed:');
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Copy README.md and CHANGELOG.md to dist
  await copyFile(join(rootDir, 'README.md'), join(rootDir, 'packages/core/dist/README.md'));
  await copyFile(join(rootDir, 'CHANGELOG.md'), join(rootDir, 'packages/core/dist/CHANGELOG.md'));

  console.log('Core package built successfully!');
}

async function buildCli() {
  console.log('Building CLI package...');

  // Clean dist directory
  await rm(join(rootDir, 'packages/cli/dist'), { recursive: true, force: true });

  // Build CLI
  const result = await Bun.build({
    entrypoints: [join(rootDir, 'packages/cli/src/cli.ts')],
    outdir: join(rootDir, 'packages/cli/dist'),
    target: 'node',
    format: 'esm',
    external: ['@btr-supply/swap'],
  });

  if (!result.success) {
    console.error('CLI build failed:');
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Copy documentation files
  await copyFile(join(rootDir, 'packages/cli/README.md'), join(rootDir, 'packages/cli/dist/README.md'));
  await copyFile(join(rootDir, 'CHANGELOG.md'), join(rootDir, 'packages/cli/dist/CHANGELOG.md'));

  console.log('CLI package built successfully!');
}

async function main() {
  try {
    await buildCore();
    await buildCli();
    console.log('All packages built successfully!');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

main();
