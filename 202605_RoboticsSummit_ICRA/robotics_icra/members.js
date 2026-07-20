/**
 * members.js — 出張メンバー共通定義
 * =========================================
 * Robotics Summit & ICRA 2026 の参加メンバー情報を一元管理するファイル。
 * このファイルを編集すれば、以下の3ファイルすべてに反映される：
 *   - robotics_summit_schedule.html
 *   - icra2026_schedule.html
 *   - robotics_icra_itinerary4.html
 *
 * 最終更新: 2026-02-22
 */

// ============================================================
// メンバー基本定義
// ============================================================

const MEMBERS = {

  mu: {
    id: 'mu',
    name: '村上',
    emoji: '🔵',
    label: '🔵 村上',
    specialty: 'モデルベース制御',
    // CSS色（icra2026_schedule.html の :root と一致）
    color: '#38bdf8',
    colorBg: 'rgba(56, 189, 248, .18)',
    colorBorder: 'rgba(56, 189, 248, .45)',
    // 参加イベント
    events: {
      roboticsSummit: true,   // Robotics Summit & Expo (Boston · May 27–28)
      icra: true,             // ICRA 2026 (Vienna · Jun 1–5)
      icraWorkshopA: true,    // Workshop Day A (Jun 1)
      icraWorkshopB: true,    // Workshop Day B (Jun 5) ✓ 参加確定
    },
    // ICRA 参加日程（到着・帰国）
    icraSchedule: {
      arrive: 'May 30 (Sat)',   // Vienna着（前日入り）
      depart: 'Jun 7 (Sun)',    // 帰国
    },
    notes: '村上はICRA Workshop Day B (Jun 5) 参加確定',
  },

  mi: {
    id: 'mi',
    name: '三浦',
    emoji: '🟢',
    label: '🟢 三浦',
    specialty: 'メカ',
    color: '#4ade80',
    colorBg: 'rgba(74, 222, 128, .18)',
    colorBorder: 'rgba(74, 222, 128, .45)',
    events: {
      roboticsSummit: true,   // Robotics Summit のみ
      icra: false,            // ICRA 不参加
      icraWorkshopA: false,
      icraWorkshopB: false,
    },
    icraSchedule: null,       // ICRA 不参加
    notes: '三浦は Robotics Summit のみ参加。ICRA 不参加。',
  },

  sa: {
    id: 'sa',
    name: '佐藤',
    emoji: '🟠',
    label: '🟠 佐藤',
    specialty: '組み込みSW / ROS',
    color: '#fb923c',
    colorBg: 'rgba(251, 146, 60, .15)',
    colorBorder: 'rgba(251, 146, 60, .4)',
    events: {
      roboticsSummit: true,   // Robotics Summit
      icra: true,             // ICRA 2026
      icraWorkshopA: true,    // Workshop Day A (Jun 1)
      icraWorkshopB: true,    // Workshop Day B (Jun 5)
    },
    icraSchedule: {
      arrive: 'May 30 (Sat)',   // Vienna着（前日入り）
      depart: 'Jun 6 (Sat)',    // 帰国
    },
    notes: '',
  },

  den: {
    id: 'den',
    name: '傳田',
    emoji: '🟡',
    label: '🟡 傳田',
    specialty: '経路計画 / SLAM',
    color: '#34d399',
    colorBg: 'rgba(52, 211, 153, .15)',
    colorBorder: 'rgba(52, 211, 153, .4)',
    events: {
      roboticsSummit: false,  // Robotics Summit 不参加
      icra: true,             // ICRA 本会議のみ
      icraWorkshopA: false,   // Workshop 不参加（この日 Vienna 着）
      icraWorkshopB: false,
    },
    icraSchedule: {
      arrive: 'Jun 1 (Mon)',    // Workshop Day A に Vienna着
      depart: 'Jun 5 (Fri)',    // 帰国（本会議終了後）
    },
    notes: '傳田は本会議のみ参加（Jun 2–4）。Jun 1着・Jun 5 OUT。',
  },

  oka: {
    id: 'oka',
    name: '岡部',
    emoji: '🟣',
    label: '🟣 岡部',
    specialty: 'IsaacSIM / SLAM',
    color: '#e879f9',
    colorBg: 'rgba(232, 121, 249, .15)',
    colorBorder: 'rgba(232, 121, 249, .4)',
    events: {
      roboticsSummit: false,  // Robotics Summit 不参加
      icra: true,             // ICRA 本会議のみ
      icraWorkshopA: false,
      icraWorkshopB: false,
    },
    icraSchedule: {
      arrive: 'Jun 1 (Mon)',    // Workshop Day A に Vienna着
      depart: 'Jun 5 (Fri)',    // 帰国（本会議終了後）
    },
    notes: '岡部は本会議のみ参加（Jun 2–4）。Jun 1着・Jun 5 OUT。',
  },

};

// ============================================================
// イベント単位の参加者リスト（よく使うグループ）
// ============================================================

const EVENT_MEMBERS = {
  // Robotics Summit & Expo 2026 (Boston · May 27–28)
  roboticsSummit: [MEMBERS.mu, MEMBERS.mi, MEMBERS.sa],

  // ICRA 2026 全体（ワークショップ含む）
  icraAll: [MEMBERS.mu, MEMBERS.sa, MEMBERS.den, MEMBERS.oka],

  // ICRA 本会議 (Jun 2–4)
  icraMain: [MEMBERS.mu, MEMBERS.sa, MEMBERS.den, MEMBERS.oka],

  // ICRA ワークショップ Day A/B (Jun 1, Jun 5)
  icraWorkshop: [MEMBERS.mu, MEMBERS.sa],

  // 全イベント共通（存在する全員）
  all: [MEMBERS.mu, MEMBERS.mi, MEMBERS.sa, MEMBERS.den, MEMBERS.oka],
};

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * メンバーIDの配列からチップHTMLを生成する。
 * @param {string[]} ids - 例: ['mu', 'sa', 'den']
 * @param {Object} options
 * @param {string} [options.fontSize='10px']
 * @param {string} [options.padding='2px 8px']
 * @returns {string} HTML文字列
 */
function renderChips(ids, options = {}) {
  const fontSize = options.fontSize || '10px';
  const padding  = options.padding  || '2px 8px';
  return ids.map(id => {
    const m = MEMBERS[id];
    if (!m) return '';
    return `<span class="chip ${id}" style="font-size:${fontSize};padding:${padding}">${m.label}</span>`;
  }).join('');
}

/**
 * MEMBERSオブジェクトから CSS変数定義文字列を生成する（:root 挿入用）。
 * @returns {string}
 */
function generateCSSVars() {
  return Object.values(MEMBERS).map(m =>
    `--${m.id}: ${m.color};`
  ).join('\n            ');
}
