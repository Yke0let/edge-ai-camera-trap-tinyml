/* ==========================================================================
   TinyML MegaDetector — Interactive 9-Slide Deck Controller
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

    const btn = document.createElement('button');
    btn.className = 'sec-seg';
    btn.textContent = secName;
    btn.title = `${i + 1}. ${title}`;
    btn.addEventListener('click', () => goTo(i));
    secbar.appendChild(btn);
    segButtons.push(btn);

    const card = document.createElement('button');
    card.className = 'ov-item';
    card.innerHTML = `
      <span class="ov-num">${String(i + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')} · ${secName.replace(/^\d+\s*/, '')}</span>
      <span class="ov-title">${title}</span>
      <span class="ov-badge">${isPhoto ? 'Ecological photo backdrop' : 'Clean editorial canvas'}</span>
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
    if (idx === 1) renderPivotChart(instant);
    if (idx === 4) renderMCUNetArch(instant);
    if (idx === 5) renderTrainingCurve(instant);
    if (idx === 6) {
      renderTrackBF1(instant);
      renderTrackBSources(instant);
    }
    if (idx === 7) renderTrackBErrors(instant);
  }

  function goTo(idx, opts = {}) {
    const target = Math.max(0, Math.min(totalSlides - 1, idx));
    const slide = slides[target];

    slides.forEach((s, i) => {
      if (i !== target) s.classList.remove('active');
    });

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
    } else if (e.key >= '1' && e.key <= '9') {
      goTo(parseInt(e.key, 10) - 1);
    } else if (e.key === '0') {
      goTo(9);
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

  window.addEventListener('beforeprint', renderAllVisualsStatic);

  function renderAllVisualsStatic() {
    renderPivotChart(true);
    renderMCUNetArch(true);
    renderTrainingCurve(true);
    renderTrackBF1(true);
    renderTrackBSources(true);
    renderTrackBErrors(true);
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
     4. SLIDE 2 — ANIMATED BIRD PILOT vs. 4-CLASS PIVOT CHART
     ======================================================================== */
  function renderPivotChart(instant = false) {
    const svg = document.getElementById('pivot-chart-svg');
    const wrap = document.getElementById('pivot-chart-wrap');
    const tip = document.getElementById('pivot-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const data = [
      { label: 'Bird Recall',   sub: 'Pilot OOD',  val: 45.0,  color: '#b8422b', detail: '1,439 / 3,200 birds found (1,761 missed = 82% of errors)' },
      { label: 'Pilot Test',    sub: 'Bird vs Not', val: 66.39, color: '#b45309', detail: '66.39% on 6,400 unseen images (Val was 85.45%)' },
      { label: '4-Class Acc',   sub: 'Final Test',  val: 88.47, color: '#2d6a4f', detail: '88.47% FP32 accuracy across 66,027 held-out test images' },
      { label: 'Macro-F1',      sub: 'Final Test',  val: 90.5,  color: '#1b4332', detail: '0.905 Macro-F1 across animal / empty / person / vehicle' }
    ];

    const pad = { top: 36, right: 20, bottom: 52, left: 46 };
    const W = 500, H = 310;
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const yScale = (v) => pad.top + innerH - (v / 100) * innerH;

    // Gridlines
    [0, 25, 50, 75, 100].forEach((t) => {
      const y = yScale(t);
      svg.appendChild(el('line', { x1: pad.left, y1: y, x2: W - pad.right, y2: y, stroke: '#e5ebe6', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: pad.left - 8, y: y + 4, 'text-anchor': 'end', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, fill: '#5d6e65' }, `${t}%`));
    });

    // Divider between Pilot and Final Pivot
    const midX = pad.left + innerW / 2;
    svg.appendChild(el('line', { x1: midX, y1: 12, x2: midX, y2: H - pad.bottom + 8, stroke: '#cbd5ce', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }));
    svg.appendChild(el('text', { x: pad.left + innerW * 0.25, y: 18, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: '#b8422b' }, 'INITIAL BIRD PILOT'));
    svg.appendChild(el('text', { x: pad.left + innerW * 0.75, y: 18, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: '#1b4332' }, 'FINAL 4-CLASS PIVOT'));

    const colW = innerW / data.length;
    const barW = 62;

    data.forEach((d, i) => {
      const x = pad.left + i * colW + (colW - barW) / 2;
      const targetY = yScale(d.val);
      const targetH = yScale(0) - targetY;

      const rect = el('rect', {
        x, y: instant ? targetY : yScale(0),
        width: barW, height: instant ? targetH : 0,
        rx: 7, fill: d.color, style: 'cursor:pointer;'
      });

      if (!instant) {
        rect.style.transition = `y 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 105}ms, height 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 105}ms`;
        requestAnimationFrame(() => {
          rect.setAttribute('y', targetY);
          rect.setAttribute('height', targetH);
        });
      }

      rect.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, `<strong>${d.label} (${d.sub})</strong><br/>${d.detail}`));
      rect.addEventListener('mouseleave', () => hideTooltip(tip));
      svg.appendChild(rect);

      svg.appendChild(el('text', {
        x: x + barW / 2, y: targetY - 8, 'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 12.5, 'font-weight': 700, fill: d.color
      }, d.label === 'Macro-F1' ? '0.905' : `${d.val.toFixed(d.val % 1 === 0 ? 1 : 2)}%`));

      svg.appendChild(el('text', {
        x: x + barW / 2, y: H - 26, 'text-anchor': 'middle',
        'font-size': 11.5, 'font-weight': 700, fill: '#16221c'
      }, d.label));

      svg.appendChild(el('text', {
        x: x + barW / 2, y: H - 10, 'text-anchor': 'middle',
        'font-size': 10, fill: '#5d6e65'
      }, d.sub));
    });
  }

  /* ========================================================================
     5. SLIDE 5 — CLEAN SINGLE-HEAD MCUNET-IN3 ARCHITECTURE SVG
        Exact verified topology from megadetector_mcunet_in3_config.json
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

  const KERNEL_COLORS = { 3: '#52796f', 5: '#2d6a4f', 7: '#1b4332' };

  function renderMCUNetArch(instant = false) {
    const svg = document.getElementById('mcunet-svg');
    const wrap = document.getElementById('mcunet-wrap');
    const tip = document.getElementById('arch-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const defs = el('defs');
    const addMarker = (id, color) => {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
      m.appendChild(el('path', { d: 'M 0 1 L 10 5 L 0 9 z', fill: color }));
      defs.appendChild(m);
    };
    addMarker('arr-forest', '#2d6a4f');
    addMarker('arr-amber', '#b45309');
    svg.appendChild(defs);

    const centerY = 175;

    // 1. INPUT RGB
    const inG = el('g', { class: 'mcunet-block' });
    inG.appendChild(el('rect', { x: 10, y: centerY - 62, width: 92, height: 124, rx: 9, fill: '#f1f4f0', stroke: '#1b4332', 'stroke-width': 1.8 }));
    inG.appendChild(el('text', { x: 56, y: centerY - 33, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#1b4332' }, 'INPUT RGB'));
    inG.appendChild(el('text', { x: 56, y: centerY - 11, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 12.5, 'font-weight': 700, fill: '#16221c' }, '176×176×3'));
    inG.appendChild(el('rect', { x: 18, y: centerY + 5, width: 76, height: 22, rx: 4, fill: '#e5efe9' }));
    inG.appendChild(el('text', { x: 56, y: centerY + 19.5, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9.4, 'font-weight': 700, fill: '#1b4332' }, '[-1, +1]'));
    inG.appendChild(el('text', { x: 56, y: centerY + 43, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9, fill: '#5d6e65' }, 'INT8: px−128'));
    inG.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, '<strong>Input Tensor</strong><br/>176×176×3 RGB · scale = 1/127.5, zp = −1<br/>Zero-float MCU prep: <code>q = pixel − 128</code>'));
    inG.addEventListener('mouseleave', () => hideTooltip(tip));
    svg.appendChild(inG);

    svg.appendChild(el('line', { x1: 102, y1: centerY, x2: 126, y2: centerY, class: instant ? '' : 'mcunet-pulse-line', stroke: '#2d6a4f', 'stroke-width': 2.2, 'marker-end': 'url(#arr-forest)' }));

    // 2. STEM: first_conv
    const stemG = el('g', { class: 'mcunet-block' });
    stemG.appendChild(el('rect', { x: 129, y: centerY - 54, width: 64, height: 108, rx: 8, fill: '#355c7d', stroke: '#233f57', 'stroke-width': 1.4 }));
    stemG.appendChild(el('text', { x: 161, y: centerY - 22, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#d6e6f2' }, 'STEM'));
    stemG.appendChild(el('text', { x: 161, y: centerY - 3, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, 'font-weight': 700, fill: '#ffffff' }, '3→16'));
    stemG.appendChild(el('text', { x: 161, y: centerY + 15, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9.8, fill: '#e8eff5' }, '3×3 s=2'));
    stemG.appendChild(el('text', { x: 161, y: centerY + 35, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8.8, fill: '#c6d7e6' }, '88×88'));
    stemG.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, '<strong>first_conv (Stem)</strong><br/>Conv2D 3 → 16 · k=3×3 · stride=2 · BN + ReLU6'));
    stemG.addEventListener('mouseleave', () => hideTooltip(tip));
    svg.appendChild(stemG);

    const startX = 212;
    const blockW = 31;
    const gapX = 9;
    const stepX = blockW + gapX;

    svg.appendChild(el('line', {
      x1: 193, y1: centerY, x2: startX + 18 * stepX + 10, y2: centerY,
      class: instant ? '' : 'mcunet-pulse-line', stroke: '#2d6a4f', 'stroke-width': 2.2
    }));

    // Spatial Stage Groupings
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
      svg.appendChild(el('path', { d: `M ${x1} ${yB - 8} L ${x1} ${yB} L ${x2} ${yB} L ${x2} ${yB - 8}`, fill: 'none', stroke: '#b6c3ba', 'stroke-width': 1.4 }));
      svg.appendChild(el('text', {
        x: (x1 + x2) / 2, y: yB + 16, 'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 10, 'font-weight': 700, fill: '#5d6e65'
      }, st.label));
    });

    svg.appendChild(el('text', {
      x: startX + 9 * stepX, y: 22, 'text-anchor': 'middle',
      'font-size': 11, 'font-weight': 700, fill: '#b45309'
    }, '11 Residual Skip Connections (Identity ADD)'));

    // 3. 18 MBInvertedConvLayer BLOCKS
    let skipCount = 0;
    MCUNET_BLOCKS.forEach((b, i) => {
      const x = startX + i * stepX;
      const h = Math.round(52 + Math.log2(b.outC) * 14.2);
      const y = centerY - h / 2;
      const fill = KERNEL_COLORS[b.k];

      const g = el('g', { class: 'mcunet-block' });
      const rect = el('rect', {
        x, y, width: blockW, height: h, rx: 5, fill,
        stroke: b.s === 2 ? '#0f231a' : 'rgba(255,255,255,0.22)',
        'stroke-width': b.s === 2 ? 1.8 : 1
      });
      if (!instant) {
        rect.style.opacity = '0';
        rect.style.transition = `opacity 0.35s ease ${i * 30}ms`;
        requestAnimationFrame(() => { rect.style.opacity = '1'; });
      }
      g.appendChild(rect);

      g.appendChild(el('text', { x: x + blockW / 2, y: centerY - 6, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9.8, 'font-weight': 700, fill: '#ffffff' }, `${b.k}×${b.k}`));
      g.appendChild(el('text', { x: x + blockW / 2, y: centerY + 10, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8.8, fill: '#d6eadf' }, `${b.outC}c`));
      if (b.s === 2) {
        g.appendChild(el('text', { x: x + blockW / 2, y: y + h - 6, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8, 'font-weight': 700, fill: '#f5d093' }, 's2'));
      }
      g.appendChild(el('text', { x: x + blockW / 2, y: y + h + 14, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8.4, fill: '#5d6e65' }, `B${b.id}`));

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

      if (b.skip) {
        skipCount++;
        const arcTop = Math.min(y - 26, 46 + (skipCount % 2) * 10);
        const sx = x - 4;
        const ex = x + blockW + 4;
        const path = el('path', {
          d: `M ${sx} ${y + 12} C ${sx} ${arcTop}, ${ex} ${arcTop}, ${ex} ${y + 12}`,
          class: 'mcunet-skip', 'marker-end': 'url(#arr-amber)'
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
    const poolX = startX + 18 * stepX + 14;
    const gapG = el('g', { class: 'mcunet-block' });
    gapG.appendChild(el('rect', { x: poolX, y: centerY - 56, width: 64, height: 112, rx: 8, fill: '#eceee9', stroke: '#52796f', 'stroke-width': 1.8 }));
    gapG.appendChild(el('text', { x: poolX + 32, y: centerY - 18, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#1b4332' }, 'GLOBAL'));
    gapG.appendChild(el('text', { x: poolX + 32, y: centerY - 4, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#1b4332' }, 'AVG POOL'));
    gapG.appendChild(el('text', { x: poolX + 32, y: centerY + 18, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 11.5, 'font-weight': 700, fill: '#16221c' }, '160-D'));
    gapG.appendChild(el('text', { x: poolX + 32, y: centerY + 35, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8.6, fill: '#5d6e65' }, '6×6→1×1'));
    gapG.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, '<strong>Global Average Pooling</strong><br/>Compresses <code>6×6×160</code> → <code>160-D</code> vector'));
    gapG.addEventListener('mouseleave', () => hideTooltip(tip));
    svg.appendChild(gapG);

    // 5. SINGLE CLEAN 4-CLASS OUTPUT HEAD
    const headX = poolX + 90;
    svg.appendChild(el('line', {
      x1: poolX + 64, y1: centerY, x2: headX - 4, y2: centerY,
      class: instant ? '' : 'mcunet-pulse-line', stroke: '#1b4332', 'stroke-width': 2.2, 'marker-end': 'url(#arr-forest)'
    }));

    const headG = el('g', { class: 'mcunet-block' });
    headG.appendChild(el('rect', { x: headX, y: centerY - 72, width: 174, height: 144, rx: 11, fill: '#1b4332', stroke: '#122e22', 'stroke-width': 1.8 }));
    headG.appendChild(el('text', { x: headX + 14, y: centerY - 45, 'font-size': 10, 'font-weight': 800, fill: '#a9d6bc' }, 'LINEARLAYER HEAD'));
    headG.appendChild(el('text', { x: headX + 14, y: centerY - 22, 'font-family': 'JetBrains Mono, monospace', 'font-size': 13.5, 'font-weight': 700, fill: '#ffffff' }, 'Drop(0.25)'));
    headG.appendChild(el('text', { x: headX + 14, y: centerY - 2, 'font-family': 'JetBrains Mono, monospace', 'font-size': 13.5, 'font-weight': 700, fill: '#ffffff' }, '160 → 4 Classes'));
    headG.appendChild(el('line', { x1: headX + 14, y1: centerY + 12, x2: headX + 160, y2: centerY + 12, stroke: 'rgba(169,214,188,0.28)', 'stroke-width': 1 }));
    headG.appendChild(el('text', { x: headX + 14, y: centerY + 31, 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.2, fill: '#e5efe9' }, 'animal · empty'));
    headG.appendChild(el('text', { x: headX + 14, y: centerY + 47, 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.2, fill: '#e5efe9' }, 'person · vehicle'));
    headG.appendChild(el('text', { x: headX + 14, y: centerY + 63, 'font-family': 'JetBrains Mono, monospace', 'font-size': 9, fill: '#a9d6bc' }, '786 KB INT8 Flash'));
    headG.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, '<strong>4-Class Classification Head</strong><br/>MCUNet <code>LinearLayer(160 → 4, dropout=0.25)</code><br/>Total parameters: <code>577,052</code> · INT8: <code>786 KB</code>'));
    headG.addEventListener('mouseleave', () => hideTooltip(tip));
    svg.appendChild(headG);
  }

  /* ========================================================================
     6. SLIDE 6 — REAL 11-EPOCH TWO-PHASE TRAINING CURVE (outputs/history.csv)
     ======================================================================== */
  const HISTORY_EPOCHS = [
    { idx: 1,  tag: 'H1', phase: 'Phase 1 · Head',     trAcc: 77.2, valAcc: 81.8, valF1: 80.0,  valLoss: 0.852 },
    { idx: 2,  tag: 'H2', phase: 'Phase 1 · Head',     trAcc: 77.5, valAcc: 81.9, valF1: 81.4,  valLoss: 0.853 },
    { idx: 3,  tag: 'H3', phase: 'Phase 1 · Head',     trAcc: 77.7, valAcc: 82.5, valF1: 81.7,  valLoss: 0.841 },
    { idx: 4,  tag: 'F1', phase: 'Phase 2 · Fine-Tune', trAcc: 88.5, valAcc: 88.4, valF1: 88.1,  valLoss: 0.714 },
    { idx: 5,  tag: 'F2', phase: 'Phase 2 · Best',      trAcc: 92.3, valAcc: 90.0, valF1: 89.94, valLoss: 0.686 },
    { idx: 6,  tag: 'F3', phase: 'Phase 2 · Fine-Tune', trAcc: 93.4, valAcc: 89.9, valF1: 89.5,  valLoss: 0.695 },
    { idx: 7,  tag: 'F4', phase: 'Phase 2 · Fine-Tune', trAcc: 94.1, valAcc: 87.9, valF1: 88.7,  valLoss: 0.737 },
    { idx: 8,  tag: 'F5', phase: 'Phase 2 · Fine-Tune', trAcc: 94.5, valAcc: 89.0, valF1: 89.5,  valLoss: 0.701 },
    { idx: 9,  tag: 'F6', phase: 'Phase 2 · Fine-Tune', trAcc: 94.9, valAcc: 87.6, valF1: 88.4,  valLoss: 0.736 },
    { idx: 10, tag: 'F7', phase: 'Phase 2 · Fine-Tune', trAcc: 95.3, valAcc: 90.1, valF1: 89.7,  valLoss: 0.689 },
    { idx: 11, tag: 'F8', phase: 'Early Stopping',      trAcc: 95.5, valAcc: 86.9, valF1: 88.2,  valLoss: 0.740 }
  ];

  function renderTrainingCurve(instant = false) {
    const svg = document.getElementById('train-curve-svg');
    const wrap = document.getElementById('train-curve-wrap');
    const tip = document.getElementById('train-curve-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const pad = { top: 34, right: 24, bottom: 42, left: 48 };
    const W = 600, H = 300;
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const minY = 74, maxY = 98;

    const xScale = (idx) => pad.left + ((idx - 1) / 10) * innerW;
    const yScale = (val) => pad.top + innerH - ((val - minY) / (maxY - minY)) * innerH;

    // Shaded Phase 1 backdrop
    const xSplit = (xScale(3) + xScale(4)) / 2;
    svg.appendChild(el('rect', {
      x: pad.left, y: pad.top, width: xSplit - pad.left, height: innerH,
      fill: 'rgba(82, 121, 111, 0.08)'
    }));

    // Gridlines
    [75, 80, 85, 90, 95].forEach((t) => {
      const y = yScale(t);
      svg.appendChild(el('line', { x1: pad.left, y1: y, x2: W - pad.right, y2: y, stroke: '#e5ebe6', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: pad.left - 8, y: y + 4, 'text-anchor': 'end', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, fill: '#5d6e65' }, `${t}%`));
    });

    // Vertical Phase Divider
    svg.appendChild(el('line', { x1: xSplit, y1: pad.top - 6, x2: xSplit, y2: H - pad.bottom, stroke: '#b45309', 'stroke-width': 1.8, 'stroke-dasharray': '5 4' }));
    svg.appendChild(el('text', { x: (pad.left + xSplit) / 2, y: pad.top - 12, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#52796f' }, 'PHASE 1: HEAD'));
    svg.appendChild(el('text', { x: xSplit + 10, y: pad.top - 12, 'font-size': 10, 'font-weight': 700, fill: '#b45309' }, 'PHASE 2: FULL FINE-TUNE (UNFREEZE)'));

    // X-axis epoch ticks
    HISTORY_EPOCHS.forEach((d) => {
      const x = xScale(d.idx);
      svg.appendChild(el('text', {
        x, y: H - pad.bottom + 18, 'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 10.2,
        'font-weight': d.idx === 5 ? 800 : 500,
        fill: d.idx === 5 ? '#1b4332' : '#5d6e65'
      }, d.tag));
    });
    svg.appendChild(el('text', { x: pad.left + innerW / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 10.2, 'font-weight': 600, fill: '#5d6e65' }, 'Epoch (H1–H3 Head-Only  |  F1–F8 Full Fine-Tune)'));

    const drawPath = (pts, color, dashed = false, width = 2.6, delay = 0) => {
      const dStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.idx)} ${yScale(p.v)}`).join(' ');
      const path = el('path', { d: dStr, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      if (dashed) path.setAttribute('stroke-dasharray', '5 4');
      svg.appendChild(path);
      if (!instant && !dashed) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;
        path.style.transition = `stroke-dashoffset 0.95s cubic-bezier(0.22,1,0.36,1) ${delay}ms`;
        requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
      }
    };

    drawPath(HISTORY_EPOCHS.map(d => ({ idx: d.idx, v: d.trAcc })), '#8aa399', true, 2, 0);
    drawPath(HISTORY_EPOCHS.map(d => ({ idx: d.idx, v: d.valAcc })), '#1b4332', false, 2.8, 80);
    drawPath(HISTORY_EPOCHS.map(d => ({ idx: d.idx, v: d.valF1 })), '#b45309', false, 2.5, 180);

    // Best Epoch Highlight (F2, idx=5)
    const bx = xScale(5), by = yScale(90.0);
    svg.appendChild(el('circle', { cx: bx, cy: by, r: 10, fill: 'rgba(27,67,50,0.16)' }));
    svg.appendChild(el('rect', { x: bx - 54, y: by - 36, width: 108, height: 22, rx: 5, fill: '#e5efe9', stroke: '#aacdb8' }));
    svg.appendChild(el('text', { x: bx, y: by - 21.5, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9.8, 'font-weight': 700, fill: '#1b4332' }, 'Best: 90.0% / .899'));

    // Interactive Data Points
    HISTORY_EPOCHS.forEach((d) => {
      const x = xScale(d.idx);
      const html = `<strong>${d.tag} — ${d.phase}</strong><br/>` +
        `Val Acc: <code>${d.valAcc.toFixed(1)}%</code> · Val Macro-F1: <code>${(d.valF1 / 100).toFixed(4)}</code><br/>` +
        `Train Acc: <code>${d.trAcc.toFixed(1)}%</code> · Val Loss: <code>${d.valLoss.toFixed(3)}</code>`;

      [
        { y: yScale(d.valAcc), stroke: '#1b4332', fill: d.idx === 5 ? '#1b4332' : '#ffffff', r: d.idx === 5 ? 5.2 : 3.8 },
        { y: yScale(d.valF1),  stroke: '#b45309', fill: '#ffffff', r: 3.4 }
      ].forEach((pt) => {
        const dot = el('circle', { cx: x, cy: pt.y, r: pt.r, fill: pt.fill, stroke: pt.stroke, 'stroke-width': 2, style: 'cursor:pointer;' });
        dot.addEventListener('mousemove', (e) => showTooltip(tip, wrap, e, html));
        dot.addEventListener('mouseleave', () => hideTooltip(tip));
        svg.appendChild(dot);
      });
    });

    // Legend inside top-right
    const leg = el('g', { transform: `translate(${W - 220}, ${H - pad.bottom - 52})` });
    leg.appendChild(el('rect', { x: -8, y: -12, width: 196, height: 54, rx: 6, fill: 'rgba(255,255,255,0.92)', stroke: '#d8dfd9' }));
    leg.appendChild(el('line', { x1: 0, y1: 0, x2: 18, y2: 0, stroke: '#1b4332', 'stroke-width': 2.8 }));
    leg.appendChild(el('text', { x: 24, y: 3.5, 'font-size': 10, 'font-weight': 700, fill: '#1b4332' }, 'Val Accuracy'));
    leg.appendChild(el('line', { x1: 0, y1: 16, x2: 18, y2: 16, stroke: '#b45309', 'stroke-width': 2.5 }));
    leg.appendChild(el('text', { x: 24, y: 19.5, 'font-size': 10, 'font-weight': 700, fill: '#b45309' }, 'Val Macro-F1 (×100)'));
    leg.appendChild(el('line', { x1: 0, y1: 32, x2: 18, y2: 32, stroke: '#8aa399', 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
    leg.appendChild(el('text', { x: 24, y: 35.5, 'font-size': 10, 'font-weight': 600, fill: '#5d6e65' }, 'Train Accuracy'));
    svg.appendChild(leg);
  }

  /* ========================================================================
     7. SLIDE 7 — LARGE, UNCROWDED TEST F1 & SOURCE ACCURACY CHARTS
     ======================================================================== */
  function renderTrackBF1(instant = false) {
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

    const pad = { top: 28, right: 20, bottom: 38, left: 46 };
    const W = 460, H = 270;
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const minY = 0.65, maxY = 1.0;
    const yScale = (v) => pad.top + innerH - ((v - minY) / (maxY - minY)) * innerH;

    [0.7, 0.8, 0.9, 1.0].forEach((t) => {
      const y = yScale(t);
      svg.appendChild(el('line', { x1: pad.left, y1: y, x2: W - pad.right, y2: y, stroke: '#e6ebe7', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: pad.left - 8, y: y + 4, 'text-anchor': 'end', 'font-family': 'JetBrains Mono, monospace', 'font-size': 11, fill: '#5d6e65' }, t.toFixed(1)));
    });

    const yMacro = yScale(0.905);
    svg.appendChild(el('line', { x1: pad.left, y1: yMacro, x2: W - pad.right, y2: yMacro, stroke: '#355c7d', 'stroke-width': 1.7, 'stroke-dasharray': '5 4' }));

    const colW = innerW / data.length;
    const barW = 58;

    data.forEach((d, i) => {
      const x = pad.left + i * colW + (colW - barW) / 2;
      const targetY = yScale(d.f1);
      const targetH = yScale(minY) - targetY;

      const rect = el('rect', {
        x, y: instant ? targetY : yScale(minY),
        width: barW, height: instant ? targetH : 0,
        rx: 6, fill: d.color, style: 'cursor:pointer;'
      });

      if (!instant) {
        rect.style.transition = `y 0.78s cubic-bezier(0.22,1,0.36,1) ${i * 95}ms, height 0.78s cubic-bezier(0.22,1,0.36,1) ${i * 95}ms`;
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
        x: x + barW / 2, y: targetY - 8, 'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 12.5, 'font-weight': 700, fill: d.color
      }, d.f1.toFixed(3)));

      svg.appendChild(el('text', {
        x: x + barW / 2, y: H - 12, 'text-anchor': 'middle',
        'font-size': 12.5, 'font-weight': 700, fill: '#2d3d35'
      }, d.cls));
    });
  }

  function renderTrackBSources(instant = false) {
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

    const pad = { top: 28, right: 26, bottom: 32, left: 92 };
    const W = 460, H = 270;
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const minX = 75, maxX = 100;
    const xScale = (v) => pad.left + ((v - minX) / (maxX - minX)) * innerW;

    [75, 80, 85, 90, 95, 100].forEach((t) => {
      const x = xScale(t);
      svg.appendChild(el('line', { x1: x, y1: pad.top, x2: x, y2: H - pad.bottom, stroke: '#e6ebe7', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x, y: H - 10, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, fill: '#5d6e65' }, `${t}%`));
    });

    const xAvg = xScale(88.47);
    svg.appendChild(el('line', { x1: xAvg, y1: pad.top - 4, x2: xAvg, y2: H - pad.bottom, stroke: '#355c7d', 'stroke-width': 1.8, 'stroke-dasharray': '5 4' }));
    svg.appendChild(el('text', { x: xAvg, y: 15, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, 'font-weight': 700, fill: '#355c7d' }, 'Avg 88.5%'));

    const rowH = innerH / data.length;
    const barH = 30;

    data.forEach((d, i) => {
      const y = pad.top + i * rowH + (rowH - barH) / 2;
      const targetW = Math.max(8, xScale(d.acc) - pad.left);

      svg.appendChild(el('text', {
        x: pad.left - 10, y: y + barH / 2 + 4.5, 'text-anchor': 'end',
        'font-size': 12.2, 'font-weight': 700, fill: '#2d3d35'
      }, d.src));

      const rect = el('rect', {
        x: pad.left, y, width: instant ? targetW : 0, height: barH,
        rx: 6, fill: d.color, style: 'cursor:pointer;'
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
        x: pad.left + targetW - 10, y: y + barH / 2 + 4.5, 'text-anchor': 'end',
        'font-family': 'JetBrains Mono, monospace', 'font-size': 12, 'font-weight': 700, fill: '#ffffff'
      }, `${d.acc.toFixed(1)}%`));
    });
  }

  /* ========================================================================
     7. SLIDE 7 — ANIMATED ERROR CONCENTRATION DONUT (91.8% animal <-> empty)
     ======================================================================== */
  function renderTrackBErrors(instant = false) {
    const svg = document.getElementById('trackb-err-svg');
    const wrap = document.getElementById('trackb-err-wrap');
    const tip = document.getElementById('trackb-err-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const cx = 112, cy = 108, r = 68;
    const circ = 2 * Math.PI * r;
    const slices = [
      { label: 'empty → animal', count: 3934, pct: 51.66, color: '#b45309' },
      { label: 'animal → empty', count: 3060, pct: 40.18, color: '#d97706' },
      { label: 'All other 10 pairs', count: 621, pct: 8.16, color: '#52796f' }
    ];

    svg.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: '#eceee9', 'stroke-width': 24 }));

    let offsetPct = 0;
    slices.forEach((s, i) => {
      const segLen = (s.pct / 100) * circ;
      const rot = -90 + (offsetPct / 100) * 360;
      const circle = el('circle', {
        cx, cy, r, fill: 'none', stroke: s.color, 'stroke-width': 24,
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

    svg.appendChild(el('text', { x: cx, y: cy - 3, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 21, 'font-weight': 800, fill: '#b45309' }, '91.8%'));
    svg.appendChild(el('text', { x: cx, y: cy + 14, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#2d3d35' }, 'animal ↔ empty'));
    svg.appendChild(el('text', { x: cx, y: cy + 28, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 9, fill: '#5d6e65' }, '6,994 / 7,615'));

    const legX = 208;
    slices.forEach((s, i) => {
      const y = 60 + i * 46;
      svg.appendChild(el('rect', { x: legX, y: y - 10, width: 12, height: 12, rx: 3, fill: s.color }));
      svg.appendChild(el('text', { x: legX + 18, y: y, 'font-size': 11.2, 'font-weight': 700, fill: '#16221c' }, s.label));
      svg.appendChild(el('text', { x: legX + 18, y: y + 16, 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.2, fill: '#5d6e65' }, `${s.count.toLocaleString()} (${s.pct.toFixed(1)}%)`));
    });
  }

  /* ========================================================================
     8. BOOTSTRAP
     ======================================================================== */
  if (isStatic) renderAllVisualsStatic();
  goTo(parseHash(), { skipHash: false });
})();
