const templates = [
{tone:'cinematic',purpose:'mission',intensity:3,template:'If you’re reading this, the clock ran out and the failsafe activated exactly as I designed it to. I wasn’t able to check in, which means something shifted beyond my control. Inside this box, you’ll find the instructions I prepared for the moment when everything changed. Follow them carefully, because they were written for a scenario where clarity matters more than speed. Whatever brought you here, know that this message was crafted with intention and urgency.'},
{tone:'poetic',purpose:'legacy',intensity:4,template:'If you’re reading this, the silence has stretched longer than I ever intended, and this message rises in its place like a lantern in the dark. Something in my world has paused, and I can no longer speak for myself. What follows are the words I hoped would guide you if I couldn’t be there to do it. Read them slowly, and let them settle. They were written with care, in a moment when I feared they might someday matter more than anything else I left behind.'},
{tone:'legalistic',purpose:'instructions',intensity:2,template:'If you’re reading this, the scheduled check‑in interval has elapsed without confirmation, thereby activating the contingency protocol. This message constitutes formal instruction and should be followed precisely as written. The materials enclosed were prepared for circumstances in which I could not provide direct guidance. Review each section in order and document any actions taken. Treat this communication as binding until all directives have been completed.'},
{tone:'humorous',purpose:'reassurance',intensity:1,template:'If you’re reading this, I missed my check‑in, which could mean something happened or that I simply forgot what day it was again. Either way, the box insisted on waking up, and here we are. Inside, you’ll find the message I left for moments exactly like this — hopefully more helpful than my usual attempts at being organized. Take a breath, open the next section, and try not to laugh too hard at the fact that technology thinks I’m gone.'},
{tone:'cinematic',purpose:'mystery',intensity:4,template:'If you’re reading this, the signal went dark and the trail I left behind begins here. Something intercepted my routine, and the system responded the only way it could. Inside this box are fragments of the truth — pieces I gathered in case everything collapsed faster than expected. You’ll have to assemble them yourself, but every clue matters. Whatever brought you here, understand that this message is the last surviving part of the story.'},
{tone:'poetic',purpose:'confession',intensity:3,template:'If you’re reading this, the quiet has grown heavy enough to break open the truth I carried. I wasn’t able to return, and the words I never spoke now rest here, waiting for you. Inside this box are pieces of my heart, my fears, and the things I hoped you would someday understand. Read them gently, because they were written in a moment of honesty I never found the courage to share aloud. Let them breathe as you move through each part.'},
{tone:'legalistic',purpose:'asset_transfer',intensity:3,template:'If you’re reading this, the threshold for non‑response has been met, and the designated transfer protocol is now active. The materials enclosed are provided under the terms I established prior to activation. You are responsible for reviewing all documentation and executing the outlined steps without deviation. Handle the contents with appropriate discretion, as they may include sensitive information. This message supersedes any prior instructions I may have given.'},
{tone:'humorous',purpose:'instructions',intensity:2,template:'If you’re reading this, something went sideways — possibly me, possibly life, possibly the universe being dramatic again. The box woke up and insists you follow the instructions I left inside. I promise they’re easier than assembling IKEA furniture and significantly less stressful. Just take it step by step, and try not to judge me too harshly for needing a backup plan. Technology can be a little overprotective sometimes.'},
{tone:'cinematic',purpose:'mission',intensity:4,template:'If you’re reading this, the final trigger has been hit and the scenario I feared has unfolded. I’m off the grid now, and this box is the only compass I could leave behind. Inside, you’ll find the directives I prepared for the moment when everything changed. Follow them with precision — the stakes are higher than you may realize. Whatever comes next, this message is your entry point into the truth.'},
{tone:'poetic',purpose:'legacy',intensity:2,template:'If you’re reading this, the world has turned without me, and this box is the lantern I lit for you in advance. Something shifted beyond my reach, and I couldn’t return to speak these words myself. Inside, you’ll find pieces of my story, woven together for you to hold. Read them with patience, and let them guide you gently. They were written with hope, even in the shadow of uncertainty.'},
{tone:'legalistic',purpose:'instructions',intensity:4,template:'If you’re reading this, the failsafe has executed due to prolonged inactivity, and all enclosed directives are now mandatory. You are required to follow each instruction in the order presented, without modification. The materials provided were prepared for circumstances in which immediate action is necessary. Document all steps taken and maintain confidentiality throughout the process. This communication remains in effect until all tasks have been completed.'},
{tone:'humorous',purpose:'reassurance',intensity:3,template:'If you’re reading this, the situation is officially not ideal — at least according to the very dramatic algorithm that decided I’m missing. I might be fine, or I might have tripped over something again. Either way, this box insisted on waking up and delivering the message I left for moments like this. Inside, you’ll find instructions, explanations, and probably more responsibility than you expected today. Try to take it in stride — I believe in you.'},
{tone:'cinematic',purpose:'mystery',intensity:2,template:'If you’re reading this, the situation shifted in a way I couldn’t answer, and the box responded the only way it knows how. Inside, you’ll find clues — fragments of a story that began long before this moment. Follow them carefully, because each piece connects to the next. I don’t know what you’ll discover, but I know the truth is waiting. This message is your first step into the unknown.'},
{tone:'poetic',purpose:'confession',intensity:4,template:'If you’re reading this, the moment I feared has arrived, and the truth I carried can no longer remain silent. I wasn’t able to return, and the words I never spoke now rest here, unguarded. Inside this box are confessions I wrote in the quiet hours, hoping they would someday find you. Read them slowly, and let them settle. They were written with a trembling honesty I never found the courage to share aloud.'},
{tone:'legalistic',purpose:'asset_transfer',intensity:1,template:'If you’re reading this, the release conditions have been met, and you may now access the enclosed materials. These items were prepared for circumstances in which I could not provide direct oversight. Review the contents carefully and follow any instructions provided. Handle all information with discretion. This message serves as your formal authorization.'},
{tone:'humorous',purpose:'instructions',intensity:4,template:'If you’re reading this, the emergency protocol activated — which sounds dramatic, but honestly might just mean I overslept. The box insists you follow the instructions inside, and who am I to argue with a very determined piece of software? Open the next section and take it step by step. I promise it’s not as chaotic as it looks. Well… mostly.'},
{tone:'cinematic',purpose:'mission',intensity:1,template:'If you’re reading this, something intercepted my routine, and the system responded automatically. Inside this box, you’ll find the message I prepared for moments when the world shifts unexpectedly. Follow the guidance carefully — it was written with clarity in mind. Whatever brought you here, this is your briefing. The rest begins when you open the next section.'},
{tone:'poetic',purpose:'legacy',intensity:3,template:'If you’re reading this, time has carried me somewhere I cannot return from, and this message rises in my place. Inside this box are pieces of my story — fragments I hoped would someday reach you. Read them gently, and let them settle. They were written with a quiet hope that they might guide you when I no longer could. This message is the last footprint I could leave behind.'},
{tone:'legalistic',purpose:'instructions',intensity:3,template:'If you’re reading this, operational inactivity has been detected, and the contingency protocol is now in effect. The enclosed directives must be followed precisely as written. Review each section in order and execute all tasks without deviation. Maintain confidentiality throughout the process. This communication remains valid until all instructions have been completed.'},
{tone:'humorous',purpose:'reassurance',intensity:2,template:'If you’re reading this, something went sideways — possibly me, possibly the universe being dramatic again. The box woke up and insists you follow the instructions I left inside. I promise they’re easier than assembling IKEA furniture and significantly less stressful. Just take it step by step, and try not to judge me too harshly for needing a backup plan. Technology can be a little overprotective sometimes.'},
{tone:'cinematic',purpose:'mystery',intensity:3,template:'If you’re reading this, the silence wasn’t accidental, and the system responded exactly as intended. Inside this box are clues — fragments of a truth that slipped out of reach. You’ll have to assemble them yourself, but every piece matters. Follow the trail carefully. This message is your entry point into the unknown.'},
{tone:'poetic',purpose:'confession',intensity:2,template:'If you’re reading this, the words I couldn’t speak now rest here, waiting for you. Something shifted beyond my reach, and I wasn’t able to return. Inside this box are truths I carried quietly, hoping they would someday find you. Read them gently, and let them breathe. They were written with a fragile honesty I never found the courage to share aloud.'},
{tone:'legalistic',purpose:'asset_transfer',intensity:4,template:'If you’re reading this, the final authorization has been triggered due to prolonged inactivity. All enclosed materials are now under your jurisdiction and must be handled with appropriate discretion. Review each document carefully and execute all outlined responsibilities without deviation. This communication supersedes any prior instruction. Maintain confidentiality throughout the process.'},
{tone:'humorous',purpose:'instructions',intensity:1,template:'If you’re reading this, I missed my check‑in — which could mean something happened or that I simply forgot what day it was again. Either way, the box insisted on waking up, and here we are. Inside, you’ll find the message I left for moments exactly like this — hopefully more helpful than my usual attempts at being organized. Take a breath, open the next section, and try not to laugh too hard at the fact that technology thinks I’m gone.'},
{tone:'cinematic',purpose:'mission',intensity:2,template:'If you’re reading this, the situation shifted in a way I couldn’t respond to, and the system activated the protocol I hoped would never be needed. Inside this box, you’ll find the guidance I prepared for moments when clarity becomes more important than comfort. Follow each step with patience and precision, because the path ahead may be unfamiliar. I designed these instructions to help you navigate uncertainty without hesitation. Whatever brought you here, know that this message marks the beginning of your role in what comes next.'},
{tone:'poetic',purpose:'legacy',intensity:1,template:'If you’re reading this, the quiet has stretched long enough to carry my words forward in my absence. Something in my world paused, and this message rises gently to meet you. Inside this box are pieces of my thoughts, gathered like small lanterns for you to hold. Read them slowly, and let them settle where they need to. They were written with a soft hope that they might guide you when I no longer could.'},
{tone:'legalistic',purpose:'instructions',intensity:1,template:'If you’re reading this, the scheduled check‑in has elapsed without confirmation, thereby activating the preliminary contingency protocol. The materials enclosed are provided for your review and should be followed in the order presented. Each section contains instructions prepared for circumstances in which I could not provide direct oversight. Please execute all tasks with care and accuracy. This communication serves as your formal authorization to proceed.'},
{tone:'humorous',purpose:'reassurance',intensity:4,template:'If you’re reading this, the emergency protocol activated — which sounds dramatic, but let’s be honest, it might just mean I misplaced my phone again. The box insisted on waking up, and I didn’t have the heart to tell it to calm down. Inside, you’ll find the message I left for moments exactly like this, written with equal parts sincerity and mild panic. Take your time reading it, and try not to judge me too harshly for needing a backup plan. Technology can be a little theatrical sometimes.'},
{tone:'cinematic',purpose:'mystery',intensity:1,template:'If you’re reading this, the routine I depended on slipped out of reach, and the system responded automatically. Inside this box are fragments of a story that began long before this moment. You’ll find clues, hints, and pieces of a truth that refused to stay quiet. Follow them carefully, because each one connects to the next. This message is your first step into a path I could no longer walk.'},
{tone:'poetic',purpose:'confession',intensity:1,template:'If you’re reading this, the words I couldn’t speak aloud have found their way to you through this quiet channel. Something shifted beyond my reach, and I wasn’t able to return to say these things myself. Inside this box are truths I carried gently, hoping they would someday matter to someone. Read them with patience, and let them breathe. They were written in a moment of honesty I never found the courage to share face‑to‑face.'},
{tone:'legalistic',purpose:'asset_transfer',intensity:2,template:'If you’re reading this, the release conditions have been met, and the designated materials are now available for your review. The items enclosed were prepared for circumstances in which I could not provide direct guidance. Please examine each document carefully and follow any instructions provided. Handle all information with appropriate discretion. This communication constitutes formal authorization for transfer.'},
{tone:'humorous',purpose:'instructions',intensity:3,template:'If you’re reading this, the situation is officially not ideal — at least according to the very dramatic algorithm that decided I’m missing. I might be fine, or I might have tripped over something again. Either way, this box insisted on waking up and delivering the message I left for moments like this. Inside, you’ll find instructions, explanations, and probably more responsibility than you expected today. Try to take it in stride — I believe in you.'},
{tone:'cinematic',purpose:'mission',intensity:4,template:'If you’re reading this, the final trigger has been activated, and the scenario I feared has unfolded. I’m off the grid now, and this box is the only compass I could leave behind. Inside, you’ll find the directives I prepared for the moment when everything changed. Follow them with precision — the stakes are higher than you may realize. Whatever comes next, this message is your entry point into the truth.'},
{tone:'poetic',purpose:'legacy',intensity:4,template:'If you’re reading this, time has carried me somewhere I cannot return from, and this message rises in my place like a final breath. Inside this box are pieces of my story — fragments I hoped would someday reach you. Read them gently, and let them settle. They were written with a quiet hope that they might guide you when I no longer could. This message is the last footprint I could leave behind.'},
{tone:'legalistic',purpose:'instructions',intensity:4,template:'If you’re reading this, the failsafe has executed due to prolonged inactivity, and all enclosed directives are now mandatory. You are required to follow each instruction in the order presented, without modification. The materials provided were prepared for circumstances in which immediate action is necessary. Document all steps taken and maintain confidentiality throughout the process. This communication remains in effect until all tasks have been completed.'},
{tone:'humorous',purpose:'reassurance',intensity:2,template:'If you’re reading this, something went sideways — possibly me, possibly the universe being dramatic again. The box woke up and insists you follow the instructions I left inside. I promise they’re easier than assembling IKEA furniture and significantly less stressful. Just take it step by step, and try not to judge me too harshly for needing a backup plan. Technology can be a little overprotective sometimes.'},
{tone:'cinematic',purpose:'mystery',intensity:3,template:'If you’re reading this, the silence wasn’t accidental, and the system responded exactly as intended. Inside this box are clues — fragments of a truth that slipped out of reach. You’ll have to assemble them yourself, but every piece matters. Follow the trail carefully. This message is your entry point into the unknown.'},
{tone:'poetic',purpose:'confession',intensity:3,template:'If you’re reading this, the quiet has grown heavy enough to break open the truth I carried. I wasn’t able to return, and the words I never spoke now rest here, waiting for you. Inside this box are pieces of my heart, my fears, and the things I hoped you would someday understand. Read them gently, because they were written in a moment of honesty I never found the courage to share aloud. Let them breathe as you move through each part.'},
{tone:'legalistic',purpose:'asset_transfer',intensity:4,template:'If you’re reading this, the final authorization has been triggered due to prolonged inactivity. All enclosed materials are now under your jurisdiction and must be handled with appropriate discretion. Review each document carefully and execute all outlined responsibilities without deviation. This communication supersedes any prior instruction. Maintain confidentiality throughout the process.'},
{tone:'humorous',purpose:'instructions',intensity:1,template:'If you’re reading this, I missed my check‑in — which could mean something happened or that I simply forgot what day it was again. Either way, the box insisted on waking up, and here we are. Inside, you’ll find the message I left for moments exactly like this — hopefully more helpful than my usual attempts at being organized. Take a breath, open the next section, and try not to laugh too hard at the fact that technology thinks I’m gone.'},
{tone:'cinematic',purpose:'mission',intensity:1,template:'If you’re reading this, something intercepted my routine, and the system responded automatically. Inside this box, you’ll find the message I prepared for moments when the world shifts unexpectedly. Follow the guidance carefully — it was written with clarity in mind. Whatever brought you here, this is your briefing. The rest begins when you open the next section.'},
{tone:'poetic',purpose:'legacy',intensity:2,template:'If you’re reading this, the world has turned without me, and this box is the lantern I lit for you in advance. Something shifted beyond my reach, and I couldn’t return to speak these words myself. Inside, you’ll find pieces of my story, woven together for you to hold. Read them with patience, and let them guide you gently. They were written with hope, even in the shadow of uncertainty.'},
{tone:'legalistic',purpose:'instructions',intensity:3,template:'If you’re reading this, operational inactivity has been detected, and the contingency protocol is now in effect. The enclosed directives must be followed precisely as written. Review each section in order and execute all tasks without deviation. Maintain confidentiality throughout the process. This communication remains valid until all instructions have been completed.'},
{tone:'humorous',purpose:'reassurance',intensity:3,template:'If you’re reading this, the situation is officially not ideal — at least according to the very dramatic algorithm that decided I’m missing. I might be fine, or I might have tripped over something again. Either way, this box insisted on waking up and delivering the message I left for moments like this. Inside, you’ll find instructions, explanations, and probably more responsibility than you expected today. Try to take it in stride — I believe in you.'},
{tone:'cinematic',purpose:'mystery',intensity:2,template:'If you’re reading this, the situation shifted in a way I couldn’t answer, and the box responded the only way it knows how. Inside, you’ll find clues — fragments of a story that began long before this moment. Follow them carefully, because each piece connects to the next. I don’t know what you’ll discover, but I know the truth is waiting. This message is your first step into the unknown.'},
{tone:'poetic',purpose:'confession',intensity:4,template:'If you’re reading this, the moment I feared has arrived, and the truth I carried can no longer remain silent. I wasn’t able to return, and the words I never spoke now rest here, unguarded. Inside this box are confessions I wrote in the quiet hours, hoping they would someday find you. Read them slowly, and let them settle. They were written with a trembling honesty I never found the courage to share aloud.'},
{tone:'legalistic',purpose:'asset_transfer',intensity:1,template:'If you’re reading this, the release conditions have been met, and you may now access the enclosed materials. These items were prepared for circumstances in which I could not provide direct oversight. Review the contents carefully and follow any instructions provided. Handle all information with discretion. This message serves as your formal authorization.'},
{tone:'humorous',purpose:'instructions',intensity:4,template:'If you’re reading this, the emergency protocol activated — which sounds dramatic, but honestly might just mean I overslept. The box insists you follow the instructions inside, and who am I to argue with a very determined piece of software? Open the next section and take it step by step. I promise it’s not as chaotic as it looks. Well… mostly.'}
];

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = s => String(s).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

