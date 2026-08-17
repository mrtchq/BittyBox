import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export interface TourConfig {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function createBittyTour(config?: TourConfig): any {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    keyboardNavigation: true,
    defaultStepOptions: {
      cancelIcon: {
        enabled: true,
      },
      classes: 'bitty-shepherd-theme',
      scrollTo: {
        behavior: 'smooth',
        block: 'center',
      },
    },
  });

  // Step 1: Welcome Center Modal
  tour.addStep({
    id: 'step-welcome',
    title: '<div class="flex items-center gap-2 text-cyan-300 font-cyber"><span class="text-base">🚀</span> WELCOME TO BITTY BOX 2.0</div>',
    text: `
      <div class="space-y-2 text-xs font-mono text-purple-100">
        <p class="leading-relaxed">
          <strong class="text-cyan-300">Bitty Box</strong> is a zero-server micro-web protocol. Entire interactive web applications, portfolios, and tools are compressed directly into a single URL fragment!
        </p>
        <div class="p-2 rounded bg-purple-950/60 border border-purple-500/30 text-[11px] text-cyan-200">
          ✨ <strong>No servers. No databases. No hosting fees.</strong> The URL is the entire application.
        </div>
      </div>
    `,
    buttons: [
      {
        text: 'SKIP TOUR',
        classes: 'shepherd-btn-secondary',
        action: () => tour.cancel(),
      },
      {
        text: 'START WALKTHROUGH →',
        classes: 'shepherd-btn-primary',
        action: () => tour.next(),
      },
    ],
  });

  // Step 2: Document Title & Metadata
  tour.addStep({
    id: 'step-title',
    attachTo: {
      element: '#doc-title-input',
      on: 'bottom',
    },
    title: '<div class="flex items-center gap-2 text-cyan-300 font-cyber"><span class="text-base">🏷️</span> TITLE & FAVICON SLUG</div>',
    text: `
      <div class="space-y-1.5 text-xs font-mono text-purple-100">
        <p>Give your micro-site a memorable name. You can customize the favicon emoji, author, language tag, and URL path slug.</p>
        <p class="text-[11px] text-cyan-300/80">Every parameter is stored directly inside the URL payload.</p>
      </div>
    `,
    buttons: [
      {
        text: '← BACK',
        classes: 'shepherd-btn-secondary',
        action: () => tour.back(),
      },
      {
        text: 'NEXT →',
        classes: 'shepherd-btn-primary',
        action: () => tour.next(),
      },
    ],
  });

  // Step 3: Template Gallery
  tour.addStep({
    id: 'step-templates',
    attachTo: {
      element: '#bitty-presets-btn',
      on: 'bottom',
    },
    title: '<div class="flex items-center gap-2 text-fuchsia-300 font-cyber"><span class="text-base">⚡</span> TEMPLATE GALLERY</div>',
    text: `
      <div class="space-y-1.5 text-xs font-mono text-purple-100">
        <p>Explore production-ready micro-apps:</p>
        <ul class="list-disc list-inside text-[11px] text-cyan-200/90 space-y-0.5 pl-1">
          <li>Developer Portfolios & MeCards</li>
          <li>Technical Documentation & Code Snippets</li>
          <li>KPI Metric Dashboards & Interactive Charts</li>
          <li>Interactive Terminal CLIs & 8-Bit Cyber Games</li>
        </ul>
      </div>
    `,
    buttons: [
      {
        text: '← BACK',
        classes: 'shepherd-btn-secondary',
        action: () => tour.back(),
      },
      {
        text: 'NEXT →',
        classes: 'shepherd-btn-primary',
        action: () => tour.next(),
      },
    ],
  });

  // Step 4: Code Workspace & Prettier
  tour.addStep({
    id: 'step-code-editor',
    attachTo: {
      element: '#format-code-btn',
      on: 'bottom',
    },
    title: '<div class="flex items-center gap-2 text-cyan-300 font-cyber"><span class="text-base">💻</span> CODE STUDIO & PRETTIER</div>',
    text: `
      <div class="space-y-1.5 text-xs font-mono text-purple-100">
        <p>Write HTML5, CSS3, JavaScript, or Markdown with real-time syntax highlighting.</p>
        <p class="text-[11px] text-teal-300">
          💡 Click <strong>FORMAT CODE</strong> (or press <kbd class="px-1 py-0.5 rounded bg-black/60 border border-cyan-500/30">Shift+Alt+F</kbd>) to instantly beautify and optimize your code!
        </p>
      </div>
    `,
    buttons: [
      {
        text: '← BACK',
        classes: 'shepherd-btn-secondary',
        action: () => tour.back(),
      },
      {
        text: 'NEXT →',
        classes: 'shepherd-btn-primary',
        action: () => tour.next(),
      },
    ],
  });

  // Step 5: Telemetry & URL Compression Gauge
  tour.addStep({
    id: 'step-telemetry',
    attachTo: {
      element: '#stats-copy-url-btn',
      on: 'top',
    },
    title: '<div class="flex items-center gap-2 text-cyan-300 font-cyber"><span class="text-base">📊</span> LIVE TRANSMISSION STATS</div>',
    text: `
      <div class="space-y-1.5 text-xs font-mono text-purple-100">
        <p>Real-time GZIP Deflate telemetry shows your compression ratio, raw payload, packed link size, and browser URL capacity.</p>
        <p class="text-[11px] text-cyan-300">Click <strong>COPY GENERATED URL</strong> anytime to send your self-contained app anywhere!</p>
      </div>
    `,
    buttons: [
      {
        text: '← BACK',
        classes: 'shepherd-btn-secondary',
        action: () => tour.back(),
      },
      {
        text: 'NEXT →',
        classes: 'shepherd-btn-primary',
        action: () => tour.next(),
      },
    ],
  });

  // Step 6: Parameter & AES-256 Vault Cipher
  tour.addStep({
    id: 'step-security',
    attachTo: {
      element: '#bitty-meta-btn',
      on: 'top',
    },
    title: '<div class="flex items-center gap-2 text-fuchsia-300 font-cyber"><span class="text-base">🔒</span> AES-256 VAULT & CIPHER</div>',
    text: `
      <div class="space-y-1.5 text-xs font-mono text-purple-100">
        <p>Configure Open Graph SEO tags or lock your micro-site with military-grade <strong>AES-GCM-256 client-side encryption</strong>.</p>
        <p class="text-[11px] text-fuchsia-300/90">Includes an entropy password analyzer and cryptographic key generator.</p>
      </div>
    `,
    buttons: [
      {
        text: '← BACK',
        classes: 'shepherd-btn-secondary',
        action: () => tour.back(),
      },
      {
        text: 'NEXT →',
        classes: 'shepherd-btn-primary',
        action: () => tour.next(),
      },
    ],
  });

  // Step 7: QR Holograms & Sharing
  tour.addStep({
    id: 'step-qr-share',
    attachTo: {
      element: '#nav-qr-btn',
      on: 'bottom',
    },
    title: '<div class="flex items-center gap-2 text-teal-300 font-cyber"><span class="text-base">📱</span> QR HOLOGRAMS & ZIP EXPORT</div>',
    text: `
      <div class="space-y-1.5 text-xs font-mono text-purple-100">
        <p>Beam your micro-site directly to smartphones with high-density QR holograms, or download an offline-ready standalone ZIP package.</p>
      </div>
    `,
    buttons: [
      {
        text: '← BACK',
        classes: 'shepherd-btn-secondary',
        action: () => tour.back(),
      },
      {
        text: 'NEXT →',
        classes: 'shepherd-btn-primary',
        action: () => tour.next(),
      },
    ],
  });

  // Step 8: Workspace Themes
  tour.addStep({
    id: 'step-themes',
    attachTo: {
      element: '#nav-theme-toggle-btn',
      on: 'bottom',
    },
    title: '<div class="flex items-center gap-2 text-cyan-300 font-cyber"><span class="text-base">🎨</span> WORKSPACE THEMES</div>',
    text: `
      <div class="space-y-1.5 text-xs font-mono text-purple-100">
        <p>Choose your workspace vibe:</p>
        <ul class="list-disc list-inside text-[11px] text-cyan-200/90 space-y-0.5 pl-1">
          <li><strong class="text-fuchsia-300">Neon Synthwave</strong> (Cyberpunk purple & cyan glow)</li>
          <li><strong class="text-zinc-200">Minimalist Monochrome</strong> (High-contrast slate & white)</li>
          <li><strong class="text-emerald-300">Matrix Cyber</strong> (Phosphor green terminal & rain)</li>
        </ul>
        <p class="text-[11px] text-emerald-400 font-bold mt-1">You are all set to build zero-server web applications!</p>
      </div>
    `,
    buttons: [
      {
        text: '← BACK',
        classes: 'shepherd-btn-secondary',
        action: () => tour.back(),
      },
      {
        text: 'FINISH & START CREATING 🚀',
        classes: 'shepherd-btn-primary',
        action: () => tour.complete(),
      },
    ],
  });

  if (config?.onComplete) {
    tour.on('complete', config.onComplete);
  }
  if (config?.onCancel) {
    tour.on('cancel', config.onCancel);
  }

  return tour;
}
