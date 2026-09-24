(() => {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeV = 0; // 0: Bitty Page, 1: Bitty Capsule, 2: Bitty Ally
  const totalV = 3;
  const activeH = [0, 0, 0]; // Current horizontal index for each vertical slide
  const totalH = [4, 4, 4]; // 4 cards per slide

  const vSlides = Array.from(document.querySelectorAll('.v-slide'));
  const vNavBtns = Array.from(document.querySelectorAll('.v-nav-btn'));
  const topNavJumps = Array.from(document.querySelectorAll('.nav-jump'));
  const hTracks = Array.from(document.querySelectorAll('.h-card-track'));

  // ── Vertical Navigation ───────────────────────────────────────────────────
  function goToVertical(idx) {
    if (idx < 0) idx = 0;
    if (idx >= totalV) idx = totalV - 1;
    if (idx === activeV && vSlides[activeV]?.classList.contains('active')) return;

    activeV = idx;

    vSlides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev-slide');
      if (i === activeV) {
        slide.classList.add('active');
      } else if (i < activeV) {
        slide.classList.add('prev-slide');
      }
    });

    vNavBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === activeV);
    });

    topNavJumps.forEach((btn, i) => {
      btn.classList.toggle('active', i === activeV);
    });
  }

  // ── Horizontal Navigation ─────────────────────────────────────────────────
  function goToHorizontal(vIdx, hIdx) {
    if (vIdx < 0 || vIdx >= totalV) return;
    const maxH = totalH[vIdx] || 4;
    if (hIdx < 0) hIdx = 0;
    if (hIdx >= maxH) hIdx = maxH - 1;

    activeH[vIdx] = hIdx;
    const track = hTracks[vIdx];
    if (track) {
      track.style.transform = `translateX(-${hIdx * 100}%)`;
    }

    const slide = vSlides[vIdx];
    if (slide) {
      const dots = Array.from(slide.querySelectorAll('.h-dot'));
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === hIdx);
      });
    }
  }

  // Expose globally for inline button onclicks if needed
  window.goToVerticalSlide = goToVertical;
  window.goToHorizontalCard = goToHorizontal;

  // ── Event Bindings ────────────────────────────────────────────────────────
  // Topbar jump buttons
  topNavJumps.forEach((btn, i) => {
    btn.addEventListener('click', () => goToVertical(i));
  });

  // Vertical rail buttons
  vNavBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => goToVertical(i));
  });

  // Vertical arrow buttons
  document.getElementById('vPrevBtn')?.addEventListener('click', () => goToVertical(activeV - 1));
  document.getElementById('vNextBtn')?.addEventListener('click', () => goToVertical(activeV + 1));

  // Horizontal controls per slide
  vSlides.forEach((slide, vIdx) => {
    const prevBtn = slide.querySelector('.h-prev');
    const nextBtn = slide.querySelector('.h-next');
    const dots = Array.from(slide.querySelectorAll('.h-dot'));

    prevBtn?.addEventListener('click', () => goToHorizontal(vIdx, activeH[vIdx] - 1));
    nextBtn?.addEventListener('click', () => goToHorizontal(vIdx, activeH[vIdx] + 1));

    dots.forEach((dot, hIdx) => {
      dot.addEventListener('click', () => goToHorizontal(vIdx, hIdx));
    });

    slide.querySelectorAll('.h-jump-next').forEach(btn => {
      btn.addEventListener('click', () => goToHorizontal(vIdx, activeH[vIdx] + 1));
    });
  });

  // ── Wheel Event Handling (Throttled) ───────────────────────────────────────
  let lastWheelTime = 0;
  window.addEventListener('wheel', e => {
    const now = Date.now();
    if (now - lastWheelTime < 450) return;

    const absY = Math.abs(e.deltaY);
    const absX = Math.abs(e.deltaX);

    if (absY > absX && absY > 25) {
      lastWheelTime = now;
      if (e.deltaY > 0) {
        goToVertical(activeV + 1);
      } else {
        goToVertical(activeV - 1);
      }
    } else if (absX > absY && absX > 25) {
      lastWheelTime = now;
      if (e.deltaX > 0) {
        goToHorizontal(activeV, activeH[activeV] + 1);
      } else {
        goToHorizontal(activeV, activeH[activeV] - 1);
      }
    }
  }, { passive: true });

  // ── Touch / Swipe Gestures ────────────────────────────────────────────────
  let touchStartX = 0;
  let touchStartY = 0;

  window.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', e => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absY > absX && absY > 40) {
        if (deltaY < 0) {
          goToVertical(activeV + 1);
        } else {
          goToVertical(activeV - 1);
        }
      } else if (absX > absY && absX > 40) {
        if (deltaX < 0) {
          goToHorizontal(activeV, activeH[activeV] + 1);
        } else {
          goToHorizontal(activeV, activeH[activeV] - 1);
        }
      }
    }
  }, { passive: true });

  // ── Keyboard Navigation ───────────────────────────────────────────────────
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      goToVertical(activeV + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      goToVertical(activeV - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToHorizontal(activeV, activeH[activeV] + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToHorizontal(activeV, activeH[activeV] - 1);
    } else if (e.key === '1') {
      goToVertical(0);
    } else if (e.key === '2') {
      goToVertical(1);
    } else if (e.key === '3') {
      goToVertical(2);
    }
  });

  // Initialize slides
  goToVertical(0);
  goToHorizontal(0, 0);
  goToHorizontal(1, 0);
  goToHorizontal(2, 0);

  // ── Heartbeat Clock Telemetry & Simulator ─────────────────────────────────
  const radar = document.getElementById('hero-radar');
  const display = document.getElementById('clock-countdown');
  const nextCheckin = document.getElementById('clock-next-checkin');

  if (radar && display) {
    const windowMs = (6 * 24 * 60 + 13 * 60 + 48) * 60 * 1000;
    let deadline = Date.now() + windowMs;

    const format = () => {
      const left = Math.max(0, deadline - Date.now());
      const days = Math.floor(left / 86400000);
      const hours = Math.floor((left % 86400000) / 3600000);
      const minutes = Math.floor((left % 3600000) / 60000);
      return `${String(days).padStart(2, '0')}D ${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M`;
    };

    const updateCheckin = val => {
      if (nextCheckin) nextCheckin.textContent = val.split(' ').slice(0, 2).join(' ');
    };

    const showMode = mode => {
      radar.dataset.mode = mode;
      if (mode === 'alive') {
        deadline = Date.now() + windowMs;
        display.textContent = format();
        updateCheckin(display.textContent);
      } else if (mode === 'mutating') {
        display.textContent = 'OVERDUE +18H';
        if (nextCheckin) nextCheckin.textContent = 'OVERDUE';
      } else if (mode === 'aftermath') {
        display.textContent = 'RELEASED';
        if (nextCheckin) nextCheckin.textContent = 'FIRED';
      } else if (mode === 'burn') {
        display.textContent = 'ZEROIZED';
        if (nextCheckin) nextCheckin.textContent = 'PURGED';
      }
    };

    document.querySelectorAll('.state-switcher .state-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.state-switcher .state-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showMode(btn.dataset.state || 'alive');
      });
    });

    window.setInterval(() => {
      if (radar.dataset.mode === 'alive') {
        display.textContent = deadline > Date.now() ? format() : 'CHECK-IN DUE';
        updateCheckin(display.textContent);
      }
    }, 1000);
  }

  // Mobile menu toggle
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.topbar-nav');
  menu?.addEventListener('click', () => {
    nav?.classList.toggle('open');
  });

  // ── Interactive Specular Light & 3D Tilt ──────────────────────────────────
  if (!REDUCED && window.matchMedia('(hover: hover)').matches) {
    const visualStages = Array.from(document.querySelectorAll('.visual-stage'));

    window.addEventListener('mousemove', e => {
      visualStages.forEach(stage => {
        const rect = stage.getBoundingClientRect();
        // Check if cursor is reasonably close to stage to optimize
        const isNear = (
          e.clientX >= rect.left - 200 &&
          e.clientX <= rect.right + 200 &&
          e.clientY >= rect.top - 200 &&
          e.clientY <= rect.bottom + 200
        );

        if (isNear) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          stage.style.setProperty('--mouse-x', `${x}px`);
          stage.style.setProperty('--mouse-y', `${y}px`);

          // Subtle 3D tilt
          const normX = (x / rect.width) - 0.5;
          const normY = (y / rect.height) - 0.5;
          const tiltX = (normY * -6).toFixed(2);
          const tiltY = (normX * 6).toFixed(2);
          stage.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
        } else {
          stage.style.transform = '';
        }
      });
    }, { passive: true });
  }

  // ── Code Snippet Copy Feature ─────────────────────────────────────────────
  document.querySelectorAll('.sim-code-box').forEach(box => {
    const header = box.querySelector('.sim-code-header');
    const codeEl = box.querySelector('.sim-code-body code');
    if (header && codeEl) {
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'sim-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy code snippet');
      copyBtn.innerHTML = '<span>⧉ COPY</span>';
      copyBtn.style.cssText = `
        font-family: var(--font-mono);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--champagne);
        background: rgba(223, 194, 145, 0.1);
        border: 1px solid rgba(223, 194, 145, 0.25);
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-left: auto;
        margin-right: 8px;
      `;

      copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.background = 'rgba(223, 194, 145, 0.25)';
        copyBtn.style.color = '#fff';
      });
      copyBtn.addEventListener('mouseleave', () => {
        copyBtn.style.background = 'rgba(223, 194, 145, 0.1)';
        copyBtn.style.color = 'var(--champagne)';
      });

      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(codeEl.innerText.trim());
          copyBtn.innerHTML = '<span style="color:#71d6a1;">✓ COPIED</span>';
          setTimeout(() => {
            copyBtn.innerHTML = '<span>⧉ COPY</span>';
          }, 2000);
        } catch (_) {
          copyBtn.innerHTML = '<span>COPIED</span>';
          setTimeout(() => {
            copyBtn.innerHTML = '<span>⧉ COPY</span>';
          }, 2000);
        }
      });

      header.insertBefore(copyBtn, header.querySelector('.sim-status-code'));
    }
  });

  // ── Luxury Stardust Canvas Background ─────────────────────────────────────
  if (!REDUCED) {
    const canvas = document.getElementById('luxury-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let width = 0;
      let height = 0;
      let particles = [];
      const particleCount = 70;

      // Color palette for stardust particles
      const colors = [
        'rgba(250, 247, 242, ', // Cream pure
        'rgba(244, 238, 227, ', // Cream silk
        'rgba(223, 194, 145, ', // Champagne gold
        'rgba(225, 29, 72, ',   // Crimson bright
        'rgba(201, 24, 59, '    // Crimson velvet
      ];

      function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });

      let mouse = { x: -1000, y: -1000, radius: 140 };
      window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }, { passive: true });

      window.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
      }, { passive: true });

      class Stardust {
        constructor() {
          this.reset(true);
        }

        reset(initial = false) {
          this.x = Math.random() * width;
          this.y = initial ? Math.random() * height : height + 10;
          this.size = Math.random() * 2 + 0.6;
          this.speedY = -(Math.random() * 0.45 + 0.15);
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.colorBase = colors[Math.floor(Math.random() * colors.length)];
          this.alpha = Math.random() * 0.6 + 0.2;
          this.maxAlpha = this.alpha;
          this.pulse = Math.random() * Math.PI;
          this.pulseSpeed = Math.random() * 0.03 + 0.01;
        }

        update() {
          this.y += this.speedY;
          this.x += this.speedX + Math.sin(this.pulse) * 0.2;
          this.pulse += this.pulseSpeed;

          // Mouse proximity effect
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (1 - dist / mouse.radius);
            this.x -= (dx / dist) * force * 1.5;
            this.y -= (dy / dist) * force * 1.5;
            this.currentAlpha = Math.min(1, this.maxAlpha + force * 0.5);
          } else {
            this.currentAlpha = this.maxAlpha * (0.6 + 0.4 * Math.sin(this.pulse));
          }

          if (this.y < -10 || this.x < -10 || this.x > width + 10) {
            this.reset(false);
          }
        }

        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.colorBase + this.currentAlpha + ')';
          ctx.shadowBlur = this.size > 1.8 ? 8 : 4;
          ctx.shadowColor = this.colorBase + '0.8)';
          ctx.fill();
        }
      }

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Stardust());
      }

      let isRunning = true;
      function loop() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          particles[i].update();
          particles[i].draw();
        }

        requestAnimationFrame(loop);
      }

      loop();

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          isRunning = false;
        } else {
          isRunning = true;
          loop();
        }
      });
    }
  }

})();