const PURPOSE_LABELS = {
  mission: 'Mission Briefing',
  legacy: 'Legacy & Memory',
  instructions: 'Directives & Steps',
  reassurance: 'Reassurance & Care',
  mystery: 'Mystery & Clues',
  confession: 'Confession & Honesty',
  asset_transfer: 'Asset & Escrow Transfer',
};

const INTENSITY_LABELS = {
  1: 'Level 1 • Subtle & Calm',
  2: 'Level 2 • Measured Guidance',
  3: 'Level 3 • Direct & Urgent',
  4: 'Level 4 • Critical & Final',
};

// Precompute counts
const counts = { tone: {}, purpose: {}, intensity: {} };
templates.forEach(t => {
  counts.tone[t.tone] = (counts.tone[t.tone] || 0) + 1;
  counts.purpose[t.purpose] = (counts.purpose[t.purpose] || 0) + 1;
  counts.intensity[t.intensity] = (counts.intensity[t.intensity] || 0) + 1;
});

let currentDim = 'all'; // 'all' | 'tone' | 'purpose' | 'intensity'
let currentFilter = null; // null means all within current dimension
let shown = 0;
let visible = templates.map((_, i) => i);

function getFilteredIndices() {
  if (currentDim === 'all' || currentFilter === null) {
    return templates.map((_, i) => i);
  }
  if (currentDim === 'tone') {
    return templates.map((t, i) => t.tone === currentFilter ? i : -1).filter(i => i !== -1);
  }
  if (currentDim === 'purpose') {
    return templates.map((t, i) => t.purpose === currentFilter ? i : -1).filter(i => i !== -1);
  }
  if (currentDim === 'intensity') {
    return templates.map((t, i) => t.intensity === Number(currentFilter) ? i : -1).filter(i => i !== -1);
  }
  return templates.map((_, i) => i);
}

