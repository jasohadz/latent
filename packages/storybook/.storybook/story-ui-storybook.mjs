#!/usr/bin/env node
// Written by Story UI. Starts Storybook with WATCHPACK_POLLING set on macOS, where
// Storybook's story-index watcher (watchpack over fs.watch) shares one FSEvents stream
// rooted at your home directory: a burst of file activity anywhere under it drops events
// silently, and a new story then never appears until Storybook restarts. Polling stats the
// directories instead, so nothing FSEvents does can reach it.
//
// This has to happen before Node loads Storybook — watchpack reads the variable once, when
// its module is first evaluated, which is before .storybook/main is read. Setting it inside
// the config is too late and has no effect.
//
// Everything after the script name is passed to Storybook unchanged, so this file is a
// drop-in for the `storybook` command. Delete it and restore the plain command if you set
// WATCHPACK_POLLING yourself.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

if (process.platform === 'darwin' && !process.env.WATCHPACK_POLLING) {
  process.env.WATCHPACK_POLLING = '1000';
}

const require = createRequire(import.meta.url);
const pkgPath = require.resolve('storybook/package.json', { paths: [process.cwd(), import.meta.dirname] });
const pkg = require(pkgPath);
const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.storybook;
await import(pathToFileURL(path.join(path.dirname(pkgPath), bin)).href);
