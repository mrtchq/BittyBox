/* ============================================================================
   BITTY BOX — Dead Man's Switch mobile carousel
   /test/dms.js — carousel engine + real /api/deadman wiring.
   No framework. Native scroll-snap for true thumb inertia.
   ========================================================================= */
(function () {
  'use strict';

  var VERSION = 1;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CAN_HAPTIC = typeof navigator.vibrate === 'function' && !REDUCED;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ── Steps ───────────────────────────────────────────────────────────── */
  var STEPS = [
    { id: 'signal',    name: 'SIGNAL',    cta: 'Begin setup',            back: false },
    { id: 'seal',      name: 'SEAL',      cta: 'Choose the guardian',    back: true  },
    { id: 'guardian',  name: 'GUARDIAN',  cta: 'Set the heartbeat',      back: true  },
    { id: 'heartbeat', name: 'HEARTBEAT', cta: 'Add a grace window',     back: true  },
    { id: 'grace',     name: 'GRACE',     cta: 'Review & arm',           back: true  },
    { id: 'arm',       name: 'ARM',       cta: 'Arm the switch',         back: true  },
    { id: 'sealed',    name: 'SEALED',    cta: 'Check in now',           back: false }
  ];

  /* ── Duration model (mirrors the editor + backend contract) ──────────── */
  var UNIT_MINUTES = { minutes: 1, hours: 60, days: 1440 };
  var UNIT_ABBR    = { minutes: 'min', hours: 'hrs', days: 'days' };
  var UNIT_NOUN    = { minutes: 'minutes', hours: 'hours', days: 'days' };
  var INTERVAL_MIN = 1, INTERVAL_MAX = 400 * 1440;
  var GRACE_MIN = 1, GRACE_MAX = 90 * 1440;
  /* Dial span per unit — the stepper and presets reach beyond it. */
  var DIAL_SPAN = { minutes: { min: 1, max: 120 }, hours: { min: 1, max: 168 }, days: { min: 1, max: 90 } };
  var ARC_LEN = 540.35; /* 2πr, r = 86 */

  function bestUnit(mins) {
    if (mins > 0 && mins % 1440 === 0) return 'days';
    if (mins > 0 && mins % 60 === 0) return 'hours';
    return 'minutes';
  }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, Number(n) || lo)); }
  function humanize(mins) {
    var m = Math.round(Number(mins) || 0);
    if (m <= 0) return 'no grace';
    var d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
    var out = [];
    if (d) out.push(d + ' day' + (d === 1 ? '' : 's'));
    if (h) out.push(h + ' hour' + (h === 1 ? '' : 's'));
    if (mi) out.push(mi + ' minute' + (mi === 1 ? '' : 's'));
    return out.join(' ') || '1 minute';
  }
  function humanizeShort(mins) {
    var m = Math.round(Number(mins) || 0);
    if (m <= 0) return 'now';
    var d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
    if (d) return d + 'd' + (h ? ' ' + h + 'h' : '');
    if (h) return h + 'h' + (mi ? ' ' + mi + 'm' : '');
    return mi + 'm';
  }
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function countdown(ms) {
    if (ms <= 0) return 'now';
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
        m = Math.floor((s % 3600) / 60), sec = s % 60;
    /* Zero-pad the trailing units so the readout keeps a stable width and the
       ticking seconds read as a clock rather than a jittering number. */
    if (d) return d + 'd ' + pad(h) + 'h ' + pad(m) + 'm';
    if (h) return h + 'h ' + pad(m) + 'm ' + pad(sec) + 's';
    return m + 'm ' + pad(sec) + 's';
  }
  function timeLabel(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return iso; }
  }

  /* ── DOM ─────────────────────────────────────────────────────────────── */
  var app = $('#dmsApp');
  var track = $('#dmsTrack');
  var panes = $$('.dms-pane');
  var segs = $$('.dms-seg');
  var progressFill = $('#dmsProgressFill');
  var stepName = $('#dmsStepName');
  var btnBack = $('#dmsBack');
  var btnNext = $('#dmsNext');
  var btnNextLabel = $('#dmsNextLabel');
  var toastEl = $('#dmsToast');

  var elTitle = $('#dmsTitle');
  var elBoxUrl = $('#dmsBoxUrl');
  var elNote = $('#dmsNote');
  var elNoteCount = $('#dmsNoteCount');
  var elRecipientEmail = $('#dmsRecipientEmail');
  var elRecipientName = $('#dmsRecipientName');
  var elRecipientWarn = $('#dmsRecipientWarn');
  var elCreatorEmail = $('#dmsCreatorEmail');
  var elCreatorWarn = $('#dmsCreatorWarn');
  var elGuardianName = $('#dmsGuardianName');
  var elGuardianMail = $('#dmsGuardianMail');

  var elHeartbeatEcho = $('#dmsHeartbeatEcho');
  var elGraceToggle = $('#dmsGraceToggle');
  var elGraceToggleEcho = $('#dmsGraceToggleEcho');
  var elGraceWrap = $('#dmsGraceWrap');
  var elTlDue = $('#dmsTlDue');
  var elTlFire = $('#dmsTlFire');
  var elTlSegA = $('#dmsTlSegA');
  var elTlSegB = $('#dmsTlSegB');
  var elTotalEcho = $('#dmsTotalEcho');

  var elRvTitle = $('#dmsRvTitle');
  var elRvGuardian = $('#dmsRvGuardian');
  var elRvInterval = $('#dmsRvInterval');
  var elRvGrace = $('#dmsRvGrace');
  var elRvTotal = $('#dmsRvTotal');
  var elRvCreator = $('#dmsRvCreator');
  var elSendToggle = $('#dmsSendToggle');

  var elLivePill = $('#dmsLivePill');
  var elSwitchId = $('#dmsSwitchId');
  var elCdValue = $('#dmsCdValue');
  var elLiveRelease = $('#dmsLiveRelease');
  var elLiveGuardian = $('#dmsLiveGuardian');
  var elCheckInLink = $('#dmsCheckInLink');
  var elSealedHeadline = $('#dmsSealedHeadline');
  var elSealedSub = $('#dmsSealedSub');
  var elDisarmEcho = $('#dmsDisarmEcho');
  var elTestEcho = $('#dmsTestEcho');

  /* ── State ───────────────────────────────────────────────────────────── */
  var state = {
    step: 0,
    interval: { minutes: 10080, unit: 'days', value: 7 },
    grace: { enabled: true, minutes: 4320, unit: 'days', value: 3 },
    sendFirstEmail: true,
    busy: false,
    switch: null,      /* publicSwitchView from the API */
    token: '',
    switchId: '',
    checkedIn: false
  };

  /* ── Persistence: survive an accidental reload mid-setup ────────────── */
  var LS_KEY = 'bitty_dms_test_draft_v1';
  function persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        title: elTitle.value, boxUrl: elBoxUrl.value, note: elNote.value,
        recipientEmail: elRecipientEmail.value, recipientName: elRecipientName.value,
        creatorEmail: elCreatorEmail.value,
        intervalMinutes: state.interval.minutes, intervalUnit: state.interval.unit,
        graceEnabled: state.grace.enabled, graceMinutes: state.grace.minutes, graceUnit: state.grace.unit,
        sendFirstEmail: state.sendFirstEmail
      }));
    } catch (e) { /* private mode */ }
  }
  function restore() {
    var raw = null;
    try { raw = localStorage.getItem(LS_KEY); } catch (e) { return; }
    if (!raw) return;
    var d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d || typeof d !== 'object') return;
    if (d.title) elTitle.value = d.title;
    if (d.boxUrl) elBoxUrl.value = d.boxUrl;
    if (d.note) elNote.value = d.note;
    if (d.recipientEmail) elRecipientEmail.value = d.recipientEmail;
    if (d.recipientName) elRecipientName.value = d.recipientName;
    if (d.creatorEmail) elCreatorEmail.value = d.creatorEmail;
    if (d.intervalMinutes) setIntervalMinutes(d.intervalMinutes, { quiet: true });
    if (typeof d.graceEnabled === 'boolean') setGraceEnabled(d.graceEnabled, { quiet: true });
    if (d.graceMinutes) setGraceMinutes(d.graceMinutes, { quiet: true });
    if (typeof d.sendFirstEmail === 'boolean') setSendFirstEmail(d.sendFirstEmail, { quiet: true });
  }

  /* ── Haptics + toast + ripple ────────────────────────────────────────── */
  var lastBuzz = 0;
  function buzz(pattern) {
    if (!CAN_HAPTIC) return;
    var now = Date.now();
    if (typeof pattern === 'number') {
      if (now - lastBuzz < 45) return;
      lastBuzz = now;
    }
    try { navigator.vibrate(pattern); } catch (e) { /* unsupported */ }
  }

  var toastTimer = null;
  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'dms-toast is-on' + (kind ? ' is-' + kind : '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = 'dms-toast'; }, 3400);
  }

  function bindRipples() {
    document.addEventListener('pointerdown', function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest('.dms-btn') : null;
      if (!btn || REDUCED) return;
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height);
      var span = document.createElement('span');
      span.className = 'dms-ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (ev.clientX - r.left - size / 2) + 'px';
      span.style.top = (ev.clientY - r.top - size / 2) + 'px';
      btn.appendChild(span);
      setTimeout(function () { if (span.parentNode) span.parentNode.removeChild(span); }, 640);
    }, { passive: true });
  }

  function flagField(el, msg) {
    if (!el) return;
    try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); }
    el.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    el.classList.add('dms-shake');
    setTimeout(function () { el.classList.remove('dms-shake'); }, 520);
    buzz([14, 40, 14]);
    if (msg) toast(msg, 'bad');
  }

  /* ── Carousel ────────────────────────────────────────────────────────── */
  function currentIndex() {
    if (!track) return 0;
    var w = track.clientWidth || 1;
    return Math.round(track.scrollLeft / w);
  }

  var rafPending = false;
  function onTrackScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      syncFromScroll();
    });
  }

  function syncFromScroll() {
    var i = clamp(currentIndex(), 0, STEPS.length - 1);
    if (i !== state.step) {
      var forward = i > state.step;
      state.step = i;
      applyStep({ forward: forward, fromScroll: true });
    } else {
      paintProgress();
    }
  }

  function applyStep(opts) {
    opts = opts || {};
    var i = state.step;
    var cfg = STEPS[i];

    app.setAttribute('data-step', String(i));
    panes.forEach(function (p, idx) {
      var live = idx === i;
      p.classList.toggle('is-live', live);
      p.setAttribute('aria-hidden', live ? 'false' : 'true');
      if (live && opts.forward) p.scrollTop = 0;
    });

    stepName.textContent = cfg.name;
    btnNextLabel.textContent = cfg.cta;
    btnBack.disabled = !cfg.back;
    btnBack.style.visibility = cfg.back ? 'visible' : 'hidden';

    paintProgress();
    updateGating();
    if (cfg.id === 'arm') renderReview();
    if (cfg.id === 'sealed') renderLive();

    document.dispatchEvent(new CustomEvent('dms:step', { detail: { index: i, id: cfg.id } }));
  }

  function paintProgress() {
    var i = state.step;
    segs.forEach(function (s, idx) {
      s.classList.toggle('is-active', idx === i);
      s.classList.toggle('is-done', idx < i);
      s.setAttribute('aria-current', idx === i ? 'step' : 'false');
    });
    if (progressFill) {
      progressFill.style.width = ((i / (STEPS.length - 1)) * 100) + '%';
    }
  }

  function goTo(i, opts) {
    opts = opts || {};
    i = clamp(i, 0, STEPS.length - 1);
    var forward = i > state.step;
    state.step = i;
    if (track) {
      track.scrollTo({ left: i * (track.clientWidth || 0), behavior: (REDUCED || opts.instant) ? 'auto' : 'smooth' });
    }
    applyStep({ forward: forward });
    buzz(8);
  }

  function next() { goTo(state.step + 1); }
  function prev() { goTo(state.step - 1); }

  /* ── Validation / CTA gating ─────────────────────────────────────────── */
  function gateFor(i) {
    var cfg = STEPS[i];
    if (cfg.id === 'seal') return elTitle.value.trim() ? '' : 'Give the box a name first.';
    if (cfg.id === 'guardian') {
      if (!elRecipientEmail.value.trim()) return 'Who should receive it? Add their email.';
      return emailOk(elRecipientEmail.value) ? '' : 'That guardian email looks incomplete.';
    }
    if (cfg.id === 'arm') {
      if (!elCreatorEmail.value.trim()) return 'We need your email to send the check-in link.';
      return emailOk(elCreatorEmail.value) ? '' : 'That check-in email looks incomplete.';
    }
    return '';
  }

  function updateGating() {
    var reason = gateFor(state.step);
    var soft = state.step < STEPS.length - 1;
    if (soft) {
      btnNext.setAttribute('aria-disabled', reason ? 'true' : 'false');
      btnNext.classList.toggle('is-gated', !!reason);
    } else {
      btnNext.setAttribute('aria-disabled', 'false');
      btnNext.classList.remove('is-gated');
    }
    return reason;
  }

  /* ── Live echoes ─────────────────────────────────────────────────────── */
  function renderEchoes() {
    var t = elTitle.value.trim();
    var gName = elRecipientName.value.trim();
    var gMail = elRecipientEmail.value.trim();

    elGuardianName.textContent = gName || (gMail ? gMail.split('@')[0] : 'Not chosen yet');
    elGuardianMail.textContent = gMail || '—';

    elHeartbeatEcho.textContent = humanize(state.interval.minutes);
    elGraceToggleEcho.textContent = state.grace.enabled
      ? humanize(state.grace.minutes) + ' of silence before release'
      : 'hard edge — release the moment a check-in is missed';

    elTlDue.textContent = 'in ' + humanizeShort(state.interval.minutes);
    elTlFire.textContent = 'in ' + humanizeShort(state.interval.minutes + (state.grace.enabled ? state.grace.minutes : 0));
    var gi = state.interval.minutes, gg = state.grace.enabled ? state.grace.minutes : 0.0001;
    elTlSegA.style.flexGrow = String(Math.max(1, gi));
    elTlSegB.style.flexGrow = String(Math.max(0.6, gg));

    var total = state.interval.minutes + (state.grace.enabled ? state.grace.minutes : 0);
    elTotalEcho.textContent = humanize(total);

    elNoteCount.textContent = String(elNote.value.length);
  }

  function renderReview() {
    elRvTitle.textContent = elTitle.value.trim() || 'Untitled Bitty Box';
    elRvGuardian.textContent = (elRecipientName.value.trim() ? elRecipientName.value.trim() + ' · ' : '') +
      (elRecipientEmail.value.trim() || '—');
    elRvInterval.textContent = 'every ' + humanize(state.interval.minutes);
    elRvGrace.textContent = state.grace.enabled ? humanize(state.grace.minutes) : 'none (hard edge)';
    var total = state.interval.minutes + (state.grace.enabled ? state.grace.minutes : 0);
    elRvTotal.textContent = humanize(total) + ' of silence';
    elRvCreator.textContent = elCreatorEmail.value.trim() || '—';
    renderEchoes();
  }

  /* ── Duration controls ───────────────────────────────────────────────── */
  function setIntervalMinutes(mins, opts) {
    opts = opts || {};
    mins = clamp(Math.round(mins), INTERVAL_MIN, INTERVAL_MAX);
    /* `unit` forces the display unit (explicit user choice); otherwise pick the
       unit that represents the value most cleanly. */
    var u = (opts.unit && UNIT_MINUTES[opts.unit]) ? opts.unit : bestUnit(mins);
    state.interval.minutes = mins;
    state.interval.unit = u;
    state.interval.value = Math.round((mins / UNIT_MINUTES[u]) * 1000) / 1000;
    paintDial('interval');
    paintUnits('interval');
    paintPresets('interval');
    paintSteppers('interval');
    renderEchoes();
    renderReview();
    if (!opts.quiet) persist();
  }

  function setGraceMinutes(mins, opts) {
    opts = opts || {};
    mins = clamp(Math.round(mins), GRACE_MIN, GRACE_MAX);
    var u = (opts.unit && UNIT_MINUTES[opts.unit]) ? opts.unit : bestUnit(mins);
    state.grace.minutes = mins;
    state.grace.unit = u;
    state.grace.value = Math.round((mins / UNIT_MINUTES[u]) * 1000) / 1000;
    paintDial('grace');
    paintUnits('grace');
    paintSteppers('grace');
    renderEchoes();
    renderReview();
    if (!opts.quiet) persist();
  }

  function setGraceEnabled(on, opts) {
    opts = opts || {};
    state.grace.enabled = !!on;
    elGraceToggle.setAttribute('aria-checked', on ? 'true' : 'false');
    elGraceWrap.classList.toggle('is-off', !on);
    elGraceWrap.setAttribute('aria-hidden', on ? 'false' : 'true');
    renderEchoes();
    renderReview();
    if (!opts.quiet) { persist(); buzz(10); }
  }

  function setSendFirstEmail(on, opts) {
    opts = opts || {};
    state.sendFirstEmail = !!on;
    elSendToggle.setAttribute('aria-checked', on ? 'true' : 'false');
    if (!opts.quiet) { persist(); buzz(10); }
  }

  function paintUnits(which) {
    var st = which === 'interval' ? state.interval : state.grace;
    var wrap = which === 'interval' ? $('#dmsIntervalUnits') : $('#dmsGraceUnits');
    $$('.dms-unit', wrap).forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-unit') === st.unit ? 'true' : 'false');
    });
  }

  function paintPresets(which) {
    if (which !== 'interval') return;
    $$('#dmsIntervalPresets .dms-chip').forEach(function (c) {
      var m = Number(c.getAttribute('data-minutes'));
      c.classList.toggle('dms-on', m === state.interval.minutes);
    });
  }

  function paintDial(which) {
    var st = which === 'interval' ? state.interval : state.grace;
    var dial = which === 'interval' ? $('#dmsIntervalDial') : $('#dmsGraceDial');
    var arc = which === 'interval' ? $('#dmsDialArc') : $('#dmsGraceArc');
    var knob = which === 'interval' ? $('#dmsDialKnob') : $('#dmsGraceKnob');
    var valEl = which === 'interval' ? $('#dmsDialValue') : $('#dmsGraceValue');
    var unitEl = which === 'interval' ? $('#dmsDialUnit') : $('#dmsGraceUnit');
    if (!dial || !arc) return;

    var span = DIAL_SPAN[st.unit];
    var frac = (st.value - span.min) / (span.max - span.min);
    frac = clamp(frac, 0, 1);

    arc.style.strokeDashoffset = String(ARC_LEN * (1 - frac));

    var rect = dial.getBoundingClientRect();
    var R = (rect.width || 200) * (86 / 200);
    var ang = (-90 + frac * 360) * Math.PI / 180;
    if (knob) knob.style.transform = 'translate(' + (Math.cos(ang) * R).toFixed(2) + 'px,' + (Math.sin(ang) * R).toFixed(2) + 'px)';

    var shown = st.value;
    valEl.textContent = String(Math.round(shown * 100) / 100);
    unitEl.textContent = UNIT_NOUN[st.unit];

    dial.setAttribute('aria-valuemin', String(span.min));
    dial.setAttribute('aria-valuemax', String(span.max));
    dial.setAttribute('aria-valuenow', String(shown));
    dial.setAttribute('aria-valuetext', shown + ' ' + UNIT_NOUN[st.unit]);
  }

  function buildTicks(which) {
    var g = which === 'interval' ? $('#dmsDialTicks') : $('#dmsGraceTicks');
    if (!g) return;
    var parts = [];
    for (var i = 0; i < 48; i++) {
      var a = (i / 48) * Math.PI * 2 - Math.PI / 2;
      var major = i % 4 === 0;
      var r1 = major ? 70 : 74;
      var r2 = 78;
      var x1 = 100 + Math.cos(a) * r1, y1 = 100 + Math.sin(a) * r1;
      var x2 = 100 + Math.cos(a) * r2, y2 = 100 + Math.sin(a) * r2;
      parts.push('<line x1="' + x1.toFixed(2) + '" y1="' + y1.toFixed(2) + '" x2="' + x2.toFixed(2) +
        '" y2="' + y2.toFixed(2) + '"' + (major ? ' class="dms-tick-major"' : '') + ' />');
    }
    g.innerHTML = parts.join('');
  }

  function attachDial(which) {
    var dial = which === 'interval' ? $('#dmsIntervalDial') : $('#dmsGraceDial');
    if (!dial) return;
    var dragging = false, moved = false;

    function st() { return which === 'interval' ? state.interval : state.grace; }
    function span() { return DIAL_SPAN[st().unit]; }
    function applyFromPoint(clientX, clientY) {
      var rect = dial.getBoundingClientRect();
      var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      var ang = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
      var frac = ((ang + 90) % 360 + 360) % 360 / 360;
      var s = span();
      var raw = s.min + frac * (s.max - s.min);
      var nextVal = Math.round(raw);
      if (nextVal === st().value) return;
      var mins = nextVal * UNIT_MINUTES[st().unit];
      if (which === 'interval') setIntervalMinutes(mins, { quiet: true });
      else setGraceMinutes(mins, { quiet: true });
      moved = true;
      buzz(6);
    }

    dial.addEventListener('pointerdown', function (ev) {
      if (dial.closest('.dms-dialwrap').classList.contains('is-off')) return;
      dragging = true; moved = false;
      try { dial.setPointerCapture(ev.pointerId); } catch (e) { /* noop */ }
      dial.classList.add('is-dragging');
    });
    dial.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      ev.preventDefault();
      applyFromPoint(ev.clientX, ev.clientY);
    }, { passive: false });
    function end() {
      if (!dragging) return;
      dragging = false;
      dial.classList.remove('is-dragging');
      if (moved) { persist(); buzz(12); }
    }
    dial.addEventListener('pointerup', end);
    dial.addEventListener('pointercancel', end);

    dial.addEventListener('keydown', function (ev) {
      var s = span();
      var stp = ev.shiftKey ? 10 : 1;
      var v = st().value;
      var handled = true;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') v += stp;
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') v -= stp;
      else if (ev.key === 'PageUp') v += 10;
      else if (ev.key === 'PageDown') v -= 10;
      else if (ev.key === 'Home') v = s.min;
      else if (ev.key === 'End') v = s.max;
      else handled = false;
      if (!handled) return;
      ev.preventDefault();
      v = clamp(v, s.min, s.max);
      var mins = v * UNIT_MINUTES[st().unit];
      if (which === 'interval') setIntervalMinutes(mins);
      else setGraceMinutes(mins);
      buzz(6);
    });

    dial.addEventListener('wheel', function (ev) {
      if (dial.closest('.dms-dialwrap').classList.contains('is-off')) return;
      ev.preventDefault();
      var dir = ev.deltaY > 0 ? -1 : 1;
      var v = st().value + dir;
      var s = span();
      v = clamp(v, s.min, s.max);
      var mins = v * UNIT_MINUTES[st().unit];
      if (which === 'interval') setIntervalMinutes(mins);
      else setGraceMinutes(mins);
    }, { passive: false });
  }

  function stepBy(which, dir) {
    var st = which === 'interval' ? state.interval : state.grace;
    var s = DIAL_SPAN[st.unit];
    var v = clamp(Math.round(st.value) + dir, s.min, s.max);
    var mins = v * UNIT_MINUTES[st.unit];
    if (which === 'interval') setIntervalMinutes(mins);
    else setGraceMinutes(mins);
    buzz(6);
  }

  function switchUnit(which, unit) {
    var st = which === 'interval' ? state.interval : state.grace;
    if (!UNIT_MINUTES[unit] || st.unit === unit) return;
    /* Preserve the configured cadence exactly and honour the chosen unit. The
       value is rounded to that unit's granularity so the readout stays clean. */
    var mins = Math.round(st.minutes / UNIT_MINUTES[unit]) * UNIT_MINUTES[unit];
    var lo = which === 'interval' ? INTERVAL_MIN : GRACE_MIN;
    var hi = which === 'interval' ? INTERVAL_MAX : GRACE_MAX;
    mins = clamp(mins || st.minutes, lo, hi);
    if (which === 'interval') setIntervalMinutes(mins, { unit: unit });
    else setGraceMinutes(mins, { unit: unit });
    buzz(8);
  }

  /* Disable a stepper at the edge of its dial span so nothing feels dead. */
  function paintSteppers(which) {
    var st = which === 'interval' ? state.interval : state.grace;
    var span = DIAL_SPAN[st.unit];
    var down = which === 'interval' ? $('#dmsIntervalDown') : $('#dmsGraceDown');
    var up = which === 'interval' ? $('#dmsIntervalUp') : $('#dmsGraceUp');
    if (down) down.disabled = st.value <= span.min;
    if (up) up.disabled = st.value >= span.max;
  }

  /* ── API ─────────────────────────────────────────────────────────────── */
  function api(path, body, method) {
    return fetch(path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: Object.assign({ Accept: 'application/json' },
        body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin'
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || data.success === false) {
          var msg = data.error || data.code || ('Request failed (' + res.status + ')');
          var err = new Error(msg);
          err.status = res.status;
          err.code = data.code;
          throw err;
        }
        return data;
      });
    });
  }

  function setBusy(on) {
    state.busy = !!on;
    btnNext.classList.toggle('is-busy', !!on);
    btnNext.setAttribute('aria-busy', on ? 'true' : 'false');
    $$('.dms-btn', app).forEach(function (b) { if (b !== btnNext) b.disabled = !!on; });
    if (!on) {
      btnBack.disabled = !STEPS[state.step].back;
      updateGating();
    }
  }

  function arm() {
    if (state.busy) return Promise.resolve();
    setBusy(true);
    var payload = {
      creatorEmail: elCreatorEmail.value.trim(),
      recipientEmail: elRecipientEmail.value.trim(),
      recipientName: elRecipientName.value.trim(),
      boxTitle: elTitle.value.trim() || 'Untitled Bitty Box',
      boxUrl: elBoxUrl.value.trim(),
      note: elNote.value.trim(),
      intervalMinutes: state.interval.minutes,
      graceMinutes: state.grace.enabled ? state.grace.minutes : 0,
      graceDisabled: !state.grace.enabled,
      sendFirstEmail: state.sendFirstEmail
    };
    return api('/api/deadman/arm', payload)
      .then(function (data) {
        state.switchId = data.id;
        state.token = data.checkInToken || '';
        state.switch = data.switch || null;
        try {
          if (state.token) localStorage.setItem('bitty_deadman_token_' + state.switchId, state.token);
          localStorage.setItem('bitty_dms_test_last', JSON.stringify({
            id: state.switchId, at: new Date().toISOString()
          }));
        } catch (e) { /* ignore */ }
        elCheckInLink.value = data.checkInUrl || (state.token ? location.origin + '/api/deadman/checkin/' + state.token : '');
        goTo(5 + 1);
        buzz([12, 60, 18, 60, 26]);
        toast(state.sendFirstEmail
          ? 'Armed. Your check-in link is on its way.'
          : 'Armed. Save the check-in link below.', 'good');
        startTicker();
        return data;
      })
      .catch(function (err) {
        toast('Could not arm: ' + err.message, 'bad');
        buzz([20, 60, 20]);
        throw err;
      })
      .then(function (r) { setBusy(false); return r; }, function (e) { setBusy(false); throw e; });
  }

  function checkIn() {
    if (!state.token) { toast('No check-in token on this device.', 'bad'); return Promise.resolve(); }
    setBusy(true);
    return api('/api/deadman/checkin/' + encodeURIComponent(state.token), {})
      .then(function (data) {
        state.switch = data.switch || state.switch;
        state.checkedIn = true;
        renderLive();
        buzz([10, 40, 10]);
        toast(data.alreadyTriggered ? 'Checked in — but this switch had already fired.' : 'Checked in. The clock is reset.', 'good');
      })
      .catch(function (err) { toast('Check-in failed: ' + err.message, 'bad'); })
      .then(function (r) { setBusy(false); return r; });
  }

  function testFire(kind) {
    if (!state.token) { toast('No check-in token on this device.', 'bad'); return Promise.resolve(); }
    setBusy(true);
    return api('/api/deadman/test-' + kind, { token: state.token })
      .then(function (data) {
        state.switch = data.switch || state.switch;
        state.lastTest = { kind: kind, delivery: data.delivery || null, at: new Date().toISOString(), ok: true };
        renderLive();
        if (kind === 'fire') {
          toast('Fired. The box has been released to your guardian.', 'bad');
          buzz([30, 80, 30, 80, 60]);
        } else {
          toast('Test reminder sent to your check-in address.', 'good');
          buzz(14);
        }
      })
      .catch(function (err) {
        state.lastTest = { kind: kind, error: err.message, at: new Date().toISOString(), ok: false };
        toast('Test failed: ' + err.message, 'bad');
      })
      .then(function (r) { setBusy(false); return r; });
  }

  function disarm() {
    if (!state.token) { toast('No check-in token on this device.', 'bad'); return Promise.resolve(); }
    setBusy(true);
    return api('/api/deadman/disarm', { token: state.token })
      .then(function (data) {
        state.switch = data.switch || state.switch;
        renderLive();
        toast('Disarmed. Nothing will be released.', 'good');
        buzz([8, 50, 8]);
      })
      .catch(function (err) { toast('Disarm failed: ' + err.message, 'bad'); })
      .then(function (r) { setBusy(false); return r; });
  }

  function refreshStatus() {
    if (!state.switchId) return Promise.resolve();
    return fetch('/api/deadman/status/' + encodeURIComponent(state.switchId), {
      headers: { Accept: 'application/json' }
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.success && d.switch) { state.switch = d.switch; renderLive(); }
      })
      .catch(function () { /* offline is fine, the local ticker keeps counting */ });
  }

  /* ── Live pane ───────────────────────────────────────────────────────── */
  var tickTimer = null;
  function startTicker() {
    if (tickTimer) return;
    tickTimer = setInterval(function () {
      if (state.step !== 5) { return; }
      paintCountdown();
    }, 1000);
    setTimeout(refreshStatus, 2500);
  }

  function paintCountdown() {
    var sw = state.switch;
    if (!sw || !elCdValue) return;
    if (sw.status === 'triggered') { elCdValue.textContent = 'released'; return; }
    if (sw.status === 'disarmed') { elCdValue.textContent = 'disarmed'; return; }
    var due = sw.nextDueAt ? new Date(sw.nextDueAt).getTime() : 0;
    elCdValue.textContent = countdown(due - Date.now());
  }

  function renderLive() {
    var sw = state.switch;
    if (!sw) return;
    app.setAttribute('data-state', sw.status === 'triggered' ? 'aftermath' : 'alive');

    elSwitchId.textContent = sw.id || state.switchId || '—';
    elLiveGuardian.textContent = elRecipientName.value.trim() || elRecipientEmail.value.trim() || '—';
    elLiveRelease.textContent = sw.releasesAt ? timeLabel(sw.releasesAt) : '—';

    if (sw.status === 'triggered') {
      elLivePill.className = 'dms-livepill is-after';
      elLivePill.innerHTML = '<i></i> RELEASED';
      elSealedHeadline.textContent = 'The switch has fired.';
      elSealedSub.textContent = 'Your box was released to your guardian. There is nothing left to check in for — arm a new switch when you are ready.';
      btnNextLabel.textContent = 'Start a new switch';
      elDisarmEcho.textContent = 'This switch has already fired, so there is nothing to disarm.';
    } else if (sw.status === 'disarmed') {
      elLivePill.className = 'dms-livepill is-dim';
      elLivePill.innerHTML = '<i></i> DISARMED';
      elSealedHeadline.textContent = 'Switch disarmed.';
      elSealedSub.textContent = 'Nothing will be released. Your guardian was never contacted.';
      btnNextLabel.textContent = 'Start a new switch';
      elDisarmEcho.textContent = 'Disarmed — this switch will not fire.';
    } else {
      elLivePill.className = 'dms-livepill';
      elLivePill.innerHTML = '<i></i> ARMED';
      elSealedHeadline.textContent = 'Your switch is armed.';
      elSealedSub.textContent = 'The clock is running. One tap on your check-in link resets it.';
      btnNextLabel.textContent = 'Check in now';
      elDisarmEcho.textContent = 'Disarming cancels the release permanently. Nothing is sent to your guardian.';
    }

    if (sw.overdue && sw.status === 'armed') {
      elSealedSub.textContent = 'A check-in is overdue. Check in now to keep the box sealed.';
    }
    paintCountdown();
  }

  /* ── Primary / back actions ──────────────────────────────────────────── */
  function onNext() {
    if (state.busy) return;
    var cfg = STEPS[state.step];
    var reason = gateFor(state.step);

    if (cfg.id === 'arm') {
      if (reason) {
        flagField(elCreatorEmail, reason);
        return;
      }
      arm();
      return;
    }

    if (cfg.id === 'sealed') {
      var sw = state.switch;
      if (sw && (sw.status === 'triggered' || sw.status === 'disarmed')) {
        resetForNewSwitch();
        return;
      }
      checkIn();
      return;
    }

    if (reason) {
      flagField(cfg.id === 'seal' ? elTitle : elRecipientEmail, reason);
      return;
    }
    next();
  }

  function resetForNewSwitch() {
    state.switch = null; state.token = ''; state.switchId = '';
    state.checkedIn = false;
    app.setAttribute('data-state', 'alive');
    elCheckInLink.value = '';
    elSwitchId.textContent = '—';
    elCdValue.textContent = '—';
    goTo(1, { instant: true });
    toast('Fresh canvas. Your details are still here.');
    buzz(10);
  }

  /* ── Wiring ──────────────────────────────────────────────────────────── */
  function wireInputs() {
    ['input', 'change'].forEach(function (evt) {
      elTitle.addEventListener(evt, function () { renderEchoes(); renderReview(); persist(); updateGating(); });
      elBoxUrl.addEventListener(evt, persist);
      elNote.addEventListener(evt, function () { renderEchoes(); persist(); });
      elRecipientName.addEventListener(evt, function () { renderEchoes(); renderReview(); persist(); });
      elCreatorEmail.addEventListener(evt, function () {
        elCreatorWarn.hidden = !elCreatorEmail.value.trim() || emailOk(elCreatorEmail.value);
        renderReview(); persist(); updateGating();
      });
      elRecipientEmail.addEventListener(evt, function () {
        elRecipientWarn.hidden = !elRecipientEmail.value.trim() || emailOk(elRecipientEmail.value);
        renderEchoes(); renderReview(); persist(); updateGating();
      });
    });

    $$('#dmsNoteChips .dms-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        elNote.value = c.getAttribute('data-note') || '';
        elNote.dispatchEvent(new Event('input'));
        buzz(10);
        toast('Line dropped in — make it yours.');
      });
    });

    $$('#dmsIntervalPresets .dms-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        setIntervalMinutes(Number(c.getAttribute('data-minutes')));
        buzz(10);
      });
    });

    $$('#dmsIntervalUnits .dms-unit').forEach(function (b) {
      b.addEventListener('click', function () { switchUnit('interval', b.getAttribute('data-unit')); });
    });
    $$('#dmsGraceUnits .dms-unit').forEach(function (b) {
      b.addEventListener('click', function () { switchUnit('grace', b.getAttribute('data-unit')); });
    });

    $('#dmsIntervalUp').addEventListener('click', function () { stepBy('interval', 1); });
    $('#dmsIntervalDown').addEventListener('click', function () { stepBy('interval', -1); });
    $('#dmsGraceUp').addEventListener('click', function () { stepBy('grace', 1); });
    $('#dmsGraceDown').addEventListener('click', function () { stepBy('grace', -1); });

    elGraceToggle.addEventListener('click', function () {
      setGraceEnabled(elGraceToggle.getAttribute('aria-checked') !== 'true');
    });
    elSendToggle.addEventListener('click', function () {
      setSendFirstEmail(elSendToggle.getAttribute('aria-checked') !== 'true');
    });

    btnNext.addEventListener('click', onNext);
    btnBack.addEventListener('click', function () { if (!state.busy) prev(); });

    segs.forEach(function (s) {
      s.addEventListener('click', function () {
        var i = Number(s.getAttribute('data-goto'));
        /* never let a tap jump past an unconfigured gate */
        if (i > state.step) {
          for (var k = state.step; k < i; k++) {
            var r = gateFor(k);
            if (r) { flagField(k === 1 ? elTitle : (k === 2 ? elRecipientEmail : elCreatorEmail), r); return; }
          }
        }
        goTo(i);
      });
    });

    $('#dmsCopyLink').addEventListener('click', function () {
      var v = elCheckInLink.value;
      if (!v) { toast('No check-in link yet.', 'bad'); return; }
      var done = function () { toast('Check-in link copied.', 'good'); buzz(12); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(v).then(done, function () {
          elCheckInLink.select(); toast('Select and copy the link manually.', 'bad');
        });
      } else {
        elCheckInLink.select();
        try { document.execCommand('copy'); done(); } catch (e) { toast('Select and copy the link manually.', 'bad'); }
      }
    });

    $('#dmsTestRemind').addEventListener('click', function () { testFire('remind'); });
    $('#dmsTestFire').addEventListener('click', function () { testFire('fire'); });
    $('#dmsDisarm').addEventListener('click', function () { disarm(); });

    document.addEventListener('keydown', function (ev) {
      if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
      if (ev.key === 'ArrowRight' && !ev.metaKey && !ev.ctrlKey) { if (!state.busy) next(); }
      if (ev.key === 'ArrowLeft' && !ev.metaKey && !ev.ctrlKey) { if (!state.busy) prev(); }
    });

    window.addEventListener('resize', function () {
      paintDial('interval'); paintDial('grace');
      if (track) track.scrollLeft = state.step * (track.clientWidth || 0);
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        paintDial('interval'); paintDial('grace');
        if (track) track.scrollLeft = state.step * (track.clientWidth || 0);
      }, 260);
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { refreshStatus(); paintCountdown(); }
    });
  }

  /* ── Boot ────────────────────────────────────────────────────────────── */
  function boot() {
    buildTicks('interval');
    buildTicks('grace');
    attachDial('interval');
    attachDial('grace');
    wireInputs();
    bindRipples();
    restore();

    setIntervalMinutes(state.interval.minutes, { quiet: true });
    setGraceEnabled(state.grace.enabled, { quiet: true });
    setGraceMinutes(state.grace.minutes, { quiet: true });
    setSendFirstEmail(state.sendFirstEmail, { quiet: true });
    renderEchoes();
    renderReview();

    if (track) track.addEventListener('scroll', onTrackScroll, { passive: true });
    applyStep({ forward: false });
    requestAnimationFrame(function () {
      paintDial('interval'); paintDial('grace');
      applyStep({ forward: false });
    });

    /* Verification contract — one object the headless probe can assert on. */
    window.__BB_TEST_DMS = {
      version: VERSION,
      steps: STEPS.map(function (s) { return s.id; }),
      paneCount: panes.length,
      dials: ['interval', 'grace'],
      fields: ['dmsTitle', 'dmsBoxUrl', 'dmsNote', 'dmsRecipientEmail', 'dmsRecipientName', 'dmsCreatorEmail'],
      reducedMotion: REDUCED,
      api: { endpoint: '/api/deadman/arm', armed: false, switchId: null, status: null },
      state: function () {
        return {
          step: state.step, stepId: STEPS[state.step].id,
          intervalMinutes: state.interval.minutes,
          graceMinutes: state.grace.enabled ? state.grace.minutes : 0,
          graceEnabled: state.grace.enabled,
          sendFirstEmail: state.sendFirstEmail,
          busy: state.busy,
          switchId: state.switchId,
          switchStatus: state.switch ? state.switch.status : null,
          checkInUrl: elCheckInLink.value,
          dataState: app.getAttribute('data-state'),
          ctaLabel: btnNextLabel.textContent,
          gated: btnNext.getAttribute('aria-disabled') === 'true',
          lastTest: state.lastTest || null,
          countdownText: elCdValue.textContent,
          counts: {
            panes: panes.length,
            segs: segs.length,
            ticks: $$('#dmsDialTicks line').length + $$('#dmsGraceTicks line').length
          }
        };
      },
      formatCountdown: function (ms) { return countdown(ms); },
      /* Test affordance: move the switch's due time without touching the server,
         so the 1s ticker can be proven to be live. */
      simulateDue: function (msFromNow) {
        if (!state.switch) return null;
        state.switch.nextDueAt = new Date(Date.now() + Math.max(0, Number(msFromNow) || 0)).toISOString();
        paintCountdown();
        return elCdValue.textContent;
      },
      goTo: function (i) { goTo(i, { instant: true }); return STEPS[state.step].id; },
      fill: function (patch) {
        patch = patch || {};
        if (patch.title !== undefined) { elTitle.value = patch.title; elTitle.dispatchEvent(new Event('input')); }
        if (patch.note !== undefined) { elNote.value = patch.note; elNote.dispatchEvent(new Event('input')); }
        if (patch.boxUrl !== undefined) { elBoxUrl.value = patch.boxUrl; elBoxUrl.dispatchEvent(new Event('input')); }
        if (patch.recipientEmail !== undefined) { elRecipientEmail.value = patch.recipientEmail; elRecipientEmail.dispatchEvent(new Event('input')); }
        if (patch.recipientName !== undefined) { elRecipientName.value = patch.recipientName; elRecipientName.dispatchEvent(new Event('input')); }
        if (patch.creatorEmail !== undefined) { elCreatorEmail.value = patch.creatorEmail; elCreatorEmail.dispatchEvent(new Event('input')); }
        return window.__BB_TEST_DMS.state();
      },
      setInterval: function (m) { setIntervalMinutes(m); return state.interval.minutes; },
      setGrace: function (m) { setGraceMinutes(m); return state.grace.minutes; },
      setGraceEnabled: function (on) { setGraceEnabled(on); return state.grace.enabled; },
      next: function () { onNext(); return true; },
      arm: function () { return arm().then(function (d) { return { id: d.id, checkInUrl: d.checkInUrl }; }); },
      checkIn: function () { return checkIn().then(function () { return state.switch; }); },
      disarm: function () { return disarm().then(function () { return state.switch; }); },
      testFire: function (kind) { return testFire(kind || 'remind'); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
