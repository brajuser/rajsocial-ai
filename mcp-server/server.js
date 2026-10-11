import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const here = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const dataFile = path.resolve(process.env.RAJSOCIAL_DATA_FILE || path.join(here, 'data.json'));
const bearerToken = process.env.MCP_BEARER_TOKEN || '';
if (host !== '127.0.0.1' && host !== 'localhost' && !bearerToken) {
  throw new Error('Refusing non-local binding without MCP_BEARER_TOKEN. Set a long random token in the host environment.');
}

const initial = {
  profile: {
    displayName: 'Bodh Raj',
    redditProfile: 'https://www.reddit.com/user/marketingwithraj1/',
    quoraProfile: 'https://www.quora.com/profile/Bodh-Raj-267',
    marketingExperience: 'About 5 years',
    fitnessExperience: '3–4 years',
    voice: 'Friendly, practical, experienced',
    boundaries: 'Use only facts the user supplied. Never invent personal stories, metrics, clients, results, or credentials.'
  },
  guidelines: {
    reddit: 'Check site-wide Reddit rules and the exact subreddit rules before posting. Avoid repetitive, irrelevant, or promotional posts; disclose affiliation where relevant. No karma farming, vote manipulation, or evasion.',
    quora: 'Check current Quora Terms and applicable space rules. Write original, useful answers; avoid spam, repetitive content, and misleading claims.'
  },
  queue: []
};

let writeLock = Promise.resolve();
async function readData() {
  try {
    const parsed = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    return { ...structuredClone(initial), ...parsed, profile: { ...initial.profile, ...(parsed.profile || {}) }, guidelines: { ...initial.guidelines, ...(parsed.guidelines || {}) }, queue: Array.isArray(parsed.queue) ? parsed.queue : [] };
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    await writeData(initial);
    return structuredClone(initial);
  }
}
async function writeData(data) {
  writeLock = writeLock.then(async () => {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    const tmp = `${dataFile}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await fs.rename(tmp, dataFile);
  });
  await writeLock;
}
function textResult(value) { return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }; }
function buildMcpServer() {
  const server = new McpServer({ name: 'rajsocial-ai', version: '0.2.0' });
  server.tool('get_profile', 'Read the saved personal-brand profile used to ground content drafts.', {}, async () => textResult((await readData()).profile));
  server.tool('get_guidelines', 'Read the saved platform safety checklist. This is a reminder, not a live policy feed.', {}, async () => textResult((await readData()).guidelines));
  server.tool('list_queue', 'List queued drafts, optionally filtered by platform or status. Does not publish anything.', {
    platform: z.enum(['reddit', 'quora', 'both']).optional(),
    status: z.enum(['queued', 'draft', 'published']).optional()
  }, async ({ platform, status }) => {
    const { queue } = await readData();
    return textResult(queue.filter(item => (!platform || platform === 'both' || item.platform === platform) && (!status || item.status === status)));
  });
  server.tool('add_queue_item', 'Add a reviewed draft to the private publishing queue. This never submits content to Reddit or Quora.', {
    platform: z.enum(['reddit', 'quora']),
    title: z.string().max(300).optional(),
    text: z.string().min(1).max(20000),
    community: z.string().max(200).optional(),
    plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    topic: z.string().max(200).optional(),
    sourceNote: z.string().max(1000).optional()
  }, async input => {
    const data = await readData();
    const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'queued', ...input };
    data.queue.push(item); await writeData(data); return textResult({ added: true, item });
  });
  server.tool('import_queue', 'Import reviewed drafts from a RajSocial AI queue export. This only stores drafts; it does not publish them.', {
    items: z.array(z.object({
      platform: z.enum(['reddit', 'quora']),
      title: z.string().max(300).optional(),
      text: z.string().min(1).max(20000),
      community: z.string().max(200).optional(),
      plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      topic: z.string().max(200).optional()
    })).max(100)
  }, async ({ items }) => {
    const data = await readData(); const imported = [];
    for (const source of items) {
      const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'queued', ...source };
      data.queue.push(item); imported.push(item.id);
    }
    await writeData(data); return textResult({ importedCount: imported.length, ids: imported, totalQueued: data.queue.length });
  });
  server.tool('update_queue_item', 'Update a queued item or mark it published only after the user confirms they published it manually.', {
    id: z.string().min(1),
    title: z.string().max(300).optional(),
    text: z.string().min(1).max(20000).optional(),
    community: z.string().max(200).optional(),
    plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    status: z.enum(['queued', 'draft', 'published']).optional(),
    userConfirmsManuallyPublished: z.boolean().optional()
  }, async ({ id, userConfirmsManuallyPublished, ...updates }) => {
    const data = await readData(); const item = data.queue.find(x => x.id === id);
    if (!item) return textResult({ updated: false, error: 'Queue item not found.' });
    if (updates.status === 'published' && userConfirmsManuallyPublished !== true) return textResult({ updated: false, error: 'To mark as published, explicitly confirm that you manually published it.' });
    for (const [key, value] of Object.entries(updates)) if (value !== undefined) { if (value === null) delete item[key]; else item[key] = value; }
    if (item.status === 'published') item.publishedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString(); await writeData(data); return textResult({ updated: true, item });
  });
  server.tool('remove_queue_item', 'Remove a draft from the queue. This does not affect any live social post.', { id: z.string().min(1) }, async ({ id }) => {
    const data = await readData(); const before = data.queue.length; data.queue = data.queue.filter(x => x.id !== id); await writeData(data);
    return textResult({ removed: data.queue.length < before, remaining: data.queue.length });
  });
  return server;
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'rajsocial-ai-mcp', publishingEnabled: false }));
app.all('/mcp', async (req, res) => {
  if (bearerToken) {
    const header = req.get('authorization') || '';
    const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
    const a = Buffer.from(supplied); const b = Buffer.from(bearerToken);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Unauthorized' });
  }
  const mcp = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => { transport.close().catch(() => {}); mcp.close().catch(() => {}); });
  try { await mcp.connect(transport); await transport.handleRequest(req, res, req.body); }
  catch (error) { console.error('MCP request failed:', error.message); if (!res.headersSent) res.status(500).json({ error: 'MCP request failed' }); }
});
app.listen(port, host, () => console.log(`RajSocial AI MCP listening on http://${host}:${port}/mcp`));