function setFilter(dim, filterVal) {
  currentDim = dim;
  currentFilter = filterVal;
  visible = getFilteredIndices();
  shown = 0;
  renderTabs();
  renderOptions();
  render();
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
}

function renderTabs() {
  const tabsContainer = document.getElementById('templateDimTabs');
  if (!tabsContainer) return;

  const resetBtn = document.getElementById('templateFilterReset');
  if (resetBtn) {
    if (currentDim !== 'all' || currentFilter !== null) {
      resetBtn.classList.remove('hidden');
      resetBtn.classList.add('inline-flex');
    } else {
      resetBtn.classList.add('hidden');
      resetBtn.classList.remove('inline-flex');
    }
  }

  const buttons = tabsContainer.querySelectorAll('button[data-dim]');
  buttons.forEach(btn => {
    const dim = btn.dataset.dim;
    const isActive = (dim === currentDim);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');

    let base = 'template-dim-btn px-3 py-1.5 rounded-xl text-xs font-mono transition shrink-0 flex items-center cursor-pointer active:scale-[0.96] ';
    if (isActive) {
      base += 'font-semibold ';
      if (dim === 'tone') {
        base += 'bg-cyan-950/90 border border-cyan-600/80 text-cyan-300 shadow-sm shadow-cyan-950/40';
      } else if (dim === 'purpose') {
        base += 'bg-purple-950/90 border border-purple-600/80 text-purple-300 shadow-sm shadow-purple-950/40';
      } else if (dim === 'intensity') {
        base += 'bg-amber-950/90 border border-amber-600/80 text-amber-300 shadow-sm shadow-amber-950/40';
      } else {
        base += 'bg-slate-800 border border-slate-700 text-white shadow-sm';
      }
    } else {
      base += 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent';
    }
    btn.className = base;
  });
}

