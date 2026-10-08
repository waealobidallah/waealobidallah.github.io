/* Waeal J. Obidallah — site behaviour (v1). Content comes from /data/*.json so it can be edited at /admin. */
(function () {
  const root = document.documentElement;
  const BASE = root.getAttribute('data-base') || '';
  const AR = root.lang === 'ar';
  const q = (s, el = document) => el.querySelector(s);
  const qa = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // mobile menu
  const burger = q('.burger'), menu = q('.menu');
  if (burger && menu) burger.addEventListener('click', () => menu.classList.toggle('open'));

  // reveal on scroll
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 }) : null;
  qa('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  // animated counters
  const animate = el => {
    const target = el.getAttribute('data-count'); const suffix = el.getAttribute('data-suffix') || '';
    const n = parseFloat(target.replace(/[^0-9.]/g, '')); if (isNaN(n)) return;
    const dur = 1200, t0 = performance.now();
    const fmt = v => (target.includes(',') ? Math.round(v).toLocaleString('en-US') : Math.round(v));
    const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(n * e) + suffix; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const cio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); } })) : null;
  qa('[data-count]').forEach(el => cio ? cio.observe(el) : animate(el));

  const load = async f => { try { const r = await fetch(BASE + 'data/' + f, { cache: 'no-cache' }); return r.ok ? r.json() : null; } catch (e) { return null; } };

  // updates.json → Now strip, news, insights, talks
  load('updates.json').then(u => {
    if (!u) return;
    const now = q('[data-now]'); if (now && u.now) { now.innerHTML = `<strong>${esc(AR ? 'الآن · ' + u.now.date_ar : 'Now · ' + u.now.date)}</strong> — ${esc(AR ? u.now.text_ar : u.now.text)}`; }
    const news = q('[data-news]'); if (news && u.news) news.innerHTML = u.news.map(n => `<li class="insight"><span class="d">${esc(n.label)}</span><h4 style="font-weight:600">${AR && n.text_ar ? n.text_ar : n.text}</h4></li>`).join('');
    const ins = q('[data-insights]'); if (ins && u.insights) ins.innerHTML = u.insights.map(i => `<a class="insight" ${i.url ? `href="${esc(i.url)}" target="_blank" rel="noopener"` : ''} ${i.lang === 'ar' ? 'dir="rtl"' : 'dir="ltr"'}><span class="d">${esc(i.date)} · ${esc(i.where)}${i.status === 'coming' ? (AR ? ' · قريبًا' : ' · coming') : ''}</span><h4>${esc(i.title)}</h4><span class="arrow">→</span></a>`).join('');
    const talks = q('[data-talks]'); if (talks && u.talks) talks.innerHTML = u.talks.map(t => `<li class="insight"><span class="d">${esc(t.date)}</span><h4 style="font-weight:600"><b>${esc(t.event)}</b>, ${esc(t.place)} — ${esc(AR && t.role_ar ? t.role_ar : t.role)}</h4></li>`).join('');
  });

  // publications.json → metrics, selected list, full list with filters
  load('publications.json').then(p => {
    if (!p) return;
    const m = p.metrics || {};
    qa('[data-metric]').forEach(el => { const k = el.getAttribute('data-metric'); if (m[k] != null) { el.setAttribute('data-count', String(m[k])); animate(el); } });
    const sel = q('[data-selected-pubs]');
    if (sel) sel.innerHTML = p.items.filter(i => i.selected).map(i => card(i, true)).join('');
    const full = q('[data-pubs]');
    if (full) {
      const render = f => {
        const items = p.items.filter(i => f === 'all' || i.type === f || (i.tags || []).includes(f) || (f === 'lead' && (i.role === 'first' || i.role === 'sole')));
        let y = null, out = '';
        items.sort((a, b) => b.year - a.year).forEach(i => { if (i.year !== y) { y = i.year; } out += card(i, false); });
        full.innerHTML = out || `<p class="muted">${AR ? 'لا نتائج' : 'No results'}</p>`;
        const c = q('[data-pubcount]'); if (c) c.textContent = items.length;
      };
      render('all');
      qa('.filters button').forEach(b => b.addEventListener('click', () => { qa('.filters button').forEach(x => x.classList.remove('on')); b.classList.add('on'); render(b.getAttribute('data-f')); }));
    }
    function card(i, brief) {
      const role = i.role === 'sole' ? (AR ? 'مؤلف منفرد' : 'Sole author') : i.role === 'first' ? (AR ? 'مؤلف أول' : 'First author') : '';
      const authors = esc(i.authors).replace(/Obidallah/g, '<b>Obidallah</b>');
      const doi = i.doi ? `<a href="https://doi.org/${esc(i.doi)}" target="_blank" rel="noopener">DOI</a>` : '';
      const type = i.type === 'journal' ? (AR ? 'مجلة' : 'Journal') : (AR ? 'مؤتمر' : 'Conference');
      return `<article class="pub reveal in" dir="ltr"><div class="yr">${i.year}</div><div><h4>${esc(i.title)}</h4><div class="meta">${authors} · <em>${esc(i.venue)}</em> ${doi ? '· ' + doi : ''}</div>${brief && i.blurb ? `<p class="small muted" style="margin:.4em 0 0">${esc(i.blurb)}</p>` : ''}<div class="tags"><span class="tag navy">${type}</span>${role ? `<span class="tag">${role}</span>` : ''}${(i.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}${i.citations ? `<span class="tag navy">${i.citations} ${AR ? 'استشهاد' : 'citations'}</span>` : ''}</div></div></article>`;
    }
  });

  // contact form → mailto (no backend needed on GitHub Pages)
  const form = q('form[data-mailto]');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const body = `${d.get('name')} <${d.get('email')}>\n\n${d.get('message')}`;
    location.href = `mailto:${form.getAttribute('data-mailto')}?subject=${encodeURIComponent((AR ? 'رسالة من الموقع — ' : 'Message from website — ') + d.get('name'))}&body=${encodeURIComponent(body)}`;
  });

  // footer year
  qa('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();

/* ===== v1.1 interactive layer ===== */
(function () {
  const AR = document.documentElement.lang === 'ar';
  const q = (s, el = document) => el.querySelector(s), qa = (s, el = document) => [...el.querySelectorAll(s)];

  // theme toggle (persisted per browser)
  const root = document.documentElement;
  try { const t = localStorage.getItem('theme'); if (t) root.setAttribute('data-theme', t); } catch (e) {}
  const tbtn = q('.theme');
  const paint = () => { if (tbtn) tbtn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀' : '☾'; };
  paint();
  if (tbtn) tbtn.addEventListener('click', () => { const d = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; root.setAttribute('data-theme', d); try { localStorage.setItem('theme', d); } catch (e) {} paint(); });

  // scroll progress + back to top + active nav
  const bar = document.createElement('div'); bar.id = 'progress'; document.body.appendChild(bar);
  const top = document.createElement('button'); top.id = 'totop'; top.textContent = '↑'; top.title = AR ? 'إلى الأعلى' : 'Back to top'; document.body.appendChild(top);
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const sections = qa('section[id]');
  const navLinks = qa('.menu a[href*="#"]');
  const onScroll = () => {
    const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max ? (h.scrollTop / max) * 100 : 0) + '%';
    top.classList.toggle('show', h.scrollTop > 600);
    let cur = null; sections.forEach(s => { if (s.getBoundingClientRect().top < 140) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('active', !!cur && a.getAttribute('href').endsWith('#' + cur)));
    qa('.path').forEach(p => {
      const r = p.getBoundingClientRect(), vh = innerHeight;
      const pct = Math.max(0, Math.min(100, ((vh * .75 - r.top) / r.height) * 100));
      p.style.setProperty('--fill', pct + '%');
      qa('.stage', p).forEach(st => st.classList.toggle('lit', st.getBoundingClientRect().top < vh * .75));
    });
  };
  qa('.path').forEach(p => { const f = document.createElement('div'); f.className = 'fill'; p.prepend(f); });
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // collapsible timeline stages
  qa('.stage h3').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('closed')));

  // 3D tilt on cards
  if (matchMedia('(hover:hover)').matches) qa('.card').forEach(c => {
    c.classList.add('tilt');
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-3px)`; });
    c.addEventListener('mouseleave', () => c.style.transform = '');
  });

  // hero particle network (canvas)
  const cv = q('#hero-canvas');
  if (cv && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    const ctx = cv.getContext('2d'); let W, H, pts = [], mouse = { x: -1e4, y: -1e4 };
    const resize = () => { W = cv.width = cv.offsetWidth * devicePixelRatio; H = cv.height = cv.offsetHeight * devicePixelRatio; const n = Math.min(130, Math.floor(W * H / 16000)); pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25 * devicePixelRatio, vy: (Math.random() - .5) * .25 * devicePixelRatio })); };
    resize(); addEventListener('resize', resize);
    cv.parentElement.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); mouse = { x: (e.clientX - r.left) * devicePixelRatio, y: (e.clientY - r.top) * devicePixelRatio }; });
    cv.parentElement.addEventListener('mouseleave', () => mouse = { x: -1e4, y: -1e4 });
    const D = 140 * devicePixelRatio;
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy); if (d < D) { p.x -= dx / d * .6; p.y -= dy / d * .6; } });
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < D) { ctx.strokeStyle = `rgba(127,214,203,${(1 - d / D) * .35})`; ctx.lineWidth = devicePixelRatio; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      ctx.fillStyle = 'rgba(127,214,203,.8)'; pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 * devicePixelRatio, 0, 7); ctx.fill(); });
      requestAnimationFrame(frame);
    })();
  }

  // typed rotating phrase in hero
  const typed = q('.typed');
  if (typed && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    const words = JSON.parse(typed.getAttribute('data-words') || '[]'); let wi = 0, ci = 0, del = false;
    if (words.length) (function tick() {
      const w = words[wi]; typed.textContent = w.slice(0, ci);
      if (!del && ci < w.length) { ci++; setTimeout(tick, 45); }
      else if (!del) { del = true; setTimeout(tick, 2200); }
      else if (ci > 0) { ci--; setTimeout(tick, 22); }
      else { del = false; wi = (wi + 1) % words.length; setTimeout(tick, 300); }
    })();
  }

  // capability radar (SVG) with hover/click evidence
  qa('[data-radar]').forEach(radar => {
    const axes = JSON.parse(radar.getAttribute('data-radar')); const n = axes.length, R = 140, cx = 270, cy = 200;
    const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    let svg = `<svg viewBox="0 0 540 400">`;
    [.25, .5, .75, 1].forEach(f => svg += `<polygon points="${axes.map((_, i) => pt(i, R * f).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`);
    axes.forEach((a, i) => { const [x, y] = pt(i, R); svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`; });
    svg += `<polygon class="area" points="${axes.map((a, i) => pt(i, R * a.v).join(',')).join(' ')}" fill="rgba(14,124,114,.22)" stroke="var(--teal)" stroke-width="2.5" stroke-linejoin="round"/>`;
    axes.forEach((a, i) => { const [x, y] = pt(i, R * a.v), [lx, ly] = pt(i, R + 22); const anc = lx > cx + 12 ? "start" : lx < cx - 12 ? "end" : "middle"; svg += `<g class="axis" data-i="${i}"><circle cx="${x}" cy="${y}" r="5" fill="var(--teal)"/><text x="${lx}" y="${ly}" text-anchor="${anc}" dominant-baseline="middle">${a.label}</text></g>`; });
    svg += '</svg>'; q('.radar-svg', radar).innerHTML = svg;
    const info = q('.radar-info', radar);
    const show = i => { qa('.axis', radar).forEach(g => g.classList.toggle('on', +g.dataset.i === i)); info.innerHTML = `<h4>${axes[i].label}</h4><p class="muted small">${axes[i].text}</p>`; };
    qa('.axis', radar).forEach(g => { g.addEventListener('mouseenter', () => show(+g.dataset.i)); g.addEventListener('click', () => show(+g.dataset.i)); });
    show(0);
  });

  // profile slider (capability / research)
  qa('.slider').forEach(sl => {
    const track = q('.track', sl), slides = qa('.slide', track), dots = q('.dots', sl); let i = 0;
    dots.innerHTML = slides.map((s, k) => `<button data-k="${k}" aria-label="${s.dataset.title}">${s.dataset.title}</button>`).join('');
    const rtl = getComputedStyle(track).direction === 'rtl';
    const go = k => { i = (k + slides.length) % slides.length; track.scrollTo({ left: i * track.clientWidth * (rtl ? -1 : 1), behavior: 'smooth' }); qa('button', dots).forEach((b, j) => b.classList.toggle('on', j === i)); };
    const sync = () => { const w = track.clientWidth; i = Math.round(Math.abs(track.scrollLeft) / w); qa('button', dots).forEach((b, k) => b.classList.toggle('on', k === i)); };
    q('.prev', sl).addEventListener('click', () => go(i - 1)); q('.next', sl).addEventListener('click', () => go(i + 1));
    qa('button', dots).forEach(b => b.addEventListener('click', () => go(+b.dataset.k)));
    track.addEventListener('scroll', sync, { passive: true }); sync();
  });

  // publications: year chart + live search (hooks into data rendered by the first block)
  const pubs = q('[data-pubs]');
  if (pubs) {
    const tools = q('.pubtools'); let items = [], yearSel = null;
    const chart = q('.yearchart'), search = q('.pubtools input');
    const apply = () => {
      const t = (search?.value || '').trim().toLowerCase();
      let shown = 0;
      qa('.pub', pubs).forEach(el => {
        const y = +el.dataset.year; const txt = el.textContent.toLowerCase();
        const ok = (!yearSel || y === yearSel) && (!t || txt.includes(t)) && !el.classList.contains('filtered');
        el.style.display = ok ? '' : 'none'; if (ok) shown++;
        const h = q('h4', el); if (h) { const raw = h.getAttribute('data-raw') || h.textContent; h.setAttribute('data-raw', raw); h.innerHTML = t ? raw.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), m => `<mark>${m}</mark>`) : raw; }
      });
      const c = q('[data-pubcount]'); if (c) c.textContent = shown;
    };
    const buildChart = () => {
      const counts = {}; qa('.pub', pubs).forEach(el => { const y = el.dataset.year; counts[y] = (counts[y] || 0) + 1; });
      const years = Object.keys(counts).sort(); const max = Math.max(...Object.values(counts));
      chart.innerHTML = years.map(y => `<div class="bar" data-y="${y}" title="${counts[y]} in ${y}"><i style="height:0"></i><b>${y.slice(2)}</b></div>`).join('');
      requestAnimationFrame(() => qa('.bar i', chart).forEach((i, k) => i.style.height = (counts[years[k]] / max * 70) + 'px'));
      qa('.bar', chart).forEach(b => b.addEventListener('click', () => { yearSel = yearSel === +b.dataset.y ? null : +b.dataset.y; qa('.bar', chart).forEach(x => x.classList.toggle('on', +x.dataset.y === yearSel)); apply(); }));
    };
    // wait for the list to be rendered by the data loader
    const mo = new MutationObserver(() => { qa('.pub', pubs).forEach(el => { if (!el.dataset.year) el.dataset.year = q('.yr', el).textContent.trim(); }); if (chart && !chart.children.length) buildChart(); apply(); });
    mo.observe(pubs, { childList: true });
    if (search) search.addEventListener('input', apply);
  }

  // case-study stepper
  const stepper = q('.stepper');
  if (stepper) {
    const panel = q('.steppanel'); const btns = qa('button', stepper);
    const go = i => { btns.forEach((b, k) => b.classList.toggle('on', k === i)); panel.innerHTML = `<h4>${btns[i].dataset.title}</h4><p class="muted" style="margin:0">${btns[i].dataset.text}</p>`; };
    btns.forEach((b, i) => b.addEventListener('click', () => go(i))); go(0);
    let i = 0; const auto = setInterval(() => { i = (i + 1) % btns.length; go(i); }, 4000); stepper.addEventListener('click', () => clearInterval(auto));
  }

  // logo marquee captions
  const cap = q('.logo-caption');
  if (cap) qa('.logo').forEach(l => { const on = () => { qa('.logo').forEach(x => x.classList.toggle('on', x === l)); cap.innerHTML = `<b>${l.dataset.name}</b> — ${l.dataset.role}`; }; l.addEventListener('mouseenter', on); l.addEventListener('click', on); l.addEventListener('focus', on); });

  // impact gauges: reveal (counters handled by [data-count] observer above)
  const gio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); gio.unobserve(e.target); } }), { threshold: .35 }) : null;
  qa('.gauge').forEach(g => gio ? gio.observe(g) : g.classList.add('in'));

  // copy e-mail
  qa('.copy').forEach(b => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(b.dataset.copy); const t = b.textContent; b.textContent = AR ? 'تم النسخ ✓' : 'Copied ✓'; setTimeout(() => b.textContent = t, 1500); } catch (e) {} }));
})();
