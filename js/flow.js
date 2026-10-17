/* 눌러 보는 구성도
   구성도는 자료(노드·선·장면)로 그린다. 넓은 화면과 좁은 화면은 같은 노드를 다른 자리에 놓고,
   장면을 고르면 점 하나가 실제 경로를 따라 움직이며 단계마다 상태가 바뀐다.
   움직임을 줄이도록 설정한 사용자에게는 점을 움직이지 않고 상태만 바로 바꾼다.
   페이지에는 <div class="flow" data-flow="이름" data-title="제목"></div>만 두면 안쪽 틀은 여기서 만든다.
   자료는 그 페이지의 스크립트가 window.FLOW_SPECS[이름]에 넣고, case.js가 화면에 들어올 때 재생한다. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function anchor(n, side, f) {
    if (f == null) f = 0.5;
    if (side === 'l') return [n.x, n.y + n.h * f];
    if (side === 'r') return [n.x + n.w, n.y + n.h * f];
    if (side === 't') return [n.x + n.w * f, n.y];
    return [n.x + n.w * f, n.y + n.h];
  }
  // 두 노드를 직각으로 꺾어 잇는다
  function route(a, sa, b, sb, mid) {
    var hA = sa === 'l' || sa === 'r', hB = sb === 'l' || sb === 'r', p;
    if (hA && hB) { var mx = mid != null ? mid : (a[0] + b[0]) / 2; p = [a, [mx, a[1]], [mx, b[1]], b]; }
    else if (!hA && !hB) { var my = mid != null ? mid : (a[1] + b[1]) / 2; p = [a, [a[0], my], [b[0], my], b]; }
    else if (hA) p = [a, [b[0], a[1]], b];
    else p = [a, [a[0], b[1]], b];
    return p.filter(function (q, i) { return i === 0 || q[0] !== p[i - 1][0] || q[1] !== p[i - 1][1]; });
  }
  function d(pts) { return pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0] + ' ' + q[1]; }).join(' '); }
  function plen(pts) { var L = 0; for (var i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
  function at(pts, t) {
    var L = plen(pts) * t;
    for (var i = 1; i < pts.length; i++) {
      var s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (L <= s || i === pts.length - 1) { var r = s ? Math.min(1, L / s) : 1; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r]; }
      L -= s;
    }
    return pts[pts.length - 1];
  }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4"/><path d="M2.5 2.5v3h3"/></svg>';
  function skeleton(root) {
    if (root.querySelector('.stagebox')) return;
    var t = document.createElement('p'); t.className = 'ttl';
    t.innerHTML = '<span class="lbl">' + (root.getAttribute('data-kicker') || '눌러 보기') + '</span><span></span>';
    t.lastChild.textContent = root.getAttribute('data-title') || '';
    root.innerHTML =
      '<div class="flow-top"><div class="tabs" role="tablist" aria-label="장면 고르기"></div></div>' +
      '<div class="stagebox"><div class="clock" aria-hidden="true"><span class="v"></span><span class="l"></span></div></div>' +
      '<div class="flow-bot"><div class="flow-sum"><p class="h"></p><p class="r"></p>' +
      '<div class="ctrl"><button class="btn replay" type="button">' + ICON + '다시 재생</button><span class="stepc"></span></div></div>' +
      '<ol class="steps" aria-label="단계"></ol></div><p class="live sr" aria-live="polite"></p>';
    root.querySelector('.flow-top').insertBefore(t, root.querySelector('.tabs'));
  }

  function Flow(root, spec) {
    skeleton(root);
    this.root = root; this.spec = spec; this.sc = 0; this.step = -1; this.token = 0; this.started = false;
    this.svgBox = root.querySelector('.stagebox');
    this.stepsEl = root.querySelector('.steps');
    this.sumH = root.querySelector('.flow-sum .h');
    this.sumR = root.querySelector('.flow-sum .r');
    this.counter = root.querySelector('.stepc');
    this.live = root.querySelector('.live');
    this.clock = root.querySelector('.clock');
    this.layoutKey = null;
    this.buildTabs();
    this.reset();
    this.layout();
    var self = this;
    window.addEventListener('resize', function () { self.layout(); });
    root.querySelector('.replay').addEventListener('click', function () { self.play(self.sc); });
  }

  Flow.prototype.buildTabs = function () {
    var self = this, tabs = this.root.querySelector('.tabs');
    this.spec.scenarios.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = s.label;
      b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', function () { self.play(i); });
      tabs.appendChild(b);
    });
    tabs.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = self.spec.scenarios.length, i = (self.sc + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
      self.play(i); tabs.children[i].focus();
    });
  };

  Flow.prototype.reset = function () {
    var s = this.spec.scenarios[this.sc], init = s.init || {};
    this.st = { nodes: Object.assign({}, this.spec.initNodes || {}, init.nodes || {}), badges: {}, names: {}, lit: {}, ghost: {}, cur: null, clock: null };
    (init.lit || []).forEach(function (id) { this.st.lit[id] = true; }, this);
    this.step = -1;
    var tabs = this.root.querySelectorAll('.tabs button');
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute('aria-selected', String(i === this.sc));
    this.sumH.textContent = s.title; this.sumR.textContent = s.result;
    var self = this;
    if (this.builtFor === this.sc) return;
    this.builtFor = this.sc;
    this.stepsEl.innerHTML = '';
    s.steps.forEach(function (st, i) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span class="tm">' + (st.time || String(i + 1).padStart(2, '0')) + '</span><span></span>';
      b.lastChild.textContent = st.say;
      b.addEventListener('click', function () { self.jump(i); });
      li.appendChild(b); self.stepsEl.appendChild(li);
    });
  };

  Flow.prototype.layout = function () {
    var w = this.svgBox.clientWidth, key = w < 640 ? 'narrow' : 'wide';
    if (key === this.layoutKey) return;
    this.layoutKey = key; this.L = this.spec.layouts[key];
    this.draw(); this.paint();
  };

  Flow.prototype.draw = function () {
    var L = this.L, spec = this.spec, self = this;
    if (this.svg) this.svg.remove();
    var svg = mk('svg', { viewBox: '0 0 ' + L.w + ' ' + L.h, class: 'fd', role: 'img', 'aria-label': spec.aria });
    this.svgBox.insertBefore(svg, this.svgBox.firstChild);
    this.svg = svg;
    (L.zones || []).forEach(function (z) {
      var g = mk('g', { class: 'zone' + (z.solid ? ' solid' : '') }, svg);
      mk('rect', { x: z.x, y: z.y, width: z.w, height: z.h, rx: 4 }, g);
      var t = mk('text', { x: z.right ? z.x + z.w - 14 : z.x + 14, y: z.bottom ? z.y + z.h - 14 : z.y + 22, class: z.right ? 'r' : '' }, g);
      t.textContent = z.label;
      if (z.sub) { var s = mk('tspan', { class: 's', dx: 8 }, t); s.textContent = z.sub; }
    });
    // 선
    this.edges = {};
    var eg = mk('g', {}, svg), lg = mk('g', {}, svg);
    Object.keys(L.edges).forEach(function (id) {
      var e = L.edges[id], pts;
      if (e.pts) pts = e.pts;
      else {
        var A = L.nodes[e[0]], B = L.nodes[e[2]];
        if (!A || !B) return;
        var o = e[4] || {};
        pts = route(anchor(A, e[1], o.fa), e[1], anchor(B, e[3], o.fb), e[3], o.mid);
      }
      var o2 = e[4] || e;
      var path = mk('path', { d: d(pts), class: 'edge' + (o2.dash ? ' dash' : '') + (o2.hidden ? ' hide' : '') }, eg);
      self.edges[id] = { pts: pts, el: path, hidden: !!o2.hidden };
      if (o2.label) {
        var t = mk('text', { x: o2.lx, y: o2.ly, class: 'elabel' }, lg);
        t.textContent = o2.label;
        if (o2.anchor) t.setAttribute('text-anchor', o2.anchor);
      }
    });
    this.traceG = mk('g', {}, svg);
    // 노드
    this.nodes = {};
    Object.keys(L.nodes).forEach(function (id) {
      var n = L.nodes[id], meta = spec.nodes[id] || {};
      var g = mk('g', { class: 'node ' + (meta.kind || '') }, svg);
      mk('rect', { class: 'box', x: n.x, y: n.y, width: n.w, height: n.h, rx: meta.kind === 'actor' ? n.h / 2 : 3 }, g);
      var sub = n.sub !== undefined ? n.sub : meta.sub;
      var cx = meta.kind === 'actor' || n.center ? n.x + n.w / 2 : n.x + 14;
      var lb = mk('text', { class: 'lb', x: cx, y: sub ? n.y + n.h / 2 - 3 : n.y + n.h / 2 + 5 }, g);
      lb.textContent = n.label || meta.label;
      if (cx !== n.x + 14) lb.setAttribute('text-anchor', 'middle');
      if (sub) {
        var sb = mk('text', { class: 'sb', x: cx, y: n.y + n.h / 2 + 15 }, g);
        sb.textContent = sub;
        if (cx !== n.x + 14) sb.setAttribute('text-anchor', 'middle');
      }
      var xm = mk('path', { class: 'xmark', d: 'M' + (n.x + n.w - 20) + ' ' + (n.y + n.h / 2 - 6) + 'l12 12M' + (n.x + n.w - 8) + ' ' + (n.y + n.h / 2 - 6) + 'l-12 12' }, g);
      var bg = mk('g', { class: 'badge', opacity: 0 }, g);
      var br = mk('rect', { y: n.y - 11, height: 20, rx: 2 }, bg);
      var bt = mk('text', { y: n.y + 3 }, bg);
      self.nodes[id] = { g: g, lb: lb, base: n.label || meta.label, n: n, badge: bg, br: br, bt: bt };
    });
    this.pkt = mk('circle', { class: 'pkt', r: 6, cx: -50, cy: -50, visibility: 'hidden' }, svg);
  };

  Flow.prototype.paint = function () {
    var st = this.st, self = this;
    Object.keys(this.nodes).forEach(function (id) {
      var N = self.nodes[id], s = st.nodes[id] || '';
      N.g.setAttribute('class', 'node ' + ((self.spec.nodes[id] || {}).kind || '') + ' ' + s);
      N.lb.textContent = st.names[id] || N.base;
      var b = st.badges[id];
      if (b) {
        N.bt.textContent = b.text;
        var tw = 0; try { tw = N.bt.getComputedTextLength(); } catch (e) {}
        var w = Math.max(28, (tw || b.text.length * 10) + 14);
        var x = N.n.x + N.n.w - w - 8;
        N.br.setAttribute('x', x); N.br.setAttribute('width', w);
        N.bt.setAttribute('x', x + 7);
        N.badge.setAttribute('class', 'badge' + (b.tone === 'accent' ? ' accent' : ''));
        N.badge.setAttribute('opacity', 1);
      } else N.badge.setAttribute('opacity', 0);
    });
    Object.keys(this.edges).forEach(function (id) {
      var E = self.edges[id], c = 'edge';
      if (st.ghost[id]) c += ' ghost';
      else if (E.hidden && !st.lit[id]) c += ' hide';
      else if (st.lit[id]) c += ' lit';
      if ((self.L.edges[id][4] || self.L.edges[id]).dash && !st.lit[id]) c += ' dash';
      E.el.setAttribute('class', c);
    });
    if (this.clock) {
      if (st.clock) { this.clock.classList.add('on'); this.clock.querySelector('.v').innerHTML = st.clock.v.toFixed(1) + '<small>초</small>'; this.clock.querySelector('.l').textContent = st.clock.label; }
      else this.clock.classList.remove('on');
    }
    var btns = this.stepsEl.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].className = i < this.step ? 'done' : i === this.step ? 'cur' : '';
      if (i === this.step) btns[i].setAttribute('aria-current', 'step'); else btns[i].removeAttribute('aria-current');
    }
    var n = this.spec.scenarios[this.sc].steps.length;
    this.counter.textContent = (this.step < 0 ? 0 : this.step + 1) + ' / ' + n;
  };

  // 한 단계의 결과를 상태에 반영한다(움직임 없이)
  Flow.prototype.applyEnd = function (s) {
    var st = this.st;
    (s.move || []).concat(s.move2 || []).forEach(function (m) { var id = m.replace(/^-/, ''); st.lit[id] = true; });
    (s.ghost || []).forEach(function (id) { st.ghost[id] = true; });
    (s.unlit || []).forEach(function (id) { delete st.lit[id]; });
    if (s.set) Object.assign(st.nodes, s.set);
    if (s.badge) Object.keys(s.badge).forEach(function (k) { if (s.badge[k]) st.badges[k] = s.badge[k]; else delete st.badges[k]; });
    if (s.rename) Object.assign(st.names, s.rename);
    if (s.clock) st.clock = { v: s.clock.to, label: s.clock.label };
  };
  Flow.prototype.applyPre = function (s) {
    if (s.pre) Object.assign(this.st.nodes, s.pre);
    if (s.preBadge) Object.assign(this.st.badges, s.preBadge);
  };

  Flow.prototype.travel = function (moves, tok, delay) {
    var self = this;
    var pts = [];
    moves.forEach(function (m) {
      var rev = m.charAt(0) === '-', E = self.edges[m.replace(/^-/, '')];
      if (!E) return;
      var p = rev ? E.pts.slice().reverse() : E.pts;
      pts = pts.length ? pts.concat(p.slice(1)) : p.slice();
    });
    if (pts.length < 2) return Promise.resolve();
    var dot = delay ? mk('circle', { class: 'pkt', r: 5, cx: -50, cy: -50 }, this.svg) : this.pkt;
    dot.setAttribute('visibility', 'hidden');
    var trace = mk('path', { class: 'trace', d: d(pts) }, this.traceG);
    var L = plen(pts); trace.style.strokeDasharray = L; trace.style.strokeDashoffset = L;
    var dur = Math.max(520, Math.min(1700, L * 2.1));
    return wait(delay || 0).then(function () {
      return new Promise(function (res) {
        var t0 = performance.now();
        function f(now) {
          if (tok !== self.token) { trace.remove(); if (delay) dot.remove(); return res(); }
          var t = Math.min(1, (now - t0) / dur), e = ease(t), p = at(pts, e);
          dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1]); dot.setAttribute('visibility', 'visible');
          trace.style.strokeDashoffset = L * (1 - e);
          if (t < 1) requestAnimationFrame(f);
          else {
            // 지나간 길은 먹색으로 남기고 초록 자국은 걷어 낸다
            setTimeout(function () { trace.style.transition = 'opacity .6s'; trace.style.opacity = 0; setTimeout(function () { trace.remove(); }, 650); }, 250);
            if (delay) dot.remove();
            res();
          }
        }
        requestAnimationFrame(f);
      });
    });
  };

  Flow.prototype.runStep = function (i, tok) {
    var s = this.spec.scenarios[this.sc].steps[i], self = this;
    this.step = i; this.applyPre(s); this.st.cur = i; this.paint();
    if (this.live) this.live.textContent = s.say;
    if (reduce.matches) { this.applyEnd(s); this.paint(); return Promise.resolve(); }
    var moving = wait(s.hold || 0);
    if (s.burst) {
      var arr = [];
      for (var k = 0; k < s.burst; k++) arr.push(this.travel(s.move, tok, k * 220 + 1));
      moving = Promise.all(arr);
    } else if (s.move) {
      moving = moving.then(function () { return self.travel(s.move, tok); });
    }
    if (s.move2) moving = moving.then(function () { if (tok === self.token) return self.travel(s.move2, tok); });
    return moving.then(function () {
      if (tok !== self.token) return;
      if (s.clock) {
        return new Promise(function (res) {
          var t0 = performance.now(), D = 1500;
          function f(now) {
            if (tok !== self.token) return res();
            var t = Math.min(1, (now - t0) / D);
            self.st.clock = { v: s.clock.to * ease(t), label: s.clock.label };
            self.paint();
            if (t < 1) requestAnimationFrame(f); else res();
          }
          requestAnimationFrame(f);
        });
      }
    }).then(function () {
      if (tok !== self.token) return;
      self.applyEnd(s); self.paint();
      self.pkt.setAttribute('visibility', 'hidden');
    });
  };

  Flow.prototype.play = function (sc) {
    var tok = ++this.token, self = this;
    this.sc = sc; this.reset(); this.paint();
    var steps = this.spec.scenarios[sc].steps, i = 0;
    function next() {
      if (tok !== self.token || i >= steps.length) return;
      self.runStep(i, tok).then(function () {
        i++;
        if (i < steps.length) return wait(reduce.matches ? 0 : 900 + Math.min(1600, steps[i - 1].say.length * 22)).then(next);
      });
    }
    if (reduce.matches) { steps.forEach(function (s, k) { self.step = k; self.applyPre(s); self.applyEnd(s); }); this.paint(); return; }
    wait(350).then(next);
  };

  // 단계를 누르면 그 앞까지는 바로 반영하고, 누른 단계만 움직여 보여 준다
  Flow.prototype.jump = function (k) {
    var tok = ++this.token, steps = this.spec.scenarios[this.sc].steps, self = this;
    this.reset();
    for (var i = 0; i < k; i++) { this.applyPre(steps[i]); this.applyEnd(steps[i]); }
    this.step = k - 1; this.paint();
    this.runStep(k, tok);
    var b = this.stepsEl.querySelectorAll('button')[k];
    if (b && this.stepsEl.contains(document.activeElement)) b.focus();
  };

  window.Flow = Flow;
})();
