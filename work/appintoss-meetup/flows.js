/* 하모니 페이지 전용 자료: 눌러 보는 구성도 하나(js/flow.js가 그린다)
   사실은 backend/ 원문 14쪽과 팀 저장소의 통합 시험 결과서, 배포 설정에 있는 것만 쓴다.
   보안 결함은 Codex 독립 검토가 처음 찾았다. 장면은 고친 뒤 서버의 동작과 시험 결과를 보여 준다. */
(function () {
  'use strict';
  var S = window.FLOW_SPECS = window.FLOW_SPECS || {};

  S.harmony = {
    aria: 'EC2 한 대 안의 nginx, 127.0.0.1에만 열린 Node 앱, SQLite 파일과, 바깥의 원작자, 친구, 다른 사용자가 공유 코드로 요청을 보내는 구성도.',
    nodes: {
      a: { label: '원작자', kind: 'actor' },
      b: { label: '친구', kind: 'actor' },
      c: { label: '다른 사용자', kind: 'actor' },
      ng: { label: 'nginx', sub: '443 TLS · Let\'s Encrypt' },
      api: { label: 'Node 앱', sub: '127.0.0.1:8080 · systemd' },
      db: { label: 'SQLite', sub: 'harmony.db 파일 하나' }
    },
    layouts: {
      wide: {
        w: 1200, h: 384,
        zones: [
          { x: 214, y: 20, w: 970, h: 348, label: 'AWS EC2 한 대', sub: 'Ubuntu · 서울 리전' },
          { x: 600, y: 72, w: 564, h: 276, label: 'localhost', sub: '서버 밖에서는 닿지 않습니다', bottom: true }
        ],
        nodes: {
          a: { x: 16, y: 82, w: 128, h: 44 },
          b: { x: 16, y: 172, w: 128, h: 44 },
          c: { x: 16, y: 262, w: 128, h: 44 },
          ng: { x: 264, y: 156, w: 210, h: 76 },
          api: { x: 636, y: 156, w: 220, h: 76 },
          db: { x: 920, y: 156, w: 214, h: 76 }
        },
        edges: {
          a_n: ['a', 'r', 'ng', 'l', { fb: 0.25, mid: 236 }],
          b_n: ['b', 'r', 'ng', 'l', { fb: 0.5, mid: 236 }],
          c_n: ['c', 'r', 'ng', 'l', { fb: 0.75, mid: 236 }],
          n_api: ['ng', 'r', 'api', 'l', { label: '127.0.0.1:8080', lx: 486, ly: 186 }],
          api_db: ['api', 'r', 'db', 'l', { label: '파일 I/O', lx: 888, ly: 186, anchor: 'middle' }]
        }
      },
      narrow: {
        w: 360, h: 560,
        zones: [
          { x: 6, y: 96, w: 348, h: 456, label: 'AWS EC2 한 대' },
          { x: 22, y: 250, w: 316, h: 290, label: 'localhost', bottom: true }
        ],
        nodes: {
          a: { x: 6, y: 8, w: 108, h: 40 },
          b: { x: 126, y: 8, w: 108, h: 40 },
          c: { x: 246, y: 8, w: 108, h: 40, label: '다른 사람' },
          ng: { x: 80, y: 140, w: 200, h: 64 },
          api: { x: 80, y: 290, w: 200, h: 64 },
          db: { x: 80, y: 420, w: 200, h: 64 }
        },
        edges: {
          a_n: ['a', 'b', 'ng', 't', { fb: 0.2, mid: 112 }],
          b_n: ['b', 'b', 'ng', 't', { fb: 0.5, mid: 112 }],
          c_n: ['c', 'b', 'ng', 't', { fb: 0.8, mid: 112 }],
          n_api: ['ng', 'b', 'api', 't', { label: '127.0.0.1:8080', lx: 190, ly: 236 }],
          api_db: ['api', 'b', 'db', 't', { label: '파일 I/O', lx: 190, ly: 392 }]
        }
      }
    },
    scenarios: [
      {
        label: '함께 만들기', title: '친구의 트랙 위에 내 트랙을 얹는 길',
        result: '실시간으로 함께 연주하지 않습니다. 따로 녹음한 트랙을 서버에 올리고, 화면이 1.5초마다 곡을 다시 받아 와 합칩니다.',
        steps: [
          { say: '원작자가 혼자 연주하고 녹음한 곡은 기기 안에서 끝납니다. 공유를 누를 때만 서버로 갑니다.', set: { a: 'on' } },
          { say: '곡을 올리면(POST /sessions) nginx를 지나 Node 앱이 6자리 코드를 만들고 SQLite에 저장합니다.', move: ['a_n', 'n_api', 'api_db'], set: { ng: 'on', api: 'on', db: 'on' }, badge: { api: { text: '6자리 코드' } } },
          { say: '코드는 원작자에게 돌아가고, 원작자는 그 코드를 친구에게 전합니다.', move: ['-api_db', '-n_api', '-a_n'], badge: { a: { text: '코드', tone: 'accent' } } },
          { say: '친구는 코드로 곡을 열고(GET /sessions/:code), 그 위에 자기 트랙을 얹습니다(POST …/tracks).', move: ['b_n', 'n_api', 'api_db'], set: { b: 'on' }, badge: { db: { text: '트랙 추가' } } },
          { say: '원작자의 화면은 1.5초마다 곡을 다시 받아 옵니다. 통합 시험에서는 다른 사람이 트랙을 추가하자 1.8초 안에 트랙 수가 1에서 2로 바뀌었습니다.', move: ['-api_db', '-n_api', '-a_n'], set: { a: 'ok' }, badge: { a: { text: '트랙 1→2', tone: 'accent' } } }
        ]
      },
      {
        label: '공개 곡에 남이 붙이면', title: '공개된 곡에 다른 사람이 트랙을 붙이려 할 때',
        result: 'Codex 독립 검토가 출시 전에 처음 찾은 문제입니다. 고친 뒤에는 다른 키로 붙이면 403, 소유자 키로 붙이면 201이 나왔습니다.',
        init: { nodes: { a: 'on' } },
        steps: [
          { say: '원작자의 곡이 커뮤니티 보드에 공개돼 있어, 곡 코드는 누구나 볼 수 있습니다.', badge: { a: { text: '공개 곡' } } },
          { say: '고치기 전에는 코드만 알면 누구나 남의 곡에 트랙을 붙일 수 있었습니다. 독립 검토는 이 문제로 출시 불가 판정을 냈습니다.', move: ['c_n', 'n_api'], set: { c: 'on', ng: 'on', api: 'on' }, badge: { c: { text: '다른 키' } } },
          { say: '이제 공개된 곡은 작성자 키가 같을 때만 트랙을 붙일 수 있습니다. 다른 키로 보낸 요청은 403으로 돌려보냅니다.', move: ['-n_api', '-c_n'], set: { api: 'block' }, badge: { api: { text: '403' } } },
          { say: '남의 곡을 가져다 쓰려면 원본 코드(origin_code)를 붙여 새 곡을 만듭니다. 원래 곡은 그대로 남습니다.', move: ['c_n', 'n_api', 'api_db'], set: { api: 'on', db: 'ok', c: 'ok' }, badge: { api: null, db: { text: '새 곡', tone: 'accent' } } },
          { say: '비공개 곡은 코드가 곧 열쇠입니다. 추측하기 어렵도록 코드를 crypto.randomInt로 만들게 바꿨습니다.', badge: { api: { text: 'crypto.randomInt', tone: 'accent' } } }
        ]
      },
      {
        label: '키 바꿔 신고하면', title: '한 사람이 키만 바꿔 세 번 신고할 때',
        result: '같은 IP에서 키만 바꿔 세 번 신고해도 댓글은 숨겨지지 않았습니다. 서로 다른 신고자 3명이 신고하면 자동으로 숨겨집니다.',
        steps: [
          { say: '서로 다른 신고자 3명이 같은 댓글을 신고하면, 그 댓글은 자동으로 숨겨집니다.', set: { db: 'on' }, badge: { db: { text: '신고자 3명이면 숨김' } } },
          { say: '고치기 전에는 한 사람이 클라이언트 키만 바꿔 보내면 서로 다른 신고자 3명처럼 보였습니다.', burst: 3, move: ['c_n', 'n_api'], set: { c: 'on', ng: 'on', api: 'on' }, badge: { c: { text: '키 3개' } } },
          { say: '이제 신고자는 클라이언트가 보낸 키가 아니라 서버가 확인한 IP로 셉니다. 세 번 모두 같은 신고자 한 명입니다.', badge: { api: { text: 'IP 하나 = 신고자 한 명', tone: 'accent' } } },
          { say: '그래서 댓글은 숨겨지지 않습니다(통합 시험 IT-SEC-03).', move: ['api_db'], set: { db: 'ok' }, badge: { db: { text: '댓글 유지', tone: 'accent' } } }
        ]
      },
      {
        label: 'XFF를 바꾸면', title: 'X-Forwarded-For를 바꿔 가며 계속 올릴 때',
        result: 'XFF를 바꿔 가며 13번 게시하자 12번은 201, 13번째는 429로 막혔습니다. 게시 한도는 IP당 분당 12건입니다.',
        steps: [
          { say: '요청 제한은 IP마다 셉니다. 고치기 전에는 X-Forwarded-For 헤더만 바꿔 보내면 다른 사람처럼 보여 제한을 피할 수 있었습니다.', burst: 3, move: ['c_n'], set: { c: 'on', ng: 'on' }, badge: { c: { text: 'XFF 위조' } } },
          { say: 'nginx는 클라이언트가 보낸 XFF를 이어 붙이지 않고, 실제 접속 주소($remote_addr)로 덮어씁니다.', set: { ng: 'ok' }, badge: { ng: { text: '$remote_addr', tone: 'accent' } } },
          { say: '앱은 127.0.0.1에만 열려 있어 nginx를 거치지 않고는 닿을 수 없고, TRUST_PROXY=1일 때만 그 헤더를 믿습니다.', move: ['n_api'], set: { api: 'on' }, badge: { api: { text: '127.0.0.1만' } } },
          { say: '같은 사람이 13번 게시하자 12번은 201, 13번째는 429로 막혔습니다(통합 시험 IT-SEC-07).', burst: 3, move: ['c_n', 'n_api'], set: { c: 'block' }, badge: { api: { text: '13번째 429', tone: 'accent' } } }
        ]
      }
    ]
  };
})();
