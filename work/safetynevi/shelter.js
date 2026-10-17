/* SafetyNevi 페이지 전용: 대피소 고르기를 눌러 보는 그림
   backend/ 8쪽의 그림을 장면으로 나눴다. 위험 구역은 관리자가 발령한 원형 구역만 쓴다.
   틀(탭·그림·요약·단계 목록)은 js/flow.js와 같은 모양으로 만들어 공통 스타일을 그대로 받는다.
   그림 속 거리와 자리는 설명을 위한 예시이고 실제 축척이 아니다. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.getElementById('shelter-flow');
  if (!root) return;

  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* 자리: 넓은 화면과 좁은 화면. 위험 원 z, 출발 s, 대피소 a·b·c, 도로, 실제 도로 경로, 찾는 범위 세 겹 */
  var L = {
    wide: {
      w: 960, h: 460, sq: 30, fs: 1,
      s: [150, 300], z: [510, 240, 130], a: [540, 214], b: [880, 290], c: [330, 410],
      roads: [[0, 120, 960, 120], [0, 360, 960, 360], [150, 0, 150, 460], [330, 0, 330, 460], [720, 0, 720, 460]],
      route: [[150, 300], [150, 360], [330, 360], [330, 395]],
      box: [70, 200, 0],
      tags: {
        a: { x: 566, y: 219, t: '구역 안이라 제외' },
        b: { x: 900, y: 330, t: '길이 구역을 지나 제외', end: true },
        c: { x: 356, y: 415, t: '길이 구역 밖이라 추천' }
      },
      zl: '위험 구역', zs: '관리자가 발령한 원형 구역'
    },
    narrow: {
      w: 360, h: 440, sq: 26, fs: 1,
      s: [50, 270], z: [205, 175, 72], a: [215, 160], b: [326, 215], c: [140, 380],
      roads: [[0, 90, 360, 90], [0, 330, 360, 330], [50, 0, 50, 440], [140, 0, 140, 440], [300, 0, 300, 440]],
      route: [[50, 270], [50, 330], [140, 330], [140, 367]],
      box: [40, 125, 0],
      tags: {
        a: { x: 236, y: 140, t: '구역 안' },
        b: { x: 346, y: 252, t: '길이 구역을 지남', end: true },
        c: { x: 162, y: 385, t: '추천' }
      },
      zl: '위험 구역', zs: '원형'
    }
  };

  /* 장면. on은 그 단계까지 누적되는 상태(요소 이름 → 상태) */
  var SC = [
    {
      label: '대피소 고르기', title: 'A, B, C 가운데 고르기',
      result: 'A와 B가 빠지고 C가 남았습니다. 실제 화면에서는 남은 후보 중 세 곳을 보여 줍니다.',
      init: { s: 'on', a: 'on', b: 'on', c: 'on' },
      steps: [
        { say: '출발지 근처에서 대피소 A, B, C를 찾았습니다. 위험 구역이 있으면 이 원을 기준으로 거릅니다.', on: { z: 'on' } },
        { say: 'A는 원 안에 있어서 가까워도 뺍니다.', on: { a: 'out' } },
        { say: 'B로 가는 선분은 원의 중심에서 반지름보다 가깝게 지나갑니다. 길이 구역을 지나므로 B도 뺍니다.', on: { sb: 'on', pd: 'on', b: 'out' } },
        { say: 'C로 가는 선분은 중심에서 반지름보다 멀리 지나가서 C가 남습니다.', on: { sc: 'on', c: 'ok' } },
        { say: '실제 도로 경로는 Kakao Mobility에서 받아 그리고, 이 경로가 구역을 지나면 화면에 경고를 띄웁니다.', on: { rt: 'on' } }
      ]
    },
    {
      label: '범위 넓히기', title: '후보가 세 곳 모일 때까지 넓히기',
      result: '세 곳이 모이면 범위 넓히기를 멈추고, 그다음 위험 구역을 기준으로 거릅니다.',
      init: { s: 'on', a: 'dim', b: 'dim', c: 'dim' },
      steps: [
        { say: '먼저 출발지 둘레 5km 안에서 찾습니다. 범위는 원이 아니라 위경도 사각형입니다.', on: { k1: 'on' } },
        { say: '세 곳이 안 되면 20km로 넓힙니다.', on: { k2: 'on', c: 'on' } },
        { say: '그래도 모자라면 100km까지 넓히고, 세 곳이 모이면 멈춥니다.', on: { k3: 'on', a: 'on', b: 'on' } },
        { say: '모인 후보는 이제 위험 구역을 기준으로 거릅니다.', on: { z: 'on' } }
      ]
    }
  ];

  var ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4"/><path d="M2.5 2.5v3h3"/></svg>';
  root.innerHTML =
    '<div class="flow-top"><p class="ttl"><span class="lbl">' + (root.getAttribute('data-kicker') || '눌러 보기') + '</span><span></span></p>' +
    '<div class="tabs" role="tablist" aria-label="장면 고르기"></div></div>' +
    '<div class="stagebox"></div>' +
    '<div class="flow-bot"><div class="flow-sum"><p class="h"></p><p class="r"></p>' +
    '<div class="ctrl"><button class="btn replay" type="button">' + ICON + '다시 재생</button><span class="stepc"></span></div></div>' +
    '<ol class="steps" aria-label="단계"></ol></div><p class="live sr" aria-live="polite"></p>';
  root.querySelector('.ttl span:last-child').textContent = root.getAttribute('data-title') || '';

  var box = root.querySelector('.stagebox'), stepsEl = root.querySelector('.steps');
  var sumH = root.querySelector('.flow-sum .h'), sumR = root.querySelector('.flow-sum .r');
  var counter = root.querySelector('.stepc'), live = root.querySelector('.live');
  var tabs = root.querySelector('.tabs');
  var sc = 0, step = -1, token = 0, key = null, el = {}, svg = null;

  SC.forEach(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = s.label;
    b.addEventListener('click', function () { play(i); });
    tabs.appendChild(b);
  });
  tabs.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var i = (sc + (e.key === 'ArrowRight' ? 1 : SC.length - 1)) % SC.length;
    play(i); tabs.children[i].focus();
  });
  root.querySelector('.replay').addEventListener('click', function () { play(sc); });

  // 점과 선분 사이의 최단 거리에 닿는 점
  function foot(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    return [a[0] + dx * t, a[1] + dy * t];
  }

  function draw() {
    var G = L[key];
    if (svg) svg.remove();
    svg = mk('svg', { viewBox: '0 0 ' + G.w + ' ' + G.h, class: 'sv-map', role: 'img',
      'aria-label': '출발지와 대피소 A, B, C, 원형 위험 구역. A는 구역 안이라 제외, B는 가는 길이 구역을 지나 제외, C는 길이 구역을 지나지 않아 추천합니다.' });
    box.appendChild(svg);
    el = {};
    var defs = mk('defs', {}, svg);
    var pat = mk('pattern', { id: 'sn-hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    mk('line', { x1: 0, y1: 0, x2: 0, y2: 7, class: 'hl' }, pat);

    mk('rect', { x: 0, y: 0, width: G.w, height: G.h, class: 'ground' }, svg);
    var rg = mk('g', { class: 'roads' }, svg);
    G.roads.forEach(function (r) { mk('line', { x1: r[0], y1: r[1], x2: r[2], y2: r[3] }, rg); });

    // 찾는 범위 세 겹(넓히기 장면)
    var s = G.s;
    [['k1', G.box[0], '5km'], ['k2', G.box[1], '20km'], ['k3', G.box[2], '100km']].forEach(function (k) {
      var g = mk('g', { class: 'rng' }, svg);
      var x1, y1, x2, y2;
      if (k[1]) { x1 = Math.max(8, s[0] - k[1]); y1 = Math.max(8, s[1] - k[1]); x2 = Math.min(G.w - 8, s[0] + k[1]); y2 = Math.min(G.h - 8, s[1] + k[1]); }
      else { x1 = 8; y1 = 8; x2 = G.w - 8; y2 = G.h - 8; }
      mk('rect', { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }, g);
      var t = mk('text', k[1] ? { x: x1 + 8, y: y2 - 9, class: 'rl' } : { x: x1 + 8, y: y1 + 18, class: 'rl' }, g); t.textContent = k[2];
      el[k[0]] = g;
    });

    // 위험 원
    var z = G.z, zg = mk('g', { class: 'zone' }, svg);
    mk('circle', { cx: z[0], cy: z[1], r: z[2], class: 'zf' }, zg);
    mk('circle', { cx: z[0], cy: z[1], r: 3.5, class: 'zc' }, zg);
    var zt = mk('text', { x: z[0], y: z[1] - z[2] - 12, class: 'zl', 'text-anchor': 'middle' }, zg);
    zt.textContent = G.zl;
    var zs = mk('tspan', { class: 'zs', dx: 8 }, zt); zs.textContent = G.zs;
    el.z = zg;

    // 선분: 출발 → B, 출발 → C, 중심에서 선분까지의 수선
    function seg(id, a, b, cls) {
      var p = mk('path', { d: 'M' + a[0] + ' ' + a[1] + ' L' + b[0] + ' ' + b[1], class: 'seg ' + cls }, svg);
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      p.style.setProperty('--len', len.toFixed(1));
      el[id] = p;
    }
    seg('sb', s, G.b, 'bad');
    var f = foot([z[0], z[1]], s, G.b);
    var pg = mk('g', { class: 'perp' }, svg);
    mk('line', { x1: z[0], y1: z[1], x2: f[0], y2: f[1] }, pg);
    mk('circle', { cx: f[0], cy: f[1], r: 3 }, pg);
    var dt = mk('text', { x: z[0] + 10, y: (z[1] + f[1]) / 2 + 5, class: 'dl' }, pg); dt.textContent = 'd < r';
    el.pd = pg;
    seg('sc', s, G.c, 'good');

    // 실제 도로 경로
    var rp = G.route.map(function (q, i) { return (i ? 'L' : 'M') + q[0] + ' ' + q[1]; }).join(' ');
    var rt = mk('path', { d: rp, class: 'seg route' }, svg);
    var rl = 0; for (var i = 1; i < G.route.length; i++) rl += Math.hypot(G.route[i][0] - G.route[i - 1][0], G.route[i][1] - G.route[i - 1][1]);
    rt.style.setProperty('--len', rl.toFixed(1));
    el.rt = rt;

    // 대피소
    ['a', 'b', 'c'].forEach(function (id) {
      var p = G[id], h = G.sq / 2, g = mk('g', { class: 'shel' }, svg);
      mk('rect', { x: p[0] - h, y: p[1] - h, width: G.sq, height: G.sq, rx: 3 }, g);
      var t = mk('text', { x: p[0], y: p[1] + 5, class: 'sl', 'text-anchor': 'middle' }, g); t.textContent = id.toUpperCase();
      mk('path', { class: 'xm', d: 'M' + (p[0] - h - 4) + ' ' + (p[1] - h - 4) + 'L' + (p[0] + h + 4) + ' ' + (p[1] + h + 4) }, g);
      var tg = G.tags[id], tt = mk('text', { x: tg.x, y: tg.y, class: 'tag' }, g);
      if (tg.end) tt.setAttribute('text-anchor', 'end');
      tt.textContent = tg.t;
      el[id] = g;
    });

    // 출발지
    var sg = mk('g', { class: 'start' }, svg);
    mk('circle', { cx: s[0], cy: s[1], r: 15, class: 'ring' }, sg);
    mk('circle', { cx: s[0], cy: s[1], r: 7, class: 'dot' }, sg);
    var st = mk('text', { x: s[0], y: s[1] - 24, 'text-anchor': 'middle', class: 'lb' }, sg); st.textContent = '출발';
    el.s = sg;
  }

  function layout() {
    var k = box.clientWidth < 640 ? 'narrow' : 'wide';
    if (k === key) return;
    key = k; draw(); paint(true);
  }

  function state(upto) {
    var s = SC[sc], st = Object.assign({}, s.init);
    for (var i = 0; i <= upto && i < s.steps.length; i++) Object.assign(st, s.steps[i].on);
    return st;
  }

  function paint(instant) {
    var st = state(step);
    var base = { z: 'zone', sb: 'seg bad', sc: 'seg good', rt: 'seg route', pd: 'perp', s: 'start', a: 'shel', b: 'shel', c: 'shel', k1: 'rng', k2: 'rng', k3: 'rng' };
    Object.keys(el).forEach(function (id) {
      var c = (base[id] || '') + (st[id] ? ' ' + st[id] : '') + (instant ? ' now' : '');
      el[id].setAttribute('class', c);
    });
    if (instant) requestAnimationFrame(function () { Object.keys(el).forEach(function (id) { el[id].classList.remove('now'); }); });
    var btns = stepsEl.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].className = i < step ? 'done' : i === step ? 'cur' : '';
      if (i === step) btns[i].setAttribute('aria-current', 'step'); else btns[i].removeAttribute('aria-current');
    }
    counter.textContent = (step < 0 ? 0 : step + 1) + ' / ' + SC[sc].steps.length;
  }

  function reset() {
    var s = SC[sc];
    step = -1;
    for (var i = 0; i < tabs.children.length; i++) tabs.children[i].setAttribute('aria-selected', String(i === sc));
    sumH.textContent = s.title; sumR.textContent = s.result;
    stepsEl.innerHTML = '';
    s.steps.forEach(function (st, i) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span class="tm">' + String(i + 1).padStart(2, '0') + '</span><span></span>';
      b.lastChild.textContent = st.say;
      b.addEventListener('click', function () { jump(i); });
      li.appendChild(b); stepsEl.appendChild(li);
    });
  }

  function play(i) {
    var tok = ++token;
    sc = i; reset(); paint(true);
    var steps = SC[sc].steps;
    if (reduce.matches) { step = steps.length - 1; paint(true); live.textContent = steps[step].say; return; }
    var k = 0;
    function next() {
      if (tok !== token || k >= steps.length) return;
      step = k; paint(false); live.textContent = steps[k].say;
      var hold = 1500 + Math.min(1800, steps[k].say.length * 24);
      k++;
      if (k < steps.length) wait(hold).then(next);
    }
    wait(450).then(next);
  }

  function jump(k) {
    ++token;
    step = k - 1; paint(true);
    requestAnimationFrame(function () { step = k; paint(false); live.textContent = SC[sc].steps[k].say; });
  }

  sc = 0; reset(); layout();
  window.addEventListener('resize', layout);
  if ('IntersectionObserver' in window) {
    var o = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { o.disconnect(); if (token === 0) play(0); }
    }, { threshold: 0.35 });
    o.observe(root);
  } else play(0);
})();
