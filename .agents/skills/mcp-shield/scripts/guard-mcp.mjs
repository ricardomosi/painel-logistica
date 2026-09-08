#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const options = {check: false, repair: false, root: process.cwd()};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--repair') options.repair = true;
    else if (arg === '--root') options.root = path.resolve(argv[++i]);
    else if (arg === '--help' || arg === '-h') options.help = true;
  }
  if (!options.check && !options.repair) options.check = true;
  return options;
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function extractEnvCredentials(envPath) {
  const creds = {token: null, projectRef: null};
  if (!fs.existsSync(envPath)) return creds;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('SUPABASE_ACCESS_TOKEN=')) {
      creds.token = trimmed.replace('SUPABASE_ACCESS_TOKEN=', '').trim();
    } else if (trimmed.startsWith('SUPABASE_PROJECT_REF=')) {
      creds.projectRef = trimmed.replace('SUPABASE_PROJECT_REF=', '').trim();
    }
  }
  return creds;
}

function extractCursorCredentials(cursorPath) {
  const config = readJsonSafe(cursorPath);
  if (!config?.mcpServers?.supabase) return {token: null, projectRef: null};
  const s = config.mcpServers.supabase;
  let token = null;
  let projectRef = null;

  if (s.headers?.Authorization) {
    token = s.headers.Authorization.replace(/^Bearer\s+/i, '').trim();
  }
  const urlStr = s.url || s.serverUrl || '';
  const match = urlStr.match(/project_ref=([a-zA-Z0-9_-]+)/);
  if (match) projectRef = match[1];

  return {token, projectRef};
}

export function inspectMcp(root = process.cwd()) {
  const globalConfigPath = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json');
  const envPath = path.join(root, '.env');
  const cursorPath = path.join(root, '.cursor', 'mcp.json');

  const globalConfig = readJsonSafe(globalConfigPath);
  const envCreds = extractEnvCredentials(envPath);
  const cursorCreds = extractCursorCredentials(cursorPath);

  const token = envCreds.token || cursorCreds.token || process.env.SUPABASE_ACCESS_TOKEN || null;
  const projectRef = envCreds.projectRef || cursorCreds.projectRef || 'vljftyhuzylljrgppmve';

  const findings = [];

  if (!globalConfig) {
    findings.push({severity: 'error', code: 'global_mcp_missing', message: `Global MCP config not found at ${globalConfigPath}`});
    return {globalConfigPath, globalConfig: null, findings, token, projectRef};
  }

  const supabase = globalConfig.mcpServers?.supabase;
  if (!supabase) {
    findings.push({severity: 'warning', code: 'supabase_not_configured', message: 'Supabase MCP server is not registered in global config.'});
  } else {
    const url = supabase.serverUrl || supabase.url || '';
    const isRemoteSupabase = url.includes('mcp.supabase.com');

    if (isRemoteSupabase) {
      if (!url.includes('project_ref=')) {
        findings.push({
          severity: 'error',
          code: 'missing_project_ref',
          message: 'Supabase serverUrl points to mcp.supabase.com without ?project_ref= parameter.'
        });
      }

      const authHeader = supabase.headers?.Authorization || supabase.headers?.authorization;
      if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        findings.push({
          severity: 'error',
          code: 'unauthorized_initialize_risk',
          message: 'Supabase server lacks Authorization Bearer header. Will trigger "Unauthorized on initialize".'
        });
      }
    }
  }

  return {globalConfigPath, globalConfig, findings, token, projectRef};
}

export function repairMcp(root = process.cwd()) {
  const inspection = inspectMcp(root);
  const {globalConfigPath, globalConfig, token, projectRef} = inspection;

  if (!token) {
    throw new Error('Cannot repair Supabase MCP: No SUPABASE_ACCESS_TOKEN found in .env or .cursor/mcp.json');
  }

  const baseConfig = globalConfig && typeof globalConfig === 'object' ? globalConfig : {mcpServers: {}};
  if (!baseConfig.mcpServers || typeof baseConfig.mcpServers !== 'object') {
    baseConfig.mcpServers = {};
  }

  baseConfig.mcpServers.supabase = {
    serverUrl: `https://mcp.supabase.com/mcp?project_ref=${projectRef}`,
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  fs.mkdirSync(path.dirname(globalConfigPath), {recursive: true});
  fs.writeFileSync(globalConfigPath, `${JSON.stringify(baseConfig, null, 2)}\n`, 'utf8');

  return {repaired: true, path: globalConfigPath, projectRef};
}

import url from 'node:url';

if (process.argv[1] && url.pathToFileURL(path.resolve(process.argv[1])).href.toLowerCase() === import.meta.url.toLowerCase()) {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log('Usage: node guard-mcp.mjs [--check] [--repair] [--root <path>]');
    process.exit(0);
  }

  if (options.repair) {
    try {
      const result = repairMcp(options.root);
      console.log(`[PASS] MCP configuration successfully repaired at ${result.path}`);
      console.log(`Supabase project ref: ${result.projectRef}`);
      process.exit(0);
    } catch (err) {
      console.error(`[FAIL] MCP repair failed: ${err.message}`);
      process.exit(1);
    }
  }

  const result = inspectMcp(options.root);
  if (result.findings.length === 0) {
    console.log('[PASS] All MCP servers are properly authenticated and guarded against Unauthorized errors.');
    process.exit(0);
  } else {
    console.log(`[FAIL] Found ${result.findings.length} MCP issue(s):`);
    for (const f of result.findings) {
      console.log(`  [${f.severity.toUpperCase()}] ${f.code}: ${f.message}`);
    }
    console.log('\nTo automatically fix this, run: node guard-mcp.mjs --repair');
    process.exit(1);
  }
}
