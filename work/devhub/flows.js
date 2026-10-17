/* DevHub 페이지 전용 자료: 눌러 보는 구성도 하나(js/flow.js가 그린다)
   사실은 backend/ 원문 15쪽과 저장소의 README, 설정 코드, 테스트에 있는 것만 쓴다.
   장면은 팀 프로젝트가 끝난 뒤 다시 고친 동작이다. 결제는 결제창 연동까지만 다루고 결제 검증은 말하지 않는다. */
(function () {
  'use strict';
  var S = window.FLOW_SPECS = window.FLOW_SPECS || {};

  S.devhub = {
    aria: '사용자의 요청이 Spring Security, Controller, Service, Repository를 지나 Oracle 또는 H2로 내려가는 계층 구조. 로그인 화면과 외부 API가 옆에 있습니다.',
    nodes: {
      user: { label: '사용자', kind: 'actor' },
      sec: { label: 'Spring Security', sub: '세션 → SecurityContext' },
      ctl: { label: 'Controller', sub: 'Member · Order · Chat …' },
      svc: { label: 'Service', sub: '@Transactional' },
      repo: { label: 'Repository', sub: 'Spring Data JPA' },
      db: { label: 'Oracle · H2', sub: '운영 · 데모' },
      lg: { label: '로그인 화면', sub: '/login' },
      ext: { label: '외부 API', sub: 'Dialogflow · iamport · ipinfo' }
    },
    layouts: {
      wide: {
        w: 1200, h: 334,
        zones: [
          { x: 160, y: 118, w: 860, h: 200, label: 'Spring Boot 앱', sub: ':9091', bottom: true }
        ],
        nodes: {
          user: { x: 16, y: 160, w: 110, h: 44 },
          sec: { x: 184, y: 144, w: 196, h: 76 },
          ctl: { x: 410, y: 144, w: 176, h: 76 },
          svc: { x: 616, y: 144, w: 176, h: 76 },
          repo: { x: 822, y: 144, w: 176, h: 76 },
          db: { x: 1056, y: 144, w: 128, h: 76 },
          lg: { x: 184, y: 16, w: 196, h: 56 },
          ext: { x: 588, y: 16, w: 232, h: 56 }
        },
        edges: {
          u_s: ['user', 'r', 'sec', 'l'],
          s_c: ['sec', 'r', 'ctl', 'l'],
          c_s: ['ctl', 'r', 'svc', 'l'],
          s_r: ['svc', 'r', 'repo', 'l'],
          r_d: ['repo', 'r', 'db', 'l', { label: 'JPA', lx: 1026, ly: 174 }],
          s_lg: ['sec', 't', 'lg', 'b', { dash: true, label: '로그인 안 됨', lx: 290, ly: 102 }],
          svc_ext: ['svc', 't', 'ext', 'b', { dash: true, label: 'REST', lx: 712, ly: 102 }]
        }
      },
      narrow: {
        w: 360, h: 560,
        zones: [
          { x: 6, y: 64, w: 348, h: 404, label: 'Spring Boot 앱', bottom: true }
        ],
        nodes: {
          user: { x: 40, y: 6, w: 150, h: 40 },
          sec: { x: 20, y: 84, w: 190, h: 60, sub: '세션 → Context' },
          ctl: { x: 20, y: 170, w: 190, h: 52, sub: '' },
          svc: { x: 20, y: 248, w: 190, h: 60 },
          repo: { x: 20, y: 334, w: 190, h: 52, sub: '' },
          db: { x: 20, y: 492, w: 190, h: 56 },
          lg: { x: 234, y: 84, w: 112, h: 60, label: '로그인' },
          ext: { x: 234, y: 248, w: 112, h: 60, label: '외부 API', sub: 'Dialogflow 등' }
        },
        edges: {
          u_s: ['user', 'b', 'sec', 't', { fb: 0.6 }],
          s_c: ['sec', 'b', 'ctl', 't'],
          c_s: ['ctl', 'b', 'svc', 't'],
          s_r: ['svc', 'b', 'repo', 't'],
          r_d: ['repo', 'b', 'db', 't'],
          s_lg: ['sec', 'r', 'lg', 'l', { dash: true }],
          svc_ext: ['svc', 'r', 'ext', 'l', { dash: true }]
        }
      }
    },
    scenarios: [
      {
        label: '로그인한 사용자', title: '로그인한 사용자가 글을 쓸 때',
        result: '세션의 아이디가 필터에서 인증 주체로 등록돼, 로그인이 필요한 경로도 통과합니다.',
        steps: [
          { say: '로그인에 성공하면 세션에 loginId가 남고 접속 이력이 저장됩니다. 비밀번호가 틀리면 세션을 만들지 않습니다.', set: { user: 'on' }, badge: { user: { text: 'loginId' } } },
          { say: '/bWrite로 글쓰기 요청이 오면, 필터가 세션의 loginId를 SecurityContext에 올립니다.', move: ['u_s'], set: { sec: 'ok' }, badge: { sec: { text: '인증 주체', tone: 'accent' } } },
          { say: '글쓰기는 authenticated() 경로라 여기서 인증을 확인하고 컨트롤러로 넘깁니다.', move: ['s_c'], set: { ctl: 'on' } },
          { say: '서비스 계층에서 트랜잭션을 열고, 리포지터리를 거쳐 DB에 저장합니다.', move: ['c_s', 's_r', 'r_d'], set: { svc: 'on', repo: 'on', db: 'ok' }, badge: { db: { text: '저장', tone: 'accent' } } }
        ]
      },
      {
        label: '로그인하지 않으면', title: '로그인하지 않은 사용자가 충전 경로를 열 때',
        result: 'authenticated()로 묶은 경로만 /login으로 보내고, 나머지 경로는 permitAll입니다.',
        steps: [
          { say: '로그인하지 않은 사용자가 /charge로 포인트 충전을 요청합니다.', move: ['u_s'], set: { user: 'on', sec: 'on' } },
          { say: '세션에 아이디가 없으니 필터가 올릴 것도 없고, Security가 요청을 막습니다.', set: { sec: 'block' }, badge: { sec: { text: '미인증' } } },
          { say: '막힌 요청은 /login으로 보냅니다.', move: ['s_lg'], set: { lg: 'ok' } },
          { say: '목록이나 상세 조회 같은 그 밖의 경로는 로그인 없이 그대로 컨트롤러까지 갑니다.', move: ['u_s', 's_c'], set: { sec: 'on', ctl: 'ok' }, badge: { sec: null, ctl: { text: 'permitAll', tone: 'accent' } } }
        ]
      },
      {
        label: '음수를 빼면', title: '포인트를 음수만큼 빼려 할 때',
        result: '음수 차감은 서비스에서 막히고, DB에는 정상 차감만 들어갑니다.',
        steps: [
          { say: '로그인한 사용자가 차감액으로 음수를 보냅니다.', move: ['u_s', 's_c'], set: { user: 'on', sec: 'ok', ctl: 'on' }, badge: { user: { text: '음수' } } },
          { say: '전에는 여기서 음수를 빼면 덧셈이 됐고, 잔액 확인도 그냥 통과했습니다.', move: ['c_s'], set: { svc: 'on' }, badge: { svc: { text: '현재 − (음수)' } } },
          { say: '지금은 서비스가 0 이하 차감을 먼저 거부해서, DB까지 가지 않습니다.', set: { svc: 'block' }, badge: { svc: { text: '0 이하 거부', tone: 'accent' } } },
          { say: '잔액이 충분한 정상 차감만 트랜잭션 안에서 DB에 반영됩니다.', move: ['s_r', 'r_d'], set: { svc: 'ok', repo: 'on', db: 'ok' }, badge: { svc: null, db: { text: '정상 차감만', tone: 'accent' } } }
        ]
      },
      {
        label: '챗봇 키가 없으면', title: '챗봇 인증 키 없이 앱을 띄울 때',
        result: '키 파일이 없어도 앱은 뜨고, 챗봇만 안내 문구를 돌려줍니다.',
        steps: [
          { say: '챗봇 인증 키 파일은 저장소에 올리지 않아, 새로 클론하면 없습니다.', set: { ext: 'down' }, badge: { ext: { text: '키 파일 없음' } } },
          { say: '전에는 기동하면서 챗봇 클라이언트를 무조건 만들었기 때문에, 키가 없으면 앱이 아예 뜨지 않았습니다.', set: { svc: 'down' } },
          { say: '지금은 키 파일이 있을 때만 빈을 만들고, 서비스는 ObjectProvider로 있을 때만 꺼내 씁니다.', set: { svc: 'on', sec: 'on', ctl: 'on' }, badge: { svc: { text: 'getIfAvailable()' } } },
          { say: '사용자가 챗봇에 말을 걸면 500 대신 안내 문구가 돌아갑니다.', move: ['u_s', 's_c', 'c_s'], move2: ['-c_s', '-s_c', '-u_s'], set: { svc: 'ok', user: 'ok' }, badge: { user: { text: '안내 문구', tone: 'accent' } } }
        ]
      }
    ]
  };
})();
