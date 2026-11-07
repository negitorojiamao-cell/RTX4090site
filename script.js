/* ==========================================================================
   GEFORCE RTX 4090 — THE POWER WITHIN
   script.js

   ---------------------------------------------------------------------
   IMAGES — single place to swap every photo on the site.
   Drop your own files under assets/images/{gpu,box,hardware,pc,backgrounds}/
   and change the paths below (e.g. 'assets/images/box/front.jpg').
   Anything left as-is uses a verified free-to-use Unsplash photo.
   ---------------------------------------------------------------------
   Photo credits (Unsplash License — free for commercial & non-commercial
   use, no attribution required; verified via unsplash.com/license):
   - heroBg / unboxBg base: Circuit board macro — Alexandre Debiève
     https://unsplash.com/photos/FO7JIlwjOtU
   - unboxBg overlay / gallery abstract: Abstract blue light — 灿雄 邱
     https://unsplash.com/photos/dOYVMySdXd0
   - buildBg / gallery mobo / boot bg: Motherboard close-up — Vishnu Mohanan
     https://unsplash.com/photos/xoOW8cvsWIo
   - gallery RGB PC: RGB gaming PC build — sdl sanjaya
     https://unsplash.com/photos/VBVtNgkA3ak
   - gpuDetail1 / hardwareBg: GPU close-up (MSI GTX 780) — Rohan
     https://unsplash.com/photos/mWzgDsBU1y0
   - gpuDetail2: GPU close-up (Nvidia RTX 2060) — Christian Wiediger
     https://unsplash.com/photos/TErYPw4o1KM
   None of these are official NVIDIA / AIB-partner RTX 4090 marketing
   photography — that could not be confirmed as freely redistributable,
   so they are used only as labelled "参考写真" (reference photos) for
   texture, cooling and PCB detail. The GPU card itself, the box, the
   cables and the monitor are original CSS/SVG constructions, not derived
   from any reference image.
   ------------------------------------------------------------------- */
