(() => {
  /* ========== CHỈNH Ở ĐÂY ========== */
  // Mỗi dòng là một ảnh: src là đường dẫn ảnh, cap là dòng chữ hiện bên dưới.
  // Thêm bao nhiêu ảnh cũng được, nhớ có dấu phẩy ở cuối mỗi dòng.
    const PHOTOS = [
    { src: '/static/images/1.jpg', cap: 'Lần đầu mình gặp nhau' },
    { src: '/static/images/2.jpg', cap: 'Một ngày thật bình yên bên em' },
    { src: '/static/images/3.jpg', cap: 'Nụ cười làm cả thế giới dịu lại' },
    { src: '/static/images/4.jpg', cap: 'Mong còn thật nhiều ngày như thế' },
    { src: '/static/images/6.jpg', cap: 'Bên em, nơi nào cũng thành nhà' },
    { src: '/static/images/7.jpg', cap: 'Chỉ cần có em, ngày nào cũng đẹp' },
    { src: '/static/images/8.jpg', cap: 'Cảm ơn em vì đã ở bên mình' },
  ];
  const AUTO_MS = 5500;      // tự chuyển ảnh sau mỗi bao nhiêu mili giây
  /* ================================== */

  const $ = id => document.getElementById(id);
  const body = document.body;
  const gal = $('gallery'), stage = $('galStage'), capEl = $('galCap'), dots = $('galDots'), heartsBox = $('galHearts');
  if (!gal || !PHOTOS.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = PHOTOS.length;
  let cur = 0, autoT = null, heartT = null, downX = null, moved = false;

  // Tạo các tấm polaroid và chấm tròn
  const cards = PHOTOS.map((p, i) => {
    const c = document.createElement('div');
    c.className = 'gal-card';
    const img = new Image();
    img.src = p.src; img.alt = p.cap; img.draggable = false;
    img.onerror = () => {                       // chưa có ảnh: hiện khung trái tim
      const ph = document.createElement('div');
      ph.className = 'ph'; ph.textContent = '♥';
      img.replaceWith(ph);
    };
        c.appendChild(img);
    const cp = document.createElement('p');      // chữ viết tay nằm ngay trên tấm ảnh
    cp.className = 'gal-card-cap';
    cp.textContent = p.cap;
    c.appendChild(cp);
    c.addEventListener('click', () => { if (!moved && i !== cur) go(i, true); });
    stage.appendChild(c);

    const d = document.createElement('i');
    dots.appendChild(d);
    return c;
  });

  function layout() {
    cards.forEach((c, i) => {
      let d = ((i - cur) % n + n) % n;
      if (d > n / 2) d -= n;
      const a = Math.abs(d);
      const tilt = (i % 2 ? -1 : 1) * 3;
      c.style.transform = `translateX(${d * 58}%) translateZ(${-a * 150}px) rotateY(${-d * 32}deg) rotateZ(${d === 0 ? 0 : tilt}deg) scale(${d === 0 ? 1 : .9})`;
      c.style.opacity = a > 2 ? 0 : 1 - a * .28;
      c.style.zIndex = 10 - a;
      c.style.filter = d === 0 ? 'none' : 'brightness(.6)';
      c.style.pointerEvents = a > 2 ? 'none' : 'auto';
      c.classList.toggle('on', d === 0);
    });
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === cur));
  }

  function showCap() {
    capEl.style.opacity = 0;
    setTimeout(() => { capEl.textContent = PHOTOS[cur].cap; capEl.style.opacity = 1; }, 300);
  }

  function go(i, user) {
    cur = ((i % n) + n) % n;
    layout(); showCap();
    if (user) startAuto();
  }

  function startAuto() {
    clearInterval(autoT);
    if (!reduce && n > 1) autoT = setInterval(() => go(cur + 1), AUTO_MS);
  }

  // Trái tim bay lên phía sau
  function spawnHeart() {
    const h = document.createElement('i');
    h.textContent = '♥';
    const t = 7 + Math.random() * 6;
    h.style.cssText = `--x:${Math.random() * 100}%;--s:${10 + Math.random() * 18}px;--t:${t}s;` +
      `--dx:${(Math.random() - .5) * 120}px;--c:${['#ff7aae', '#ff4f93', '#ffd0e2', '#f6d7a7'][Math.random() * 4 | 0]}`;
    heartsBox.appendChild(h);
    setTimeout(() => h.remove(), t * 1000);
  }

  function open() {
    body.classList.add('gallery-open');
    gal.setAttribute('aria-hidden', 'false');
    go(0);
    startAuto();
    if (!reduce) { for (let i = 0; i < 8; i++) setTimeout(spawnHeart, i * 150); heartT = setInterval(spawnHeart, 800); }
  }
  function close() {
    if (!body.classList.contains('gallery-open')) return;
    body.classList.remove('gallery-open');
    gal.setAttribute('aria-hidden', 'true');
    clearInterval(autoT); clearInterval(heartT);
  }

  $('galleryBtn').addEventListener('click', open);
  $('galleryClose').addEventListener('click', close);
  $('galPrev').addEventListener('click', () => go(cur - 1, true));
  $('galNext').addEventListener('click', () => go(cur + 1, true));
  addEventListener('keydown', e => {
    if (!body.classList.contains('gallery-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') go(cur - 1, true);
    if (e.key === 'ArrowRight') go(cur + 1, true);
  });

  // Vuốt trái/phải để chuyển ảnh
  stage.addEventListener('pointerdown', e => { downX = e.clientX; moved = false; });
  stage.addEventListener('pointermove', e => { if (downX !== null && Math.abs(e.clientX - downX) > 8) moved = true; });
  stage.addEventListener('pointerup', e => {
    if (downX === null) return;
    const dx = e.clientX - downX; downX = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? cur + 1 : cur - 1, true);
    setTimeout(() => { moved = false; }, 0);
  });
  stage.addEventListener('pointercancel', () => { downX = null; });
})();