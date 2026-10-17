/* ai-lunch-curator 페이지 전용 자료: 눌러 보는 구성도 하나(js/flow.js가 그린다)
   사실은 infra/ 원문 14장과 저장소 README·구성도에 적힌 것만 쓴다.
   시각(월 08:30, 평일 09:00 KST)은 운영 기간(2026-06-08 ~ 06-09)의 스케줄이다. */
(function () {
  'use strict';
  var S = window.FLOW_SPECS = window.FLOW_SPECS || {};

  S.lunch = {
    aria: 'AI 점심 큐레이터 배포 구성도. EC2 안에 Nginx, Docker Compose로 띄운 FastAPI 앱과 Oracle XE가 있고, 바깥에 사용자, 개발자, GitHub Actions, 학교 식단표, OpenAI, Teams가 있습니다.',
    nodes: {
      user: { label: '사용자', kind: 'actor' },
      dev: { label: '개발자', kind: 'actor' },
      gha: { label: 'GitHub Actions', sub: '스케줄 · 테스트 · 배포' },
      nginx: { label: 'Nginx', sub: '웹 요청은 80번으로만 받습니다' },
      app: { label: 'FastAPI 앱', sub: '127.0.0.1:8000 · 토큰 확인' },
      db: { label: 'Oracle XE', sub: '메뉴 · 그림 캐시 · 통계' },
      src: { label: '학교 식단표', sub: '이번 주 메뉴' },
      ai: { label: 'OpenAI', sub: '메뉴 분석 · 대표 그림' },
      teams: { label: 'Teams', sub: '오늘의 점심 카드' }
    },
    layouts: {
      wide: {
        w: 1200, h: 480,
        zones: [
          { x: 340, y: 40, w: 420, h: 420, label: 'EC2 · Ubuntu', sub: 't3.small · 스왑 2GB' },
          { x: 356, y: 186, w: 388, h: 252, label: 'Docker Compose', solid: true, bottom: true }
        ],
        nodes: {
          user: { x: 24, y: 84, w: 170, h: 48 },
          dev: { x: 24, y: 230, w: 170, h: 48 },
          gha: { x: 24, y: 360, w: 200, h: 76 },
          nginx: { x: 370, y: 76, w: 360, h: 64 },
          app: { x: 370, y: 208, w: 360, h: 72 },
          db: { x: 370, y: 336, w: 360, h: 60 },
          src: { x: 850, y: 60, w: 330, h: 64 },
          ai: { x: 850, y: 208, w: 330, h: 72 },
          teams: { x: 850, y: 360, w: 330, h: 64 }
        },
        edges: {
          u_n: ['user', 'r', 'nginx', 'l', { label: 'HTTP 80', lx: 282, ly: 98, anchor: 'middle' }],
          d_g: ['dev', 'b', 'gha', 't', { fb: 0.425, label: 'push', lx: 118, ly: 324 }],
          g_n: ['gha', 'r', 'nginx', 'l', { fb: 0.75, mid: 300, label: 'POST + 토큰', lx: 292, ly: 300, anchor: 'end' }],
          g_a: ['gha', 'r', 'app', 'l', { fa: 0.8, fb: 0.8, mid: 320, dash: true, label: 'SSH 배포', lx: 312, ly: 456, anchor: 'end' }],
          n_a: ['nginx', 'b', 'app', 't'],
          a_d: ['app', 'b', 'db', 't'],
          a_s: ['app', 'r', 'src', 'l', { fa: 0.2, mid: 790, label: '크롤링', lx: 798, ly: 168 }],
          a_ai: ['app', 'r', 'ai', 'l', { label: '분석 · 그림', lx: 790, ly: 236, anchor: 'middle' }],
          a_t: ['app', 'r', 'teams', 'l', { fa: 0.8, mid: 790, label: '카드', lx: 798, ly: 336 }]
        }
      },
      narrow: {
        w: 360, h: 440,
        zones: [
          { x: 4, y: 146, w: 352, h: 190, label: 'EC2' }
        ],
        nodes: {
          user: { x: 8, y: 8, w: 96, h: 40 },
          dev: { x: 252, y: 8, w: 100, h: 40 },
          gha: { x: 200, y: 74, w: 152, h: 50, sub: '' },
          nginx: { x: 16, y: 180, w: 160, h: 50, sub: '80번만' },
          app: { x: 16, y: 270, w: 160, h: 56, label: 'FastAPI', sub: '토큰 확인' },
          db: { x: 200, y: 270, w: 144, h: 56, sub: 'Docker' },
          src: { x: 8, y: 380, w: 108, h: 50, label: '식단표', sub: '' },
          ai: { x: 126, y: 380, w: 108, h: 50, sub: '' },
          teams: { x: 244, y: 380, w: 108, h: 50, sub: '' }
        },
        edges: {
          u_n: ['user', 'b', 'nginx', 't', { fa: 0.5, fb: 0.25 }],
          d_g: ['dev', 'b', 'gha', 't', { fa: 0.5, fb: 0.6711 }],
          g_n: ['gha', 'l', 'nginx', 't', { fb: 0.75 }],
          g_a: { pts: [[276, 124], [276, 250], [150, 250], [150, 270]], dash: true },
          n_a: ['nginx', 'b', 'app', 't'],
          a_d: ['app', 'r', 'db', 'l'],
          a_s: ['app', 'b', 'src', 't', { fa: 0.2875, fb: 0.5 }],
          a_ai: ['app', 'b', 'ai', 't', { fa: 0.7, fb: 0.5, mid: 360 }],
          a_t: ['app', 'b', 'teams', 't', { fa: 0.9, fb: 0.5, mid: 348 }]
        }
      }
    },
    scenarios: [
      {
        label: '월요일 수집', title: '매주 월요일 아침, 식단표를 모으는 길',
        result: 'GitHub Actions는 202만 받고 바로 끝납니다. 수집부터 저장까지는 앱이 뒤에서 마칩니다.',
        steps: [
          { say: '월요일 08:30, GitHub Actions가 토큰을 붙여 수집 주소를 부릅니다. 요청은 Nginx를 지나 앱으로 갑니다.', move: ['g_n'], move2: ['n_a'], set: { gha: 'on', nginx: 'on', app: 'on' } },
          { say: '앱은 토큰을 확인하고 바로 202로 답한 뒤, 무거운 일은 백그라운드에서 이어 갑니다.', badge: { app: { text: '202', tone: 'accent' } } },
          { say: '학교 식단표 페이지에서 이번 주 메뉴를 가져옵니다.', move: ['a_s', '-a_s'], set: { src: 'ok' } },
          { say: 'OpenAI가 한줄평·예상 칼로리·태그·추천을 만들고 대표 그림을 그립니다. 메뉴를 해시로 묶어 두어, 같은 구성이면 이미 만든 그림을 다시 씁니다.', move: ['a_ai', '-a_ai'], set: { ai: 'ok' } },
          { say: '결과를 날짜 기준 MERGE로 Oracle에 저장합니다. 같은 날을 다시 돌려도 겹치지 않고 갱신됩니다.', move: ['a_d'], set: { db: 'ok', app: 'ok' }, badge: { app: null, db: { text: '저장', tone: 'accent' } } }
        ]
      },
      {
        label: '평일 아침 발송', title: '평일 아침, 오늘의 점심이 Teams로 가는 길',
        result: 'Teams 채널에 그날 점심이 카드 한 장으로 올라옵니다.',
        steps: [
          { say: '평일 09:00, GitHub Actions가 토큰을 붙여 발송 주소를 부릅니다.', move: ['g_n'], move2: ['n_a'], set: { gha: 'on', nginx: 'on', app: 'on' } },
          { say: '앱은 오늘 날짜를 한국 시간으로 계산해, Oracle에서 오늘 메뉴를 꺼냅니다.', move: ['a_d', '-a_d'], set: { db: 'ok' } },
          { say: 'Adaptive Card로 만들어 Teams 웹훅으로 보냅니다.', move: ['a_t'], set: { teams: 'ok', app: 'ok' }, badge: { teams: { text: '오늘의 점심', tone: 'accent' } } }
        ]
      },
      {
        label: '코드를 올리면', title: 'main 브랜치에 코드를 올렸을 때',
        result: 'pytest에서 실패하면 배포는 시작하지 않습니다.',
        steps: [
          { say: '개발자가 main 브랜치에 코드를 올립니다.', move: ['d_g'], set: { dev: 'on', gha: 'on' } },
          { say: '먼저 pytest가 돕니다. OpenAI와 Teams 호출은 모두 모킹해서, 테스트 중에는 한 번도 부르지 않습니다.', set: { gha: 'pending' }, badge: { gha: { text: 'pytest' } } },
          { say: '통과하면 배포가 이어집니다. SSH로 EC2에 들어가 GitHub Secrets의 값으로 .env를 만들고 docker compose로 다시 띄웁니다.', move: ['g_a'], set: { gha: 'ok', app: 'ok' }, badge: { gha: { text: '통과', tone: 'accent' }, app: { text: '배포', tone: 'accent' } } }
        ]
      },
      {
        label: '토큰 없이 부르면', title: '누군가 토큰 없이 수집 주소를 부를 때',
        result: '수집·발송 주소는 Bearer 토큰이 있어야 열립니다. 없으면 401로 돌려보내, 비용이 드는 AI 호출이 시작되지 않습니다.',
        steps: [
          { say: '토큰 없이 수집 주소로 POST를 보냅니다.', move: ['u_n'], move2: ['n_a'], set: { user: 'on', nginx: 'on' }, rename: { user: '외부 호출' } },
          { say: '앱은 토큰이 없는 요청을 401로 돌려보냅니다.', set: { app: 'block' }, badge: { app: { text: '401' } } },
          { say: 'OpenAI 호출까지는 가지 않습니다.', move: ['-n_a'], move2: ['-u_n'], ghost: ['a_ai'] }
        ]
      }
    ]
  };
})();
