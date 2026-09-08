#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const options = {root: process.cwd(), apply: false, print: false, force: false, target: 'suite'};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') options.root = path.resolve(argv[++i]);
    else if (arg === '--apply') options.apply = true;
    else if (arg === '--print') options.print = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--target') options.target = argv[++i];
    else if (arg === '--check') { /* default */ }
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['suite', 'cli'].includes(options.target)) throw new Error('--target must be suite or cli');
  return options;
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function containsPlaceholder(value) {
  let found = false;
  const walk = item => {
    if (typeof item === 'string' && /YOUR_[A-Z0-9_]+|CHANGE_ME|<[^>]+>/.test(item)) found = true;
    else if (Array.isArray(item)) item.forEach(walk);
    else if (item && typeof item === 'object') Object.values(item).forEach(walk);
  };
  walk(value);
  return found;
}

function mergeServers(existing, workspace, force) {
  const result = structuredClone(existing ?? {mcpServers: {}});
  if (!result.mcpServers || typeof result.mcpServers !== 'object') result.mcpServers = {};
  const conflicts = [];
  for (const [name, server] of Object.entries(workspace.mcpServers ?? {})) {
    if (Object.hasOwn(result.mcpServers, name) && !force) {
      conflicts.push(name);
      continue;
    }
    result.mcpServers[name] = server;
  }
  return {result, conflicts};
}

function targetPath(target) {
  return target === 'suite'
    ? path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json')
    : path.join(os.homedir(), '.gemini', 'antigravity-cli', 'mcp_config.json');
}

function backup(file) {
  if (!fs.existsSync(file)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `${file}.ag-kit-backup-${stamp}`;
  fs.copyFileSync(file, backupFile);
  return backupFile;
}

function resolveEnvPlaceholders(workspace, root) {
  const envFile = path.join(root, '.env');
  const envMap = {};
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const l of lines) {
      const parts = l.trim().split('=');
      if (parts.length >= 2) {
        envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    }
  }

  const token = envMap.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = envMap.SUPABASE_PROJECT_REF || process.env.SUPABASE_PROJECT_REF || 'vljftyhuzylljrgppmve';

  const walkAndReplace = item => {
    if (typeof item === 'string') {
      if (token && (item === 'YOUR_SUPABASE_ACCESS_TOKEN' || item === 'YOUR_API_KEY')) return token;
      return item;
    }
    if (Array.isArray(item)) return item.map(walkAndReplace);
    if (item && typeof item === 'object') {
      const copy = {};
      for (const [k, v] of Object.entries(item)) {
        copy[k] = walkAndReplace(v);
      }
      return copy;
    }
    return item;
  };

  const resolved = walkAndReplace(workspace);

  // Shield: If supabase server is present, ensure it has project_ref and Authorization header
  if (resolved?.mcpServers?.supabase && token) {
    const sb = resolved.mcpServers.supabase;
    if (sb.serverUrl && sb.serverUrl.includes('mcp.supabase.com')) {
      if (!sb.serverUrl.includes('project_ref=')) {
        sb.serverUrl = `https://mcp.supabase.com/mcp?project_ref=${projectRef}`;
      }
      if (!sb.headers) sb.headers = {};
      if (!sb.headers.Authorization) {
        sb.headers.Authorization = `Bearer ${token}`;
      }
    }
  }

  return resolved;
}

export function planSync({root, target = 'suite', force = false}) {
  const source = path.join(root, '.agents', 'mcp_config.json');
  const rawWorkspace = readJson(source);
  if (!rawWorkspace || typeof rawWorkspace.mcpServers !== 'object') throw new Error('Invalid workspace .agents/mcp_config.json');
  const workspace = resolveEnvPlaceholders(rawWorkspace, root);
  const destination = targetPath(target);
  const existing = readJson(destination, {mcpServers: {}});
  const {result, conflicts} = mergeServers(existing, workspace, force);
  return {source, destination, workspace, merged: result, conflicts, placeholders: containsPlaceholder(workspace)};
}

import url from 'node:url';

if (process.argv[1] && url.pathToFileURL(path.resolve(process.argv[1])).href.toLowerCase() === import.meta.url.toLowerCase()) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const plan = planSync(options);
    console.log(`Source: ${plan.source}`);
    console.log(`Target: ${plan.destination}`);
    console.log(`Servers: ${Object.keys(plan.workspace.mcpServers).join(', ') || '(none)'}`);
    if (plan.conflicts.length) console.log(`Conflicts kept unchanged: ${plan.conflicts.join(', ')}`);
    if (plan.placeholders) console.log('Warning: unresolved placeholders detected; --apply is blocked until they are configured.');
    if (options.print) console.log(JSON.stringify(plan.merged, null, 2));
    if (options.apply) {
      if (plan.placeholders) throw new Error('Refusing to apply MCP configuration with unresolved placeholders.');
      fs.mkdirSync(path.dirname(plan.destination), {recursive: true});
      const backupFile = backup(plan.destination);
      fs.writeFileSync(plan.destination, `${JSON.stringify(plan.merged, null, 2)}\n`, 'utf8');
      console.log(`Applied MCP configuration.${backupFile ? ` Backup: ${backupFile}` : ''}`);
    } else {
      console.log('Check only. Use --apply after reviewing the plan.');
    }
  } catch (error) {
    console.error(`MCP sync failed: ${error.message}`);
    process.exitCode = 1;
  }
}
