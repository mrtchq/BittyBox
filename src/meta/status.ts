export interface BittyTool {
  name: string;
  description: string;
  kind: 'mcp' | 'rest' | 'both';
  path: string;
}

// Single source of truth: this manifest drives both the MCP server AND the
// machine-readable discovery doc. The landing page build can read it too so
// the human homepage can never drift from the agent interface.
export const TOOLS: BittyTool[] = [
  { name: 'create_box', description: 'Create a new portable Bitty Box micro-site', kind: 'both', path: '/api/boxes' },
  { name: 'get_box', description: 'Fetch a stored box by id', kind: 'both', path: '/api/boxes/:id' },
  { name: 'list_boxes', description: 'List stored boxes', kind: 'both', path: '/api/boxes' },
];

export function serverStatus() {
  return {
    name: 'bittybox.org',
    version: '1.0.0',
    protocol: 'micro-web',
    endpoints: {
      landing: '/',
      api: '/api',
      mcp: '/mcp',
      discovery: '/.well-known/bittybox-agent.json',
    },
    tools: TOOLS,
    ts: Date.now(),
  };
}
