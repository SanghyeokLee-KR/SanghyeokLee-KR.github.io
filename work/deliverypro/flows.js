/* DeliveryPro 페이지 전용 자료: 눌러 보는 구성도 하나(js/flow.js가 그린다)
   사실은 backend/ 12·13쪽과 저장소 README·경로 계산 코드에 적힌 것만 쓴다.
   도로망은 실제 지도가 아니라 데모용 격자 도로망이다. */
(function () {
  'use strict';
  var S = window.FLOW_SPECS = window.FLOW_SPECS || {};

  S.route = {
    aria: '묶음배달 경로 계산 흐름. 라이더 화면의 요청이 서버에서 교차로 붙이기, 다익스트라 시간표, 방문 순서 계산을 거쳐 DB에 저장되고, 순서와 구간 좌표가 화면으로 돌아와 카카오 지도나 SVG로 그려집니다.',
    nodes: {
      rider: { label: '라이더 화면', kind: 'actor' },
      kmap: { label: '카카오 지도', sub: '지도 키가 있을 때' },
      svgv: { label: 'SVG 그림', sub: '지도 키가 없을 때' },
      api: { label: '경로 계산', sub: '배차 수락 · 경로 요청' },
      snap: { label: '교차로에 붙이기', sub: '400m 격자 색인' },
      dij: { label: '다익스트라', sub: '정차지마다 한 번 · 시간표' },
      hk: { label: '방문 순서', sub: 'Held-Karp · 12곳까지 정확' },
      apx: { label: '근사', sub: '최근접 이웃 + 2-opt' },
      db: { label: 'DB', sub: 'order_sequence' }
    },
    initNodes: { apx: 'off', kmap: 'off', svgv: 'off' },
    layouts: {
      wide: {
        w: 1200, h: 450,
        zones: [{ x: 196, y: 28, w: 800, h: 410, label: '서버', sub: '데모용 격자 도로망 25 × 21' }],
        nodes: {
          kmap: { x: 16, y: 40, w: 150, h: 56 },
          rider: { x: 16, y: 160, w: 150, h: 52 },
          svgv: { x: 16, y: 300, w: 150, h: 56 },
          api: { x: 222, y: 150, w: 210, h: 72 },
          snap: { x: 474, y: 150, w: 210, h: 72 },
          dij: { x: 726, y: 150, w: 244, h: 72 },
          hk: { x: 726, y: 310, w: 244, h: 72 },
          apx: { x: 474, y: 310, w: 210, h: 72 },
          db: { x: 1030, y: 310, w: 154, h: 72 }
        },
        edges: {
          r_api: ['rider', 'r', 'api', 'l'],
          api_snap: ['api', 'r', 'snap', 'l'],
          snap_dij: ['snap', 'r', 'dij', 'l'],
          dij_hk: ['dij', 'b', 'hk', 't', { fa: 0.6, fb: 0.6, label: '시간표', lx: 884, ly: 272 }],
          dij_apx: ['dij', 'b', 'apx', 't', { fa: 0.2, mid: 266, dash: true }],
          hk_db: ['hk', 'r', 'db', 'l'],
          apx_db: ['apx', 'b', 'db', 'b', { mid: 418, dash: true }],
          r_k: ['rider', 't', 'kmap', 'b', { dash: true }],
          r_s: ['rider', 'b', 'svgv', 't', { dash: true }]
        }
      },
      narrow: {
        w: 360, h: 720,
        zones: [{ x: 6, y: 168, w: 348, h: 448, label: '서버', bottom: true }],
        nodes: {
          kmap: { x: 16, y: 8, w: 156, h: 52, sub: '키가 있을 때' },
          svgv: { x: 188, y: 8, w: 156, h: 52, sub: '키가 없을 때' },
          rider: { x: 100, y: 96, w: 160, h: 46 },
          api: { x: 40, y: 190, w: 280, h: 60 },
          snap: { x: 40, y: 280, w: 280, h: 60 },
          dij: { x: 40, y: 370, w: 280, h: 60 },
          hk: { x: 16, y: 474, w: 160, h: 64, sub: 'Held-Karp' },
          apx: { x: 184, y: 474, w: 160, h: 64, sub: '2-opt 근사' },
          db: { x: 80, y: 650, w: 200, h: 56 }
        },
        edges: {
          r_k: ['rider', 't', 'kmap', 'b', { fa: 0.25, dash: true }],
          r_s: ['rider', 't', 'svgv', 'b', { fa: 0.75, dash: true }],
          r_api: ['rider', 'b', 'api', 't'],
          api_snap: ['api', 'b', 'snap', 't'],
          snap_dij: ['snap', 'b', 'dij', 't'],
          dij_hk: ['dij', 'b', 'hk', 't', { fa: 0.2, mid: 452 }],
          dij_apx: ['dij', 'b', 'apx', 't', { fa: 0.8, mid: 452, dash: true }],
          hk_db: ['hk', 'b', 'db', 't', { fb: 0.25, mid: 624 }],
          apx_db: ['apx', 'b', 'db', 't', { fb: 0.75, mid: 624, dash: true }]
        }
      }
    },
    scenarios: [
      {
        label: '배달지 5곳', title: '배달지 다섯 곳 순서 정하기',
        result: '14.58km, 약 38분짜리 순서가 나왔습니다. 화면에 그린 경로와 DB에 저장한 순서는 같은 계산에서 나옵니다.',
        steps: [
          { say: '라이더가 다섯 집이 묶인 배차를 수락하면 서버가 계산을 시작합니다.', move: ['r_api'], set: { rider: 'on', api: 'on' } },
          { say: '집은 도로 위에 있지 않으니, 먼저 가장 가까운 교차로에 붙입니다.', move: ['api_snap'], set: { snap: 'on' } },
          { say: '정차지마다 다익스트라를 한 번씩 돌려, 서로 몇 초 걸리는지 표로 만듭니다.', move: ['snap_dij'], set: { dij: 'on' }, badge: { dij: { text: '6 × 6 시간표' } } },
          { say: '이 표로 Held-Karp를 돌려 순서를 정합니다. 다섯 곳이면 정확한 답이 나옵니다.', move: ['dij_hk'], set: { hk: 'ok' }, badge: { hk: { text: '정확한 답', tone: 'accent' } } },
          { say: '계산한 순서는 DB에 저장하고, 화면에는 순서와 구간 좌표를 함께 돌려줍니다.', move: ['hk_db'], move2: ['-dij_hk', '-snap_dij', '-api_snap', '-r_api'], set: { db: 'ok', rider: 'ok' }, badge: { rider: { text: '14.58km · 약 38분', tone: 'accent' } } }
        ]
      },
      {
        label: '12곳이 넘으면', title: '정차지가 12곳을 넘을 때',
        result: '정확한 답 대신 근사로 순서를 정하고, 그 사실을 응답에 담습니다.',
        steps: [
          { say: '정차지가 12곳을 넘어도, 교차로에 붙이고 시간표를 만드는 데까지는 같습니다.', move: ['r_api', 'api_snap', 'snap_dij'], set: { rider: 'on', api: 'on', snap: 'on', dij: 'on' } },
          { say: '여기서는 최근접 이웃으로 순서를 먼저 잡고, 2-opt로 다듬습니다.', move: ['dij_apx'], set: { hk: 'off', apx: 'ok' } },
          { say: '순서는 똑같이 저장하고, 응답에 exact=false를 붙여 근사라는 걸 알립니다.', move: ['apx_db'], move2: ['-dij_apx', '-snap_dij', '-api_snap', '-r_api'], set: { db: 'ok', rider: 'ok' }, badge: { apx: { text: 'exact=false' } } }
        ]
      },
      {
        label: '지도 키가 없으면', title: '지도 키 없이 돌려 볼 때',
        result: '지도 키가 없어도 계산한 경로는 그대로 볼 수 있습니다.',
        init: { nodes: { api: 'on', snap: 'on', dij: 'on', hk: 'ok', db: 'ok' }, lit: ['api_snap', 'snap_dij', 'dij_hk', 'hk_db'] },
        steps: [
          { say: '서버 응답에는 방문 순서와 구간마다의 좌표가 함께 들어 있습니다.', move: ['-r_api'], set: { rider: 'on' } },
          { say: '카카오 지도 키가 있으면 실제 지도 위에 경로를 얹습니다.', move: ['r_k'], set: { kmap: 'ok' } },
          { say: '키가 없으면 지도 없이 경로와 매장, 배달지만 SVG로 그립니다.', move: ['r_s'], set: { svgv: 'ok' } }
        ]
      }
    ]
  };
})();
