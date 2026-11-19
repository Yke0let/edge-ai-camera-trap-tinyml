/* ==========================================================================
   Edge AI for Camera-Trap Wildlife Monitoring — Interactive Deck Controller
   Zero-dependency navigation, animated MCUNet-in3 SVG, & interactive charts
   ========================================================================== */

(function () {
  'use strict';

  const slides = Array.from(document.querySelectorAll('.slide'));
  const totalSlides = slides.length; // Exactly 9
  const secbar = document.getElementById('secbar');
  const hudCounter = document.getElementById('hud-counter');
  const hudSecLabel = document.getElementById('hud-section-label');
  const notesDrawer = document.getElementById('notes-drawer');
  const notesTitle = document.getElementById('notes-slide-title');
  const notesText = document.getElementById('notes-text');
  const overviewModal = document.getElementById('overview-modal');
  const overviewGrid = document.getElementById('overview-grid');

  const isStatic = new URLSearchParams(window.location.search).get('static') === '1';
  if (isStatic) document.body.classList.add('static-render');

  let currentIdx = 0;

  /* ========================================================================
     1. BUILD TOP PROGRESS SEGMENTS & 3x3 OVERVIEW MODAL
     ======================================================================== */
  const segButtons = [];
  const ovItems = [];

  slides.forEach((slide, i) => {
    const secName = slide.dataset.section || `0${i + 1}`;
    const title = slide.dataset.title || `Slide ${i + 1}`;
    const isPhoto = slide.classList.contains('photo-slide');

    // Top bar segment
    const btn = document.createElement('button');
    btn.className = 'sec-seg';
    btn.textContent = secName;
    btn.title = `${i + 1}. ${title}`;
    btn.addEventListener('click', () => goTo(i));
    secbar.appendChild(btn);
    segButtons.push(btn);

    // Overview grid card
    const card = document.createElement('button');
    card.className = 'ov-item';
    card.innerHTML = `
      <span class="ov-num">${String(i + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')} · ${secName.replace(/^\d+\s*/, '')}</span>
      <span class="ov-title">${title}</span>
      <span class="ov-badge">${isPhoto ? 'Ecological photo backdrop' : 'Clean editorial data canvas'}</span>
    `;
    card.addEventListener('click', () => {
      closeOverview();
      goTo(i);
    });
    overviewGrid.appendChild(card);
    ovItems.push(card);
  });

  /* ========================================================================
     2. SLIDE NAVIGATION & HASH SYNC (#1 to #9)
     ======================================================================== */
  function parseHash() {
    const m = window.location.hash.match(/^#(\d+)$/);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= totalSlides) return n - 1;
    return 0;
  }

  function updateChrome(idx) {
    const slide = slides[idx];
    const isPhoto = slide.classList.contains('photo-slide');
    document.body.classList.toggle('theme-photo', isPhoto);

    hudCounter.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
    hudSecLabel.textContent = slide.dataset.section || '';

    segButtons.forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
      btn.classList.toggle('done', i < idx);
    });

    ovItems.forEach((item, i) => item.classList.toggle('current', i === idx));

    notesTitle.textContent = `${idx + 1}. ${slide.dataset.title || ''}`;
    notesText.textContent = slide.dataset.notes || 'No notes for this slide.';
  }

  function triggerSlideVisuals(idx, instant) {
    if (idx === 4) renderMCUNetArch(instant);
    if (idx === 5) renderTrackAChart(instant);
    if (idx === 6) renderTrackBCharts(instant);
  }

  function goTo(idx, opts = {}) {
    const target = Math.max(0, Math.min(totalSlides - 1, idx));
    const slide = slides[target];

    slides.forEach((s, i) => {
      if (i !== target) s.classList.remove('active');
    });

    // Force reflow so staggered CSS & gauge/bar animations replay cleanly
    slide.classList.remove('active');
    void slide.offsetWidth;
    slide.classList.add('active');

    currentIdx = target;
    updateChrome(target);

    if (!opts.skipHash) {
      const desiredHash = `#${target + 1}`;
      if (window.location.hash !== desiredHash) {
        history.replaceState(null, '', desiredHash);
      }
    }

    triggerSlideVisuals(target, isStatic);
  }

  function replayCurrent() {
    goTo(currentIdx, { skipHash: true });
  }

  /* ========================================================================
     3. CONTROLS, KEYBOARD, TOUCH & PRINT HOOKS
     ======================================================================== */
  function toggleNotes() {
    const shown = notesDrawer.classList.toggle('shown');
    document.getElementById('btn-notes').classList.toggle('is-active', shown);
  }

  function openOverview() {
    overviewModal.classList.add('shown');
    document.getElementById('btn-overview').classList.add('is-active');
  }

  function closeOverview() {
    overviewModal.classList.remove('shown');
    document.getElementById('btn-overview').classList.remove('is-active');
  }

  function toggleOverview() {
    if (overviewModal.classList.contains('shown')) closeOverview();
    else openOverview();
  }

  document.getElementById('btn-prev').addEventListener('click', () => goTo(currentIdx - 1));
  document.getElementById('btn-next').addEventListener('click', () => goTo(currentIdx + 1));
  document.getElementById('btn-replay').addEventListener('click', replayCurrent);
  document.getElementById('btn-overview').addEventListener('click', toggleOverview);
  document.getElementById('btn-close-overview').addEventListener('click', closeOverview);
  document.getElementById('btn-notes').addEventListener('click', toggleNotes);
  document.getElementById('btn-close-notes').addEventListener('click', toggleNotes);
  document.getElementById('btn-print').addEventListener('click', () => {
    renderAllVisualsStatic();
    window.print();
  });

  overviewModal.addEventListener('click', (e) => {
    if (e.target === overviewModal) closeOverview();
  });

  window.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.key === 'Escape') {
      closeOverview();
      notesDrawer.classList.remove('shown');
      document.getElementById('btn-notes').classList.remove('is-active');
      return;
    }

    if (overviewModal.classList.contains('shown')) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      goTo(currentIdx + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
      e.preventDefault();
      goTo(currentIdx - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(totalSlides - 1);
    } else if (e.key >= '1' && e.key <= String(totalSlides)) {
      goTo(parseInt(e.key, 10) - 1);
    } else if (e.key === 'o' || e.key === 'O') {
      toggleOverview();
    } else if (e.key === 'n' || e.key === 'N') {
      toggleNotes();
    } else if (e.key === 'r' || e.key === 'R') {
      replayCurrent();
    }
  });

  window.addEventListener('hashchange', () => {
    const idx = parseHash();
    if (idx !== currentIdx) goTo(idx, { skipHash: true });
  });

  // Touch swipe navigation
  let touchStartX = null;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 48) {
      if (dx < 0) goTo(currentIdx + 1);
      else goTo(currentIdx - 1);
    }
  }, { passive: true });

  // Ensure every chart & diagram renders completely before printing
  window.addEventListener('beforeprint', renderAllVisualsStatic);

  function renderAllVisualsStatic() {
    renderMCUNetArch(true);
    renderTrackAChart(true);
    renderTrackBCharts(true);
  }

  /* ========================================================================
     SVG HELPER & TOOLTIP POSITIONER
     ======================================================================== */
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs = {}, text = null) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      node.setAttribute(k, String(v));
    }
    if (text !== null) node.textContent = text;
    return node;
  }

  function showTooltip(tooltipEl, wrapEl, evt, html) {
    tooltipEl.innerHTML = html;
    tooltipEl.classList.add('visible');
    const wrapRect = wrapEl.getBoundingClientRect();
    const tipRect = tooltipEl.getBoundingClientRect();
    let left = evt.clientX - wrapRect.left + 12;
    let top = evt.clientY - wrapRect.top - tipRect.height - 10;
    if (left + tipRect.width > wrapRect.width - 8) {
      left = evt.clientX - wrapRect.left - tipRect.width - 12;
    }
    if (left < 6) left = 6;
    if (top < 6) top = evt.clientY - wrapRect.top + 14;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }

  function hideTooltip(tooltipEl) {
    tooltipEl.classList.remove('visible');
  }

  /* ========================================================================
     4. SLIDE 5 — EXACT ANIMATED MCUNET-IN3 ARCHITECTURE DIAGRAM
        Verified from megadetector_mcunet_in3_config.json (18 blocks, 11 skips)
     ======================================================================== */
  const MCUNET_BLOCKS = [
    { id: 0,  inC: 16, outC: 8,   k: 3, s: 1, exp: 1, res: '88×88', skip: false },
    { id: 1,  inC: 8,  outC: 16,  k: 7, s: 2, exp: 3, res: '44×44', skip: false },
    { id: 2,  inC: 16, outC: 16,  k: 3, s: 1, exp: 5, res: '44×44', skip: true  },
    { id: 3,  inC: 16, outC: 16,  k: 7, s: 1, exp: 5, res: '44×44', skip: true  },
    { id: 4,  inC: 16, outC: 16,  k: 5, s: 1, exp: 4, res: '44×44', skip: true  },
    { id: 5,  inC: 16, outC: 24,  k: 5, s: 2, exp: 5, res: '22×22', skip: false },
    { id: 6,  inC: 24, outC: 24,  k: 5, s: 1, exp: 5, res: '22×22', skip: true  },
    { id: 7,  inC: 24, outC: 24,  k: 5, s: 1, exp: 5, res: '22×22', skip: true  },
    { id: 8,  inC: 24, outC: 40,  k: 3, s: 2, exp: 5, res: '11×11', skip: false },
    { id: 9,  inC: 40, outC: 40,  k: 7, s: 1, exp: 6, res: '11×11', skip: true  },
    { id: 10, inC: 40, outC: 40,  k: 5, s: 1, exp: 4, res: '11×11', skip: true  },
    { id: 11, inC: 40, outC: 48,  k: 5, s: 1, exp: 5, res: '11×11', skip: false },
    { id: 12, inC: 48, outC: 48,  k: 7, s: 1, exp: 5, res: '11×11', skip: true  },
    { id: 13, inC: 48, outC: 48,  k: 3, s: 1, exp: 5, res: '11×11', skip: true  },
    { id: 14, inC: 48, outC: 96,  k: 3, s: 2, exp: 6, res: '6×6',   skip: false },
    { id: 15, inC: 96, outC: 96,  k: 7, s: 1, exp: 5, res: '6×6',   skip: true  },
    { id: 16, inC: 96, outC: 96,  k: 3, s: 1, exp: 4, res: '6×6',   skip: true  },
    { id: 17, inC: 96, outC: 160, k: 7, s: 1, exp: 5, res: '6×6',   skip: false }
  ];

  const KERNEL_COLORS = {
    3: '#52796f', // muted sage
    5: '#2d6a4f', // forest-mid
    7: '#1b4332'  // deep canopy pine
  };

  function renderMCUNetArch(instant = false) {
    const svg = document.getElementById('mcunet-svg');
    const wrap = document.getElementById('mcunet-wrap');
    const tip = document.getElementById('arch-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    // Defs: arrowheads
    const defs = el('defs');
    const addMarker = (id, color) => {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
      m.appendChild(el('path', { d: 'M 0 1 L 10 5 L 0 9 z', fill: color }));
      defs.appendChild(m);
    };
    addMarker('arr-forest', '#2d6a4f');
    addMarker('arr-amber', '#b45309');
    addMarker('arr-slate', '#355c7d');
    svg.appendChild(defs);

    const centerY = 178;

    // 1. INPUT TENSOR BOX
    const inG = el('g', { class: 'mcunet-block' });
    inG.appendChild(el('rect', { x: 10, y: centerY - 62, width: 92, height: 124, rx: 8, fill: '#f1f4f0', stroke: '#1b4332', 'stroke-width': 1.8 }));
    inG.appendChild(el('text', { x: 56, y: centerY - 34, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#1b4332' }, 'INPUT RGB'));
    inG.appendChild(el('text', { x: 56, y: centerY - 12, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 12.5, 'font-weight': 700, fill: '#16221c' }, '176×176×3'));
    inG.appendChild(el('rect', { x: 18, y: centerY + 4, width: 76, height: 22, rx: 4, fill: '#e5efe9' }));
    inG.appendChild(el('text', { x: 56, y: centerY + 18.5, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9.2, 'font-weight': 700, fill: '#1b4332' }, '[-1, +1]'));
    inG.appendChild(el('text', { x: 56, y: centerY + 42, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8.8, fill: '#5d6e65' }, 'INT8: px−128'));
    inG.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, '<strong>Input Tensor</strong><br/>176×176×3 RGB · scale = 1/127.5, zp = −1<br/>Zero-float MCU prep: <code>q = pixel − 128</code>'));
    inG.addEventListener('mouseleave', () => hideTooltip(tip));
    svg.appendChild(inG);

    // Connector Input -> Stem
    svg.appendChild(el('line', { x1: 102, y1: centerY, x2: 126, y2: centerY, class: instant ? '' : 'mcunet-pulse-line', stroke: '#2d6a4f', 'stroke-width': 2, 'marker-end': 'url(#arr-forest)' }));

    // 2. STEM: first_conv (3->16, 3x3, s=2)
    const stemG = el('g', { class: 'mcunet-block' });
    stemG.appendChild(el('rect', { x: 129, y: centerY - 52, width: 64, height: 104, rx: 7, fill: '#355c7d', stroke: '#233f57', 'stroke-width': 1.4 }));
    stemG.appendChild(el('text', { x: 161, y: centerY - 22, 'text-anchor': 'middle', 'font-size': 9.8, 'font-weight': 700, fill: '#d6e6f2' }, 'STEM'));
    stemG.appendChild(el('text', { x: 161, y: centerY - 4, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10, 'font-weight': 700, fill: '#ffffff' }, '3→16'));
    stemG.appendChild(el('text', { x: 161, y: centerY + 14, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9.5, fill: '#e8eff5' }, '3×3 s=2'));
    stemG.appendChild(el('text', { x: 161, y: centerY + 34, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8.5, fill: '#c6d7e6' }, '88×88'));
    stemG.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, '<strong>first_conv (Stem)</strong><br/>Conv2D 3 → 16 · k=3×3 · stride=2 · BN + ReLU6<br/>Output feature map: 88×88×16'));
    stemG.addEventListener('mouseleave', () => hideTooltip(tip));
    svg.appendChild(stemG);

    // Main backbone animated spine line behind the 18 MBConv blocks
    const startX = 212;
    const blockW = 31;
    const gapX = 9;
    const stepX = blockW + gapX; // 40px per block -> 18*40 = 720px -> ends at 923px
    svg.appendChild(el('line', {
      x1: 193, y1: centerY, x2: startX + 18 * stepX + 10, y2: centerY,
      class: instant ? '' : 'mcunet-pulse-line',
      stroke: '#2d6a4f', 'stroke-width': 2
    }));

    // Spatial Stage Groupings (bottom brackets)
    const stages = [
      { label: '88²·8c',        from: 0,  to: 0  },
      { label: '44×44 · 16ch',  from: 1,  to: 4  },
      { label: '22×22 · 24ch',  from: 5,  to: 7  },
      { label: '11×11 · 40→48', from: 8,  to: 13 },
      { label: '6×6 · 96→160',  from: 14, to: 17 }
    ];

    stages.forEach((st) => {
      const x1 = startX + st.from * stepX;
      const x2 = startX + st.to * stepX + blockW;
      const yB = 294;
      svg.appendChild(el('path', {
        d: `M ${x1} ${yB - 8} L ${x1} ${yB} L ${x2} ${yB} L ${x2} ${yB - 8}`,
        fill: 'none', stroke: '#b6c3ba', 'stroke-width': 1.4
      }));
      svg.appendChild(el('text', {
        x: (x1 + x2) / 2, y: yB + 15,
        'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace',
        'font-size': 9.8,
        'font-weight': 700,
        fill: '#5d6e65'
      }, st.label));
    });

    // Top annotation for 11 residual skips
    svg.appendChild(el('text', {
      x: startX + 9 * stepX, y: 24,
      'text-anchor': 'middle',
      'font-size': 10.5,
      'font-weight': 700,
      fill: '#b45309'
    }, '11 Residual Skip Connections (Identity ADD)'));

    // 3. ALL 18 MBInvertedConvLayer BLOCKS + 11 RESIDUAL SKIPS
    let skipCount = 0;
    MCUNET_BLOCKS.forEach((b, i) => {
      const x = startX + i * stepX;
      // Height scales smoothly with log(outC) from 64px to 156px
      const h = Math.round(52 + Math.log2(b.outC) * 14.2);
      const y = centerY - h / 2;
      const fill = KERNEL_COLORS[b.k];

      // Block group
      const g = el('g', { class: 'mcunet-block' });
      const rect = el('rect', {
        x, y, width: blockW, height: h, rx: 5,
        fill,
        stroke: b.s === 2 ? '#0f231a' : 'rgba(255,255,255,0.22)',
        'stroke-width': b.s === 2 ? 1.8 : 1
      });
      if (!instant) {
        rect.style.opacity = '0';
        rect.style.transition = `opacity 0.35s ease ${i * 32}ms`;
        requestAnimationFrame(() => { rect.style.opacity = '1'; });
      }
      g.appendChild(rect);

      // Kernel size badge inside block
      g.appendChild(el('text', {
        x: x + blockW / 2, y: centerY - 7,
        'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace',
        'font-size': 9.8, 'font-weight': 700, fill: '#ffffff'
      }, `${b.k}×${b.k}`));

      // Out channels
      g.appendChild(el('text', {
        x: x + blockW / 2, y: centerY + 9,
        'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace',
        'font-size': 8.6, fill: '#d6eadf'
      }, `${b.outC}c`));

      // Downsample indicator (s=2)
      if (b.s === 2) {
        g.appendChild(el('text', {
          x: x + blockW / 2, y: y + h - 6,
          'text-anchor': 'middle',
          'font-family': 'JetBrains Mono, monospace',
          'font-size': 7.8, 'font-weight': 700, fill: '#f5d093'
        }, 's2'));
      }

      // Block index underneath
      g.appendChild(el('text', {
        x: x + blockW / 2, y: y + h + 13,
        'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace',
        'font-size': 8.2, fill: '#5d6e65'
      }, `B${b.id}`));

      g.addEventListener('mousemove', (e) => {
        showTooltip(tip, wrap, e,
          `<strong>Block B${b.id} · MBInvertedConvLayer</strong><br/>` +
          `Channels: <code>${b.inC} → ${b.outC}</code> · Spatial: <code>${b.res}</code><br/>` +
          `DW Kernel: <code>${b.k}×${b.k}</code> · Stride: <code>${b.s}</code> · Expand: <code>${b.exp}×</code><br/>` +
          `Residual Skip: <strong>${b.skip ? 'Yes (Identity ADD)' : 'No'}</strong>`
        );
      });
      g.addEventListener('mouseleave', () => hideTooltip(tip));
      svg.appendChild(g);

      // Residual shortcut arc above block
      if (b.skip) {
        skipCount++;
        const arcTop = Math.min(y - 26, 48 + (skipCount % 2) * 10);
        const sx = x - 4;
        const ex = x + blockW + 4;
        const path = el('path', {
          d: `M ${sx} ${y + 12} C ${sx} ${arcTop}, ${ex} ${arcTop}, ${ex} ${y + 12}`,
          class: 'mcunet-skip',
          'marker-end': 'url(#arr-amber)'
        });
        path.style.setProperty('--skip-delay', `${260 + skipCount * 65}ms`);
        if (instant) {
          path.style.strokeDashoffset = '0';
          path.style.animation = 'none';
        }
        svg.appendChild(path);
      }
    });

    // 4. GLOBAL AVERAGE POOLING (160-D)
    const poolX = startX + 18 * stepX + 14; // ~946
    const gapG = el('g', { class: 'mcunet-block' });
    gapG.appendChild(el('rect', { x: poolX, y: centerY - 56, width: 64, height: 112, rx: 8, fill: '#eceee9', stroke: '#52796f', 'stroke-width': 1.8 }));
    gapG.appendChild(el('text', { x: poolX + 32, y: centerY - 18, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#1b4332' }, 'GLOBAL'));
    gapG.appendChild(el('text', { x: poolX + 32, y: centerY - 4, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#1b4332' }, 'AVG POOL'));
    gapG.appendChild(el('text', { x: poolX + 32, y: centerY + 18, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 11, 'font-weight': 700, fill: '#16221c' }, '160-D'));
    gapG.appendChild(el('text', { x: poolX + 32, y: centerY + 34, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8.5, fill: '#5d6e65' }, '6×6→1×1'));
    gapG.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, '<strong>Global Average Pooling</strong><br/>Reduces <code>6×6×160</code> feature tensor → <code>160-D</code> embedding'));
    gapG.addEventListener('mouseleave', () => hideTooltip(tip));
    svg.appendChild(gapG);

    // 5. DUAL CLASSIFICATION HEADS (FORK)
    const headX = poolX + 94; // ~1040
    // Upper fork arrow -> Track A
    svg.appendChild(el('path', {
      d: `M ${poolX + 64} ${centerY - 14} C ${poolX + 78} ${centerY - 14}, ${poolX + 78} ${centerY - 68}, ${headX - 4} ${centerY - 68}`,
      class: instant ? '' : 'mcunet-pulse-line',
      stroke: '#52796f', 'stroke-width': 2, fill: 'none', 'marker-end': 'url(#arr-forest)'
    }));
    // Lower fork arrow -> Track B
    svg.appendChild(el('path', {
      d: `M ${poolX + 64} ${centerY + 14} C ${poolX + 78} ${centerY + 14}, ${poolX + 78} ${centerY + 68}, ${headX - 4} ${centerY + 68}`,
      class: instant ? '' : 'mcunet-pulse-line',
      stroke: '#1b4332', 'stroke-width': 2, fill: 'none', 'marker-end': 'url(#arr-forest)'
    }));

    // Track A Head Card
    const headA = el('g', { class: 'mcunet-block' });
    headA.appendChild(el('rect', { x: headX, y: centerY - 110, width: 170, height: 84, rx: 9, fill: '#e5efe9', stroke: '#52796f', 'stroke-width': 1.8 }));
    headA.appendChild(el('text', { x: headX + 12, y: centerY - 88, 'font-size': 9.8, 'font-weight': 800, fill: '#52796f' }, 'TRACK A · LINEARLAYER'));
    headA.appendChild(el('text', { x: headX + 12, y: centerY - 68, 'font-family': 'JetBrains Mono, monospace', 'font-size': 12.2, 'font-weight': 700, fill: '#16221c' }, '160 → 2 Classes'));
    headA.appendChild(el('text', { x: headX + 12, y: centerY - 50, 'font-size': 9.6, fill: '#2d3d35' }, 'bird · not_bird'));
    headA.appendChild(el('text', { x: headX + 12, y: centerY - 34, 'font-family': 'JetBrains Mono, monospace', 'font-size': 9, fill: '#5d6e65' }, '576,730 params · 785.9 KB'));
    headA.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, '<strong>Track A Classification Head</strong><br/>MCUNet custom <code>LinearLayer(160 → 2)</code><br/>Preserves <code>model.config</code> serialization · 576,730 total params'));
    headA.addEventListener('mouseleave', () => hideTooltip(tip));
    svg.appendChild(headA);

    // Track B Head Card
    const headB = el('g', { class: 'mcunet-block' });
    headB.appendChild(el('rect', { x: headX, y: centerY + 26, width: 170, height: 88, rx: 9, fill: '#1b4332', stroke: '#122e22', 'stroke-width': 1.8 }));
    headB.appendChild(el('text', { x: headX + 12, y: centerY + 48, 'font-size': 9.8, 'font-weight': 800, fill: '#a9d6bc' }, 'TRACK B · LINEARLAYER'));
    headB.appendChild(el('text', { x: headX + 12, y: centerY + 68, 'font-family': 'JetBrains Mono, monospace', 'font-size': 12.2, 'font-weight': 700, fill: '#ffffff' }, 'Drop(0.25) · 160→4'));
    headB.appendChild(el('text', { x: headX + 12, y: centerY + 86, 'font-size': 9.3, fill: '#dceae2' }, 'animal · empty · person · veh'));
    headB.appendChild(el('text', { x: headX + 12, y: centerY + 103, 'font-family': 'JetBrains Mono, monospace', 'font-size': 9, fill: '#a9d6bc' }, '577,052 params · 786 KB'));
    headB.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, '<strong>Track B Classification Head</strong><br/>MCUNet <code>LinearLayer(160 → 4, dropout=0.25)</code><br/>Preserves <code>model.config</code> · 577,052 total params'));
    headB.addEventListener('mouseleave', () => hideTooltip(tip));
    svg.appendChild(headB);
  }

  /* ========================================================================
     5. SLIDE 6 — ANIMATED TRACK A LEARNING CURVE vs. UNSEEN OOD BENCHMARK
        Exact verified data from Track A Training Pipeline PDF
     ======================================================================== */
  const TRACK_A_EPOCHS = [
    { ep: 1, trAcc: 79.5, valAcc: 82.6,  trLoss: 0.419, valLoss: 0.370 },
    { ep: 2, trAcc: 82.8, valAcc: 83.8,  trLoss: 0.361, valLoss: 0.335 },
    { ep: 3, trAcc: 84.2, valAcc: 83.4,  trLoss: 0.337, valLoss: 0.357 },
    { ep: 4, trAcc: 85.2, valAcc: 84.1,  trLoss: 0.323, valLoss: 0.331 },
    { ep: 5, trAcc: 85.3, valAcc: 84.9,  trLoss: 0.312, valLoss: 0.328 },
    { ep: 6, trAcc: 85.9, valAcc: 85.45, trLoss: 0.305, valLoss: 0.3241 },
    { ep: 7, trAcc: 86.2, valAcc: 85.4,  trLoss: 0.294, valLoss: 0.329 },
    { ep: 8, trAcc: 86.7, valAcc: 85.3,  trLoss: 0.288, valLoss: 0.329 }
  ];

  function renderTrackAChart(instant = false) {
    const svg = document.getElementById('tracka-chart-svg');
    const wrap = document.getElementById('tracka-chart-wrap');
    const tip = document.getElementById('tracka-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const pad = { top: 26, right: 32, bottom: 42, left: 52 };
    const W = 620, H = 285;
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;

    const minY = 60, maxY = 92;
    const xScale = (ep) => pad.left + ((ep - 1) / 7) * innerW;
    const yScale = (val) => pad.top + innerH - ((val - minY) / (maxY - minY)) * innerH;

    // Horizontal grid lines
    [60, 65, 70, 75, 80, 85, 90].forEach((tick) => {
      const y = yScale(tick);
      svg.appendChild(el('line', { x1: pad.left, y1: y, x2: W - pad.right, y2: y, stroke: '#e4eae5', 'stroke-width': 1 }));
      svg.appendChild(el('text', {
        x: pad.left - 8, y: y + 4, 'text-anchor': 'end',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, fill: '#5d6e65'
      }, `${tick}%`));
    });

    // X axis labels
    TRACK_A_EPOCHS.forEach((d) => {
      const x = xScale(d.ep);
      svg.appendChild(el('text', {
        x, y: H - pad.bottom + 18, 'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5,
        'font-weight': d.ep === 6 ? 700 : 500,
        fill: d.ep === 6 ? '#1b4332' : '#5d6e65'
      }, `Ep ${d.ep}`));
    });

    svg.appendChild(el('text', {
      x: pad.left + innerW / 2, y: H - 6, 'text-anchor': 'middle',
      'font-size': 10.5, 'font-weight': 600, fill: '#5d6e65'
    }, 'Training Epoch (Best Checkpoint Saved at Epoch 6)'));

    // Unseen OOD Test Reference Line (66.39%)
    const yTest = yScale(66.39);
    svg.appendChild(el('rect', { x: pad.left, y: yTest, width: innerW, height: yScale(60) - yTest, fill: 'rgba(184, 66, 43, 0.06)' }));
    svg.appendChild(el('line', {
      x1: pad.left, y1: yTest, x2: W - pad.right, y2: yTest,
      stroke: '#b8422b', 'stroke-width': 2.2, 'stroke-dasharray': '7 5'
    }));
    svg.appendChild(el('text', {
      x: pad.left + 8, y: yTest - 6,
      'font-family': 'JetBrains Mono, monospace', 'font-size': 11, 'font-weight': 700, fill: '#b8422b'
    }, 'Unseen 4-Dataset OOD Test (FP32): 66.39%'));

    // Vertical Domain Shift Arrow at Epoch 6
    const xBest = xScale(6);
    const yBest = yScale(85.45);
    svg.appendChild(el('line', {
      x1: xBest, y1: yBest + 7, x2: xBest, y2: yTest - 4,
      stroke: '#b8422b', 'stroke-width': 1.6, 'stroke-dasharray': '3 3'
    }));
    svg.appendChild(el('rect', { x: xBest - 46, y: (yBest + yTest) / 2 - 11, width: 92, height: 22, rx: 5, fill: '#fbece8', stroke: '#ecc0b6' }));
    svg.appendChild(el('text', {
      x: xBest, y: (yBest + yTest) / 2 + 4, 'text-anchor': 'middle',
      'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, 'font-weight': 700, fill: '#b8422b'
    }, '−19.06 pp'));

    // Helper for animated polyline
    const drawCurve = (vals, color, dashed = false, delayMs = 0) => {
      const dStr = vals.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.ep)} ${yScale(p.y)}`).join(' ');
      const path = el('path', {
        d: dStr, fill: 'none', stroke: color,
        'stroke-width': dashed ? 2.2 : 3,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      if (dashed) path.setAttribute('stroke-dasharray', '6 4');
      svg.appendChild(path);

      if (!instant && !dashed) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;
        path.style.transition = `stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1) ${delayMs}ms`;
        requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
      }
    };

    drawCurve(TRACK_A_EPOCHS.map(d => ({ ep: d.ep, y: d.trAcc })), '#52796f', true, 50);
    drawCurve(TRACK_A_EPOCHS.map(d => ({ ep: d.ep, y: d.valAcc })), '#1b4332', false, 120);

    // Best Epoch 6 Halo
    svg.appendChild(el('circle', { cx: xBest, cy: yBest, r: 10, fill: 'rgba(27,67,50,0.16)' }));

    // Interactive Data Points
    TRACK_A_EPOCHS.forEach((d) => {
      const x = xScale(d.ep);
      const yTr = yScale(d.trAcc);
      const yVal = yScale(d.valAcc);

      const dotTr = el('circle', { cx: x, cy: yTr, r: 3.6, fill: '#ffffff', stroke: '#52796f', 'stroke-width': 2, style: 'cursor:pointer;' });
      const dotVal = el('circle', { cx: x, cy: yVal, r: d.ep === 6 ? 5.5 : 4.2, fill: d.ep === 6 ? '#1b4332' : '#ffffff', stroke: '#1b4332', 'stroke-width': 2.2, style: 'cursor:pointer;' });

      const tipHtml = `<strong>Epoch ${d.ep}${d.ep === 6 ? ' (Best Saved)' : ''}</strong><br/>` +
        `Val Acc: <code>${d.valAcc.toFixed(d.ep === 6 ? 2 : 1)}%</code> · Val Loss: <code>${d.valLoss}</code><br/>` +
        `Train Acc: <code>${d.trAcc.toFixed(1)}%</code> · Train Loss: <code>${d.trLoss}</code>`;

      [dotTr, dotVal].forEach((dot) => {
        dot.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, tipHtml));
        dot.addEventListener('mouseleave', () => hideTooltip(tip));
      });

      svg.appendChild(dotTr);
      svg.appendChild(dotVal);
    });

    // Best Val Label
    svg.appendChild(el('text', {
      x: xBest, y: yBest - 13, 'text-anchor': 'middle',
      'font-family': 'JetBrains Mono, monospace', 'font-size': 11, 'font-weight': 700, fill: '#1b4332'
    }, 'Best Val 85.45%'));

    // Top Legend
    const leg = el('g', { transform: `translate(${pad.left + 4}, 10)` });
    leg.appendChild(el('line', { x1: 0, y1: 4, x2: 18, y2: 4, stroke: '#1b4332', 'stroke-width': 3 }));
    leg.appendChild(el('text', { x: 24, y: 8, 'font-size': 10.5, 'font-weight': 700, fill: '#1b4332' }, 'Val Acc (Unseen Locs)'));
    leg.appendChild(el('line', { x1: 165, y1: 4, x2: 183, y2: 4, stroke: '#52796f', 'stroke-width': 2.2, 'stroke-dasharray': '5 3' }));
    leg.appendChild(el('text', { x: 189, y: 8, 'font-size': 10.5, 'font-weight': 600, fill: '#52796f' }, 'Train Acc'));
    svg.appendChild(leg);
  }

  /* ========================================================================
     6. SLIDE 7 — 3 ANIMATED TRACK B CHARTS (F1, Source Acc, Error Donut)
        Exact verified data from outputs/test_predictions.csv (66,027 imgs)
     ======================================================================== */
  function renderTrackBCharts(instant = false) {
    renderTrackBF1(instant);
    renderTrackBSources(instant);
    renderTrackBErrors(instant);
  }

  function renderTrackBF1(instant) {
    const svg = document.getElementById('trackb-f1-svg');
    const wrap = document.getElementById('trackb-f1-wrap');
    const tip = document.getElementById('trackb-f1-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const data = [
      { cls: 'vehicle', f1: 0.948, p: '94.9%', r: '94.8%', n: '1,848',  color: '#1b4332' },
      { cls: 'person',  f1: 0.936, p: '90.6%', r: '96.9%', n: '4,268',  color: '#2d6a4f' },
      { cls: 'animal',  f1: 0.905, p: '89.9%', r: '91.2%', n: '39,035', color: '#52796f' },
      { cls: 'empty',   f1: 0.828, p: '84.6%', r: '81.1%', n: '20,876', color: '#b45309' }
    ];

    const pad = { top: 22, right: 16, bottom: 32, left: 38 };
    const W = 340, H = 215;
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const minY = 0.65, maxY = 1.0;
    const yScale = (v) => pad.top + innerH - ((v - minY) / (maxY - minY)) * innerH;

    [0.7, 0.8, 0.9, 1.0].forEach((t) => {
      const y = yScale(t);
      svg.appendChild(el('line', { x1: pad.left, y1: y, x2: W - pad.right, y2: y, stroke: '#e6ebe7', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: pad.left - 6, y: y + 3.5, 'text-anchor': 'end', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9.5, fill: '#5d6e65' }, t.toFixed(1)));
    });

    // Macro-F1 reference line (0.905)
    const yMacro = yScale(0.905);
    svg.appendChild(el('line', { x1: pad.left, y1: yMacro, x2: W - pad.right, y2: yMacro, stroke: '#355c7d', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }));

    const colW = innerW / data.length;
    const barW = 42;

    data.forEach((d, i) => {
      const x = pad.left + i * colW + (colW - barW) / 2;
      const targetY = yScale(d.f1);
      const targetH = yScale(minY) - targetY;

      const rect = el('rect', {
        x, y: instant ? targetY : yScale(minY),
        width: barW, height: instant ? targetH : 0,
        rx: 5, fill: d.color, style: 'cursor:pointer;'
      });

      if (!instant) {
        rect.style.transition = `y 0.75s cubic-bezier(0.22,1,0.36,1) ${i * 95}ms, height 0.75s cubic-bezier(0.22,1,0.36,1) ${i * 95}ms`;
        requestAnimationFrame(() => {
          rect.setAttribute('y', targetY);
          rect.setAttribute('height', targetH);
        });
      }

      const html = `<strong>${d.cls}</strong> (n = ${d.n})<br/>F1: <code>${d.f1.toFixed(3)}</code> · Prec: <code>${d.p}</code> · Rec: <code>${d.r}</code>`;
      rect.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, html));
      rect.addEventListener('mouseleave', () => hideTooltip(tip));
      svg.appendChild(rect);

      svg.appendChild(el('text', {
        x: x + barW / 2, y: targetY - 6, 'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, 'font-weight': 700, fill: d.color
      }, d.f1.toFixed(3)));

      svg.appendChild(el('text', {
        x: x + barW / 2, y: H - 10, 'text-anchor': 'middle',
        'font-size': 10.5, 'font-weight': 700, fill: '#2d3d35'
      }, d.cls));
    });
  }

  function renderTrackBSources(instant) {
    const svg = document.getElementById('trackb-src-svg');
    const wrap = document.getElementById('trackb-src-wrap');
    const tip = document.getElementById('trackb-src-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const data = [
      { src: 'COCO 2017', acc: 94.5, n: '5,724',  color: '#1b4332' },
      { src: 'CCT',       acc: 92.1, n: '18,121', color: '#2d6a4f' },
      { src: 'ImageNet',  acc: 91.0, n: '2,182',  color: '#52796f' },
      { src: 'WCS',       acc: 85.8, n: '40,000', color: '#b45309' }
    ];

    const pad = { top: 22, right: 44, bottom: 26, left: 74 };
    const W = 340, H = 215;
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const minX = 75, maxX = 100;
    const xScale = (v) => pad.left + ((v - minX) / (maxX - minX)) * innerW;

    [75, 80, 85, 90, 95, 100].forEach((t) => {
      const x = xScale(t);
      svg.appendChild(el('line', { x1: x, y1: pad.top, x2: x, y2: H - pad.bottom, stroke: '#e6ebe7', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x, y: H - 9, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9.2, fill: '#5d6e65' }, `${t}%`));
    });

    // Global Test Acc Reference Line (88.47%)
    const xAvg = xScale(88.47);
    svg.appendChild(el('line', { x1: xAvg, y1: pad.top - 4, x2: xAvg, y2: H - pad.bottom, stroke: '#355c7d', 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }));
    svg.appendChild(el('text', { x: xAvg, y: 12, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9, 'font-weight': 700, fill: '#355c7d' }, 'Avg 88.5%'));

    const rowH = innerH / data.length;
    const barH = 24;

    data.forEach((d, i) => {
      const y = pad.top + i * rowH + (rowH - barH) / 2;
      const targetW = Math.max(4, xScale(d.acc) - pad.left);

      svg.appendChild(el('text', {
        x: pad.left - 8, y: y + barH / 2 + 4, 'text-anchor': 'end',
        'font-size': 10.5, 'font-weight': 700, fill: '#2d3d35'
      }, d.src));

      const rect = el('rect', {
        x: pad.left, y, width: instant ? targetW : 0, height: barH,
        rx: 5, fill: d.color, style: 'cursor:pointer;'
      });

      if (!instant) {
        rect.style.transition = `width 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 100}ms`;
        requestAnimationFrame(() => { rect.setAttribute('width', targetW); });
      }

      const html = `<strong>${d.src}</strong><br/>Test Accuracy: <code>${d.acc.toFixed(1)}%</code> · Test N: <code>${d.n}</code>`;
      rect.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, html));
      rect.addEventListener('mouseleave', () => hideTooltip(tip));
      svg.appendChild(rect);

      svg.appendChild(el('text', {
        x: pad.left + targetW - 8, y: y + barH / 2 + 3.8,
        'text-anchor': 'end',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, 'font-weight': 700,
        fill: '#ffffff'
      }, `${d.acc.toFixed(1)}%`));
    });
  }

  function renderTrackBErrors(instant) {
    const svg = document.getElementById('trackb-err-svg');
    const wrap = document.getElementById('trackb-err-wrap');
    const tip = document.getElementById('trackb-err-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const cx = 104, cy = 108, r = 64;
    const circ = 2 * Math.PI * r;
    const slices = [
      { label: 'empty → animal', count: 3934, pct: 51.66, color: '#b45309' },
      { label: 'animal → empty', count: 3060, pct: 40.18, color: '#d97706' },
      { label: 'All other 10 pairs', count: 621, pct: 8.16, color: '#52796f' }
    ];

    // Track ring
    svg.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: '#eceee9', 'stroke-width': 22 }));

    let offsetPct = 0;
    slices.forEach((s, i) => {
      const segLen = (s.pct / 100) * circ;
      const rot = -90 + (offsetPct / 100) * 360;
      const circle = el('circle', {
        cx, cy, r, fill: 'none', stroke: s.color, 'stroke-width': 22,
        'stroke-dasharray': `${instant ? segLen : 0} ${circ}`,
        transform: `rotate(${rot} ${cx} ${cy})`,
        style: 'cursor:pointer;'
      });

      if (!instant) {
        circle.style.transition = `stroke-dasharray 0.85s cubic-bezier(0.22,1,0.36,1) ${i * 120}ms`;
        requestAnimationFrame(() => { circle.setAttribute('stroke-dasharray', `${segLen} ${circ}`); });
      }

      circle.addEventListener('mousemove', (e) => {
        showTooltip(tip, wrap, e, `<strong>${s.label}</strong><br/><code>${s.count.toLocaleString()}</code> / 7,615 errors (<code>${s.pct.toFixed(1)}%</code>)`);
      });
      circle.addEventListener('mouseleave', () => hideTooltip(tip));
      svg.appendChild(circle);
      offsetPct += s.pct;
    });

    // Center Callout
    svg.appendChild(el('text', { x: cx, y: cy - 3, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 20, 'font-weight': 800, fill: '#b45309' }, '91.8%'));
    svg.appendChild(el('text', { x: cx, y: cy + 14, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 700, fill: '#2d3d35' }, 'animal ↔ empty'));
    svg.appendChild(el('text', { x: cx, y: cy + 27, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8.5, fill: '#5d6e65' }, '6,994 / 7,615'));

    // Right-side clean legend
    const legX = 192;
    slices.forEach((s, i) => {
      const y = 62 + i * 44;
      svg.appendChild(el('rect', { x: legX, y: y - 9, width: 11, height: 11, rx: 3, fill: s.color }));
      svg.appendChild(el('text', { x: legX + 17, y: y, 'font-size': 10.2, 'font-weight': 700, fill: '#16221c' }, s.label));
      svg.appendChild(el('text', { x: legX + 17, y: y + 14, 'font-family': 'JetBrains Mono, monospace', 'font-size': 9.5, fill: '#5d6e65' }, `${s.count.toLocaleString()} (${s.pct.toFixed(1)}%)`));
    });
  }

  /* ========================================================================
     7. BOOTSTRAP
     ======================================================================== */
  // Pre-render charts once if static or print, then navigate to initial hash slide
  if (isStatic) renderAllVisualsStatic();
  goTo(parseHash(), { skipHash: false });
})();
