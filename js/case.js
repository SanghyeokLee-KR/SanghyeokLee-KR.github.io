/* 작업 페이지 공통: 머리 막대 선, 장 막대와 읽은 만큼의 선, 나타나기, 칸 그림, 눌러 보는 구성도 재생
   페이지마다 다른 자료(구성도 장면)는 그 페이지 폴더의 스크립트가 window.FLOW_SPECS에 넣는다. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var head = document.querySelector('.head');
  var bar = document.querySelector('.progress');
  var main = document.querySelector('.case-body');
  function onScroll() {
    head.classList.toggle('lined', window.scrollY > 8);
    if (bar && main) {
      var r = main.getBoundingClientRect(), total = r.height - window.innerHeight * 0.6;
      var p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 지금 읽는 장을 막대에 표시하고, 좁은 화면에서는 그 칸이 보이게 옮긴다
  var links = Array.prototype.slice.call(document.querySelectorAll('.chapters a'));
  var list = document.querySelector('.chapters ol');
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var current = -2;
  function mark() {
    var y = window.innerHeight * 0.32, k = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < y) k = i; });
    if (k === current) return;
    current = k;
    links.forEach(function (a, i) { a.setAttribute('aria-current', String(i === k)); });
    if (!list) return;
    if (k === -1) list.scrollLeft = 0;
    else if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: links[k].offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
  }
  if (links.length) { window.addEventListener('scroll', mark, { passive: true }); mark(); }

  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* 칸 그림: <div class="cells" data-total="122" data-lost="36" data-cols="61"></div>
     칸이 모두 찬 뒤, 사라진 건수만큼 뒤쪽 칸이 빈칸으로 바뀐다 */
  Array.prototype.forEach.call(document.querySelectorAll('.cells[data-total]'), function (box) {
    var total = +box.getAttribute('data-total'), lost = +box.getAttribute('data-lost') || 0;
    if (box.getAttribute('data-cols')) box.style.setProperty('--cols', box.getAttribute('data-cols'));
    for (var i = 0; i < total; i++) {
      var c = document.createElement('i');
      if (i >= total - lost) c.className = 'lost';
      if (!reduce) c.style.transitionDelay = (i * 7) + 'ms';
      box.appendChild(c);
    }
    function run() {
      box.classList.add('on');
      setTimeout(function () {
        if (!reduce) box.querySelectorAll('i.lost').forEach(function (c, k) { c.style.transitionDelay = (k * 28) + 'ms'; });
        box.classList.add('gone');
      }, reduce ? 0 : total * 7 + 600);
    }
    if ('IntersectionObserver' in window && !reduce) {
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); run(); } }, { threshold: 0.5 });
      o.observe(box);
    } else run();
  });

  /* 눌러 보는 구성도: 화면에 들어오면 첫 장면을 한 번 재생한다 */
  var specs = window.FLOW_SPECS || {};
  Array.prototype.forEach.call(document.querySelectorAll('.flow[data-flow]'), function (root) {
    var spec = specs[root.getAttribute('data-flow')];
    if (!spec || !window.Flow) return;
    var f = new window.Flow(root, spec);
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { o.disconnect(); if (f.token === 0) f.play(0); }
      }, { threshold: 0.35 });
      o.observe(root);
    } else f.play(0);
  });
})();
