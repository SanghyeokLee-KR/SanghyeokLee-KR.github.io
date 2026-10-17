/* 첫 페이지: 머리 막대 선, 나타나기, 첫 화면의 장애 넘기기 장면, 분야 거르기, 작업 미리보기 */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  // 머리 막대는 내려가기 시작하면 아래 선을 긋는다
  var head = document.querySelector('.head');
  function onScroll() { head.classList.toggle('lined', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 스크롤해서 들어오는 묶음은 천천히 나타난다(시간축은 이때 막대가 그려진다)
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 첫 화면 장면: AWS에서 주 DB 전원을 끊은 시험 ----------
     실제로 확인한 것만 보여 준다. 전원 차단 → 예비 DB가 스스로 새 주 DB가 됨(23.0초, 숫자 띠에 표시)
     → 끊기기 직전 주문 196건을 하나씩 대조, 사라진 주문 없음.
     새 주 DB로 거래가 다시 흐르는 장면은 AWS 기록에 없으므로 그리지 않는다. */
  var scene = document.getElementById('scene');
  if (scene) (function () {
    var fig = document.getElementById('fig-failover');
    var log = scene.querySelectorAll('.sc-log li');
    var ticksBox = document.getElementById('ticks');
    var ticks = [];
    for (var i = 0; i < 196; i++) { var t = document.createElement('i'); ticksBox.appendChild(t); ticks.push(t); }

    // 그림마다 주문(점)이 지나는 길. x는 주 DB 앞에서 막히는 길
    var ROUTES = {
      wide: { a: 'M80 118 H96 V52 H296', b: 'M80 118 H96 V176 H262 V52 H296', ax: 'M80 118 H96 V52 H289', bx: 'M80 118 H96 V176 H262 V52 H289' },
      tall: { a: 'M170 40 V58 H85 V220', b: 'M170 40 V58 H255 V184 H85 V220', ax: 'M170 40 V58 H85 V213', bx: 'M170 40 V58 H255 V184 H85 V213' }
    };
    var views = Array.prototype.map.call(scene.querySelectorAll('svg.sc'), function (svg) {
      var R = ROUTES[svg.classList.contains('tall') ? 'tall' : 'wide'];
      return { svg: svg, R: R, layer: svg.querySelector('.pk-layer'), cache: {}, routes: [], blocked: false, pk: [], acc: 0, idx: 0,
        db1: svg.querySelector('[data-db="1"]'), db2: svg.querySelector('[data-db="2"]') };
    });
    function path(v, d) {
      if (v.cache[d]) return v.cache[d];
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', 'none');
      v.layer.appendChild(p);
      return (v.cache[d] = { el: p, len: p.getTotalLength() });
    }
    function flow(keys, blocked) {
      views.forEach(function (v) {
        v.pk.forEach(function (p) { p.el.remove(); }); v.pk = [];
        v.routes = keys.map(function (k) { return path(v, v.R[k]); });
        v.blocked = !!blocked; v.acc = 9999;
      });
    }
    function node(g, cls, name, tag) {
      g.setAttribute('class', 'n' + (cls ? ' ' + cls : ''));
      g.querySelector('.nt').textContent = name;
      g.querySelector('.tg').textContent = tag || '';
    }
    function logOn(n) { log.forEach(function (li) { li.classList.toggle('on', +li.getAttribute('data-p') <= n); }); }
    function setTicks(n) { for (var k = 0; k < 196; k++) ticks[k].classList.toggle('c', k < n); }

    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(scene);

    var last = 0;
    function tick(t) {
      var dt = last ? Math.min(64, t - last) : 16; last = t;
      if (visible && !document.hidden) views.forEach(function (v) {
        v.acc += dt;
        if (v.routes.length && v.acc >= 560) {
          v.acc = 0;
          var r = v.routes[v.idx++ % v.routes.length], c = document.createElementNS(NS, 'circle');
          c.setAttribute('r', 2.8); c.setAttribute('class', 'pk'); v.layer.appendChild(c);
          v.pk.push({ r: r, s: 0, el: c, hold: 0, x: v.blocked });
        }
        v.pk = v.pk.filter(function (p) {
          if (p.s < p.r.len) {
            p.s = Math.min(p.r.len, p.s + 140 * dt / 1000);
            var q = p.r.el.getPointAtLength(p.s);
            p.el.setAttribute('cx', q.x.toFixed(1)); p.el.setAttribute('cy', q.y.toFixed(1));
            if (p.s >= p.r.len && !p.x) { p.el.remove(); return false; }
            return true;
          }
          // 주 DB 앞에서 막힌 주문은 잠시 머물렀다 흐려진다
          if (!p.hold) p.el.setAttribute('class', 'pk x');
          p.hold += dt;
          p.el.setAttribute('opacity', Math.max(0, 1 - p.hold / 900).toFixed(2));
          if (p.hold > 900) { p.el.remove(); return false; }
          return true;
        });
      });
      requestAnimationFrame(tick);
    }

    function normal() {
      views.forEach(function (v) { v.svg.classList.remove('rep-off'); v.svg.style.opacity = ''; node(v.db1, '', '주 DB'); node(v.db2, '', '예비 DB'); });
      flow(['a', 'b']); logOn(0); setTicks(0); fig.classList.remove('hot');
    }
    function cut() {
      views.forEach(function (v) { v.svg.classList.add('rep-off'); node(v.db1, 'down', '주 DB', '전원 차단'); });
      flow(['ax', 'bx'], true); logOn(1);
    }
    function judge() { flow([]); views.forEach(function (v) { node(v.db2, 'pending', '예비 DB'); }); }
    function promote() {
      views.forEach(function (v) { node(v.db1, 'down', '주 DB', '꺼짐'); node(v.db2, 'ok', '새 주 DB', '승격'); });
      logOn(2); fig.classList.add('hot');
    }
    function verify() {
      logOn(3);
      var t0 = performance.now();
      (function f(now) {
        var k = Math.min(1, (now - t0) / 1800);
        setTicks(Math.round(196 * k));
        if (k < 1) requestAnimationFrame(f);
      })(t0);
    }
    function dim() { views.forEach(function (v) { v.svg.style.transition = 'opacity .4s'; v.svg.style.opacity = '.3'; }); }

    if (reduce) {
      // 움직임을 줄인 경우: 마지막 상태를 그대로 보여 준다
      views.forEach(function (v) { v.svg.classList.add('rep-off'); });
      promote(); logOn(3); setTicks(196);
      return;
    }
    // [이 단계를 실행하고, 다음 단계까지 기다릴 시간]
    var seq = [[normal, 4200], [cut, 2600], [judge, 1800], [promote, 1600], [verify, 5600], [dim, 450]];
    var at = 0;
    (function run() { seq[at][0](); var w = seq[at][1]; at = (at + 1) % seq.length; setTimeout(run, w); })();
    requestAnimationFrame(tick);
  })();

  /* ---------- 분야 거르기: 줄을 접고 펴며 개수를 바꾼다 ---------- */
  var buttons = document.querySelectorAll('.filter button');
  var works = document.querySelectorAll('.work');
  var count = document.getElementById('work-count');
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var n = 0;
      works.forEach(function (w) {
        var show = f === 'all' || w.getAttribute('data-kind').split(' ').indexOf(f) > -1;
        w.classList.toggle('hide', !show);
        var a = w.querySelector('a');
        if (show) { a.removeAttribute('tabindex'); w.removeAttribute('aria-hidden'); n++; }
        else { a.setAttribute('tabindex', '-1'); w.setAttribute('aria-hidden', 'true'); }
      });
      count.textContent = n;
    });
  });

  /* ---------- 작업 미리보기: 마우스를 따라오고, 키보드로 고르면 그 줄 옆에 뜬다 ---------- */
  var peek = document.querySelector('.peek');
  if (!peek || !window.matchMedia('(hover: hover)').matches) return;
  var img = peek.querySelector('img');
  var cap = peek.querySelector('.cap');
  var tx = 0, ty = 0, x = 0, y = 0, raf = 0, active = null, byKey = false;
  var W = 420, H = 262;

  function place() {
    x += (tx - x) * (reduce ? 1 : 0.16);
    y += (ty - y) * (reduce ? 1 : 0.16);
    peek.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
    if (Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4) raf = requestAnimationFrame(place);
    else raf = 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(place); }
  function aim(cx, cy) {
    // 오른쪽 아래에 두되 화면 밖으로 나가지 않게
    var px = cx + 28, py = cy - H / 2;
    if (px + W > window.innerWidth - 16) px = cx - W - 28;
    py = Math.max(76, Math.min(window.innerHeight - H - 16, py));
    tx = px; ty = py;
  }
  function aimAt(a) { var r = a.getBoundingClientRect(); aim(r.left + r.width * 0.62, r.top + r.height / 2); }
  function show(li, cx, cy, jump) {
    if (active !== li) {
      active = li;
      img.src = li.getAttribute('data-img');
      cap.textContent = li.querySelector('.w-title').firstChild.textContent.trim() + ' · ' + (li.getAttribute('data-cap') || '');
      peek.classList.toggle('light', li.getAttribute('data-tone') === 'light');
    }
    aim(cx, cy);
    if (jump) { x = tx; y = ty; }
    kick();
    peek.classList.add('on');
  }
  function hide() { active = null; byKey = false; peek.classList.remove('on'); }

  works.forEach(function (li) {
    var a = li.querySelector('a');
    a.addEventListener('mouseenter', function (e) { byKey = false; show(li, e.clientX, e.clientY, !peek.classList.contains('on')); });
    a.addEventListener('mousemove', function (e) { aim(e.clientX, e.clientY); kick(); });
    a.addEventListener('mouseleave', function () { if (!byKey) hide(); });
    a.addEventListener('focus', function () {
      if (!a.matches(':focus-visible')) return;
      byKey = true;
      var r = a.getBoundingClientRect();
      show(li, r.left + r.width * 0.62, r.top + r.height / 2, true);
    });
    a.addEventListener('blur', hide);
  });
  // 스크롤하면 마우스 미리보기는 닫고, 키보드로 고른 줄의 미리보기는 줄을 따라간다
  window.addEventListener('scroll', function () {
    if (!active) return;
    if (byKey) { aimAt(active.querySelector('a')); x = tx; y = ty; kick(); }
    else if (!active.matches(':hover')) hide();
  }, { passive: true });
})();