function renderOptions() {
  const rail = document.getElementById('templateOptionPills');
  if (!rail) return;
  rail.innerHTML = '';

  if (currentDim === 'all') {
    const info = document.createElement('span');
    info.className = 'text-[11px] font-mono text-slate-400 mr-2 flex items-center shrink-0';
    info.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 shrink-0 animate-pulse"></span>Showing all 48 messages • Filter by:';
    rail.appendChild(info);

    const quickTone = document.createElement('button');
    quickTone.type = 'button';
    quickTone.className = 'px-2.5 py-1 rounded-lg text-xs font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/50 hover:bg-cyan-900/60 hover:border-cyan-500/60 transition cursor-pointer active:scale-[0.96] shrink-0';
    quickTone.textContent = 'Tone (4) →';
    quickTone.onclick = () => setFilter('tone', null);
    rail.appendChild(quickTone);

    const quickPurpose = document.createElement('button');
    quickPurpose.type = 'button';
    quickPurpose.className = 'px-2.5 py-1 rounded-lg text-xs font-mono text-purple-300 bg-purple-950/50 border border-purple-800/50 hover:bg-purple-900/60 hover:border-purple-500/60 transition cursor-pointer active:scale-[0.96] shrink-0';
    quickPurpose.textContent = 'Purpose (7) →';
    quickPurpose.onclick = () => setFilter('purpose', null);
    rail.appendChild(quickPurpose);

    const quickIntensity = document.createElement('button');
    quickIntensity.type = 'button';
    quickIntensity.className = 'px-2.5 py-1 rounded-lg text-xs font-mono text-amber-300 bg-amber-950/50 border border-amber-800/50 hover:bg-amber-900/60 hover:border-amber-500/60 transition cursor-pointer active:scale-[0.96] shrink-0';
    quickIntensity.textContent = 'Intensity (4) →';
    quickIntensity.onclick = () => setFilter('intensity', null);
    rail.appendChild(quickIntensity);

    return;
  }

  let options = [];
  if (currentDim === 'tone') {
    options = [
      { val: null, label: `All Tones (${templates.length})` },
      ...Object.keys(counts.tone).map(k => ({ val: k, label: `${label(k)} (${counts.tone[k]})` }))
    ];
  } else if (currentDim === 'purpose') {
    options = [
      { val: null, label: `All Purposes (${templates.length})` },
      ...Object.keys(counts.purpose).map(k => ({ val: k, label: `${PURPOSE_LABELS[k] || label(k)} (${counts.purpose[k]})` }))
    ];
  } else if (currentDim === 'intensity') {
    options = [
      { val: null, label: `All Intensities (${templates.length})` },
      ...[1, 2, 3, 4].map(k => ({ val: k, label: `${INTENSITY_LABELS[k]} (${counts.intensity[k]})` }))
    ];
  }

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = (currentFilter === opt.val);
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

    let base = 'px-2.5 py-1 rounded-lg text-xs font-mono transition shrink-0 cursor-pointer active:scale-[0.96] flex items-center ';
    if (isSelected) {
      if (currentDim === 'tone') {
        base += 'bg-cyan-950/90 border border-cyan-500/80 text-cyan-200 font-bold ring-1 ring-cyan-500/40 shadow-sm';
      } else if (currentDim === 'purpose') {
        base += 'bg-purple-950/90 border border-purple-500/80 text-purple-200 font-bold ring-1 ring-purple-500/40 shadow-sm';
      } else if (currentDim === 'intensity') {
        base += 'bg-amber-950/90 border border-amber-500/80 text-amber-200 font-bold ring-1 ring-amber-500/40 shadow-sm';
      } else {
        base += 'bg-slate-800 border border-slate-600 text-white font-bold';
      }
    } else {
      base += 'text-slate-400 bg-slate-900/60 border border-slate-800 hover:text-white hover:bg-slate-800/80 hover:border-slate-700';
    }
    btn.className = base;
    btn.textContent = opt.label;
    btn.onclick = () => setFilter(currentDim, opt.val);
    rail.appendChild(btn);
  });
}

