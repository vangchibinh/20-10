(() => {
  const $ = id => document.getElementById(id);
  const body = document.body, root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = innerWidth < 600;
  const cv = $('fx'), ctx = cv.getContext('2d');
  let W, H, DPR, mx = 0, my = 0, tx = 0, ty = 0, t = 0;

  const resize = () => {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * DPR;
    H = cv.height = innerHeight * DPR;
  };
  addEventListener('resize', resize);
  resize();

  addEventListener('pointermove', e => {
    tx = e.clientX / innerWidth * 2 - 1;
    ty = e.clientY / innerHeight * 2 - 1;
  });
  addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 30));
    ty = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
  });

  /* =====================================================
     0. MÀN MỞ ĐẦU: tách chữ, tạo đốm sáng bay lên
     ===================================================== */
  const introText = $('introText');
  if (introText) {
    const txt = introText.textContent.trim();
    introText.setAttribute('aria-label', txt);
    introText.textContent = '';
    let n = 0;
    txt.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      [...word].forEach(ch => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        s.style.setProperty('--i', n++);
        w.appendChild(s);
      });
      introText.appendChild(w);
      if (wi < arr.length - 1) { introText.appendChild(document.createTextNode(' ')); n++; }
    });
  }
  const sparks = $('introSparks');
  if (sparks) {
    for (let i = 0; i < 26; i++) {
      const e = document.createElement('i');
      e.style.cssText = `--x:${Math.random() * 100}%;--s:${1.5 + Math.random() * 3}px;` +
        `--t:${6 + Math.random() * 7}s;--d:-${Math.random() * 10}s;--dx:${(Math.random() - .5) * 80}px`;
      sparks.appendChild(e);
    }
  }

  /* =====================================================
     1. HIỆU ỨNG CANVAS: sao, cánh hoa, sao băng, pháo tim, mưa tim
     ===================================================== */
  const COLORS = ['#ff4f93', '#ffb3d1', '#f6d7a7', '#fff'];
  const stars = Array.from({ length: mobile ? 90 : 160 }, () => {
    const z = Math.random();
    return { x: Math.random(), y: Math.random(), z, r: .4 + z * 1.5, p: Math.random() * 6.28, s: .6 + Math.random() * 1.6, d: Math.random() * 5 };
  });
  const makePetal = () => ({
    x: Math.random(), y: -.1, z: .3 + Math.random() * .7,
    rot: Math.random() * 6.28, vr: (Math.random() - .5) * .03,
    vy: .0006 + Math.random() * .0012, sw: Math.random() * 6.28,
    c: ['#ff7aae', '#ff4f93', '#ffd0e2', '#f6d7a7'][Math.random() * 4 | 0],
    heart: Math.random() < .3
  });
  const petals = Array.from({ length: mobile ? 12 : 22 }, () => ({ ...makePetal(), y: Math.random() }));
  let shoots = [], bursts = [], petalsOn = 0;

  const drawHeart = (x, y, s, c, a) => {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.globalAlpha = a; ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.bezierCurveTo(-14, -2, -9, -14, 0, -6);
    ctx.bezierCurveTo(9, -14, 14, -2, 0, 9);
    ctx.fill();
    ctx.restore();
  };

  const frame = () => {
    t += .016;
    mx += (tx - mx) * .06;
    my += (ty - my) * .06;
    root.style.setProperty('--mx', mx.toFixed(3));
    root.style.setProperty('--my', my.toFixed(3));
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      const appear = Math.max(0, Math.min(1, (t - s.d) / 2));
      ctx.globalAlpha = appear * (.35 + .65 * Math.abs(Math.sin(t * s.s + s.p)));
      ctx.fillStyle = s.z > .7 ? '#fff4d6' : '#ffe0ee';
      ctx.beginPath();
      ctx.arc(s.x * W - mx * 40 * s.z * DPR, s.y * H - my * 40 * s.z * DPR, s.r * DPR, 0, 6.28);
      ctx.fill();
    }

    // Cánh hoa: ít hơn khi thư đang mở để không che chữ
    const petalTarget = body.classList.contains('letter-open') ? .45
      : (body.classList.contains('st2') || body.classList.contains('scene')) ? 1 : 0;
    petalsOn += (petalTarget - petalsOn) * .01;
    for (const p of petals) {
      p.y += p.vy; p.rot += p.vr; p.sw += .01;
      if (p.y > 1.1) Object.assign(p, makePetal());
      const x = (p.x + Math.sin(p.sw) * .03) * W + mx * 70 * p.z * DPR;
      const y = p.y * H + my * 40 * p.z * DPR;
      const size = (6 + p.z * 12) * DPR;
      const a = (.3 + p.z * .5) * petalsOn;
      if (p.heart) {
        drawHeart(x, y, size / 14, p.c, a);
      } else {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(p.rot);
        ctx.globalAlpha = a; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.ellipse(0, 0, size * .55, size * .3, 0, 0, 6.28); ctx.fill();
        ctx.restore();
      }
    }

    if (t > 3 && Math.random() < .004) shoots.push({ x: Math.random() * W, y: Math.random() * H * .4, l: 0 });
    shoots = shoots.filter(s => s.l < 1);
    for (const s of shoots) {
      s.l += .018;
      const x = s.x + s.l * 420 * DPR, y = s.y + s.l * 200 * DPR;
      const g = ctx.createLinearGradient(x, y, x - 120 * DPR, y - 57 * DPR);
      g.addColorStop(0, `rgba(255,240,220,${1 - s.l})`);
      g.addColorStop(1, 'rgba(255,240,220,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 2 * DPR;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 120 * DPR, y - 57 * DPR); ctx.stroke();
    }

    bursts = bursts.filter(b => b.a > 0);
    for (const b of bursts) {
      b.x += b.vx; b.y += b.vy; b.vy += .12 * DPR; b.a -= .012;
      drawHeart(b.x, b.y, b.s * DPR / 14, b.c, Math.max(b.a, 0));
    }

    ctx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(frame);
  };
  frame();

  // Pháo tim bung ra từ một điểm
  const burst = (x, y, n = 36) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = (2 + Math.random() * 6) * DPR;
      bursts.push({ x: x * DPR, y: y * DPR, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3 * DPR,
        a: 1, s: 8 + Math.random() * 14, c: COLORS[i % 4] });
    }
  };
  // Mưa tim rơi từ trên xuống
  const rain = n => {
    for (let i = 0; i < n; i++) {
      bursts.push({ x: Math.random() * W, y: -20 * DPR, vx: (Math.random() - .5) * DPR,
        vy: (1 + Math.random() * 2) * DPR, a: 1.2, s: 8 + Math.random() * 10, c: COLORS[i % 4] });
    }
  };

  /* =====================================================
     2. CÁC GIAI ĐOẠN: cảnh tặng hoa -> tiêu đề -> trái tim -> lời chúc
     ===================================================== */
  let timers = [], letterTimers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const lt = (fn, ms) => letterTimers.push(setTimeout(fn, ms));
  const clearLetterTimers = () => { letterTimers.forEach(clearTimeout); letterTimers = []; };

  const setStage = n => [1, 2, 3].forEach(i => body.classList.toggle('st' + i, n >= i));
  const play = () => {
    setStage(1);
    later(() => setStage(2), 3200);
    later(() => setStage(3), 6500);
  };

  /* ---------- Cảnh tặng hoa ---------- */
  const SCENE_MS = 9800;
  const ff = $('fireflies');
  if (ff) {
    for (let i = 0; i < 16; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', 50 + Math.random() * 700);
      c.setAttribute('cy', 180 + Math.random() * 250);
      c.setAttribute('r', 1.5 + Math.random() * 1.8);
      c.setAttribute('class', 'firefly');
      c.style.animationDelay = (Math.random() * 5) + 's';
      c.style.animationDuration = (4 + Math.random() * 4) + 's';
      ff.appendChild(c);
    }
  }
  const endScene = () => {
    if (!body.classList.contains('scene')) return;
    body.classList.add('flashing');
    later(() => { body.classList.remove('scene'); play(); }, 600);
    later(() => body.classList.remove('flashing'), 2200);
  };
  const startScene = () => {
    body.classList.add('scene');
    later(endScene, SCENE_MS);
  };

  /* =====================================================
     3. NHẠC NỀN
     ===================================================== */
  const bgm = $('bgm'), musicBtn = $('musicBtn'), vol = $('vol');
  bgm.volume = +vol.value;
  const syncBtn = () => musicBtn.setAttribute('aria-pressed', String(!bgm.paused));
  bgm.addEventListener('play', syncBtn);
  bgm.addEventListener('pause', syncBtn);
  bgm.addEventListener('error', () => {
    $('music').classList.add('nomusic');
    musicBtn.title = 'Không tìm thấy file nhạc static/music/love.mp3';
  });
  musicBtn.addEventListener('click', () => bgm.paused ? bgm.play().catch(() => {}) : bgm.pause());
  vol.addEventListener('input', () => { bgm.volume = +vol.value; });

  /* =====================================================
     4. CÁC NÚT BẤM
     ===================================================== */
  $('startBtn').addEventListener('click', e => {
    body.classList.add('started');
    bgm.play().catch(() => {});        // chỉ phát được sau thao tác chạm này
    burst(e.clientX, e.clientY, 40);
    startScene();
  });

  $('skipBtn').addEventListener('click', () => {
    clearTimers();
    endScene();
  });

  // Mở thư: phong thư -> nắp mở -> giấy nhô lên -> bức thư mở rộng -> mưa tim
  $('giftBtn').addEventListener('click', () => {
    body.classList.add('letter-open');
    lt(() => burst(innerWidth / 2, innerHeight * .42, 40), 1700);    // nắp thư mở
    lt(() => burst(innerWidth / 2, innerHeight * .5, 70), 3000);     // bức thư hiện ra
    for (let i = 0; i < 6; i++) lt(() => rain(10), 3200 + i * 700);
    lt(() => $('closeLetter').focus({ preventScroll: true }), 3500);
  });

  const closeLetter = () => {
    if (!body.classList.contains('letter-open')) return;
    clearLetterTimers();
    body.classList.remove('letter-open');
    body.classList.add('done');
    burst(innerWidth / 2, innerHeight / 2, 60);
    setTimeout(() => {
      document.querySelector('.finale').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  };
  $('closeLetter').addEventListener('click', closeLetter);
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeLetter(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeLetter(); });

  $('replayBtn').addEventListener('click', () => {
    clearTimers();
    body.classList.remove('done', 'flashing');
    setStage(0);
    scrollTo({ top: 0, behavior: 'smooth' });
    later(startScene, 700);            // xem lại từ cảnh tặng hoa, nhạc vẫn phát
  });

  $('heartScene').addEventListener('click', e => burst(e.clientX, e.clientY, 18));
})();