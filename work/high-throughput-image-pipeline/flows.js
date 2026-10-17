/* high-throughput-image-pipeline 페이지 전용 자료: 눌러 보는 구성도 하나(js/flow.js가 그린다)
   사실은 infra/ 원문 13장과 저장소 README에 적힌 것만 쓴다. 숫자는 t3.micro 실측(시작 코드 5026468, 200장)이다. */
(function () {
  'use strict';
  var S = window.FLOW_SPECS = window.FLOW_SPECS || {};

  S.pipe = {
    aria: '이미지 수집 파이프라인 구성도. t3.micro 한 대 안에 생산자 프로세스, Redis 큐, 소비자 프로세스 두 개, 디스크가 있고, 소비자는 바깥의 수집 대상 사이트에 HTTP/2로 요청합니다.',
    nodes: {
      prod: { label: '생산자', sub: '프로세스 1개 · 상품 코드 +1' },
      redis: { label: 'Redis 큐', sub: '생산자와 소비자 사이' },
      c1: { label: '소비자 프로세스 1', sub: '코루틴 128개' },
      c2: { label: '소비자 프로세스 2', sub: '코루틴 128개' },
      disk: { label: '디스크', sub: '~/images' },
      site: { label: '수집 대상 사이트', sub: '상품 상세 페이지' }
    },
    layouts: {
      wide: {
        w: 1200, h: 400,
        zones: [
          { x: 16, y: 40, w: 940, h: 330, label: 't3.micro 한 대', sub: 'vCPU 2 · 메모리 1GB' }
        ],
        nodes: {
          prod: { x: 40, y: 170, w: 210, h: 72 },
          redis: { x: 300, y: 170, w: 180, h: 72 },
          c1: { x: 540, y: 96, w: 230, h: 72 },
          c2: { x: 540, y: 250, w: 230, h: 72 },
          disk: { x: 806, y: 170, w: 136, h: 72 },
          site: { x: 1000, y: 170, w: 184, h: 72 }
        },
        edges: {
          p_r: ['prod', 'r', 'redis', 'l', { label: '코드', lx: 275, ly: 198, anchor: 'middle' }],
          r_c1: ['redis', 'r', 'c1', 'l', { fa: 0.3, mid: 510 }],
          r_c2: ['redis', 'r', 'c2', 'l', { fa: 0.7, mid: 510 }],
          c1_s: ['c1', 'r', 'site', 't', { fa: 0.3, label: 'HTTP/2', lx: 1084, ly: 108, anchor: 'end' }],
          c2_s: ['c2', 'r', 'site', 'b', { fa: 0.7 }],
          c1_d: ['c1', 'r', 'disk', 'l', { fa: 0.7, fb: 0.3, mid: 788 }],
          c2_d: ['c2', 'r', 'disk', 'l', { fa: 0.3, fb: 0.7, mid: 788 }]
        }
      },
      narrow: {
        w: 360, h: 570,
        zones: [
          { x: 4, y: 4, w: 352, h: 410, label: 't3.micro 한 대' }
        ],
        nodes: {
          prod: { x: 140, y: 30, w: 200, h: 56 },
          redis: { x: 140, y: 122, w: 200, h: 56 },
          c1: { x: 16, y: 226, w: 156, h: 62, label: '소비자 1' },
          c2: { x: 188, y: 226, w: 156, h: 62, label: '소비자 2' },
          disk: { x: 90, y: 330, w: 180, h: 56 },
          site: { x: 16, y: 440, w: 328, h: 56 }
        },
        edges: {
          p_r: ['prod', 'b', 'redis', 't'],
          r_c1: ['redis', 'b', 'c1', 't', { fa: 0.25, fb: 0.5, mid: 205 }],
          r_c2: ['redis', 'b', 'c2', 't', { fa: 0.75, fb: 0.5, mid: 205 }],
          c1_s: ['c1', 'b', 'site', 't', { fa: 0.15, fb: (39.4 - 16) / 328 }],
          c2_s: ['c2', 'b', 'site', 't', { fa: 0.85, fb: (320.6 - 16) / 328 }],
          c1_d: ['c1', 'b', 'disk', 't', { fa: 0.6, fb: 0.2, mid: 309 }],
          c2_d: ['c2', 'b', 'disk', 't', { fa: 0.4, fb: 0.8, mid: 309 }]
        }
      }
    },
    scenarios: [
      {
        label: '상품 하나', title: '상품 코드 하나가 지나가는 길',
        result: '생산자와 소비자는 Redis로만 이야기합니다. 동시성은 프로세스와 코루틴으로 냈고, 스레드는 한 개도 쓰지 않았습니다.',
        steps: [
          { say: '생산자가 시작 코드에서 1씩 늘려 가며 상품 코드를 Redis 큐에 넣습니다.', move: ['p_r'], set: { prod: 'on', redis: 'on' } },
          { say: '소비자 프로세스가 준비되는 대로 큐에서 코드를 꺼냅니다. 프로세스마다 코루틴 128개가 함께 일합니다.', move: ['r_c1'], set: { c1: 'on' } },
          { say: '상품 상세 페이지를 HTTP/2로 요청합니다. 요청 수백 개가 몇 개의 연결을 나눠 써서 TLS 연결 비용을 줄입니다.', move: ['c1_s', '-c1_s'], set: { site: 'ok' } },
          { say: '없는 코드에도 200이 오기 때문에, 본문에 이미지 필드가 있을 때만 유효한 상품으로 봅니다.', badge: { c1: { text: '유효', tone: 'accent' } } },
          { say: 'Redis INCR로 저장할 자리를 하나 예약한 뒤 이미지를 디스크에 씁니다. 그래서 정확히 N장만 남습니다.', move: ['-r_c1'], move2: ['r_c1', 'c1_d'], set: { disk: 'ok' }, badge: { redis: { text: 'INCR' } } },
          { say: '끝났는지는 카운터가 아니라 디스크에 실제로 쌓인 파일 수로 판단합니다.', badge: { disk: { text: '파일 수로 판단', tone: 'accent' }, redis: null } }
        ]
      },
      {
        label: '측정 전 예열', title: '타이머를 켜기 전에 끝내 두는 일',
        result: '한 번만 드는 준비 비용이 측정값에 섞이지 않게, 예열을 모두 마친 뒤 GO 신호부터 시간을 쟀습니다.',
        steps: [
          { say: '소비자 프로세스를 미리 띄웁니다.', pre: { c1: 'pending', c2: 'pending' }, hold: 700, set: { c1: 'on', c2: 'on' } },
          { say: '프로세스마다 httpx.Client를 만들어 연결 풀을 준비합니다.', badge: { c1: { text: '연결 풀' }, c2: { text: '연결 풀' } } },
          { say: 'robots.txt를 한 번 요청해 DNS·TCP·TLS를 실제로 데워 둡니다.', move: ['c1_s', '-c1_s'], move2: ['c2_s', '-c2_s'], set: { site: 'on' } },
          { say: '모든 소비자가 READY가 되면 Enter로 GO 신호를 보내고, 그때부터 타이머가 돕니다.', set: { c1: 'ok', c2: 'ok' }, badge: { c1: { text: 'READY', tone: 'accent' }, c2: { text: 'READY', tone: 'accent' } } }
        ]
      },
      {
        label: '200장 모으기', title: '200장을 모으는 동안',
        result: 't3.micro에서 같은 시작 코드로 잰 결과입니다. 코루틴 방식은 16.14초 만에 200장을 모았고, CPU는 100%까지 쓰면서 메모리는 최대 47%에 머물렀습니다.',
        steps: [
          { say: '생산자가 상품 코드를 쉬지 않고 큐에 넣습니다.', burst: 3, move: ['p_r'], set: { prod: 'on', redis: 'on' } },
          { say: '두 소비자 프로세스의 코루틴 256개가 동시에 요청합니다.', burst: 3, move: ['r_c1', 'c1_s'], set: { c1: 'on', site: 'on' } },
          { say: '요청 하나는 약 85ms를 기다리는데, 동시에 많이 보내면 CPU 2개가 TLS와 파싱, 이미지 처리로 먼저 꽉 찹니다.', burst: 3, move: ['r_c2', 'c2_s'], set: { c2: 'on' } },
          { say: '유효한 상품 200장을 모두 저장하고 끝납니다.', move: ['c1_d'], set: { disk: 'ok' }, badge: { disk: { text: '200장', tone: 'accent' } }, clock: { to: 16.14, label: '200장을 모으기까지 · t3.micro 실측' } }
        ]
      }
    ]
  };
})();
