(() => {
  // Navigation & Mobile Menu
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.topbar nav');
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.topbar nav a').forEach(a => {
    a.addEventListener('click', () => nav?.classList.remove('open'));
  });

  // Hero Quick State Preview
  const stateBtns = document.querySelectorAll('.hero-quick-switch .state-btn');
  const heroStatePill = document.getElementById('hero-state-pill');
  const tagA = document.getElementById('radar-tag-a');
  const tagB = document.getElementById('radar-tag-b');
  const tagC = document.getElementById('radar-tag-c');
  const freezeState = document.getElementById('hero-freeze-state');
  const pulseStatus = document.getElementById('hero-pulse-status');
  const heroVault = document.getElementById('hero-vault');

  stateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const state = btn.dataset.state;

      if (state === 'alive') {
        if (heroStatePill) { heroStatePill.className = 'badge-alive'; heroStatePill.textContent = 'ALIVE MODE'; }
        if (tagA) tagA.textContent = 'CHECK-IN / 06D 14H';
        if (tagB) { tagB.textContent = 'HEARTBEAT // SIMULATED'; tagB.style.color = 'var(--cyan)'; }
        if (tagC) tagC.textContent = 'AFTERMATH / LOCKED';
        if (freezeState) freezeState.textContent = 'CRYSTALLIZED';
        if (pulseStatus) { pulseStatus.textContent = '● DEMO SIGNAL'; pulseStatus.style.color = 'var(--green)'; }
        if (heroVault) heroVault.style.filter = 'drop-shadow(0 0 20px rgba(255, 66, 71, 0.4))';
      } else if (state === 'mutating') {
        if (heroStatePill) { heroStatePill.className = 'badge-mutating'; heroStatePill.textContent = 'MUTATING'; }
        if (tagA) tagA.textContent = 'CHECK-IN / OVERDUE';
        if (tagB) { tagB.textContent = 'HEARTBEAT // MISSED'; tagB.style.color = 'var(--gold)'; }
        if (tagC) tagC.textContent = 'STATE / UNSTABLE';
        if (freezeState) freezeState.textContent = 'THAWING...';
        if (pulseStatus) { pulseStatus.textContent = '⚠ ESCALATING'; pulseStatus.style.color = 'var(--gold)'; }
        if (heroVault) heroVault.style.filter = 'drop-shadow(0 0 24px rgba(232, 189, 99, 0.6))';
      } else if (state === 'aftermath') {
        if (heroStatePill) { heroStatePill.className = 'badge-aftermath'; heroStatePill.textContent = 'AFTERMATH TRIGGERED'; }
        if (tagA) tagA.textContent = 'SWITCH / FIRED';
        if (tagB) { tagB.textContent = 'PAYLOAD // EXECUTING'; tagB.style.color = 'var(--red)'; }
        if (tagC) tagC.textContent = 'AFTERMATH / UNLOCKED';
        if (freezeState) freezeState.textContent = 'THAWED & ACTIVE';
        if (pulseStatus) { pulseStatus.textContent = '⚡ TRIGGERED'; pulseStatus.style.color = 'var(--red)'; }
        if (heroVault) heroVault.style.filter = 'drop-shadow(0 0 30px rgba(255, 66, 71, 0.9))';
      } else if (state === 'burn') {
        if (heroStatePill) { heroStatePill.className = 'badge-burn'; heroStatePill.textContent = 'BURNED / ASHES'; }
        if (tagA) tagA.textContent = 'STATUS / DESTROYED';
        if (tagB) { tagB.textContent = 'KEY // ZEROIZED'; tagB.style.color = '#718096'; }
        if (tagC) tagC.textContent = 'EXECUTED SEALED';
        if (freezeState) freezeState.textContent = 'PERMANENT PURGE';
        if (pulseStatus) { pulseStatus.textContent = '✕ EXECUTED'; pulseStatus.style.color = '#a0aec0'; }
        if (heroVault) heroVault.style.filter = 'grayscale(1) opacity(0.3)';
      }
    });
  });

  // Simulator 01: State Engine
  window.setSimState = function(mode) {
    const screen = document.getElementById('sim-screen');
    const statusLabel = document.getElementById('sim-status-label');
    const content = document.getElementById('sim-content');
    const hbVal = document.getElementById('sim-hb-val');
    const lockVal = document.getElementById('sim-lock-val');
    const timeVal = document.getElementById('sim-time-val');
    const btns = document.querySelectorAll('.btn-sim');

    btns.forEach(b => b.classList.remove('active'));

    if (mode === 'alive') {
      btns[0]?.classList.add('active');
      if (screen) screen.style.borderColor = '#232b3b';
      if (statusLabel) { statusLabel.textContent = 'STATUS: ALIVE (NORMAL)'; statusLabel.style.color = 'var(--cyan)'; }
      if (content) content.innerHTML = 'Welcome. This Bitty Box is currently in <strong>Alive Mode</strong>. Heartbeat ping confirmed 12 minutes ago. All confidential vaults remain encrypted and locked. Check-in window open for 6 days.';
      if (hbVal) { hbVal.textContent = 'ONLINE (OK)'; hbVal.style.color = 'var(--green)'; }
      if (lockVal) { lockVal.textContent = 'CRYSTALLIZED'; lockVal.style.color = 'var(--cyan)'; }
      if (timeVal) { timeVal.textContent = '06D 13H 48M'; timeVal.style.color = 'var(--white)'; }
    } else if (mode === 'mutating') {
      btns[1]?.classList.add('active');
      if (screen) screen.style.borderColor = 'rgba(232, 189, 99, 0.5)';
      if (statusLabel) { statusLabel.textContent = 'STATUS: DEGRADED (MUTATING)'; statusLabel.style.color = 'var(--gold)'; }
      if (content) content.innerHTML = '<strong>WARNING:</strong> Check-in deadline missed by 18 hours. Visual styles decaying. Copy urgency escalated. Line 4 of 12 un-redacting. Bitty Box metadata corrupting toward thaw.';
      if (hbVal) { hbVal.textContent = 'MISSED (WARN)'; hbVal.style.color = 'var(--gold)'; }
      if (lockVal) { lockVal.textContent = 'UNSTABLE (THAWING)'; lockVal.style.color = 'var(--gold)'; }
      if (timeVal) { timeVal.textContent = '00D 05H 12M'; timeVal.style.color = 'var(--gold)'; }
    } else if (mode === 'aftermath') {
      btns[2]?.classList.add('active');
      if (screen) screen.style.borderColor = 'rgba(255, 66, 71, 0.7)';
      if (statusLabel) { statusLabel.textContent = 'STATUS: TRIGGERED (AFTERMATH ACTIVE)'; statusLabel.style.color = 'var(--red)'; }
      if (content) content.innerHTML = '<strong>DEAD MAN’S SWITCH TRIGGERED.</strong> Alive Mode offline. Payload decrypted and executing. All designated recipients notified. Aftermath micro-site online with final instructions.';
      if (hbVal) { hbVal.textContent = 'DEAD (TIMED OUT)'; hbVal.style.color = 'var(--red)'; }
      if (lockVal) { lockVal.textContent = 'RELEASED / THAWED'; lockVal.style.color = 'var(--red)'; }
      if (timeVal) { timeVal.textContent = '00D 00H 00M'; timeVal.style.color = 'var(--red)'; }
    } else if (mode === 'burn') {
      btns[3]?.classList.add('active');
      if (screen) screen.style.borderColor = '#718096';
      if (statusLabel) { statusLabel.textContent = 'STATUS: EXECUTED (BURNED / PURGED)'; statusLabel.style.color = '#a0aec0'; }
      if (content) content.innerHTML = '<strong>PAYLOAD PERMANENTLY PURGED.</strong> Single-view window closed. Cryptographic encryption keys destroyed from memory. Zero residual trace. “EXECUTED” seal applied.';
      if (hbVal) { hbVal.textContent = 'ZEROIZED'; hbVal.style.color = '#718096'; }
      if (lockVal) { lockVal.textContent = 'PURGED'; lockVal.style.color = '#718096'; }
      if (timeVal) { timeVal.textContent = 'TERMINATED'; timeVal.style.color = '#718096'; }
    }
  };

  // Simulator 02: Dossier Redaction Toggle
  let unredacted = false;
  window.toggleRedaction = function() {
    unredacted = !unredacted;
    const btn = document.getElementById('btn-unredact');
    const redactEls = document.querySelectorAll('#dossier-box .redact');

    redactEls.forEach(el => {
      if (unredacted) {
        el.classList.add('revealed');
        el.textContent = el.dataset.secret;
      } else {
        el.classList.remove('revealed');
        el.textContent = '█'.repeat(el.dataset.secret.length || 16);
      }
    });

    if (btn) {
      btn.textContent = unredacted ? '🔒 RE-LOCK & REDACT DOSSIER' : '⚡ TEST TRIGGER: UN-REDACT DOSSIER';
    }
  };

  // Simulator 03: Mystery DMS Generator
  const themes = [
    "Orbital Blacksite (Glitch Minimal)",
    "Crystallized Amber (Temporal Freeze)",
    "Cold War Dossier (Typewriter & Redaction)",
    "Neon Cyber-Vault (High-Tension Cyan)",
    "Victorian Parchment (Wax Seal Legacy)",
    "Terminal 80 (Monochrome Amber CRT)",
    "Deep Submersible (Pressure Pulse UI)"
  ];
  const triggers = [
    "3 missed daily pings + secondary capsule unopened",
    "72-hour inactivity + failed passphrase challenge",
    "Missed heartbeat URL webhook + geofence timeout",
    "Compound failsafe: 2 missed check-ins + emergency duress code",
    "Cascading trigger: Capsule A thaw + 48h unacknowledged",
    "Silent timer: 14 days zero activity on target device"
  ];
  const reveals = [
    "Burn-After-Reading + ashes glitch purge",
    "Interactive cryptographic puzzle lock challenge",
    "Progressive line-by-line un-redacting over 24 hours",
    "Multi-recipient cascade: Split keys to 3 recipients",
    "Cinematic audio dispatch + self-destroying dossier",
    "Transformation into permanent digital memorial site"
  ];
  const prompts = [
    "“A letter explaining the family archive.”",
    "“A final letter to my children when they reach age 25.”",
    "“A private note about a family story worth preserving.”",
    "“Curated legacy gallery: 10 memories that shaped everything.”",
    "“Confession of what really happened in winter 2024.”",
    "“A checklist for finding non-sensitive family documents.”"
  ];

  let genCount = 1;
  window.generateMysteryCapsule = function() {
    genCount++;
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const elTheme = document.getElementById('res-theme');
    const elTrigger = document.getElementById('res-trigger');
    const elReveal = document.getElementById('res-reveal');
    const elPrompt = document.getElementById('res-prompt');
    const elCount = document.getElementById('gen-count-label');

    if (elTheme) elTheme.textContent = pick(themes);
    if (elTrigger) elTrigger.textContent = pick(triggers);
    if (elReveal) elReveal.textContent = pick(reveals);
    if (elPrompt) elPrompt.textContent = pick(prompts);
    if (elCount) elCount.textContent = `Bitty Boxes generated this session: ${genCount}`;
  };

  // Subtle pointer 3D tilt on hero art
  const heroArt = document.querySelector('.hero-art');
  if (heroArt && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroArt.addEventListener('pointermove', e => {
      const r = heroArt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      heroArt.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${y * -6}deg)`;
    });
    heroArt.addEventListener('pointerleave', () => {
      heroArt.style.transform = 'none';
    });
  }
})();

// Heartbeat clock preview only; no check-in is sent and no release is triggered.
(() => {
  const radar = document.getElementById('hero-radar');
  const display = document.getElementById('clock-countdown');
  const tag = document.getElementById('radar-tag-a');
  if (!radar || !display) return;
  const windowMs = (6 * 24 * 60 + 13 * 60 + 48) * 60 * 1000;
  let deadline = Date.now() + windowMs;
  const format = () => {
    const left = Math.max(0, deadline - Date.now());
    const days = Math.floor(left / 86400000);
    const hours = Math.floor(left % 86400000 / 3600000);
    const minutes = Math.floor(left % 3600000 / 60000);
    return `${String(days).padStart(2,'0')}D ${String(hours).padStart(2,'0')}H ${String(minutes).padStart(2,'0')}M`;
  };
  const showMode = mode => {
    radar.dataset.mode = mode;
    if (mode === 'alive') { deadline = Date.now() + windowMs; display.textContent = format(); if(tag) tag.textContent = `NEXT CHECK-IN / ${display.textContent.split(' ').slice(0,2).join(' ')}`; }
    else display.textContent = ({mutating:'OVERDUE +18H',aftermath:'RELEASED',burn:'ZEROIZED'})[mode] || 'PAUSED';
  };
  document.querySelectorAll('.hero-quick-switch .state-btn').forEach(button => {
    button.addEventListener('click', () => showMode(button.dataset.state || 'alive'));
  });
  window.setInterval(() => {
    if (radar.dataset.mode === 'alive') { display.textContent = deadline > Date.now() ? format() : 'CHECK-IN DUE'; if(tag) tag.textContent = `NEXT CHECK-IN / ${display.textContent.split(' ').slice(0,2).join(' ')}`; }
  }, 1000);
})();