const IMAGES = {
  heroBg:          'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2400&auto=format&fit=crop',
  unboxBg:         'https://images.unsplash.com/photo-1773053525998-8cb667020fa7?q=80&w=2400&auto=format&fit=crop',
  buildBg:         'https://images.unsplash.com/photo-1642229408339-572fa3328d10?q=80&w=2400&auto=format&fit=crop',
  connectBg:       null, // optional — leave null to keep the CSS gradient-only background
  bootBg:          'https://images.unsplash.com/photo-1642229408339-572fa3328d10?q=80&w=1800&auto=format&fit=crop',
  hardwareBg:      'https://images.unsplash.com/photo-1634672350437-f9632adc9c3f?q=80&w=2400&auto=format&fit=crop',
  gpuDetail1:      'https://images.unsplash.com/photo-1634672350437-f9632adc9c3f?q=80&w=1200&auto=format&fit=crop',
  gpuDetail2:      'https://images.unsplash.com/photo-1555618565-9f2b0323a10d?q=80&w=1600&auto=format&fit=crop',
  galleryCircuit:  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop',
  galleryMobo:     'https://images.unsplash.com/photo-1642229408339-572fa3328d10?q=80&w=1200&auto=format&fit=crop',
  galleryRgbPc:    'https://images.unsplash.com/photo-1738245494097-9b1e3971c3eb?q=80&w=1200&auto=format&fit=crop',
  galleryAbstract: 'https://images.unsplash.com/photo-1773053525998-8cb667020fa7?q=80&w=1800&auto=format&fit=crop'
};

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 640px)').matches;

  /* ---------------------------------------------------------------------
     Apply IMAGES config to every [data-img] element
     ------------------------------------------------------------------- */
  document.querySelectorAll('[data-img]').forEach(el => {
    const key = el.getAttribute('data-img');
    const url = IMAGES[key];
    if (url) el.style.backgroundImage = `url('${url}')`;
  });

  /* ---------------------------------------------------------------------
     Smooth scroll — ONLY for nav / CTA link clicks, never for normal
     wheel scrolling (html has scroll-behavior:auto in CSS).
     ------------------------------------------------------------------- */
  document.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId.charAt(0) !== '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      closeMobileNav();
    });
  });

  const nav = document.getElementById('siteNav');
  const navToggle = document.getElementById('navToggle');

  function closeMobileNav(){
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  function lerp(a, b, t){ return a + (b - a) * t; }
  function clamp01(x){ return Math.max(0, Math.min(1, x)); }

  /* ---------------------------------------------------------------------
     PERFORMANCE — section visibility + tab visibility gating.
     Every infinite CSS animation (fan spin, RGB strip, circuit drift,
     boot pulse...) is paused via CSS whenever its <section> lacks
     [data-inview] (see style.css) or the tab is hidden. This one
     observer drives every section at once instead of each feature
     managing its own on/off state.
     ------------------------------------------------------------------- */
  const sectionVisibility = new Map(); // section id -> boolean, for JS-side checks (e.g. hero canvas)
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.toggleAttribute('data-inview', entry.isIntersecting);
      sectionVisibility.set(entry.target.id, entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: '200px 0px' });
  document.querySelectorAll('main > section[id]').forEach(sec => sectionObserver.observe(sec));

  let tabHidden = document.hidden;
  document.documentElement.toggleAttribute('data-tab-hidden', tabHidden);
  document.addEventListener('visibilitychange', () => {
    tabHidden = document.hidden;
    document.documentElement.toggleAttribute('data-tab-hidden', tabHidden);
  });

  /* ---------------------------------------------------------------------
     Scroll progress bar + nav background + all pinned-stage updates.
     Everything scroll-driven is computed from native window.scrollY —
     nothing here intercepts or slows the user's wheel input.
     ------------------------------------------------------------------- */
  const scrollBar = document.getElementById('scrollBar');
  let ticking = false;

  function onScroll(){
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    scrollBar.style.width = pct + '%';
    nav.classList.toggle('is-scrolled', scrollTop > 40);
    updateUnboxing(scrollTop);
    updateBuild(scrollTop);
    updateConnect(scrollTop);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking){
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  /* ---------------------------------------------------------------------
     Generic reveal-on-scroll — tuned to fire once an element is well
     into view (roughly its center crossing mid-viewport), not just a
     sliver visible at the bottom edge.
     ------------------------------------------------------------------- */
  const revealSelectors = [
    '.section-head', '.perf__stat', '.gallery__item', '.boot__title',
    '.boot__pulse-row', '.cta__title', '.cta__desc', '.cta__actions',
    '.arch__legend', '.dlss__frame', '.hw-photo__content', '.hw__detail-photo'
  ];
  const revealEls = document.querySelectorAll(revealSelectors.join(','));
  revealEls.forEach(el => el.setAttribute('data-reveal', ''));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35, rootMargin: '0px 0px -15% 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------------------------------------------------------------------
     HERO — ambient particle field (canvas)
     ------------------------------------------------------------------- */
  const particleCanvas = document.getElementById('particleField');
  if (particleCanvas && !reduceMotion){
    const ctx = particleCanvas.getContext('2d');
    let particles = [];
    let w, h;

    function resizeCanvas(){
      w = particleCanvas.offsetWidth;
      h = particleCanvas.offsetHeight;
      particleCanvas.width = w * devicePixelRatio;
      particleCanvas.height = h * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    function initParticles(){
      const count = isMobile ? 34 : 80;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        vy: Math.random() * 0.25 + 0.05, vx: (Math.random() - 0.5) * 0.12,
        a: Math.random() * 0.5 + 0.15,
        hue: Math.random() > 0.7 ? 'violet' : 'lime'
      }));
    }
    function drawParticlesFrame(){
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.y -= p.vy; p.x += p.vx;
        if (p.y < -10) p.y = h + 10;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 'lime' ? `rgba(163,242,106,${p.a})` : `rgba(139,107,255,${p.a})`;
        ctx.fill();
      });
      if (heroLoopRunning) requestAnimationFrame(drawParticlesFrame);
    }
    resizeCanvas(); initParticles();
    window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

    // Only burn CPU/GPU on this canvas while the hero is actually on screen
    // and the tab is in the foreground — a pure decorative loop has no
    // reason to run when nobody can see it.
    let heroLoopRunning = false;
    function updateHeroLoop(){
      const shouldRun = !tabHidden && sectionVisibility.get('hero') !== false;
      if (shouldRun && !heroLoopRunning){
        heroLoopRunning = true;
        requestAnimationFrame(drawParticlesFrame);
      } else if (!shouldRun){
        heroLoopRunning = false;
      }
    }
    updateHeroLoop();
    const heroObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => sectionVisibility.set('hero', entry.isIntersecting));
      updateHeroLoop();
    }, { threshold: 0 });
    heroObserver.observe(document.getElementById('hero'));
    document.addEventListener('visibilitychange', updateHeroLoop);
  }

  /* ---------------------------------------------------------------------
     UNBOXING — short pinned scroll-scrubbed sequence.
     The section height (set in CSS, ~300vh / ~250vh / ~220vh by
     breakpoint) is deliberately small: on a 900px-tall viewport that is
     roughly 2 screens of *additional* scroll on top of the first screen
     where the box appears, so the whole box -> open -> GPU -> hold
     sequence completes within a natural, continuous scroll gesture.
     ------------------------------------------------------------------- */
  const unboxSection = document.getElementById('unboxing');
  const unboxBox = document.getElementById('unboxBox');
  const unboxLid = document.getElementById('unboxLid');
  const unboxLight = document.getElementById('unboxLight');
  const unboxGpu = document.getElementById('unboxGpu');
  const unboxCaption = document.getElementById('unboxCaption');
  const unboxSpecs = document.getElementById('unboxSpecs');
  const boxGlow = unboxBox ? unboxBox.querySelector('.unbox__box-glow') : null;

  const unboxCaptions = [
    [0, 12, '箱が、暗闇の中に浮かび上がる。'],
    [12, 24, '光が当たり、わずかに振動する。'],
    [24, 36, '蓋が、静かに開いてゆく。'],
    [36, 46, '内部から、光が漏れ出す。'],
    [46, 58, 'RTX 4090が、箱から浮上する。'],
    [58, 72, 'カメラが、GPUへ近づく。'],
    [72, 100, 'その姿を見せるように、GPUが回転する。']
  ];

  function updateUnboxing(scrollTop){
    if (!unboxSection || !unboxBox || !unboxGpu) return;
    const total = unboxSection.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const start = unboxSection.offsetTop;
    const p = clamp01((scrollTop - start) / total) * 100;

    // 0-12%: box appears
    const t1 = clamp01(p / 12);

    // 12-24%: light + subtle vibration (folded into the same transform as the
    // box's entrance below — a separate marginLeft write here would trigger
    // layout/reflow on every scroll frame, which is exactly what item 25
    // (transform/opacity only) asks to avoid).
    const t2 = clamp01((p - 12) / 12);
    unboxLight.style.opacity = t2 * 0.9;
    const shakeX = (!reduceMotion && p >= 12 && p < 24) ? Math.sin(p * 6) * (1 - t2) * 3 : 0;

    unboxBox.style.opacity = t1;
    unboxBox.style.transform = `translateY(${lerp(40, 0, t1)}px) translateX(${shakeX}px) scale(${lerp(0.9, 1, t1)})`;

    // 24-36%: lid opens
    const t3 = clamp01((p - 24) / 12);
    unboxLid.style.transform = `rotateX(${lerp(0, -118, t3)}deg)`;

    // 36-46%: glow leaks
    const t4 = clamp01((p - 36) / 10);
    if (boxGlow) boxGlow.style.opacity = t4;

    // 46-58%: GPU rises from box
    const t5 = clamp01((p - 46) / 12);
    unboxGpu.style.opacity = t5;
    unboxGpu.style.transform = `translateY(${lerp(120, 20, t5)}px) scale(${lerp(0.78, 0.94, t5)}) rotateX(${lerp(8, 2, t5)}deg)`;

    // 58-72%: camera approaches — GPU centers and grows slightly, box fades back
    const t6 = clamp01((p - 58) / 14);
    unboxGpu.style.transform = `translateY(${lerp(20, -20, t6)}px) scale(${lerp(0.94, 1.08, t6)}) rotateX(${lerp(2, 0, t6)}deg)`;
    unboxBox.style.opacity = Math.max(0, t1 - t6 * 0.7);
    if (unboxSpecs) unboxSpecs.classList.toggle('is-active', p >= 66);

    // 72-100%: "presenting" turn — the GPU rotates to show its profile, then
    // settles back to a friendly 3/4 angle. A single deliberate motion, not a
    // constant spin, so it reads as a camera move rather than decoration.
    if (p >= 72){
      const t7 = clamp01((p - 72) / 28);
      const showAngle = reduceMotion ? 0 : Math.sin(t7 * Math.PI) * 24;
      unboxGpu.style.transform =
        `translateY(${lerp(-20, -32, t7)}px) scale(${lerp(1.08, 1.12, t7)}) rotateY(${showAngle}deg) rotateX(${lerp(0, -2, t7)}deg)`;
    }

    for (const [from, to, text] of unboxCaptions){
      if (p >= from && (p < to || to === 100)){
        if (unboxCaption.textContent !== text) unboxCaption.textContent = text;
        break;
      }
    }
  }

  /* ---------------------------------------------------------------------
     BUILD — short pinned sequence: GPU slides into PCIe, click-tag,
     cooler + reference photo settle in, all inside one sticky viewport.
     ------------------------------------------------------------------- */
  const buildSection = document.getElementById('build');
  const buildGpu = document.getElementById('buildGpu');
  const buildClickTag = document.getElementById('buildClickTag');
  const buildCooler = document.querySelector('.build__cooler');
  const buildPhotoCard = document.getElementById('buildPhotoCard');

  function updateBuild(scrollTop){
    if (!buildSection || !buildGpu) return;
    const total = buildSection.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const start = buildSection.offsetTop;
    const p = clamp01((scrollTop - start) / total) * 100;

    // 0-35%: GPU slides into the PCIe slot
    const t1 = clamp01(p / 35);
    buildGpu.style.opacity = t1;
    buildGpu.style.transform = `translateX(${lerp(120, 0, t1)}%)`;

    // 30-45%: click-tag + cooler fans fade in
    buildClickTag.classList.toggle('is-active', p >= 38);
    if (buildCooler) buildCooler.style.opacity = clamp01((p - 30) / 15);

    // 45-70%: reference photo card settles into view
    if (buildPhotoCard) buildPhotoCard.classList.toggle('is-active', p >= 50);
  }

  /* ---------------------------------------------------------------------
     CONNECT — power + monitor merged into a single short pinned
     sequence: cable draws in -> connector lights up -> cross-fade to
     the monitor -> DP cable draws in -> screen boots. All inside one
     sticky viewport, so the user never loses sight of what's animating.
     ------------------------------------------------------------------- */
  const connectSection = document.getElementById('connect');
  const connectTag = document.getElementById('connectTag');
  const connectCaption = document.getElementById('connectCaption');
  const powerScene = document.getElementById('powerScene');
  const monitorScene = document.getElementById('monitorScene');
  const cablePath = document.getElementById('cablePath');
  const powerConnector = document.getElementById('powerConnector');
  const powerTag = document.getElementById('powerTag');
  const dpCablePath = document.getElementById('dpCablePath');
  const monitorScreen = document.getElementById('monitorScreen');

  function updateConnect(scrollTop){
    if (!connectSection || !cablePath) return;
    const total = connectSection.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const start = connectSection.offsetTop;
    const p = clamp01((scrollTop - start) / total) * 100;

    const showPower = p < 48;
    powerScene.classList.toggle('is-visible', showPower);
    monitorScene.classList.toggle('is-visible', !showPower);
    connectTag.textContent = showPower ? '03 — POWER' : '04 — DISPLAY';

    // power: 0-38% cable draws, connects by 40%
    const cableLen = 1400;
    const tPower = clamp01(p / 36);
    cablePath.style.strokeDashoffset = String(cableLen * (1 - tPower));
    const connected = p >= 38;
    powerConnector.classList.toggle('is-connected', connected);
    powerTag.classList.toggle('is-active', connected);

    // monitor: 48-88% DP cable draws, screen on by 88%
    const dpLen = 900;
    const tMonitor = clamp01((p - 50) / 34);
    dpCablePath.style.strokeDashoffset = String(dpLen * (1 - tMonitor));
    monitorScreen.classList.toggle('is-on', p >= 88);

    if (p < 12) connectCaption.textContent = '電源ケーブルが、GPUへ伸びてゆく。';
    else if (p < 38) connectCaption.textContent = 'コネクタが、GPUへ近づいてゆく。';
    else if (p < 48) connectCaption.textContent = 'POWER CONNECTED — 電源が入る。';
    else if (p < 70) connectCaption.textContent = 'DisplayPortケーブルが、モニターへ伸びる。';
    else if (p < 88) connectCaption.textContent = '接続完了。映像信号を待っている。';
    else connectCaption.textContent = 'SYSTEM READY — 画面が目を覚ます。';
  }

  /* ---------------------------------------------------------------------
     PERFORMANCE — count-up numbers + bar chart
     ------------------------------------------------------------------- */
  const perfNums = document.querySelectorAll('.perf__num[data-count-to]');
  const perfBars = document.querySelectorAll('.perf__bar i');
  const perfSection = document.getElementById('performance');

  function animateCount(el){
    const to = parseFloat(el.dataset.countTo);
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = reduceMotion ? 0 : 1400;
    const start = performance.now();
    function step(now){
      const t = duration === 0 ? 1 : clamp01((now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = to * eased;
      el.textContent = (decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-US')) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (perfSection){
    const perfObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          perfNums.forEach(animateCount);
          perfBars.forEach(bar => bar.style.height = bar.style.getPropertyValue('--h'));
          perfObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    perfObserver.observe(perfSection);
  }

  /* ---------------------------------------------------------------------
     ARCHITECTURE — generate SM grid + RT/Tensor node die diagram
     ------------------------------------------------------------------- */
  const archGrid = document.getElementById('archGrid');
  const archNodes = document.getElementById('archNodes');
  const SVG_NS = 'http://www.w3.org/2000/svg';

  if (archGrid && archNodes){
    const cols = 8, rows = 8, size = 60, gap = 6, pad = 30;
    for (let r = 0; r < rows; r++){
      for (let c = 0; c < cols; c++){
        const x = pad + c * (size + gap);
        const y = pad + r * (size + gap);
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', x); rect.setAttribute('y', y);
        rect.setAttribute('width', size); rect.setAttribute('height', size);
        rect.setAttribute('rx', 4); rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', '#a3f26a20'); rect.setAttribute('stroke-width', '1');
        archGrid.appendChild(rect);

        const roll = (r * cols + c) % 7;
        if (roll === 0 || roll === 4){
          const dot = document.createElementNS(SVG_NS, 'circle');
          dot.setAttribute('cx', x + size / 2); dot.setAttribute('cy', y + size / 2);
          dot.setAttribute('r', 4);
          const isViolet = roll === 0;
          dot.setAttribute('fill', isViolet ? '#8b6bff' : '#4fe0e8');
          dot.setAttribute('class', 'arch-node');
          dot.style.animationDelay = ((r + c) * 0.12) + 's';
          archNodes.appendChild(dot);
        }
      }
    }
    const style = document.createElementNS(SVG_NS, 'style');
    style.textContent = `.arch-node{ animation: archpulse 2.6s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
      @keyframes archpulse{ 0%,100%{ opacity:.35; transform:scale(1);} 50%{ opacity:1; transform:scale(1.5);} }`;
    archGrid.parentNode.insertBefore(style, archGrid);
  }

  /* ---------------------------------------------------------------------
     RAY TRACING — animated bouncing light rays with reflections
     ------------------------------------------------------------------- */
  const rtRays = document.getElementById('rtRays');
  if (rtRays){
    const raysData = [
      { d: 'M 80 80 L 340 220 L 640 120', color: '#a3f26a' },
      { d: 'M 80 80 L 260 340 L 560 300', color: '#4fe0e8' },
      { d: 'M 80 80 L 420 400 L 720 420', color: '#8b6bff' },
      { d: 'M 80 80 L 500 90 L 740 260', color: '#ffb454' }
    ];
    raysData.forEach((r, i) => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', r.d); path.setAttribute('fill', 'none');
      path.setAttribute('stroke', r.color); path.setAttribute('stroke-width', '1.6');
      path.setAttribute('opacity', '0.75');
      path.style.filter = `drop-shadow(0 0 4px ${r.color})`;
      const len = 1400;
      path.setAttribute('stroke-dasharray', String(len));
      path.setAttribute('stroke-dashoffset', String(len));
      path.style.transition = `stroke-dashoffset 1.6s ${reduceMotion ? 0 : 0.25 * i}s cubic-bezier(.16,.84,.44,1)`;
      rtRays.appendChild(path);
    });
    const surface = document.createElementNS(SVG_NS, 'polygon');
    surface.setAttribute('points', '20,460 780,460 780,500 20,500');
    surface.setAttribute('fill', '#0c120d');
    surface.setAttribute('stroke', '#ffffff14');
    rtRays.insertBefore(surface, rtRays.firstChild.nextSibling);

    const rtObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          rtRays.querySelectorAll('path').forEach(p => p.setAttribute('stroke-dashoffset', '0'));
          rtObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.45 });
    rtObserver.observe(rtRays);
  }

  /* ---------------------------------------------------------------------
     RT ON/OFF compare slider — plain <input type="range"> the user drags.
     This is direct pointer interaction, not scroll-linked, so it never
     touches wheel/scroll behavior.
     ------------------------------------------------------------------- */
  const rtCompareSlider = document.getElementById('rtCompareSlider');
  const rtCompareOff = document.getElementById('rtCompareOff');
  const rtCompareHandle = document.getElementById('rtCompareHandle');
  if (rtCompareSlider && rtCompareOff && rtCompareHandle){
    const updateCompare = () => {
      const v = rtCompareSlider.value; // 0-100, position of the RT-OFF reveal edge
      rtCompareOff.style.clipPath = `inset(0 0 0 ${v}%)`;
      rtCompareHandle.style.left = v + '%';
    };
    rtCompareSlider.addEventListener('input', updateCompare);
    updateCompare();
  }

  /* ---------------------------------------------------------------------
     AI / DLSS — particles converge from noise into a coherent grid
     ------------------------------------------------------------------- */
  const dlssCanvas = document.getElementById('dlssCanvas');
  const dlssSection = document.getElementById('dlss');

  if (dlssCanvas && dlssSection){
    const dctx = dlssCanvas.getContext('2d');
    let dw, dh, dParticles = [], dlssStarted = false;
    function resizeDlss(){
      dw = dlssCanvas.offsetWidth; dh = dlssCanvas.offsetHeight;
      dlssCanvas.width = dw * devicePixelRatio; dlssCanvas.height = dh * devicePixelRatio;
      dctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resizeDlss();
    window.addEventListener('resize', resizeDlss);

    function buildParticles(){
      const cols = isMobile ? 14 : 26;
      const rows = isMobile ? 7 : 12;
      dParticles = [];
      for (let r = 0; r < rows; r++){
        for (let c = 0; c < cols; c++){
          dParticles.push({
            x: Math.random() * dw, y: Math.random() * dh,
            tx: (c + 0.5) * (dw / cols), ty: (r + 0.5) * (dh / rows),
            hue: Math.random() > 0.5 ? '79,224,232' : '163,242,106'
          });
        }
      }
    }
    function animateDlss(){
      let allSettled = true;
      dctx.clearRect(0, 0, dw, dh);
      dParticles.forEach(p => {
        p.x = lerp(p.x, p.tx, reduceMotion ? 1 : 0.06);
        p.y = lerp(p.y, p.ty, reduceMotion ? 1 : 0.06);
        if (Math.abs(p.x - p.tx) > 0.5 || Math.abs(p.y - p.ty) > 0.5) allSettled = false;
        dctx.beginPath(); dctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        dctx.fillStyle = `rgba(${p.hue},0.7)`; dctx.fill();
      });
      if (!allSettled) requestAnimationFrame(animateDlss);
    }
    const dlssObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !dlssStarted){
          dlssStarted = true; buildParticles(); animateDlss();
          dlssObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    dlssObserver.observe(dlssSection);
  }

  /* ---------------------------------------------------------------------
     DLSS HUD — small illustrative FPS toggle. Clearly labelled as a
     concept demo (see markup note); never presented as a benchmark.
     ------------------------------------------------------------------- */
  const dlssToggle = document.getElementById('dlssToggle');
  const dlssToggleState = document.getElementById('dlssToggleState');
  const dlssFpsNum = document.getElementById('dlssFpsNum');
  if (dlssToggle && dlssFpsNum){
    const FPS_OFF = 62, FPS_ON = 118;
    let dlssOn = false, fpsAnimId = null;

    function animateFpsTo(target){
      if (fpsAnimId) cancelAnimationFrame(fpsAnimId);
      const startVal = parseInt(dlssFpsNum.textContent, 10) || FPS_OFF;
      const startTime = performance.now();
      const duration = reduceMotion ? 0 : 500;
      function step(now){
        const t = duration === 0 ? 1 : clamp01((now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        dlssFpsNum.textContent = Math.round(lerp(startVal, target, eased));
        if (t < 1) fpsAnimId = requestAnimationFrame(step);
      }
      fpsAnimId = requestAnimationFrame(step);
    }

    dlssToggle.addEventListener('click', () => {
      dlssOn = !dlssOn;
      dlssToggle.setAttribute('aria-pressed', String(dlssOn));
      dlssToggleState.textContent = dlssOn ? 'ON' : 'OFF';
      animateFpsTo(dlssOn ? FPS_ON : FPS_OFF);
    });
  }

  /* ---------------------------------------------------------------------
     HARDWARE — exploded view spreads apart on scroll into view
     ------------------------------------------------------------------- */
  const hwExploded = document.getElementById('hwExploded');
  if (hwExploded){
    const back = hwExploded.querySelector('.hw__layer--back');
    const pcb = hwExploded.querySelector('.hw__layer--pcb');
    const heatsink = hwExploded.querySelector('.hw__layer--heatsink');
    const shroud = hwExploded.querySelector('.hw__layer--shroud');
    const hwObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          back.style.transform = 'translate(-50%,-50%) translateY(120px) scale(.94)';
          pcb.style.transform = 'translate(-50%,-50%) translateY(50px) scale(.97)';
          heatsink.style.transform = 'translate(-50%,-50%) translateY(-10px)';
          shroud.style.transform = 'translate(-50%,-50%) translateY(-100px) scale(1.02)';
          hwObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.45 });
    hwObserver.observe(hwExploded);
  }

  /* ---------------------------------------------------------------------
     GALLERY — click to open a lightbox with the full photo + caption
     ------------------------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(item){
    const imgEl = item.querySelector('.gallery__img');
    lightboxImg.style.backgroundImage = imgEl.style.backgroundImage;
    lightboxCaption.textContent = item.getAttribute('data-caption') || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('.gallery__item').forEach(item => {
    item.addEventListener('click', () => openLightbox(item));
  });
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  /* ---------------------------------------------------------------------
     Initial paint — safe to run now that every const above is declared.
     ------------------------------------------------------------------- */
  onScroll();

})();
