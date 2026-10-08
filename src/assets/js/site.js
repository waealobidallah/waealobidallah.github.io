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
