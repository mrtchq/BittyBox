import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createBittyLink, decodeBittyLink, DEFAULT_DOMAIN } from '../lib/bitty-engine.js';

export function buildMcpServer() {
  const server = new McpServer({
    name: 'bittybox',
    version: '2.0.0'
  });

  // Tool 1: Universal Bitty Link Creator
  server.tool(
    'create_bitty_link',
    'Create a self-contained Bitty Link URL for any text, code, markdown, HTML, SVG, JSON, or canvas to be rendered directly in the browser without backend storage. The compressed payload is contained entirely in the URL hash.',
    {
      content: z.string().describe('The content to encode (text, code, markdown, HTML, JSON, SVG, etc.)'),
      title: z.string().optional().describe('Document or window title (e.g. "My Script", "Project Plan", "Data Summary")'),
      format: z.enum(['auto', 'markdown', 'code', 'html', 'text', 'json', 'svg', 'canvas', 'recipe', 'raw'])
        .optional()
        .default('auto')
        .describe('Rendering format. "auto" automatically detects markdown, HTML, code, or JSON. "code" provides syntax highlighting and line numbers. "markdown" provides rich typography and dark/light mode.'),
      language: z.string().optional().describe('Programming language if format is code (e.g. python, typescript, javascript, bash, sql, rust, go, html, css, json, yaml)'),
      theme: z.enum(['auto', 'dark', 'light']).optional().default('auto').describe('Theme styling for markdown, code, and viewer templates'),
      editable: z.boolean().optional().default(false).describe('Whether to open directly in Bitty Box editable note mode'),
      password: z.string().optional().describe('Optional password to encrypt the document using AES-256-GCM'),
      domain: z.string().optional().describe(`Base domain for the generated link (default: ${DEFAULT_DOMAIN})`)
    },
    async (args) => {
      try {
        const result = await createBittyLink(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 2: Code Bitty Link Creator
  server.tool(
    'create_code_bitty_link',
    'Create a developer-grade syntax-highlighted code viewer Bitty Link with line numbers, copy button, download button, and dark/light themes.',
    {
      code: z.string().describe('The raw source code to display'),
      language: z.string().optional().describe('Programming language (e.g. python, typescript, javascript, rust, go, bash, sql, json, yaml, html, css)'),
      title: z.string().optional().describe('File name or title (e.g. "main.py", "database.sql", "Deploy Script")'),
      theme: z.enum(['dark', 'light', 'auto']).optional().default('dark').describe('Color theme (dark or light)')
    },
    async (args) => {
      try {
        const result = await createBittyLink({
          content: args.code,
          format: 'code',
          language: args.language,
          title: args.title,
          theme: args.theme
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating code Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 3: Markdown Bitty Link Creator
  server.tool(
    'create_markdown_bitty_link',
    'Create a rich Markdown document Bitty Link with GitHub-flavored markdown, syntax-highlighted code blocks, tables, task lists, and reading stats.',
    {
      markdown: z.string().describe('Markdown formatted text'),
      title: z.string().optional().describe('Document title'),
      theme: z.enum(['auto', 'dark', 'light']).optional().default('auto').describe('Color theme')
    },
    async (args) => {
      try {
        const result = await createBittyLink({
          content: args.markdown,
          format: 'markdown',
          title: args.title,
          theme: args.theme
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating markdown Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 4: Interactive HTML Mini-Web App Creator
  server.tool(
    'create_html_bitty_link',
    'Create an interactive HTML / mini-web application Bitty Link that renders inside the secure Bitty Box client sandbox.',
    {
      html: z.string().describe('Complete HTML/CSS/JavaScript code for the web app or widget'),
      title: z.string().optional().describe('App or page title')
    },
    async (args) => {
      try {
        const result = await createBittyLink({
          content: args.html,
          format: 'html',
          title: args.title
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating HTML Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 5: Bitty Link Decoder
  server.tool(
    'decode_bitty_link',
    'Decode an existing Bitty Link URL or hash fragment back to its original source content and metadata.',
    {
      url: z.string().describe('The full Bitty Link URL (e.g. "https://bittybox.org/#My-Title/...") or hash fragment'),
      password: z.string().optional().describe('Passcode if the Bitty Link is AES-256-GCM encrypted')
    },
    async (args) => {
      try {
        const result = await decodeBittyLink(args.url, { password: args.password });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error decoding Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 6: Supported Formats & Capabilities
  server.tool(
    'list_supported_formats',
    'List all supported formats, templates, code languages, and link features supported by Bitty Box.',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              supportedFormats: [
                {
                  format: 'auto',
                  description: 'Auto-detects whether the content is markdown, HTML, code, SVG, or JSON'
                },
                {
                  format: 'markdown',
                  description: 'Rich GitHub-flavored markdown with code highlighting, tables, checkboxes, dark/light themes'
                },
                {
                  format: 'code',
                  description: 'Syntax-highlighted code viewer with line numbers, copy button, and download button'
                },
                {
                  format: 'html',
                  description: 'Interactive HTML/CSS/JavaScript web applications, calculators, widgets, games'
                },
                {
                  format: 'json',
                  description: 'Interactive JSON tree viewer with search and copy'
                },
                {
                  format: 'svg',
                  description: 'Responsive vector graphic viewer with zoom and copy'
                },
                {
                  format: 'canvas',
                  description: 'HTML5 Canvas animation / generative art runner'
                },
                {
                  format: 'recipe',
                  description: 'Schema.org Recipe card with ingredients check-off list and step instructions'
                },
                {
                  format: 'text',
                  description: 'Clean reading typography for plain notes and articles'
                }
              ],
              popularLanguages: [
                'python', 'javascript', 'typescript', 'rust', 'go', 'bash', 'sql', 
                'c', 'cpp', 'csharp', 'java', 'kotlin', 'swift', 'php', 'ruby', 
                'html', 'css', 'json', 'yaml', 'toml', 'dockerfile'
              ],
              features: [
                'Zero-backend persistent URLs (payload stored in URL hash)',
                'GZIP compression level 9',
                'Optional AES-256-GCM password encryption',
                'Embedded responsive dark/light themes',
                'One-click clipboard copy buttons with visual feedback',
                'QR code generation for mobile scanning'
              ]
            }, null, 2)
          }
        ]
      };
    }
  );

  return server;
}
