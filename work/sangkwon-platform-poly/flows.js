/* sangkwon-platform-poly 페이지 전용 자료: 눌러 보는 구성도 하나(js/flow.js가 그린다)
   사실은 infra/ 15쪽, backend/ 10·11쪽과 팀 저장소의 배포 문서에 적힌 것만 쓴다.
   배포 장면은 설계한 배포 순서를 따라가는 것이고, 다운타임을 잰 기록이 아니다. */
(function () {
  'use strict';
  var S = window.FLOW_SPECS = window.FLOW_SPECS || {};

  S.sk = {
    aria: '서울 리전 구성도. 사용자가 ALB로 들어오고, ALB는 가용 영역 a의 EC2-A와 가용 영역 c의 EC2-B로 보내며, 두 서버는 리전 바깥의 Oracle 자율 DB를 함께 씁니다.',
    nodes: {
      user: { label: '사용자', kind: 'actor' },
      alb: { label: 'ALB', sub: 'HTTPS 443 · 헬스체크' },
      a: { label: 'EC2-A', sub: 't3.small · systemd' },
      b: { label: 'EC2-B', sub: 't3.small · systemd' },
      db: { label: 'Oracle 자율 DB', sub: '세션 · 요청 제한 · 락' }
    },
    layouts: {
      wide: {
        w: 1200, h: 460,
        zones: [
          { x: 150, y: 16, w: 780, h: 428, label: '서울 리전', sub: 'VPC' },
          { x: 430, y: 60, w: 470, h: 160, label: '가용 영역 a', sub: 'ap-northeast-2a' },
          { x: 430, y: 252, w: 470, h: 160, label: '가용 영역 c', sub: 'ap-northeast-2c' }
        ],
        nodes: {
          user: { x: 16, y: 214, w: 100, h: 44 },
          alb: { x: 180, y: 200, w: 190, h: 72 },
          a: { x: 560, y: 104, w: 230, h: 72 },
          b: { x: 560, y: 296, w: 230, h: 72 },
          db: { x: 980, y: 200, w: 204, h: 72 }
        },
        edges: {
          u_alb: ['user', 'r', 'alb', 'l'],
          alb_a: ['alb', 'r', 'a', 'l', { mid: 400 }],
          alb_b: ['alb', 'r', 'b', 'l', { mid: 400 }],
          a_db: ['a', 'r', 'db', 'l', { fb: 0.3, mid: 944, label: 'JDBC · Wallet', lx: 952, ly: 158 }],
          b_db: ['b', 'r', 'db', 'l', { fb: 0.7, mid: 944 }]
        }
      },
      narrow: {
        w: 360, h: 590,
        zones: [
          { x: 6, y: 70, w: 348, h: 410, label: '서울 리전', bottom: true },
          { x: 14, y: 190, w: 162, h: 150, label: '가용 영역 a', bottom: true },
          { x: 184, y: 190, w: 162, h: 150, label: '가용 영역 c', bottom: true }
        ],
        nodes: {
          user: { x: 120, y: 8, w: 120, h: 40 },
          alb: { x: 80, y: 92, w: 200, h: 60, sub: 'HTTPS · 헬스체크' },
          a: { x: 24, y: 236, w: 142, h: 66, sub: 't3.small' },
          b: { x: 194, y: 236, w: 142, h: 66, sub: 't3.small' },
          db: { x: 40, y: 512, w: 280, h: 64 }
        },
        edges: {
          u_alb: ['user', 'b', 'alb', 't'],
          alb_a: ['alb', 'b', 'a', 't', { fa: 0.3, mid: 172 }],
          alb_b: ['alb', 'b', 'b', 't', { fa: 0.7, mid: 172 }],
          a_db: ['a', 'b', 'db', 't', { fa: 0.75, fb: 0.32, mid: 494 }],
          b_db: ['b', 'b', 'db', 't', { fa: 0.25, fb: 0.68, mid: 494 }]
        }
      }
    },
    scenarios: [
      {
        label: '요청 한 건', title: '요청 한 건이 지나가는 길',
        result: '로그인 세션이 서버가 아니라 DB에 있어서, ALB가 어느 서버로 보내든 같은 사용자로 이어집니다.',
        steps: [
          { say: '사용자의 요청은 HTTPS로 ALB에 들어옵니다. 인증서와 TLS 종료는 ALB가 맡습니다.', move: ['u_alb'], set: { alb: 'on' } },
          { say: 'ALB는 헬스체크를 통과한 서버 가운데 한 대로 요청을 보냅니다. 이번에는 가용 영역 a의 EC2-A입니다.', move: ['alb_a'], set: { a: 'on' } },
          { say: 'EC2-A는 로그인 세션을 자기 메모리가 아니라 DB에서 읽습니다. Spring Session JDBC를 썼습니다.', move: ['a_db'], set: { db: 'on' }, badge: { db: { text: '세션' } } },
          { say: '다음 요청이 가용 영역 c의 EC2-B로 가도, 같은 DB에서 같은 세션을 읽어 로그인이 그대로 이어집니다.', move: ['u_alb', 'alb_b', 'b_db'], set: { b: 'ok', a: 'ok' }, badge: { b: { text: '같은 세션', tone: 'accent' } } }
        ]
      },
      {
        label: '한 대씩 배포', title: '새 버전을 한 대씩 올리는 순서',
        result: '교체는 늘 한 대씩입니다. 어느 단계에서든 요청을 받는 서버가 적어도 한 대는 남습니다.',
        init: { nodes: { alb: 'on', a: 'on', b: 'on', db: 'on' }, lit: ['u_alb', 'alb_a', 'alb_b', 'a_db', 'b_db'] },
        steps: [
          { say: 'EC2-A에 새 jar를 올리고 서비스를 다시 시작합니다. 처리 중인 요청은 최대 20초까지 마저 처리하고 내려갑니다.', set: { a: 'pending' }, badge: { a: { text: '교체 중' } } },
          { say: 'ALB 헬스체크가 A를 대상에서 빼고, 그동안 들어오는 요청은 B가 모두 받습니다.', unlit: ['alb_a', 'a_db'], move: ['u_alb', 'alb_b'], set: { b: 'ok' }, badge: { b: { text: '요청 받는 중', tone: 'accent' } } },
          { say: 'A가 헬스체크를 통과하면 다시 대상에 들어옵니다. 그다음에야 B로 넘어갑니다.', move: ['alb_a', 'a_db'], set: { a: 'ok' }, badge: { a: { text: '새 버전', tone: 'accent' }, b: null } },
          { say: 'B도 같은 순서로 바꿉니다. 이번에는 A가 요청을 모두 받습니다.', unlit: ['alb_b', 'b_db'], set: { b: 'pending' }, badge: { b: { text: '교체 중' }, a: { text: '요청 받는 중', tone: 'accent' } }, move: ['u_alb', 'alb_a'] },
          { say: '두 서버 모두 같은 커밋으로 만든 같은 jar로 바뀌었습니다. 문제가 생기면 이전 jar로 같은 순서를 되밟습니다.', move: ['alb_b', 'b_db'], set: { b: 'ok' }, badge: { a: { text: '새 버전', tone: 'accent' }, b: { text: '새 버전', tone: 'accent' } } }
        ]
      },
      {
        label: '로그인 한도', title: '두 서버가 한 줄을 함께 셉니다',
        result: '10분에 5회라는 로그인 한도가 서버 수와 상관없이 그대로 지켜집니다.',
        steps: [
          { say: '로그인 요청이 EC2-A로 들어옵니다. 서버는 DB의 공유 테이블에 먼저 1을 더하고, 그다음 한도를 확인합니다.', move: ['u_alb', 'alb_a', 'a_db'], set: { alb: 'on', a: 'on', db: 'on' }, badge: { db: { text: '1 / 5' } } },
          { say: '다음 요청은 EC2-B로 갑니다. B도 같은 줄에 더해서 2가 됩니다.', move: ['u_alb', 'alb_b', 'b_db'], set: { b: 'on' }, badge: { db: { text: '2 / 5' } } },
          { say: '세 번째부터 다섯 번째 요청까지, 어느 서버로 들어오든 같은 줄에 더해집니다.', burst: 3, move: ['u_alb', 'alb_a', 'a_db'], badge: { db: { text: '5 / 5' } } },
          { say: '여섯 번째 요청은 더한 값이 한도를 넘어 거절됩니다.', move: ['u_alb', 'alb_b', 'b_db'], set: { db: 'ok' }, badge: { db: { text: '6 / 5 · 거절', tone: 'accent' }, b: { text: '거절' } } }
        ]
      }
    ]
  };
})();
