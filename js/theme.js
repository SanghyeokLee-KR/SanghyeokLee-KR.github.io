/* 밝기 전환: 처음에는 기기 설정을 따르고, 버튼으로 바꾸면 그 선택을 기억한다 */
(function () {
  var root = document.documentElement;
  function label() {
    var b = document.querySelectorAll('.theme-btn');
    for (var i = 0; i < b.length; i++) {
      var dark = root.classList.contains('dark');
      b[i].textContent = dark ? '밝게' : '어둡게';
      b[i].setAttribute('aria-label', dark ? '밝은 화면으로 바꾸기' : '어두운 화면으로 바꾸기');
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.theme-btn');
    if (!t) return;
    var dark = !root.classList.contains('dark');
    root.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (err) {}
    label();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', label); else label();
})();
