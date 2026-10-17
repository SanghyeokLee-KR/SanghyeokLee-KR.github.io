/* failstop 페이지 전용 자료: 눌러 보는 구성도 두 개(js/flow.js가 그린다)
   사실은 infra/·backend/ 원문과 구성도 그림에 있는 것만 쓴다.
   AWS 장면에는 AWS에서 확인한 것만 넣는다(새 주 DB로 거래가 다시 흐르는 장면은 내 PC 시험의 기록이라 넣지 않는다). */
(function () {
  'use strict';
  var S = window.FLOW_SPECS = window.FLOW_SPECS || {};

  /* ---------- 구성도 1: AWS 운영 환경 ---------- */
  S.aws = {
    aria: 'AWS 서울 리전 구성도. 사용자, CloudFront, 로드밸런서, 두 데이터센터의 거래 서버, 조회 서버, HAProxy, 주 DB와 예비 DB, 관제 서버, 바깥의 운영자와 Teams, 온프레미스 AI 서버.',
    nodes: {
      user: { label: '사용자', kind: 'actor' },
      op: { label: '운영자', kind: 'actor' },
      cf: { label: 'CloudFront', sub: '웹·API 진입점' },
      lb: { label: '로드밸런서', sub: '3개 AZ 연결' },
      app1: { label: '거래 서버 1', sub: '주문 체결·조회' },
      q: { label: '조회 서버', sub: '사람이 몰릴 때만 켜짐' },
      app2: { label: '거래 서버 2', sub: '주문 체결·조회' },
      hap: { label: 'HAProxy', kind: 'small' },
      db1: { label: '주 DB', sub: 'PostgreSQL 17 · Patroni' },
      db2: { label: '예비 DB', sub: 'PostgreSQL 17 · Patroni' },
      mon: { label: '관제 서버', sub: 'Prometheus · Grafana' },
      s3: { label: 'S3', sub: '배포 파일' },
      ssm: { label: 'SSM', sub: 'SSH 대신 원격 관리' },
      teams: { label: 'Teams', sub: '운영 채널' },
      ai: { label: '온프레미스 AI 서버', sub: '제안까지만' }
    },
    initNodes: { q: 'off' },
    layouts: {
      wide: {
        w: 1280, h: 640,
        // 선이 이름표를 가로지르지 않게: 관제 영역은 오른쪽 세로 칸으로 두고 이름표는 아래에, 데이터센터 이름표는 선이 없는 왼쪽 위에,
        // 거래 서버 세 대의 선은 HAProxy 왼쪽으로만 들어가게 했다.
        zones: [
          { x: 288, y: 108, w: 980, h: 516, label: '서울 리전' },
          { x: 494, y: 214, w: 580, h: 152, label: '데이터센터 1', sub: 'AZ-a' },
          { x: 494, y: 456, w: 580, h: 156, label: '데이터센터 2', sub: 'AZ-c' },
          { x: 1090, y: 214, w: 166, h: 398, label: '관제', sub: 'AZ-b', bottom: true }
        ],
        nodes: {
          user: { x: 16, y: 364, w: 80, h: 44 },
          cf: { x: 116, y: 348, w: 150, h: 76 },
          lb: { x: 304, y: 348, w: 150, h: 76 },
          app1: { x: 516, y: 256, w: 180, h: 64 },
          q: { x: 516, y: 376, w: 180, h: 64 },
          app2: { x: 516, y: 512, w: 180, h: 64 },
          hap: { x: 730, y: 388, w: 92, h: 40, center: true },
          db1: { x: 862, y: 256, w: 190, h: 64 },
          db2: { x: 862, y: 512, w: 190, h: 64 },
          mon: { x: 1102, y: 372, w: 142, h: 72, sub: 'Prometheus·Grafana' },
          s3: { x: 396, y: 128, w: 140, h: 56 },
          ssm: { x: 552, y: 128, w: 200, h: 56 },
          op: { x: 592, y: 24, w: 120, h: 52 },
          teams: { x: 880, y: 24, w: 150, h: 52 },
          ai: { x: 1074, y: 24, w: 190, h: 52 }
        },
        edges: {
          u_cf: ['user', 'r', 'cf', 'l'],
          cf_lb: ['cf', 'r', 'lb', 'l'],
          lb_a1: ['lb', 'r', 'app1', 'l', { mid: 474 }],
          lb_q: ['lb', 'r', 'q', 'l', { dash: true, mid: 474 }],
          lb_a2: ['lb', 'r', 'app2', 'l', { mid: 474 }],
          a1_h: ['app1', 'r', 'hap', 'l', { fb: 0.25, mid: 713 }],
          q_h: ['q', 'r', 'hap', 'l', { dash: true }],
          a2_h: ['app2', 'r', 'hap', 'l', { fb: 0.75, mid: 713 }],
          h_d1: ['hap', 'r', 'db1', 'l', { fa: 0.3, mid: 842 }],
          rep: ['db1', 'b', 'db2', 't', { label: '엄격 동기 복제', lx: 967, ly: 416 }],
          ssm_a1: ['ssm', 'b', 'app1', 't', { fa: 0.325, fb: 0.5611, dash: true, label: '관리 접속', lx: 627, ly: 204 }],
          op_ssm: ['op', 'b', 'ssm', 't', { dash: true }],
          mon_ai: ['mon', 't', 'ai', 'b', { fa: 0.75, fb: (1102 + 142 * 0.75 - 1074) / 190, label: '지표', lx: 1218, ly: 172 }],
          mon_t: { pts: [[1137.5, 372], [1137.5, 100], [955, 100], [955, 76]], label: '경보', lx: 1129, ly: 172, anchor: 'end' },
          ai_t: ['ai', 'l', 'teams', 'r'],
          t_op: ['teams', 'l', 'op', 'r']
        }
      },
      narrow: {
        w: 360, h: 790,
        zones: [{ x: 6, y: 152, w: 348, h: 540, label: '서울 리전' }],
        nodes: {
          user: { x: 120, y: 8, w: 120, h: 40 },
          cf: { x: 80, y: 72, w: 200, h: 56 },
          lb: { x: 80, y: 188, w: 200, h: 56 },
          app1: { x: 16, y: 290, w: 104, h: 62, sub: 'AZ-a' },
          q: { x: 128, y: 290, w: 104, h: 62, sub: '몰릴 때만' },
          app2: { x: 240, y: 290, w: 104, h: 62, sub: 'AZ-c' },
          hap: { x: 130, y: 392, w: 100, h: 34, center: true },
          db1: { x: 16, y: 466, w: 132, h: 62, sub: 'AZ-a · Patroni' },
          db2: { x: 212, y: 466, w: 132, h: 62, sub: 'AZ-c · Patroni' },
          mon: { x: 80, y: 590, w: 200, h: 62, sub: 'AZ-b · Prometheus' },
          op: { x: 6, y: 730, w: 110, h: 46 },
          teams: { x: 130, y: 730, w: 100, h: 46, sub: '' },
          ai: { x: 244, y: 730, w: 110, h: 46, label: 'AI 서버', sub: '온프레미스' }
        },
        edges: {
          u_cf: ['user', 'b', 'cf', 't'],
          cf_lb: ['cf', 'b', 'lb', 't'],
          lb_a1: ['lb', 'b', 'app1', 't'],
          lb_q: ['lb', 'b', 'q', 't', { dash: true }],
          lb_a2: ['lb', 'b', 'app2', 't'],
          a1_h: ['app1', 'b', 'hap', 't'],
          q_h: ['q', 'b', 'hap', 't', { dash: true }],
          a2_h: ['app2', 'b', 'hap', 't'],
          h_d1: ['hap', 'b', 'db1', 't'],
          rep: ['db1', 'r', 'db2', 'l', { label: '동기 복제', lx: 180, ly: 488, anchor: 'middle' }],
          mon_ai: ['mon', 'b', 'ai', 't', { fa: 0.8, mid: 712 }],
          mon_t: ['mon', 'b', 'teams', 't'],
          ai_t: ['ai', 'l', 'teams', 'r'],
          t_op: ['teams', 'l', 'op', 'r']
        }
      }
    },
    scenarios: [
      {
        label: '주문 한 건', title: '주문 한 건의 처리 경로',
        result: '커밋이 끝난 주문은 주 DB와 예비 DB에 모두 남아 있어서, 거래 서버가 죽어도 사라지지 않습니다.',
        steps: [
          { say: '사용자의 주문은 CloudFront를 지나 로드밸런서로 들어옵니다.', move: ['u_cf', 'cf_lb'], set: { cf: 'on', lb: 'on' } },
          { say: '로드밸런서가 데이터센터마다 한 대씩 있는 거래 서버로 넘깁니다.', move: ['lb_a1'], set: { app1: 'on' } },
          { say: '거래 서버는 엔진보다 먼저 DB의 명령 저널에 주문을 적습니다. HAProxy가 지금의 주 DB로 연결해 줍니다.', move: ['a1_h', 'h_d1'], set: { hap: 'on', db1: 'on' } },
          { say: '예비 DB에도 같은 기록이 써져야 커밋이 끝납니다(Patroni 엄격 동기 복제).', move: ['rep'], set: { db2: 'on' } },
          { say: '그다음에 매칭 엔진이 체결하고, 결과가 원장에 남습니다.', move: ['-h_d1', '-a1_h', '-lb_a1', '-cf_lb', '-u_cf'], set: { app1: 'ok' }, badge: { app1: { text: '체결', tone: 'accent' } } }
        ]
      },
      {
        label: '주 DB가 꺼지면', title: '주 DB 전원 차단 시험',
        result: '2026년 10월 AWS 서울 리전에서 한 시험입니다. DB 전환에는 AI가 관여하지 않고 Patroni가 처리합니다.',
        init: { nodes: { app1: 'on', app2: 'on', hap: 'on', db1: 'on', db2: 'on', q: 'off' }, lit: ['a1_h', 'a2_h', 'h_d1', 'rep'] },
        steps: [
          { say: '주 DB 서버의 전원을 끊습니다.', set: { db1: 'down' }, badge: { db1: { text: '전원 차단' } }, unlit: ['h_d1', 'rep'] },
          { say: '예비 DB가 스스로 새 주 DB가 됩니다.', clock: { to: 23.0, label: '주 DB가 꺼지고 예비 DB가 넘겨받기까지' }, set: { db2: 'ok' }, rename: { db2: '새 주 DB' }, badge: { db2: { text: '23.0초', tone: 'accent' } } },
          { say: '끊기기 직전 주문 196건을 하나씩 대조했습니다. 사라진 주문은 없었습니다.', badge: { db2: { text: '196건 중 유실 0건', tone: 'accent' } } }
        ]
      },
      {
        label: '사람이 몰리면', title: '부하가 올라갈 때 조회 서버를 늘리는 순서',
        result: '경보부터 조회 서버 합류까지 4분 44초가 걸렸습니다.',
        steps: [
          { time: '03:02:12', say: '부하가 올라가 CPU 경보가 울리고, Teams로 알림이 갑니다.', burst: 3, move: ['u_cf', 'cf_lb', 'lb_a1'], move2: ['mon_t', 't_op'], set: { cf: 'on', lb: 'on', app1: 'on', mon: 'on', teams: 'on', op: 'on' }, badge: { mon: { text: 'CPU 경보' } } },
          { time: '03:03:57', say: 'AI가 지표를 모아 보고, 조회 서버를 한 대 늘리자고 제안합니다.', move: ['mon_ai'], set: { ai: 'on' }, badge: { ai: { text: '조회 서버 +1', tone: 'accent' } } },
          { time: '03:05:49', say: '운영자인 제가 제안을 확인하고 승인합니다. 승인 전에는 서버를 바꾸지 않습니다.', set: { op: 'ok' }, badge: { op: { text: '승인', tone: 'accent' } } },
          { time: '03:06:56', say: '67초 뒤 조회 서버가 합류합니다.', pre: { q: 'pending' }, hold: 900, move: ['lb_q'], set: { q: 'ok' }, badge: { q: { text: '합류', tone: 'accent' } } },
          { time: '03:07', say: '경보가 풀리고, AI가 쓴 장애 보고서가 Teams에 올라옵니다.', move: ['ai_t'], badge: { mon: null, teams: { text: '보고서', tone: 'accent' } } }
        ]
      }
    ]
  };

  /* ---------- 구성도 2: 가상 머신 실습망의 방화벽 층 ---------- */
  S.fw = {
    aria: '가상 머신 실습망의 방화벽 층. 경계 방화벽, 투명 방화벽 안의 HAProxy 입구와 포트 정책과 Suricata, 그 아래 웹 진입 서버, 앱 서버, 주 DB, 관제 서버. 서버마다 nftables.',
    nodes: {
      net: { label: '외부 요청', kind: 'actor' },
      fw: { label: '경계 방화벽', sub: 'pfSense · NAT' },
      haproxy: { label: 'HAProxy 입구', sub: 'L7 · 암호화를 풀어 내용 확인', kind: 'layer' },
      pol: { label: '포트 정책', sub: 'L3·L4 · 필요한 포트만 허용', kind: 'layer' },
      ids: { label: 'Suricata', sub: 'IDS · 웹과 앱 사이 감시', kind: 'layer' },
      web: { label: '웹 진입 서버', sub: 'DMZ' },
      app: { label: '앱 서버', sub: 'APP · 8080' },
      db: { label: '주 DB', sub: 'DATA' },
      ops: { label: '관제 서버', sub: 'OPS' }
    },
    layouts: {
      wide: {
        w: 1200, h: 520,
        zones: [
          { x: 16, y: 112, w: 1168, h: 150, right: true, label: '투명 방화벽', sub: 'pfSense 브리지 · 서버 설정은 그대로 두고 앞에 끼움' },
          { x: 16, y: 296, w: 1168, h: 200, label: 'nftables', sub: '서버마다 한 번 더 · 기본 차단, 필요한 것만 허용', solid: true, bottom: true }
        ],
        nodes: {
          net: { x: 24, y: 24, w: 150, h: 48 },
          fw: { x: 240, y: 20, w: 250, h: 56 },
          haproxy: { x: 40, y: 160, w: 340, h: 72 },
          pol: { x: 412, y: 160, w: 340, h: 72 },
          ids: { x: 784, y: 160, w: 376, h: 72 },
          web: { x: 40, y: 330, w: 250, h: 72 },
          app: { x: 330, y: 330, w: 250, h: 72 },
          db: { x: 620, y: 330, w: 250, h: 72 },
          ops: { x: 910, y: 330, w: 250, h: 72 }
        },
        edges: {
          n_f: ['net', 'r', 'fw', 'l'],
          f_h: ['fw', 'b', 'haproxy', 't', { mid: 96 }],
          h_w: ['haproxy', 'b', 'web', 't', { fa: 0.5588, fb: 0.76 }],
          w_p: ['web', 't', 'pol', 'b', { fa: 0.9, fb: 0.2, mid: 281 }],
          p_i: ['pol', 'r', 'ids', 'l'],
          i_a: ['ids', 'b', 'app', 't', { fa: 0.15, fb: 0.75, mid: 300 }],
          p_d: ['pol', 'b', 'db', 't', { fa: 0.8, fb: 0.256, hidden: true }],
          i_o: ['ids', 'b', 'ops', 't', { fa: 0.75, fb: 0.624, label: '경보', lx: 1076, ly: 290 }]
        }
      },
      narrow: {
        w: 360, h: 500,
        nodes: {
          net: { x: 16, y: 8, w: 150, h: 40 },
          fw: { x: 184, y: 4, w: 160, h: 48 },
          haproxy: { x: 16, y: 84, w: 224, h: 54, sub: 'L7 · 투명 방화벽' },
          web: { x: 16, y: 170, w: 224, h: 54 },
          pol: { x: 16, y: 256, w: 224, h: 54, sub: 'L3·L4 · 투명 방화벽' },
          ids: { x: 16, y: 342, w: 224, h: 54, sub: 'IDS · 투명 방화벽' },
          app: { x: 16, y: 428, w: 224, h: 54 },
          db: { x: 256, y: 256, w: 88, h: 54 },
          ops: { x: 256, y: 342, w: 88, h: 54 }
        },
        edges: {
          n_f: ['net', 'r', 'fw', 'l'],
          f_h: ['fw', 'b', 'haproxy', 't', { fb: 0.85, mid: 68 }],
          h_w: ['haproxy', 'b', 'web', 't'],
          w_p: ['web', 'b', 'pol', 't'],
          p_i: ['pol', 'b', 'ids', 't'],
          i_a: ['ids', 'b', 'app', 't'],
          p_d: ['pol', 'r', 'db', 'l', { hidden: true }],
          i_o: ['ids', 'r', 'ops', 'l']
        }
      }
    },
    scenarios: [
      {
        label: '평소 요청', title: '정상 요청의 경로',
        result: 'L7 입구, L3·L4 포트 정책, IDS, 서버별 nftables로 차단과 탐지를 나눴습니다.',
        steps: [
          { say: '요청이 경계 방화벽을 지나 투명 방화벽의 HAProxy 입구에 닿습니다.', move: ['n_f', 'f_h'], set: { fw: 'on' } },
          { say: 'HAProxy가 암호화를 풀어 내용을 보고, 웹 진입 서버로 넘깁니다.', move: ['h_w'], set: { haproxy: 'ok', web: 'on' } },
          { say: '웹 서버는 앱 서버의 8080 포트로만 갈 수 있습니다.', move: ['w_p'], set: { pol: 'ok' }, badge: { pol: { text: '허용 8080', tone: 'accent' } } },
          { say: '웹과 앱 사이는 Suricata가 지켜봅니다. 요청이 앱 서버에 닿았습니다.', move: ['p_i', 'i_a'], set: { ids: 'on', app: 'ok' } },
          { say: '서버 안에서는 nftables가 기본은 모두 막고 필요한 것만 엽니다. 규칙 파일 하나로 여섯 대를 똑같이 맞췄습니다.' }
        ]
      },
      {
        label: 'SQL 주입', title: 'SQL 주입 시험 요청',
        result: 'HAProxy 입구에서 403으로 돌려보내고, 요청은 웹 서버까지 가지 않습니다.',
        steps: [
          { say: '시험용 SQL 주입 요청이 경계 방화벽을 지나 들어옵니다.', move: ['n_f', 'f_h'], set: { fw: 'on' } },
          { say: 'HAProxy가 내용을 열어 보고 SQL 주입을 알아챕니다.', set: { haproxy: 'block' }, badge: { haproxy: { text: '차단' } } },
          { say: '요청은 403으로 돌아갑니다.', move: ['-f_h', '-n_f'], set: { net: 'on' }, badge: { haproxy: { text: '403' } } }
        ]
      },
      {
        label: '웹에서 DB로', title: '웹 서버가 DB로 바로 가려 할 때',
        result: 'DB로 바로 가는 길은 막혀 있습니다. 웹 서버가 갈 수 있는 곳은 앱 서버의 8080 포트뿐입니다.',
        init: { nodes: { web: 'on' } },
        steps: [
          { say: '웹 진입 서버에서 주 DB로 바로 가는 연결을 시도합니다.', move: ['w_p'], set: { pol: 'on' } },
          { say: '포트 정책에 없는 길이라 투명 방화벽에서 막힙니다.', ghost: ['p_d'], set: { pol: 'block' }, badge: { pol: { text: 'DB 차단' } } }
        ]
      },
      {
        label: '스크립트 삽입', title: '스크립트 삽입 시도',
        result: 'Suricata는 IDS라서 차단하지 않고, 탐지해서 경보를 보냅니다.',
        init: { nodes: { web: 'on' } },
        steps: [
          { say: '웹 서버에서 앱 서버로 가는 요청에 스크립트 삽입 시도가 섞여 있습니다.', move: ['w_p', 'p_i'], set: { pol: 'on' } },
          { say: 'Suricata가 이 시도를 찾아냅니다.', set: { ids: 'ok' }, badge: { ids: { text: '탐지', tone: 'accent' } } },
          { say: '관제 서버로 경보가 갑니다.', move: ['i_o'], set: { ops: 'ok' }, badge: { ops: { text: '경보', tone: 'accent' } } }
        ]
      }
    ]
  };
})();
