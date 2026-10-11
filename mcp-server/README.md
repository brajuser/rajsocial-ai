# RajSocial AI MCP server (starter)

Private MCP tools for your personal content queue. **No Reddit/Quora login, tokens, or publishing are implemented.** Tools available to a connected MCP client:

- `get_profile`
- `get_guidelines`
- `list_queue`
- `add_queue_item`
- `import_queue` (bring reviewed items over from an exported queue)
- `update_queue_item`
- `remove_queue_item`

Data is stored in a local JSON file with restrictive file permissions. No external analytics or AI provider is called by this server.

## Run locally

Requires Node.js 20+.

```bash
cd mcp-server
npm install
npm start
```

The default binding is `127.0.0.1:8787`; MCP endpoint is `http://127.0.0.1:8787/mcp`. Health check: `http://127.0.0.1:8787/health`.

For a local-only test, no bearer token is required. Do not expose this local endpoint to a network.

## Remote hosting / ChatGPT MCP

1. Deploy this service to a trusted host with HTTPS and persistent disk.
2. Set `HOST=0.0.0.0`, `PORT` to the platform's assigned port, `RAJSOCIAL_DATA_FILE` to a persistent path, and a high-entropy `MCP_BEARER_TOKEN` using the host's secret manager. Never put the token in source control or the Chrome extension.
3. Verify `/health`, then configure the ChatGPT MCP/custom app connection to use the `/mcp` endpoint and the bearer token, following the connection UI's current requirements.
4. Keep the endpoint private. Review every tool and test with non-sensitive sample drafts before connecting real data.

A ChatGPT plan/workspace may limit custom remote MCP configuration. An MCP server being runnable does not itself connect it to ChatGPT; the server must be hosted and explicitly authorized/connected in a supported ChatGPT surface.

## Important boundaries

- The queue is a planning and record-keeping tool. It cannot publish to Reddit or Quora.
- Do not add browser-cookie/session-token extraction or password collection.
- Reddit developer/API availability and app approval requirements may change; use only an officially authorized integration if one becomes available to your account.
- This server does not fetch live community rules. `get_guidelines` returns a saved reminder, so check the actual subreddit/space rules before each post.
- Quora does not expose a general public posting API for this use case. Keep Quora publishing manual unless an official supported integration becomes available.
- Use the queue for useful, context-specific posts, not repetitive karma farming or mass cross-posting.
