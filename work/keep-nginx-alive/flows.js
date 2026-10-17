/* keep-nginx-alive 페이지 전용 자료: 눌러 보는 구성도 하나(js/flow.js가 그린다)
   사실은 infra/ 원문 10~12장과 저장소 README·docs·구성도에 적힌 것만 쓴다.
   '다운에서 복구까지 2초'는 Teams 알림 기록 한 건이다. 어느 공격 때의 기록인지는 원문에 없으므로 공격 장면과 잇지 않는다. */
(function () {
  'use strict';
  var S = window.FLOW_SPECS = window.FLOW_SPECS || {};

  S.ctf = {
    aria: 'CTF 방어 구성도. 공격자는 #1 서버에만 SSH root로 들어오고, 채점 봇은 로드밸런서 주소만 확인합니다. 로드밸런서 뒤에는 #1의 nginx와 같은 구성의 #2, #3 서버가 있고, #1 안의 복구 장치 다섯 겹이 nginx를 되살리며, 상태 변화는 Teams로 알립니다.',
    nodes: {
      atk: { label: '공격자 (교수님)', kind: 'actor' },
      bot: { label: '채점 봇', kind: 'actor' },
      nlb: { label: '로드밸런서', sub: 'NLB · 제출한 고정 주소' },
      ngx: { label: 'nginx', sub: '80번 · 채점 페이지' },
      guard: { label: '복구 장치 다섯 겹', sub: 'systemd부터 독립 감시까지', kind: 'layer' },
      s2: { label: '#2 서버', sub: '같은 구성 · SSH 막음' },
      s3: { label: '#3 서버', sub: '같은 구성 · SSH 막음' },
      teams: { label: 'Teams', sub: '로그인 · 명령 · 다운과 복구' }
    },
    layouts: {
      wide: {
        w: 1200, h: 520,
        zones: [
          { x: 600, y: 56, w: 584, h: 156, label: '#1 서버', sub: '공격자가 들어올 수 있는 유일한 서버' }
        ],
        nodes: {
          atk: { x: 24, y: 104, w: 180, h: 48 },
          bot: { x: 24, y: 300, w: 180, h: 48 },
          nlb: { x: 330, y: 286, w: 200, h: 76 },
          ngx: { x: 620, y: 104, w: 230, h: 80 },
          guard: { x: 930, y: 104, w: 234, h: 80 },
          s2: { x: 620, y: 286, w: 230, h: 76 },
          s3: { x: 620, y: 410, w: 230, h: 76 },
          teams: { x: 930, y: 286, w: 234, h: 76 }
        },
        edges: {
          atk_ngx: ['atk', 'r', 'ngx', 'l', { fb: 0.3, dash: true, label: 'SSH root', lx: 400, ly: 116, anchor: 'middle' }],
          bot_nlb: ['bot', 'r', 'nlb', 'l', { label: '5분마다 채점', lx: 267, ly: 312, anchor: 'middle' }],
          nlb_ngx: ['nlb', 'r', 'ngx', 'l', { fa: 0.25, fb: 0.7, mid: 580 }],
          nlb_s2: ['nlb', 'r', 's2', 'l'],
          nlb_s3: ['nlb', 'r', 's3', 'l', { fa: 0.75, mid: 580 }],
          g_ngx: ['guard', 'l', 'ngx', 'r', { label: '되살림', lx: 890, ly: 134, anchor: 'middle' }],
          ngx_t: ['ngx', 'b', 'teams', 't', { fa: 0.85, mid: 244, label: '알림', lx: 1058, ly: 270 }]
        }
      },
      narrow: {
        w: 360, h: 450,
        zones: [
          { x: 4, y: 176, w: 120, h: 214, label: '#1 서버', bottom: true }
        ],
        nodes: {
          atk: { x: 8, y: 8, w: 120, h: 40, label: '공격자' },
          bot: { x: 180, y: 8, w: 170, h: 40 },
          nlb: { x: 134, y: 88, w: 216, h: 50, sub: 'NLB' },
          ngx: { x: 14, y: 200, w: 104, h: 56, sub: '80번' },
          guard: { x: 14, y: 290, w: 104, h: 64, label: '복구 장치', sub: '다섯 겹' },
          s2: { x: 134, y: 200, w: 104, h: 56, sub: '같은 구성' },
          s3: { x: 246, y: 200, w: 104, h: 56, sub: '같은 구성' },
          teams: { x: 134, y: 310, w: 216, h: 56, sub: '세 채널 알림' }
        },
        edges: {
          atk_ngx: ['atk', 'b', 'ngx', 't', { fa: 0.2667, fb: 0.25, dash: true }],
          bot_nlb: ['bot', 'b', 'nlb', 't', { fa: 0.5, fb: 0.6065 }],
          nlb_ngx: ['nlb', 't', 'ngx', 't', { fa: 0.0741, fb: 0.6346, mid: 70 }],
          nlb_s2: ['nlb', 'b', 's2', 't', { fa: 0.2407 }],
          nlb_s3: ['nlb', 'b', 's3', 't', { fa: 0.7593 }],
          g_ngx: ['guard', 't', 'ngx', 'b'],
          ngx_t: ['ngx', 'r', 'teams', 'l', { fa: 0.8, mid: 129 }]
        }
      }
    },
    scenarios: [
      {
        label: '평소 채점', title: '채점 봇이 5분마다 확인하는 길',
        result: '채점 봇은 로드밸런서 주소 하나만 봅니다. 뒤의 서버 중 한 곳만 정상이어도 채점은 통과합니다.',
        steps: [
          { say: '채점 봇이 5분마다 제출한 주소로 페이지를 요청합니다.', move: ['bot_nlb'], set: { nlb: 'on' } },
          { say: '로드밸런서는 세 서버의 /healthz를 보고, 정상인 서버로만 보냅니다. #1은 2초마다 자기 페이지 본문을 검사해 정상일 때만 200을 냅니다.', move: ['nlb_ngx'], set: { ngx: 'ok', s2: 'ok', s3: 'ok' }, badge: { ngx: { text: '/healthz 200', tone: 'accent' } } },
          { say: '정상 페이지가 200으로 돌아갑니다. #2와 #3은 SSH를 막아 두어 공격자가 들어올 수 없습니다.', move: ['-nlb_ngx', '-bot_nlb'], badge: { nlb: { text: '200', tone: 'accent' } } }
        ]
      },
      {
        label: 'nginx가 꺼지면', title: 'nginx가 강제로 꺼졌을 때',
        result: '00:03:45에 다운 알림이, 00:03:47에 복구 알림이 Teams로 왔습니다. 2초 걸렸습니다.',
        steps: [
          { say: 'nginx가 강제로 꺼지고, Teams로 다운 알림이 갑니다.', set: { ngx: 'down' }, badge: { ngx: { text: '다운' } }, move: ['ngx_t'] },
          { say: 'systemd가 꺼진 nginx를 2초 뒤 다시 띄웁니다. 복구 장치 중 첫 단계입니다.', move: ['g_ngx'], set: { guard: 'on' }, clock: { to: 2.0, label: '다운에서 복구까지' } },
          { say: 'nginx가 돌아오고, 복구 시간을 담은 알림이 Teams로 갑니다.', move: ['ngx_t'], set: { ngx: 'ok', teams: 'ok' }, badge: { ngx: null, teams: { text: '복구 2초', tone: 'accent' } } }
        ]
      },
      {
        label: '1차 공격', title: '감시 스크립트를 노린 공격',
        result: '감시 스크립트를 꺼도 남아 있던 다른 복구 장치가 1분 안에 nginx를 되살렸습니다.',
        steps: [
          { say: '공격자가 감시 스크립트와 nginx를 한꺼번에 끕니다.', move: ['atk_ngx'], set: { atk: 'on', ngx: 'down', guard: 'pending' }, badge: { ngx: { text: '다운' }, guard: { text: '감시 스크립트 꺼짐' } } },
          { say: '남아 있던 다른 복구 장치가 nginx를 다시 띄웁니다.', move: ['g_ngx'], set: { ngx: 'ok', guard: 'on' }, badge: { ngx: { text: '1분 안에 복구', tone: 'accent' }, guard: null } },
          { say: '공격자는 이어서 docker와 .ssh 폴더를 살펴봤지만, 채점 봇에는 정상 페이지가 그대로 나갑니다.', move: ['bot_nlb', 'nlb_ngx', '-nlb_ngx', '-bot_nlb'], set: { nlb: 'on' } }
        ]
      },
      {
        label: '2차 공격', title: 'apache2로 80번 포트를 빼앗았을 때',
        result: '#1이 스스로 빠지고 로드밸런서가 #2와 #3으로 돌려, 채점은 끊기지 않았습니다.',
        init: { nodes: { ngx: 'ok', s2: 'ok', s3: 'ok' } },
        steps: [
          { say: '공격자가 nginx를 멈추고 apache2를 설치해 80번 포트를 차지합니다.', move: ['atk_ngx'], set: { atk: 'on', ngx: 'block' }, rename: { ngx: 'apache2' }, badge: { ngx: { text: '80번 빼앗김' } } },
          { say: '채점 페이지가 사라지자 #1은 헬스체크에 실패하고, 로드밸런서 대상에서 빠집니다.', unlit: ['nlb_ngx', 'atk_ngx'], badge: { ngx: { text: '대상에서 빠짐' } } },
          { say: '로드밸런서는 #2와 #3으로 보냅니다. 채점 봇은 끊김 없이 200을 받습니다.', move: ['bot_nlb', 'nlb_s2', '-nlb_s2', '-bot_nlb'], set: { nlb: 'on' }, badge: { s2: { text: '200', tone: 'accent' } } },
          { say: '그사이 팀원이 들어가 apache2를 지웁니다.', move: ['ngx_t'], set: { teams: 'on', ngx: 'pending' }, rename: { ngx: 'nginx' }, badge: { ngx: { text: '정리 중' } } },
          { say: 'nginx가 돌아오고 헬스체크가 다시 200이 되자, #1은 대상에 다시 들어갑니다.', move: ['nlb_ngx'], set: { ngx: 'ok' }, badge: { ngx: { text: '다시 들어감', tone: 'accent' } } }
        ]
      },
      {
        label: '3차 공격', title: 'nginx가 다시 켜지지 못하게 막았을 때',
        result: 'mask까지 걸어도 nginx는 다시 떴고, 채점은 그대로 이어졌습니다.',
        init: { nodes: { ngx: 'ok' } },
        steps: [
          { say: '공격자가 nginx를 멈추고 systemctl mask로 다시 켜지는 길까지 막습니다.', move: ['atk_ngx'], set: { atk: 'on', ngx: 'down' }, badge: { ngx: { text: 'mask' } } },
          { say: '감시 스크립트가 unmask로 막힌 것을 풀고 nginx를 다시 띄웁니다.', move: ['g_ngx'], set: { guard: 'on', ngx: 'ok' }, badge: { ngx: { text: '풀고 다시 띄움', tone: 'accent' } } },
          { say: '채점 봇에는 정상 페이지가 그대로 나갑니다.', move: ['bot_nlb', 'nlb_ngx', '-nlb_ngx', '-bot_nlb'], set: { nlb: 'on' } }
        ]
      }
    ]
  };
})();