function render() {
  const countEl = document.getElementById('templateCount');
  const toneBtn = document.getElementById('templateTone');
  const purposeBtn = document.getElementById('templatePurpose');
  const intensityBtn = document.getElementById('templateIntensity');
  const textEl = document.getElementById('templateText');
  const progressEl = document.getElementById('templateProgress');
  const prevBtn = document.getElementById('templatePrev');
  const nextBtn = document.getElementById('templateNext');
  const copyBtn = document.getElementById('templateCopy');

  if (visible.length === 0) {
    if (countEl) countEl.textContent = '00 / 00';
    if (textEl) textEl.textContent = 'No messages found matching this filter.\n\nClick "Clear filter" above to restore templates.';
    if (progressEl) progressEl.style.width = '0%';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (copyBtn) copyBtn.disabled = true;
    return;
  }

  if (copyBtn) copyBtn.disabled = false;
  const t = templates[visible[shown]];

  if (countEl) {
    countEl.textContent = `${String(shown + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
  }

  if (toneBtn) {
    toneBtn.textContent = label(t.tone);
    toneBtn.title = `Click to filter by Tone: ${label(t.tone)}`;
    if (currentDim === 'tone' && currentFilter === t.tone) {
      toneBtn.className = 'px-2.5 py-1 rounded-full text-xs font-mono text-cyan-100 bg-cyan-950 border border-cyan-400 ring-2 ring-cyan-500/30 transition flex items-center cursor-pointer';
    } else {
      toneBtn.className = 'px-2.5 py-1 rounded-full text-xs font-mono text-cyan-200 bg-cyan-950/60 border border-cyan-700/50 hover:border-cyan-400 hover:text-white transition flex items-center cursor-pointer';
    }
  }

  if (purposeBtn) {
    purposeBtn.textContent = PURPOSE_LABELS[t.purpose] || label(t.purpose);
    purposeBtn.title = `Click to filter by Purpose: ${PURPOSE_LABELS[t.purpose] || label(t.purpose)}`;
    if (currentDim === 'purpose' && currentFilter === t.purpose) {
      purposeBtn.className = 'px-2.5 py-1 rounded-full text-xs font-mono text-purple-100 bg-purple-950 border border-purple-400 ring-2 ring-purple-500/30 transition flex items-center cursor-pointer';
    } else {
      purposeBtn.className = 'px-2.5 py-1 rounded-full text-xs font-mono text-purple-200 bg-purple-950/60 border border-purple-700/50 hover:border-purple-400 hover:text-white transition flex items-center cursor-pointer';
    }
  }

  if (intensityBtn) {
    intensityBtn.textContent = `Intensity ${t.intensity} / 4`;
    intensityBtn.title = `Click to filter by Intensity: Level ${t.intensity}`;
    if (currentDim === 'intensity' && currentFilter === t.intensity) {
      intensityBtn.className = 'px-2.5 py-1 rounded-full text-xs font-mono text-amber-100 bg-amber-950 border border-amber-400 ring-2 ring-amber-500/30 transition flex items-center cursor-pointer';
    } else {
      intensityBtn.className = 'px-2.5 py-1 rounded-full text-xs font-mono text-amber-200 bg-amber-950/40 border border-amber-700/40 hover:border-amber-400 hover:text-white transition flex items-center cursor-pointer';
    }
  }

  if (textEl) {
    textEl.textContent = t.template;
  }

  if (progressEl) {
    progressEl.style.width = `${((shown + 1) / visible.length) * 100}%`;
  }

  if (prevBtn) prevBtn.disabled = visible.length < 2;
  if (nextBtn) nextBtn.disabled = visible.length < 2;
}

function move(delta) {
  if (visible.length === 0) return;
  shown = (shown + delta + visible.length) % visible.length;
  render();
}

function init() {
  const container = document.getElementById('deadman-carousel');
  if (!container) return;

  const prevBtn = document.getElementById('templatePrev');
  const nextBtn = document.getElementById('templateNext');
  const copyBtn = document.getElementById('templateCopy');
  const resetBtn = document.getElementById('templateFilterReset');
  const toneBtn = document.getElementById('templateTone');
  const purposeBtn = document.getElementById('templatePurpose');
  const intensityBtn = document.getElementById('templateIntensity');

  if (prevBtn) prevBtn.addEventListener('click', () => move(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => move(1));
  if (resetBtn) resetBtn.addEventListener('click', () => setFilter('all', null));

  if (toneBtn) {
    toneBtn.addEventListener('click', () => {
      if (visible.length === 0) return;
      const t = templates[visible[shown]];
      setFilter('tone', t.tone);
    });
  }
  if (purposeBtn) {
    purposeBtn.addEventListener('click', () => {
      if (visible.length === 0) return;
      const t = templates[visible[shown]];
      setFilter('purpose', t.purpose);
    });
  }
  if (intensityBtn) {
    intensityBtn.addEventListener('click', () => {
      if (visible.length === 0) return;
      const t = templates[visible[shown]];
      setFilter('intensity', t.intensity);
    });
  }

  const tabsContainer = document.getElementById('templateDimTabs');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-dim]');
      if (!btn) return;
      const dim = btn.dataset.dim;
      if (dim === currentDim && dim === 'all') return;
      setFilter(dim, null);
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async e => {
      if (visible.length === 0) return;
      const button = e.currentTarget;
      const text = templates[visible[shown]].template;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.innerHTML = '<i data-lucide="copy" class="w-4 h-4 mr-2"></i>Copy message';
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      }, 1400);
    });
  }

  const slider = document.getElementById('templateCard');
  if (slider) {
    let x = 0;
    slider.addEventListener('touchstart', e => { x = e.changedTouches[0].screenX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const d = e.changedTouches[0].screenX - x;
      if (Math.abs(d) > 45) move(d < 0 ? 1 : -1);
    }, { passive: true });
  }

  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
  });

  window.filterDeadmanTemplates = (dim, val) => setFilter(dim, val);

  renderTabs();
  renderOptions();
  render();
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
