/* polytalk 페이지 전용 자료: 눌러 보는 구성도 하나(js/flow.js가 그린다)
   사실은 backend/ 원문 15쪽과 저장소의 README, 시퀀스 그림, 코드에 있는 것만 쓴다.
   '서버를 믿지 않는다'고 쓰지 않는다. 서버가 메시지 평문을 저장하지 않는다는 것까지만 말한다. */
(function () {
  'use strict';
  var S = window.FLOW_SPECS = window.FLOW_SPECS || {};

  S.e2ee = {
    aria: '클라이언트 A, 채팅 서버, 클라이언트 B와 서버의 JSON 저장소. 방에 들어가면 서버가 공개키를 서로에게 전하고, 두 클라이언트가 같은 Peer 키를 계산해 암호문을 주고받습니다.',
    nodes: {
      a: { label: '클라이언트 A', sub: '개인키 · Peer 키 · 평문' },
      s: { label: '채팅 서버', sub: 'ServerSocket :5000' },
      b: { label: '클라이언트 B', sub: '개인키 · Peer 키 · 평문' },
      db: { label: 'data/*.json', sub: '공개키 · 암호문 · 해시' }
    },
    layouts: {
      wide: {
        w: 1200, h: 380,
        zones: [
          { x: 16, y: 40, w: 300, h: 200, label: 'A의 기기' },
          { x: 440, y: 40, w: 320, h: 324, label: '서버', sub: 'Peer 키와 평문이 없습니다' },
          { x: 884, y: 40, w: 300, h: 200, label: 'B의 기기', right: true }
        ],
        nodes: {
          a: { x: 36, y: 104, w: 260, h: 84 },
          s: { x: 470, y: 104, w: 260, h: 84 },
          b: { x: 904, y: 104, w: 260, h: 84 },
          db: { x: 470, y: 272, w: 260, h: 68 }
        },
        edges: {
          a_s: ['a', 'r', 's', 'l', { label: 'TCP · JSON', lx: 383, ly: 136, anchor: 'middle' }],
          s_b: ['s', 'r', 'b', 'l', { label: 'TCP · JSON', lx: 817, ly: 136, anchor: 'middle' }],
          s_db: ['s', 'b', 'db', 't', { label: '저장', lx: 610, ly: 234 }]
        }
      },
      narrow: {
        w: 360, h: 470,
        zones: [
          { x: 50, y: 178, w: 260, h: 284, label: '서버', bottom: true }
        ],
        nodes: {
          a: { x: 6, y: 8, w: 166, h: 72, sub: 'Peer 키 · 평문' },
          b: { x: 188, y: 8, w: 166, h: 72, sub: 'Peer 키 · 평문' },
          s: { x: 80, y: 200, w: 200, h: 64 },
          db: { x: 80, y: 330, w: 200, h: 60, sub: '공개키 · 암호문' }
        },
        edges: {
          a_s: ['a', 'b', 's', 't', { fb: 0.3, mid: 140 }],
          s_b: ['s', 't', 'b', 'b', { fa: 0.7, mid: 140 }],
          s_db: ['s', 'b', 'db', 't', { label: '저장', lx: 190, ly: 302 }]
        }
      }
    },
    scenarios: [
      {
        label: '방에 들어가면', title: '방에 들어갈 때',
        result: '서버는 공개키만 전해 줍니다. 개인키는 각자의 기기에만 있고 네트워크로 나가지 않습니다.',
        steps: [
          { say: '회원가입 때 각자의 기기에서 EC 키쌍을 만들고, 서버에는 공개키만 등록합니다.', set: { a: 'on', b: 'on', db: 'on' }, badge: { a: { text: '개인키는 여기에만' }, b: { text: '개인키는 여기에만' } } },
          { say: 'A가 ROOM_JOIN으로 방에 들어갑니다. 서버는 방 비밀번호를 BCrypt 해시와 맞춰 봅니다.', move: ['a_s'], set: { s: 'on' }, badge: { a: null, s: { text: '입장 확인' } } },
          { say: '서버가 이미 방에 있는 B의 공개키를 A에게 보냅니다.', move: ['-a_s'], badge: { a: { text: 'B 공개키 받음' } } },
          { say: '그리고 새로 들어온 A의 공개키를 B에게 보냅니다.', move: ['s_b'], badge: { b: { text: 'A 공개키 받음' } } },
          { say: '키 교환에서 서버가 하는 일은 여기까지이고, 서버는 두 사람의 공개키만 압니다.', set: { s: 'ok' }, badge: { s: { text: '공개키만', tone: 'accent' } } }
        ]
      },
      {
        label: '같은 키 계산', title: '두 클라이언트가 같은 키를 계산할 때',
        result: '두 사람은 키 자체를 주고받지 않고도 같은 Peer 키를 얻습니다. 이 키는 서버를 지나가지 않습니다.',
        init: { nodes: { a: 'on', b: 'on', s: 'on' } },
        steps: [
          { say: 'A는 자기 개인키와 B의 공개키로 ECDH를 계산합니다.', set: { a: 'pending' }, badge: { a: { text: 'ECDH(A 개인, B 공개)' } } },
          { say: 'B는 자기 개인키와 A의 공개키로 ECDH를 계산합니다.', set: { b: 'pending' }, badge: { b: { text: 'ECDH(B 개인, A 공개)' } } },
          { say: '두 결과는 같은 Peer 키입니다. EcdhUtilTest가 이걸 확인합니다.', set: { a: 'ok', b: 'ok' }, badge: { a: { text: 'Peer 키', tone: 'accent' }, b: { text: 'Peer 키 · 같음', tone: 'accent' } } },
          { say: '이 키는 네트워크로 보내지 않아 서버에는 없습니다.', badge: { s: { text: 'Peer 키 없음' } } }
        ]
      },
      {
        label: '메시지 보내기', title: '메시지를 보낼 때',
        result: '서버에는 암호문만 저장됩니다.',
        init: { nodes: { a: 'ok', b: 'ok', s: 'on' } },
        steps: [
          { say: 'A가 메시지를 Peer 키로 AES-128-GCM 암호화합니다. IV를 매번 새로 만들어서 같은 문장도 암호문이 달라집니다.', badge: { a: { text: 'AES-GCM 암호화' } } },
          { say: '암호문이 담긴 CHAT 메시지가 TCP로 서버에 갑니다. 핸드셰이크를 마친 연결만 CHAT을 보낼 수 있습니다.', move: ['a_s'], badge: { a: null, s: { text: '암호문' } } },
          { say: '서버는 복호화하지 않고 ChatLog.encryptedData에 그대로 저장합니다.', move: ['s_db'], set: { db: 'ok' }, badge: { db: { text: '암호문만 저장', tone: 'accent' } } },
          { say: '같은 방의 B에게 그 암호문을 그대로 보냅니다.', move: ['s_b'] },
          { say: 'B는 같은 Peer 키로 풉니다. 인증 태그가 맞아야 평문이 나옵니다.', badge: { b: { text: '복호화 → 평문', tone: 'accent' } } }
        ]
      }
    ]
  };
})();
