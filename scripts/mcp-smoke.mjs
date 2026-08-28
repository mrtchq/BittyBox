import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const base = process.env.BASE ?? 'http://127.0.0.1:3000';
const transport = new SSEClientTransport(new URL(`${base}/mcp/sse`));
const client = new Client({ name: 'smoke', version: '1.0.0' });
await client.connect(transport);

const tools = await client.listTools();
console.log('TOOLS:', tools.tools.map((t) => t.name).join(', '));

const created = await client.callTool({ name: 'create_box', arguments: { content: 'mcp smoke test' } });
console.log('CREATE:', created.content[0].text.slice(0, 120));

const listed = await client.callTool({ name: 'list_boxes', arguments: {} });
console.log('LIST count:', JSON.parse(listed.content[0].text).length);

await client.close();
console.log('MCP_SMOKE_OK');
