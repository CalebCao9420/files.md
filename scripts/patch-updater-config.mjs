#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const [confPath, pubkey, endpoint] = process.argv.slice(2);
if (!confPath || !pubkey || !endpoint) {
  console.error('Usage: patch-updater-config.mjs <tauri.conf.json> <pubkey> <endpoint-url>');
  process.exit(1);
}

const conf = JSON.parse(readFileSync(confPath, 'utf8'));
conf.plugins ??= {};
conf.plugins.updater ??= {};
conf.plugins.updater.pubkey = pubkey;
conf.plugins.updater.endpoints = [endpoint];
conf.bundle ??= {};
conf.bundle.createUpdaterArtifacts = true;

writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n', 'utf8');
console.log('Updated', confPath);
