import { TemplatePreset } from '../types';

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'portfolio',
    name: 'Developer & Creator Portfolio',
    category: 'Showcases',
    description: 'A modern, responsive personal portfolio with avatar, project showcase cards, skill badges, experience timeline, and contact links.',
    icon: 'Briefcase',
    title: 'Alex Vance // Systems Architect',
    docDescription: 'Cyberpunk developer portfolio with projects and contact links.',
    favicon: '⚡',
    type: 'portfolio',
    tags: ['Portfolio', 'Resume', 'Bio', 'Projects'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Vance // Systems Architect</title>
  <style>
    :root {
      --bg: #070314;
      --card-bg: rgba(18, 8, 38, 0.85);
      --cyan: #00f2ff;
      --pink: #ff00de;
      --purple: #8b5cf6;
      --text: #f1f5f9;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 2rem 1rem;
      min-height: 100vh;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 2.5rem;
      position: relative;
    }
    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--cyan), var(--pink));
      padding: 3px;
      margin: 0 auto 1rem auto;
      box-shadow: 0 0 25px rgba(0, 242, 255, 0.4);
    }
    .avatar-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #0d0420;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
    }
    h1 {
      font-size: 2rem;
      color: #ffffff;
      margin-bottom: 0.25rem;
      letter-spacing: -0.02em;
    }
    .subtitle {
      color: var(--cyan);
      font-size: 0.95rem;
      font-family: monospace;
      margin-bottom: 0.75rem;
    }
    .bio {
      color: var(--muted);
      font-size: 0.95rem;
      max-width: 520px;
      margin: 0 auto;
    }
    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 1rem;
    }
    .badge {
      background: rgba(0, 242, 255, 0.1);
      border: 1px solid rgba(0, 242, 255, 0.3);
      color: var(--cyan);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-family: monospace;
    }
    .section-title {
      font-size: 1.1rem;
      font-family: monospace;
      color: var(--pink);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 2rem 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .section-title::after {
      content: "";
      flex: 1;
      height: 1px;
      background: rgba(255, 0, 222, 0.25);
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    @media (min-width: 600px) {
      .grid { grid-template-columns: 1fr 1fr; }
    }
    .card {
      background: var(--card-bg);
      border: 1px solid rgba(0, 242, 255, 0.2);
      border-radius: 12px;
      padding: 1.25rem;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: var(--cyan);
      box-shadow: 0 8px 24px rgba(0, 242, 255, 0.15);
    }
    .card-title {
      font-size: 1.05rem;
      color: #ffffff;
      margin-bottom: 0.4rem;
    }
    .card-desc {
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 0.75rem;
    }
    .card-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--cyan);
      text-decoration: none;
      font-size: 0.8rem;
      font-weight: bold;
    }
    .card-link:hover { text-decoration: underline; }
    .contact-bar {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn {
      background: linear-gradient(135deg, var(--purple), var(--pink));
      color: #ffffff;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="avatar">
        <div class="avatar-inner">⚡</div>
      </div>
      <h1>Alex Vance</h1>
      <div class="subtitle">&lt;Distributed Systems &amp; Web Architect /&gt;</div>
      <p class="bio">Building zero-server protocols, client-side cryptographic VMs, and reactive micro-applications.</p>
      
      <div class="skills">
        <span class="badge">TypeScript</span>
        <span class="badge">Rust</span>
        <span class="badge">WebAssembly</span>
        <span class="badge">Cryptography</span>
        <span class="badge">WebSockets</span>
      </div>
    </header>

    <div class="section-title">Selected Projects</div>
    <div class="grid">
      <div class="card">
        <h3 class="card-title">📦 Bitty Box Engine</h3>
        <p class="card-desc">Zero-server micro-web protocol storing full client-side applications directly inside URL fragments.</p>
        <a href="#projects" class="card-link">View Architecture &rarr;</a>
      </div>

      <div class="card">
        <h3 class="card-title">🔒 Quantum Vault</h3>
        <p class="card-desc">AES-256-GCM client-side encryption layer with PBKDF2 key derivation and zero server logs.</p>
        <a href="#vault" class="card-link">Inspect Cipher &rarr;</a>
      </div>

      <div class="card">
        <h3 class="card-title">⚡ Matrix Terminal</h3>
        <p class="card-desc">Lightweight retro terminal emulator with custom command pipelines and reactive canvas rendering.</p>
        <a href="#cli" class="card-link">Launch Terminal &rarr;</a>
      </div>

      <div class="card">
        <h3 class="card-title">🌌 Synthwave Horizon</h3>
        <p class="card-desc">Interactive procedural canvas visualizer with adaptive audio synthesis and retro-future styling.</p>
        <a href="#canvas" class="card-link">Play Visualizer &rarr;</a>
      </div>
    </div>

    <div class="contact-bar">
      <a href="mailto:alex@bitty.box" class="btn">✉️ Get In Touch</a>
      <a href="https://github.com" target="_blank" class="btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">💻 GitHub Profile</a>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'documentation',
    name: 'Interactive Technical Documentation',
    category: 'Docs & Data',
    description: 'Clean technical documentation with sticky sidebar navigation, interactive code snippet blocks with copy buttons, warning callouts, and search filter.',
    icon: 'BookOpen',
    title: 'Bitty Box // Developer Manual',
    docDescription: 'Technical reference manual and API specifications for Bitty Box.',
    favicon: '📖',
    type: 'docs',
    tags: ['Docs', 'API', 'Manual', 'Code'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bitty Box // Developer Manual</title>
  <style>
    :root {
      --bg: #09090b;
      --sidebar-bg: #121216;
      --card-bg: #18181b;
      --cyan: #00f2ff;
      --green: #22c55e;
      --amber: #f59e0b;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --border: #27272a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      display: flex;
      min-height: 100vh;
    }
    #sidebar {
      width: 260px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border);
      padding: 1.5rem 1rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      flex-shrink: 0;
    }
    @media (max-width: 768px) {
      body { flex-direction: column; }
      #sidebar { width: 100%; height: auto; position: static; border-right: none; border-bottom: 1px solid var(--border); }
    }
    .brand {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--cyan);
      font-family: monospace;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-section {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--muted);
      margin: 1rem 0 0.5rem 0.5rem;
      font-weight: bold;
    }
    .nav-link {
      display: block;
      color: #d4d4d8;
      text-decoration: none;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .nav-link:hover, .nav-link.active {
      background: rgba(0, 242, 255, 0.15);
      color: var(--cyan);
    }
    #main {
      flex: 1;
      padding: 2.5rem 2rem;
      max-width: 860px;
    }
    h1 { font-size: 2.2rem; color: #fff; margin-bottom: 0.5rem; }
    h2 { font-size: 1.4rem; color: #fff; margin: 2rem 0 0.75rem 0; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    p { color: #d4d4d8; margin-bottom: 1rem; }
    .callout {
      background: rgba(245, 158, 11, 0.1);
      border-left: 4px solid var(--amber);
      padding: 1rem;
      border-radius: 0 8px 8px 0;
      margin: 1.5rem 0;
      font-size: 0.9rem;
    }
    .code-block {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      position: relative;
      font-family: monospace;
      font-size: 0.85rem;
      overflow-x: auto;
    }
    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #27272a;
      border: 1px solid #3f3f46;
      color: #d4d4d8;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .copy-btn:hover { background: #3f3f46; color: #fff; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.85rem;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.6rem 0.8rem;
      text-align: left;
    }
    th { background: #18181b; color: var(--cyan); }
  </style>
</head>
<body>
  <nav id="sidebar">
    <div class="brand">📦 BITTY DOCS</div>
    <div class="nav-section">Getting Started</div>
    <a href="#intro" class="nav-link active">Introduction</a>
    <a href="#compression" class="nav-link">Compression Pipeline</a>
    <a href="#encryption" class="nav-link">AES-256 Encryption</a>
    <div class="nav-section">API &amp; Specifications</div>
    <a href="#url-format" class="nav-link">URL Schema</a>
    <a href="#limits" class="nav-link">Browser Limits</a>
  </nav>

  <main id="main">
    <h1 id="intro">Bitty Box Specification</h1>
    <p>Bitty Box is a zero-server micro-web protocol. Every webpage is compressed using Deflate (GZIP/LZMA) and stored directly inside the URL hash fragment.</p>

    <div class="callout">
      <strong>⚡ Zero Infrastructure Requirement:</strong> No database or web hosting required. The URL is the single point of truth.
    </div>

    <h2 id="compression">1. Compression Pipeline</h2>
    <p>Client payloads are converted to UTF-8 byte streams, passed through native <code>CompressionStream('deflate')</code>, and encoded via URL-safe Base64.</p>

    <div class="code-block">
      <button class="copy-btn" onclick="copyCode(this)">COPY</button>
      <pre>const cs = new CompressionStream('deflate');
const writer = cs.writable.getWriter();
writer.write(new TextEncoder().encode(payload));
writer.close();</pre>
    </div>

    <h2 id="encryption">2. AES-256-GCM Encryption</h2>
    <p>When password protected, keys are derived via PBKDF2 with 100,000 SHA-256 iterations and encrypted using AES-GCM cipher with a random 12-byte initialization vector.</p>

    <table>
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Standard</th>
          <th>Security Level</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cipher</td>
          <td>AES-GCM-256</td>
          <td>Military Grade</td>
        </tr>
        <tr>
          <td>Key Derivation</td>
          <td>PBKDF2 (100k rounds)</td>
          <td>High Entropy</td>
        </tr>
        <tr>
          <td>IV Size</td>
          <td>96-bit (12 bytes)</td>
          <td>NIST Compliant</td>
        </tr>
      </tbody>
    </table>
  </main>

  <script>
    function copyCode(btn) {
      const code = btn.nextElementSibling.innerText;
      navigator.clipboard.writeText(code);
      btn.innerText = 'COPIED!';
      setTimeout(() => btn.innerText = 'COPY', 2000);
    }
  </script>
</body>
</html>`
  },
  {
    id: 'dashboard',
    name: 'Interactive Metrics & Analytics Dashboard',
    category: 'Docs & Data',
    description: 'An interactive analytical dashboard with real-time KPI counter widgets, mini SVG sparkline charts, status toggle filters, and activity log.',
    icon: 'LayoutDashboard',
    title: 'Quantum Telemetry Dashboard',
    docDescription: 'Interactive telemetry and metrics dashboard encapsulated inside a URL.',
    favicon: '📊',
    type: 'dashboard',
    tags: ['Dashboard', 'Charts', 'KPI', 'Analytics'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quantum Telemetry Dashboard</title>
  <style>
    :root {
      --bg: #050515;
      --card: rgba(10, 10, 30, 0.85);
      --cyan: #00f2ff;
      --pink: #ff00de;
      --teal: #00f5d4;
      --text: #e0f2fe;
      --muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 1.5rem;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(0, 242, 255, 0.2);
      padding-bottom: 1rem;
    }
    .logo { font-size: 1.25rem; font-weight: 800; color: var(--cyan); font-family: monospace; }
    .badge {
      background: rgba(0, 245, 212, 0.15);
      color: var(--teal);
      border: 1px solid var(--teal);
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-family: monospace;
    }
    .grid-kpi {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi-card {
      background: var(--card);
      border: 1px solid rgba(0, 242, 255, 0.25);
      border-radius: 10px;
      padding: 1.25rem;
    }
    .kpi-title { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-family: monospace; }
    .kpi-val { font-size: 1.8rem; font-weight: bold; color: #fff; margin: 0.25rem 0; }
    .kpi-change { font-size: 0.75rem; color: var(--teal); font-weight: 600; }
    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .main-grid { grid-template-columns: 1fr; }
    }
    .panel {
      background: var(--card);
      border: 1px solid rgba(0, 242, 255, 0.2);
      border-radius: 10px;
      padding: 1.25rem;
    }
    .panel-header { font-size: 0.9rem; font-weight: bold; color: var(--cyan); margin-bottom: 1rem; font-family: monospace; }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 140px;
      padding-top: 1rem;
    }
    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
    }
    .bar-fill {
      width: 100%;
      background: linear-gradient(to top, var(--pink), var(--cyan));
      border-radius: 4px 4px 0 0;
      transition: height 0.3s;
    }
    .bar-label { font-size: 0.65rem; color: var(--muted); margin-top: 4px; font-family: monospace; }
    .feed-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 0.8rem;
    }
    .btn-refresh {
      background: var(--cyan);
      color: #000;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.75rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ QUANTUM CORE // TELEMETRY</div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="badge">LIVE NODE</span>
        <button class="btn-refresh" onclick="randomizeData()">PULSE DATA</button>
      </div>
    </div>

    <div class="grid-kpi">
      <div class="kpi-card">
        <div class="kpi-title">Link Invocations</div>
        <div class="kpi-val" id="kpi-1">28,491</div>
        <div class="kpi-change">&uarr; +14.2% today</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Compression Ratio</div>
        <div class="kpi-val" id="kpi-2">84.6%</div>
        <div class="kpi-change">&darr; 4.2ms decode</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Encrypted Vaults</div>
        <div class="kpi-val" id="kpi-3">1,402</div>
        <div class="kpi-change">&uarr; AES-GCM-256</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="panel">
        <div class="panel-header">TRANSMISSION TRAFFIC (LAST 7 DAYS)</div>
        <div class="bar-chart" id="chart">
          <div class="bar-col"><div class="bar-fill" style="height: 45%;"></div><span class="bar-label">MON</span></div>
          <div class="bar-col"><div class="bar-fill" style="height: 60%;"></div><span class="bar-label">TUE</span></div>
          <div class="bar-col"><div class="bar-fill" style="height: 85%;"></div><span class="bar-label">WED</span></div>
          <div class="bar-col"><div class="bar-fill" style="height: 70%;"></div><span class="bar-label">THU</span></div>
          <div class="bar-col"><div class="bar-fill" style="height: 95%;"></div><span class="bar-label">FRI</span></div>
          <div class="bar-col"><div class="bar-fill" style="height: 50%;"></div><span class="bar-label">SAT</span></div>
          <div class="bar-col"><div class="bar-fill" style="height: 80%;"></div><span class="bar-label">SUN</span></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">REALTIME EVENT STREAM</div>
        <div class="feed-item"><span>Hash Decompressed</span><strong style="color:var(--teal)">2s ago</strong></div>
        <div class="feed-item"><span>QR Key Scanned</span><strong style="color:var(--cyan)">14s ago</strong></div>
        <div class="feed-item"><span>AES Payload Decrypted</span><strong style="color:var(--pink)">1m ago</strong></div>
        <div class="feed-item"><span>Client VM Initialized</span><strong style="color:var(--muted)">3m ago</strong></div>
      </div>
    </div>
  </div>

  <script>
    function randomizeData() {
      document.querySelectorAll('.bar-fill').forEach(bar => {
        const h = Math.floor(Math.random() * 60) + 35;
        bar.style.height = h + '%';
      });
      document.getElementById('kpi-1').innerText = (Math.floor(Math.random() * 10000) + 20000).toLocaleString();
    }
  </script>
</body>
</html>`
  },
  {
    id: 'cyber-terminal',
    name: 'Cyberpunk Interactive Terminal CLI',
    category: 'Interactive & Games',
    description: 'An interactive UNIX/Cyberpunk shell emulator where users can type commands like help, cat bio.txt, matrix, skills, and clear.',
    icon: 'Terminal',
    title: 'Bitty Shell // Interactive Terminal',
    docDescription: 'Interactive terminal emulator running directly inside URL.',
    favicon: '💻',
    type: 'terminal',
    tags: ['Terminal', 'CLI', 'Shell', 'Matrix'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bitty Shell // Terminal CLI</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #020b05;
      color: #00ff66;
      font-family: 'Courier New', Courier, monospace;
      padding: 1.5rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    #terminal {
      flex: 1;
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
      background: rgba(1, 15, 6, 0.9);
      border: 1px solid #00ff66;
      box-shadow: 0 0 25px rgba(0, 255, 102, 0.2);
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .banner {
      color: #00ff66;
      font-weight: bold;
      margin-bottom: 1rem;
      border-bottom: 1px solid rgba(0, 255, 102, 0.3);
      padding-bottom: 0.5rem;
    }
    .log-line { margin: 0.3rem 0; line-height: 1.4; word-break: break-word; }
    .prompt-line { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
    .prompt { color: #34d399; font-weight: bold; }
    input {
      flex: 1;
      background: transparent;
      border: none;
      color: #ffffff;
      font-family: inherit;
      font-size: 1rem;
      outline: none;
    }
  </style>
</head>
<body>
  <div id="terminal" onclick="document.getElementById('cmd').focus()">
    <div class="banner">
==================================================<br>
  BITTY SHELL v2.4 // ZERO-SERVER KERNEL ACTIVE<br>
  Type 'help' for available commands.<br>
==================================================
    </div>
    <div id="history"></div>
    <div class="prompt-line">
      <span class="prompt">guest@bitty:~$</span>
      <input type="text" id="cmd" autofocus autocomplete="off" spellcheck="false">
    </div>
  </div>

  <script>
    const input = document.getElementById('cmd');
    const history = document.getElementById('history');

    const commands = {
      help: 'Available commands: help, bio, skills, matrix, date, clear, echo [text]',
      bio: 'Alex Vance - Senior Cyber Systems Architect. Specializing in URL-native web protocols.',
      skills: 'JavaScript, TypeScript, WebAssembly, Rust, WebCrypto AES-GCM, GZIP Compression',
      date: () => new Date().toString(),
      matrix: () => 'Wake up, Neo... The Matrix has you. Follow the white rabbit. 🐇',
      clear: () => { history.innerHTML = ''; return null; }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        input.value = '';
        if (!val) return;

        const cmdLine = document.createElement('div');
        cmdLine.className = 'log-line';
        cmdLine.innerHTML = '<span class="prompt">guest@bitty:~$</span> ' + val;
        history.appendChild(cmdLine);

        const parts = val.split(' ');
        const mainCmd = parts[0].toLowerCase();

        let output = '';
        if (mainCmd === 'echo') {
          output = parts.slice(1).join(' ');
        } else if (commands[mainCmd]) {
          output = typeof commands[mainCmd] === 'function' ? commands[mainCmd]() : commands[mainCmd];
        } else {
          output = "command not found: " + mainCmd + ". Type 'help' for instructions.";
        }

        if (output) {
          const resLine = document.createElement('div');
          resLine.className = 'log-line';
          resLine.style.color = '#38bdf8';
          resLine.innerText = output;
          history.appendChild(resLine);
        }

        window.scrollTo(0, document.body.scrollHeight);
      }
    });
  </script>
</body>
</html>`
  },
  {
    id: 'cyber-art',
    name: 'Cyber Horizon Art',
    category: 'Interactive & Games',
    description: 'An interactive neon synthwave horizon with customizable grid speed, audio synth, and star pulse.',
    icon: 'Sparkles',
    title: 'Neon Horizon',
    docDescription: 'Interactive synthwave retro-futuristic horizon animation.',
    favicon: '🌆',
    type: 'canvas',
    tags: ['Canvas', 'Synthwave', 'Audio', 'Retro'],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Horizon</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #090314;
      color: #00ddff;
      font-family: 'Courier New', monospace;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    .hud {
      position: relative;
      z-index: 10;
      background: rgba(12, 4, 28, 0.75);
      border: 1px solid #00ddff;
      box-shadow: 0 0 20px rgba(0, 221, 255, 0.3);
      padding: 1.5rem 2rem;
      border-radius: 8px;
      text-align: center;
      backdrop-filter: blur(8px);
    }
    h1 {
      font-size: 1.8rem;
      letter-spacing: 4px;
      color: #ff00de;
      text-shadow: 0 0 10px #ff00de;
      margin-bottom: 0.5rem;
    }
    p {
      color: #00f5d4;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    button {
      background: linear-gradient(90deg, #7928ca, #ff00de);
      color: white;
      border: none;
      padding: 0.6rem 1.4rem;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      box-shadow: 0 0 15px rgba(255, 0, 222, 0.5);
      transition: all 0.2s;
    }
    button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 25px rgba(0, 221, 255, 0.8);
    }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <div class="hud">
    <h1>BITTY BOX // MATRIX</h1>
    <p>Stored entirely inside this URL fragment.</p>
    <button onclick="changeColor()">CYCLE SPECTRUM</button>
  </div>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    let offset = 0;
    let hue = 180;

    function draw() {
      ctx.fillStyle = 'rgba(9, 3, 20, 0.2)';
      ctx.fillRect(0, 0, w, h);

      // Sun
      const sunY = h * 0.45;
      const grad = ctx.createRadialGradient(w/2, sunY, 10, w/2, sunY, 120);
      grad.addColorStop(0, '#ff00de');
      grad.addColorStop(0.5, '#7928ca');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w/2, sunY, 120, 0, Math.PI*2);
      ctx.fill();

      // Horizon line
      ctx.strokeStyle = '#00ddff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ddff';
      ctx.beginPath();
      ctx.moveTo(0, sunY + 60);
      ctx.lineTo(w, sunY + 60);
      ctx.stroke();

      // Grid
      offset = (offset + 1.5) % 40;
      const horizon = sunY + 60;
      for (let y = horizon; y < h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = -w; x < w * 2; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(w / 2 + (x - w / 2) * 0.1, horizon);
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }
    draw();

    function changeColor() {
      hue = (hue + 60) % 360;
      document.querySelector('h1').style.color = \`hsl(\${hue}, 100%, 65%)\`;
      document.querySelector('h1').style.textShadow = \`0 0 15px hsl(\${hue}, 100%, 65%)\`;
    }
  </script>
</body>
</html>`
  },
  {
    id: 'classified-dossier',
    name: 'Classified Cipher Dossier',
    category: 'Utilities & Ciphers',
    description: 'A classified cyberpunk report with military style typography, audio blips, and secret passcode verification.',
    icon: 'Shield',
    title: 'Project Quantum Echo',
    docDescription: 'CLASSIFIED // Level 5 Quantum Transmission',
    favicon: '🔒',
    type: 'html',
    tags: ['Security', 'Classified', 'Military', 'Lock'],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PROJECT QUANTUM ECHO // CLASSIFIED</title>
  <style>
    body {
      background: #0a0514;
      color: #38bdf8;
      font-family: monospace;
      padding: 2rem;
      line-height: 1.6;
    }
    .badge {
      display: inline-block;
      background: #dc2626;
      color: white;
      font-weight: bold;
      padding: 0.2rem 0.6rem;
      font-size: 0.8rem;
      letter-spacing: 2px;
      margin-bottom: 1rem;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      border: 1px solid #00ddff;
      padding: 2rem;
      background: rgba(18, 8, 38, 0.85);
      box-shadow: 0 0 30px rgba(0, 221, 255, 0.2);
    }
    h1 { color: #f43f5e; border-bottom: 1px solid #f43f5e; padding-bottom: 0.5rem; }
    .meta { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; }
    .classified {
      background: #000;
      color: #00f5d4;
      padding: 1rem;
      border-left: 3px solid #00f5d4;
      margin: 1.5rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">TOP SECRET // EYES ONLY</div>
    <h1>OPERATION: BITTY BOX</h1>
    <div class="meta">TRANSMISSION ID: BB-9021 // ENCRYPTION: AES-GCM-256</div>
    <p>Zero database footprints detected. The target payload is completely encapsulated inside the client-side URL fragment hash.</p>
    <div class="classified">
      &gt; DATA INTEGRITY: 100% VERIFIED<br>
      &gt; PROTOCOL: GZIP + BASE64 STREAM<br>
      &gt; DECRYPTION TIME: 4ms
    </div>
    <p>Share this transmission link with authorized operatives. When recipient opens link, cryptographic decompression executes instantly in their sandbox browser.</p>
  </div>
</body>
</html>`
  },
  {
    id: 'retro-recipe',
    name: 'Cyberpunk Ramen Recipe',
    category: 'Showcases',
    description: 'Structured recipe card with step timers, ingredient checklists, serving scaling, and nutritional stats.',
    icon: 'Utensils',
    title: 'Neon Tonkotsu Ramen',
    docDescription: 'A rich 12-hour broth with smoked chashu and shoyu nitamago eggs.',
    favicon: '🍜',
    type: 'recipe',
    tags: ['Recipe', 'Food', 'Schema.org'],
    content: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": "Neon Tonkotsu Ramen",
      "image": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80",
      "description": "Legendary rich tonkotsu ramen brewed with scorched scallion oil and seasoned bamboo shoots.",
      "prepTime": "PT30M",
      "cookTime": "PT45M",
      "totalTime": "PT75M",
      "recipeYield": "2 servings",
      "recipeIngredient": [
        "2 portions fresh ramen noodles",
        "4 cups rich pork bone broth",
        "4 slices glazed chashu pork belly",
        "2 marinated soft-boiled ramen eggs",
        "2 tablespoons scorched scallion oil",
        "1/4 cup shredded wood ear mushrooms",
        "2 stalks thinly sliced green onions",
        "2 sheets crispy toasted nori seaweed"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "text": "Warm the serving bowls with hot water. Prepare the seasoned tonkotsu broth in a medium saucepot over medium heat until simmering for 5 minutes."
        },
        {
          "@type": "HowToStep",
          "text": "Boil a large pot of water. Drop in fresh ramen noodles and cook vigorously for 2 minutes until firm and chewy."
        },
        {
          "@type": "HowToStep",
          "text": "Ladle 2 cups of boiling hot broth into each warmed bowl. Stir in 1 tablespoon of scorched scallion oil."
        },
        {
          "@type": "HowToStep",
          "text": "Drain noodles thoroughly and fold into the broth. Top carefully with chashu pork, halved eggs, wood ear mushrooms, green onions, and nori sheets."
        }
      ],
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": "680 calories"
      }
    }, null, 2)
  },
  {
    id: 'cyber-contact',
    name: 'Holographic MeCard / VCard',
    category: 'Utilities & Ciphers',
    description: 'Digital holographic business card with instant click-to-call, email, social links, and bio.',
    icon: 'User',
    title: 'Alex Vance // Cyberdeck Engineer',
    docDescription: 'Holo-ID Contact Card',
    favicon: '🪪',
    type: 'contact',
    tags: ['Contact', 'vCard', 'MeCard', 'Phone'],
    content: `MECARD:N:Vance,Alex;TEL:+15550198372;EMAIL:alex.vance@cybernet.bitty;URL:https://github.com;URL:https://twitter.com;URL:https://linkedin.com;NOTE:Lead Quantum Systems Engineer. Building zero-knowledge URL payloads and distributed bitty boxes.;`
  },
  {
    id: 'retro-arcade',
    name: '8-Bit Cyber Arcade Game',
    category: 'Interactive & Games',
    description: 'Playable Neon Dodger mini game with score tracking and responsive canvas controls in <2KB URL size.',
    icon: 'Gamepad2',
    title: 'Neon Dodger 2099',
    docDescription: 'Cyberpunk canvas arcade game playable directly inside URL.',
    favicon: '🕹️',
    type: 'html',
    tags: ['Game', 'Arcade', 'Canvas', 'Action'],
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Neon Dodger 2099</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#090314; color:#00ddff; font-family:monospace; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; overflow:hidden; touch-action:none; }
    #score { font-size: 1.5rem; color:#ff00de; text-shadow:0 0 10px #ff00de; margin-bottom:10px; font-weight:bold; }
    canvas { background:#120826; border:2px solid #00ddff; box-shadow:0 0 20px rgba(0,221,255,0.4); border-radius:6px; max-width:95vw; max-height:75vh; }
    p { font-size:0.85rem; color:#00f5d4; margin-top:10px; text-align:center; }
  </style>
</head>
<body>
  <div id="score">SCORE: 0</div>
  <canvas id="game" width="360" height="480"></canvas>
  <p>Move mouse or drag finger to dodge laser hazards!</p>
  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let player = { x: 180, y: 420, size: 14, speed: 5 };
    let obstacles = [];
    let score = 0;
    let gameOver = false;
    let frame = 0;

    function spawnObstacle() {
      obstacles.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        w: 20 + Math.random() * 30,
        h: 12,
        speed: 3 + Math.random() * 3
      });
    }

    function update() {
      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff00de';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM OVERHEAT', canvas.width/2, canvas.height/2 - 10);
        ctx.fillStyle = '#00ddff';
        ctx.font = '16px monospace';
        ctx.fillText('CLICK / TAP TO REBOOT', canvas.width/2, canvas.height/2 + 25);
        return;
      }

      ctx.fillStyle = 'rgba(18, 8, 38, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Player
      ctx.fillStyle = '#00f5d4';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f5d4';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.size, 0, Math.PI*2);
      ctx.fill();

      // Obstacles
      if (frame % 20 === 0) spawnObstacle();
      ctx.fillStyle = '#ff00de';
      ctx.shadowColor = '#ff00de';
      for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += obs.speed;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        // Collision test
        if (
          player.x + player.size > obs.x &&
          player.x - player.size < obs.x + obs.w &&
          player.y + player.size > obs.y &&
          player.y - player.size < obs.y + obs.h
        ) {
          gameOver = true;
        }

        if (obs.y > canvas.height) {
          obstacles.splice(i, 1);
          score += 10;
          document.getElementById('score').innerText = 'SCORE: ' + score;
        }
      }

      frame++;
      requestAnimationFrame(update);
    }

    function setPos(clientX) {
      const rect = canvas.getBoundingClientRect();
      player.x = (clientX - rect.left) * (canvas.width / rect.width);
      player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    }

    canvas.addEventListener('mousemove', e => { if (!gameOver) setPos(e.clientX); });
    canvas.addEventListener('touchmove', e => { if (!gameOver && e.touches[0]) setPos(e.touches[0].clientX); e.preventDefault(); });
    window.addEventListener('click', () => {
      if (gameOver) {
        gameOver = false;
        score = 0;
        obstacles = [];
        frame = 0;
        document.getElementById('score').innerText = 'SCORE: 0';
        update();
      }
    });

    update();
  </script>
</body>
</html>`
  }
];
