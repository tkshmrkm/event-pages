import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, 'source.html');
const outputPath = join(here, 'index.html');
const familyOutputPath = join(here, 'family_print.html');
const immigrationOutputPath = join(here, 'immigration_print.html');
const browserPath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!browserPath) throw new Error('Chrome or Edge is required to build index.html');

const DAY_META = {
  '1017': { date: '2026-10-17', kind: 'move', badge: '移動', zone: '各地点の現地時刻。香港は日本より1時間遅い', focus: '村上が1日先行。夕食は機内食で済み、香港ではシャワーと休憩。深夜便でアムステルダムへ' },
  '1018': { date: '2026-10-18', kind: 'move', badge: '別行動', zone: '村上は欧州現地時間（日本より7時間遅い）。美馬・金築は日本・香港の各現地時刻', focus: '村上はアムステルダム到着後に時差調整。美馬・金築は日本を出発' },
  '1019': { date: '2026-10-19', kind: 'conf', badge: 'TechEx', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: '村上はTechEx Europe Day 1。美馬・金築はEuroBLECH開幕前の自由日を利用してヴォルフスブルクへ日帰り。ゲッティンゲンが経路上にあるため、先にホテルへ荷物を預けて身軽に移動する' },
  '1020': { date: '2026-10-20', kind: 'conf', badge: '別行動', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: '村上はTechEx Day 2後、20:30頃にゲッティンゲンのホテルへ到着。美馬・金築はEuroBLECHを視察後、18:00頃に戻る目安' },
  '1021': { date: '2026-10-21', kind: 'conf', badge: 'EuroBLECH', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: '3名で09:00〜17:00にEuroBLECHを展示会視察。18:00頃にゲッティンゲンへ戻り、19:00頃に夕食' },
  '1022': { date: '2026-10-22', kind: 'visit', badge: '工場見学', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: 'Mercedes-Benz Werk Bremenを見学。復路は「早めに戻って資料整理」と「18:00頃まで市内滞在」の2案から決める' },
  '1023': { date: '2026-10-23', kind: 'conf', badge: 'EuroBLECH', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: 'EuroBLECHを14:15頃まで視察。17:30頃にフランクフルトのホテルへチェックインし、18:30頃に夕食' },
  '1024': { date: '2026-10-24', kind: 'move', badge: '帰国便', zone: '欧州現地時間 CEST（日本より7時間遅い）。到着後の香港は日本より1時間遅い', focus: '東横INNで朝食・チェックアウト後、フランクフルト空港から香港行きCX288に搭乗' },
  '1025': { date: '2026-10-25', kind: 'move', badge: '帰着', zone: '香港は日本より1時間遅い。日本到着後はJST', focus: '07:20に香港着、09:35にセントレア行きへ乗り継ぎ。14:10到着後はVisit Japan Webを用意して入国・税関手続き' },
};

const STAYS = {
  '1017': [{ who: '村上', name: '機内', tone: 'murakami' }],
  '1018': [
    { who: '村上', name: 'Holiday Inn Express Amsterdam - Sloterdijk Station', tone: 'murakami' },
    { who: '美馬・金築', name: '機内', tone: 'team' },
  ],
  '1019': [
    { who: '村上', name: 'Holiday Inn Express Amsterdam - Sloterdijk Station', tone: 'murakami' },
    { who: '美馬・金築', name: 'Hotel FREIgeist Göttingen Innenstadt', tone: 'team' },
  ],
  '1020': [{ who: '全員', name: 'Hotel FREIgeist Göttingen Innenstadt', tone: 'shared' }],
  '1021': [{ who: '全員', name: 'Hotel FREIgeist Göttingen Innenstadt', tone: 'shared' }],
  '1022': [{ who: '全員', name: 'Hotel FREIgeist Göttingen Innenstadt', tone: 'shared' }],
  '1023': [{ who: '全員', name: 'Toyoko Inn Frankfurt am Main Hauptbahnhof', tone: 'shared' }],
  '1024': [{ who: '全員', name: '機内', tone: 'shared' }],
  '1025': [],
};

const ROUTES = [
  ['1017','京都駅発 → 名古屋','10/17（土）11:30頃','JST','京都駅','新幹線 のぞみ','約36分','10/17（土）12:06頃','JST','名古屋駅'],
  ['1017','名古屋駅発 → 中部国際空港','10/17（土）12:35','JST','名鉄名古屋駅','名鉄ミュースカイ','約28分','10/17（土）13:03','JST','中部国際空港駅'],
  ['1017','CX539 NGO発','10/17（土）16:10','JST','中部国際空港（NGO）','CX539','4時間20分','10/17（土）19:30','HKT','香港国際空港（HKG）'],
  ['1017','CX271 HKG発','10/17（土）23:15','HKT','香港国際空港（HKG）','CX271','13時間40分','10/18（日）06:55','CEST','Amsterdam Airport Schiphol（AMS）'],
  ['1018','Schiphol → Amsterdam Sloterdijk','10/18（日）07:30頃','CEST','Schiphol Airport Station','NS直通','約8〜10分','10/18（日）07:40頃','CEST','Amsterdam Sloterdijk'],
  ['1018','京都駅発 → 名古屋','10/18（日）11:30頃','JST','京都駅','新幹線 のぞみ','約36分','10/18（日）12:06頃','JST','名古屋駅'],
  ['1018','名古屋駅発 → 中部国際空港','10/18（日）12:35','JST','名鉄名古屋駅','名鉄ミュースカイ','約28分','10/18（日）13:03','JST','中部国際空港駅'],
  ['1018','CX539 NGO発','10/18（日）16:10','JST','中部国際空港（NGO）','CX539','4時間20分','10/18（日）19:30','HKT','香港国際空港（HKG）'],
  ['1018','CX289 HKG発','10/18（日）23:55','HKT','香港国際空港（HKG）','CX289','13時間20分','10/19（月）07:15','CEST','Frankfurt Airport（FRA）'],
  ['1019','ホテル → RAI','10/19（月）08:30','CEST','Holiday Inn Express Amsterdam - Sloterdijk Station','メトロ50系統＋徒歩','約25〜28分','10/19（月）08:55頃','CEST','RAI Amsterdam'],
  ['1019','RAI → ホテルへ戻る','10/19（月）21:00頃','CEST','RAI Amsterdam','メトロ50系統＋徒歩','約25〜28分','10/19（月）21:25頃','CEST','Holiday Inn Express Amsterdam - Sloterdijk Station'],
  ['1019','RE2 + ICE774 FRA空港駅発','10/19（月）08:22','CEST','Frankfurt空港駅','RE2＋ICE774','2時間9分','10/19（月）10:31','CEST','Göttingen Hbf'],
  ['1019','ICE ゲッティンゲン発 → Wolfsburg','10/19（月）11:00頃','CEST','Göttingen Hbf','ICE（Hannover経由）','約1時間15〜20分','10/19（月）12:20頃','CEST','Wolfsburg Hbf'],
  ['1019','Wolfsburg Hbf 着 → Autostadtへ','10/19（月）12:20頃','CEST','Wolfsburg Hbf','徒歩','約10分','10/19（月）12:30頃','CEST','Autostadt'],
  ['1019','ICE Wolfsburg Hbf発 → ゲッティンゲン','10/19（月）17:30頃','CEST','Wolfsburg Hbf','ICE直通','約1時間15〜20分','10/19（月）18:45頃','CEST','Göttingen Hbf'],
  ['1020','チェックアウト（荷物持参）→ RAIへ','10/20（火）08:30頃','CEST','Holiday Inn Express Amsterdam - Sloterdijk Station','メトロ50系統＋徒歩','約25〜28分','10/20（火）08:55頃','CEST','RAI Amsterdam'],
  ['1020','RAI →','10/20（火）14:55','CEST','RAI Amsterdam','鉄道','約10分','10/20（火）15:20頃','CEST','Amsterdam Airport Schiphol（AMS）'],
  ['1020','✈️ KL1791（KLM Cityhopper）AMS発','10/20（火）16:50','CEST','Amsterdam Airport Schiphol（AMS）','KL1791','55分','10/20（火）17:45','CEST','Hannover Airport（HAJ）'],
  ['1020','S5 Hannover Flughafen発','10/20（火）19:06','CEST','Hannover Flughafen','S5','17分','10/20（火）19:23','CEST','Hannover Hbf'],
  ['1020','ICE77','10/20（火）19:53','CEST','Hannover Hbf','ICE77','32分','10/20（火）20:25','CEST','Göttingen Hbf'],
  ['1020','ICE888','10/20（火）07:55','CEST','Göttingen Hbf','ICE888（直通）','28分','10/20（火）08:23','CEST','Hannover Messe/Laatzen'],
  ['1020','EuroBLECHからゲッティンゲンへ戻る','10/20（火）17:30頃','CEST','Hannover Messe/Laatzen','列車候補を確認','約30分の目安','10/20（火）18:00頃','CEST','Göttingen Hbf'],
  ['1021','ICE888','10/21（水）07:55','CEST','Göttingen Hbf','ICE888','28分','10/21（水）08:23','CEST','Hannover Messe/Laatzen'],
  ['1021','EuroBLECHからゲッティンゲンへ戻る','10/21（水）17:30頃','CEST','Hannover Messe/Laatzen','列車候補を確認','約30分の目安','10/21（水）18:00頃','CEST','Göttingen Hbf'],
  ['1022','ICE1674','10/22（木）09:00','CEST','Göttingen Hbf','ICE1674（直通）','1時間45分','10/22（木）10:45','CEST','Bremen Hbf'],
  ['1022','ブレーメンHbf → ゲッティンゲン','10/22（木）18:00頃','CEST','Bremen Hbf','列車候補を確認','約2時間の目安','10/22（木）20:00頃','CEST','Göttingen Hbf'],
  ['1023','ICE888','10/23（金）07:55','CEST','Göttingen Hbf','ICE888','28分','10/23（金）08:23','CEST','Hannover Messe/Laatzen'],
  ['1023','S4','10/23（金）14:30','CEST','Hannover Messe/Laatzen','S4','8分','10/23（金）14:38','CEST','Hannover Hbf'],
  ['1023','ICE771','10/23（金）14:53','CEST','Hannover Hbf','ICE771','2時間21分','10/23（金）17:14','CEST','Frankfurt(Main) Hbf'],
  ['1024','FRA中央駅','10/24（土）10:15','CEST','Toyoko Inn Frankfurt am Main Hauptbahnhof','徒歩＋空港列車','約25分','10/24（土）10:40','CEST','Frankfurt Airport Terminal 3'],
  ['1024','フランクフルト → 香港','10/24（土）13:40','CEST','Frankfurt Airport（FRA）','CX288','11時間40分','10/25（日）07:20','HKT','香港国際空港（HKG）'],
  ['1025','CX536 HKG発','10/25（日）09:35','HKT','香港国際空港（HKG）','CX536','3時間35分','10/25（日）14:10','JST','中部国際空港（NGO）'],
];

const SOURCE_TEXT_REPLACEMENTS = [
  ['出発日 — 村上のみ セントレア発（美馬・金築は翌18日発）', '出発日 — 村上のみセントレア発（美馬・金築は翌18日発）'],
  ['AMS着・時差調整日（村上）/ 出発日（美馬・金築）', 'AMS着・時差調整日（村上）／出発日（美馬・金築）'],
  ['TechEx Day 1 フル参加（村上）/ 美馬・金築 FRA着→ゲッティンゲン（荷物預け）→Wolfsburg（Autostadt）', 'TechEx Day 1（村上）／FRA着・ヴォルフスブルク日帰り（美馬・金築）'],
  // EuroBLECHの日には番号を振らない。会期が10/20開幕であることは元資料にあるが、
  // 何日開催かは未確認で、`Day 1` も `最終` も裏が取れていない。参加日は日付カードで分かる。
  ['TechEx Day 2 → ゲッティンゲン移動（村上）/ EuroBLECH Day 1（美馬・金築）', 'TechEx Day 2・ゲッティンゲン移動（村上）／EuroBLECH 視察（美馬・金築）'],
  ['EuroBLECH 最終 → フランクフルト移動（全員）', 'EuroBLECH 視察 → フランクフルト移動（全員）'],
  ['Bremen 日帰り — 全員（工場見学）', 'ブレーメン日帰り — 全員（工場見学）'],
  ['👥 美馬・金築（FRA着 → ゲッティンゲンで荷物預け → Wolfsburg → ゲッティンゲン）', '👥 美馬・金築（FRA着・ヴォルフスブルク日帰り）'],
  ['フランクフルト → セントレア 出発（全員同便）', 'フランクフルト出発 → 香港（全員）'],
  ['セントレア 帰着 🎉', '香港乗継 → セントレア帰着・各自帰宅'],
  ['🏨 荷物預け（予約済み）', '🏨 ホテルに荷物を預ける'],
  ['Wolfsburgから<strong>18:45頃</strong>にゲッティンゲン着 → 荷物ピックアップ・チェックイン後', 'ヴォルフスブルクから<strong>18:45頃</strong>にゲッティンゲン着 → 荷物受取・チェックイン後'],
  ['🥂 VIP networking drinks（Gold Pass特典）', '🥂 VIP Networking Drinks（Gold Pass特典）'],
  ['<strong>②VIP networking drinks 参加可</strong>', '<strong>②VIP Networking Drinks 参加可</strong>'],
  ['<div class="text-slate-600 text-xs mt-0.5"><strong>昼はブレーメン</strong>（マルクト広場周辺）でランチ。<strong>夜</strong>は、ブレーメンに良い店があればそのまま夕食、なければ18時前にゲッティンゲンへ戻って旧市街で。</div>', '<div class="text-slate-600 text-xs mt-0.5"><strong>昼はブレーメン</strong>（マルクト広場周辺）でランチ。<strong>夜</strong>は、ブレーメンに良い店があればそのまま夕食、なければゲッティンゲンへ戻って旧市街で。</div>'],
  ['<strong>ホテルは朝食が付かない</strong>うえ翌朝は07:55発と早い。前夜に買っておくと確実だが、この日も会場（メッセ）到着後に朝の時間帯でパン等はとれる。', '<strong>ホテルは朝食が付かない</strong>うえ翌朝は09:00発。前夜に購入するか、ゲッティンゲン駅・車内・ブレーメン到着後に軽くとる。'],
  // 10/20 村上のHAJ待ちも、FRAの買い出しと同じ「短い主表示＋折り畳み」にそろえる。
  ['<div class="text-slate-600 text-xs">S5発（19:06）まで約1時間20分。<strong>夕食はここが本命</strong>。ゲッティンゲン着は20:25と遅く店が閉まりがちなので、空港で食べるか列車用に買っておく。</div>', '<div class="text-slate-600 text-xs">S5発（19:06）まで約1時間20分。ここで夕食か買い出しを済ませる</div><details class="fold mt-1"><summary>なぜここで済ませるか</summary><div class="fold-body"><div>ゲッティンゲン着は20:25と遅く、旧市街の店が閉まりがち</div><div>空港で食べるか、列車で食べる分を買っておく</div></div></details>'],
  ['17時過ぎにFRA着。', '17:14頃にフランクフルト中央駅着。'],
  ['🏨 ゲッティンゲンをチェックアウト（荷物持参・全員）', '🏨 チェックアウト（荷物持参）'],
  ['Gold Passの価値はDay1に集中している', 'Gold Passの価値はDay 1に集中している'],
  ['村上はTechEx Day2のため合流は翌21日', '村上はTechEx Day 2のため合流は翌21日'],
  ['🛋 ラウンジは対象外 — カードラウンジを検討', '🛋 ラウンジ候補'],
  ['<strong>ゴールドカード以上を持っていれば、出国審査前のカードラウンジが無料</strong>で使える → 出国審査の前なので早めに入る。', '航空会社ラウンジとPriority Passラウンジを、利用条件別に確認。'],
  ['対象ラウンジ名・有料の選択肢', 'エアライン／Priority Passの候補'],
  ['<div>ステータス無し・プライオリティパス無しのため<strong>サクララウンジは利用不可</strong>。村上は前日出発のため同伴枠も使えない。</div>', '<div><strong>エアライン側：</strong>JALサクララウンジ（第1ターミナル・国際線制限エリア）。CX539での利用可否は、搭乗クラス・oneworld/Cathay等のステータス・航空会社の招待条件をチェックイン時に確認。</div>'],
  ['<div><strong>出国審査前のカードラウンジ</strong>（ゴールドカード以上が対象）: プレミアムラウンジ セントレア / 第2プレミアムラウンジ セントレア / QUALIA LOUNGE。</div>', '<div><strong>Priority Pass側：</strong>Plaza Premium Lounge（第1ターミナル・保安検査／出国審査後・Gate 18付近）または The Coral Finest Business Class Lounge。会員本人のアプリで当日の対象施設と同伴条件を確認。</div>'],
  ['                <div>制限エリア内で確実に休むなら プラザ・プレミアム・ラウンジ名古屋（有料 約5,930円/人〜・<strong>営業時間は要確認</strong>）。</div>\n', ''],
  ['ラウンジは対象外。<strong>香港らしいものを食べるなら着いてすぐ Level 7 へ</strong>', 'ラウンジ資格は未確認。<strong>香港らしいものを食べるなら着いてすぐ Level 7 へ</strong>'],
  ['<div><strong>ラウンジを使うなら</strong>: 有料の Plaza Premium。Gate 60 が24時間・HKD 250〜で最安、Gate 1 が24時間・HKD 650〜。</div>', '<div><strong>エアライン側：</strong>キャセイのビジネスクラスラウンジ。搭乗クラスまたはoneworld/Cathay等のステータスが対象かを確認。The Deck と The Pier, Business は05:30〜00:30、The Bridge は05:00〜最終キャセイ便。</div><div><strong>一般有料：</strong>Plaza Premium Lounge は Gate 1・Gate 60 が24時間、Gate 35 が06:00〜01:00。Priority Passの対象施設かは未確認のため、会員本人のアプリで当日の対象と同伴条件を確認。</div>'],
  ['ラウンジは対象外なので<strong>制限エリア内で夕食を取る</strong>', 'ラウンジを利用しない場合は<strong>制限エリア内で夕食を取る</strong>'],
  ['Gold Passに含まれる特典。<strong>翌20日は14:55に会場を出るため、参加できるのは実質この日だけ</strong>。開催時刻・場所は当日のアジェンダで確認。', '開催時刻・場所は当日のアジェンダで確認。'],
  ['          <div class="text-xs text-slate-500 px-1">EuroBLECHは10/20開幕のため19日は自由日。Wolfsburgへの日帰りはゲッティンゲンが経路上にあるため、先にホテルへ荷物を預けて身軽に移動</div>\n', ''],
  // 準備タブの「ラウンジ利用可否」表は transformScript 側で区間×4系統に組み直す。
  // 個々のセルをここで置換すると二重管理になるため、表への置換は持たせない。
  ['美馬・金築は<strong>ゴールドカード以上ならセントレアの出国審査前カードラウンジが無料</strong>。', '美馬・金築は、航空会社ラウンジとPriority Passラウンジの利用条件を確認。'],
  ['<strong>有料ラウンジ</strong>: Plaza Premium は <strong>Gate 60 が24時間・HKD 250〜（最安）</strong>、Gate 1 が24時間・HKD 650〜。Plaza Premium First は West Hall 06:00〜／East Hall 06:30〜。', '<strong>一般有料ラウンジ</strong>: Plaza Premium Lounge は Gate 60 が24時間・HKD 250〜（最安）、Gate 1 が24時間・HKD 650〜、Gate 35 が06:00〜01:00・HKD 650〜。Plaza Premium First は East Hall（Gate 1）06:30〜01:00／West Hall（Gate 35）06:00〜01:00・HKD 980〜。Priority Passの対象施設かは未確認のため、会員本人のアプリで当日確認する。'],
  // 香港のラウンジ。営業時間はキャセイ公式のラウンジ個別ページで確認済み（2026-08-14時点）。
  // The Deck: L7・Gate 6付近・05:30-00:30 / The Pier, Business: L6・Gate 65付近・05:30-00:30・シャワー14室
  // The Bridge: L6・Gate 35付近・05:00〜最終キャセイ便（00:30-03:20の範囲）
  // oneworld Sapphireはビジネスクラスラウンジのみ本人＋同伴1名、キャセイ運航ラウンジに限る。ファーストは対象外。
  // The Wingは現行のHKGラウンジ一覧にFirstのみ在り、Business側の掲載が無い。
  // 乗り継ぎは「過ごし方」を主表示にする。ラウンジは選択肢の一つに落とし、
  // ラウンジ自体もエアライン／Priority Pass／一般有料／カード付帯の4系統に分けて並べる。
  // 行時刻も乗り継ぎ全体（着から発まで）にそろえる。20:00〜22:30はラウンジ前提だった頃の名残。
  ['<div class="text-slate-500">20:00〜22:30</div>', '<div class="text-slate-500">19:30〜23:15</div>'],
  // 10/17 村上の香港乗継 3時間45分。
  ['          <div class="font-semibold">🛋 ビジネスクラスラウンジで夕食＋シャワー</div>\n          <div class="text-slate-600 text-xs">Sapphireでビジネスクラスラウンジ可（The Pier ビジネス側はシャワー14室）。⚠️ <strong>営業時間が未確認</strong>のため、到着後にトランスファーデスクで開いているラウンジを聞く。</div>\n          <details class="fold mt-1">\n            <summary>閉まっていた場合の代替・無料シャワーの場所</summary>\n            <div class="fold-body">\n              <div>⭐ <strong>無料シャワー（L5・24時間）</strong>: Gate 12付近 / Gate 43付近。シャンプー等あり、タオルは近くの自販機で購入。<strong>ラウンジの可否と無関係に使える</strong>ので、総移動21時間45分の後半が楽になる。</div>\n              <div><strong>有料ラウンジ</strong>: Plaza Premium が Gate 60（24時間・HKD 250〜／最安）、Gate 1（24時間・HKD 650〜）。</div>\n              <div><strong>飲食</strong>: Gate 10〜11付近 Level 6 の Men Wah Bing Teng（香港式の茶餐廳）・McDonald\'s が<strong>24時間</strong>。Level 7 フードコート（Tasty Congee のお粥・雲呑麺など）は22〜23時台に閉まる可能性があるので、行くなら早めに。</div>\n              <div>ファースト側の「ザ・カバナ」「ザ・ヘイヴン」は Sapphire では対象外。</div>\n            </div>\n          </details>\n',
    '          <div class="font-semibold">🕐 香港で乗り継ぎ（3時間45分）</div>\n'],
  ['<div>⚠️ <strong>キャセイ自社ラウンジ（The Wing / The Pier / The Deck / The Bridge）の営業時間は未確認</strong>（公式サイトにアクセスできず特定できなかった）。<strong>夜23時台・早朝7時台は閉まっている可能性がある</strong>ため、出発前にキャセイに確認するか、到着後にトランスファーデスクで開いているラウンジを聞く。</div>', '<div>⭐ <strong>キャセイのビジネスクラスラウンジ営業時間</strong>: The Deck（L7・Gate 6付近）と The Pier, Business（L6・Gate 65付近）が<strong>05:30〜00:30</strong>、The Bridge（L6・Gate 35付近）が<strong>05:00〜最終キャセイ便（00:30〜03:20の範囲）</strong>。<strong>夜23時台も早朝7時台も営業時間内</strong>。The Wing は現行のラウンジ一覧では First のみで、Business側の掲載が無い。</div>'],
  // 10/25 全員の香港乗継 2時間15分。ここもラウンジを選択肢の一つとして並べる。
  // 昼食の場所は時刻ではなく場所に張り付く常設情報なので、日トップの食事トピック側に置く。
  ['<div>Autostadt内での昼食が遅めになる想定なので、夕食は軽めでも足りる。到着が19時前なのでラストオーダーに注意。</div>', '<div>昼食はAutostadt内か、<strong>ヴォルフスブルク中央駅の周辺</strong>（少し歩けば店がある）。どちらも遅めになる想定なので、夕食は軽めでも足りる。到着が19時前なのでラストオーダーに注意。</div>'],
  // 日跨ぎ便で着いた日は、その日の先頭で「◯◯着」を示す。前日の4列交通しか
  // 到着を持っていないため、その日だけ見ると着いたことが分からなくなる。
  // 10/25の乗り継ぎ行は transformScript 側で「やること」「過ごし方」に組み直す。
  // EuroBLECHは展示会視察。TechExの「参加」、Mercedesの「工場見学」とは語を分ける。
  // アイコンも工場（🏭）ではなく展示会（🏛）にする。🏭はMercedes工場見学だけに残す。
  ['🏭 EuroBLECH Day 1', '🏛 EuroBLECH Day 1'],
  ['🏭 EuroBLECH（Hannover Messe）', '🏛 EuroBLECH（Hannover Messe）'],
  ['🏭 EuroBLECH（最終）', '🏛 EuroBLECH（最終）'],
  ['🏭 EuroBLECH 2026', '🏛 EuroBLECH 2026'],
  ['<i class="fas fa-industry"></i> EuroBLECH 公式サイト', '<i class="fas fa-landmark"></i> EuroBLECH 公式サイト'],
  ['EuroBLECH フル参加 — 全員合流', 'EuroBLECH 展示会視察 — 全員合流'],
  ['<!-- Day 5: 10/21 EuroBLECH フル参加（全員合流） -->', '<!-- Day 5: 10/21 EuroBLECH 展示会視察（全員合流） -->'],
  // 「EuroBLECH フル参加（全員合流・ハノーファーメッセ）」への置換はここから外した。
  // その文はindex_v1.html側の旧家族向け表にしか無く、直後に家族向けブロックごと
  // index_v2.htmlの内容で差し替えられるため、置換結果は元から捨てられていた。
  // 家族向けブロックはsource.htmlへ取り込み済みで、二重の入力元は無くなった。
  ['<div class="text-sm text-slate-600 mt-1">村上・美馬・金築 全員参加</div>', '<div class="text-sm text-slate-600 mt-1">村上・美馬・金築 全員で終日視察</div>'],
  ['Hannover Messe · 10/20（火）– 10/23（金）· 全員参加', 'Hannover Messe ・ 10/20（火）– 10/23（金）・ 全員で展示会視察'],
  ['美馬・金築が20日朝ハノーファーへ移動して参加', '美馬・金築が20日朝ハノーファーへ移動して視察'],
  ['<div class="font-semibold">10/21（水）— 全員フル参加</div>', '<div class="font-semibold">10/21（水）— 全員で終日視察</div>'],
  ['10/22（木）12:45–14:00 · 全員参加・予約確定済み', '10/22（木）12:45–14:00 ・ 全員で工場見学・予約確定済み'],
  // 自動手荷物預けの対象便かは未確認。有人カウンター前提にそろえる（村上10/17・美馬金築10/18の両方）。
  ['<div class="text-slate-600 text-xs">国際線のため3時間前にチェックイン</div>', '<div class="text-slate-600 text-xs">国際線のため3時間前にチェックイン。自動手荷物預けの対応可否は未確認のため、有人カウンターで預ける前提で動く</div>', 'all'],
];

// 家族向けの日別。駅から駅への細かい移動は載せない。
// 残すのは、その日の居場所が変わる出来事（フライト、到着、チェックイン）と、
// 日中なにをしているか、連絡が取りにくい時間帯（機内）だけ。
const FAMILY_DAYS = [
  { date:'10/17', dow:'土', murakami:[
    ['16:10','flight','フライト','CX539 セントレア発 → 香港 19:30着'],
    ['19:30〜23:15','transfer','乗り継ぎ','香港で3時間45分。23:15発の便へ'],
    ['23:15〜','flight','機内','CX271 香港発。**翌朝まで連絡がつきにくい**'],
  ], team:[], stays:[['村上','機内']] },
  { date:'10/18', dow:'日', murakami:[
    ['06:55','procedure','到着','Amsterdam AMS着。入国審査・荷物受取'],
    ['日中','stay','時差調整','ホテルに荷物を預けて休息'],
    ['15:00頃','stay','チェックイン','Holiday Inn Express Amsterdam - Sloterdijk Station'],
  ], team:[
    ['16:10','flight','フライト','CX539 セントレア発 → 香港 19:30着'],
    ['19:30〜23:55','transfer','乗り継ぎ','香港で4時間25分'],
    ['23:55〜','flight','機内','CX289 香港発。**翌朝まで連絡がつきにくい**'],
  ], stays:[['村上','Holiday Inn Express Amsterdam - Sloterdijk Station'],['美馬・金築','機内']] },
  { date:'10/19', dow:'月', murakami:[
    ['09:45〜16:50','work','仕事','TechEx Europe Day 1（RAI Amsterdam）'],
    ['18:00〜21:00','work','交流会','VIP Networking Drinks'],
  ], team:[
    ['07:15','procedure','到着','Frankfurt FRA着。入国審査・荷物受取'],
    ['12:30〜17:20頃','work','見学','Autostadt（ヴォルフスブルク）'],
    ['18:50頃','stay','チェックイン','Hotel FREIgeist Göttingen Innenstadt'],
  ], stays:[['村上','Holiday Inn Express Amsterdam - Sloterdijk Station'],['美馬・金築','Hotel FREIgeist Göttingen Innenstadt']] },
  { date:'10/20', dow:'火', murakami:[
    ['09:45〜14:55','work','仕事','TechEx Europe Day 2（RAI Amsterdam）'],
    ['16:50','flight','フライト','KL1791 Amsterdam AMS発 → Hannover HAJ 17:45着'],
    ['20:30頃','stay','チェックイン','Hotel FREIgeist Göttingen Innenstadt'],
  ], team:[
    ['09:00〜17:00','work','仕事','EuroBLECH 展示会視察（ハノーファー）'],
    ['18:00頃','stay','戻り目安','ゲッティンゲンのホテルへ'],
  ], stays:[['全員','Hotel FREIgeist Göttingen Innenstadt']] },
  { date:'10/21', dow:'水', shared:[
    ['09:00〜17:00','work','仕事','EuroBLECH 展示会視察（3名合流。ハノーファー）'],
    ['19:00頃','stay','夕食','ゲッティンゲン旧市街'],
  ], stays:[['全員','Hotel FREIgeist Göttingen Innenstadt']] },
  { date:'10/22', dow:'木', shared:[
    ['12:45〜14:00','work','工場見学','Mercedes-Benz Werk Bremen（予約確定）'],
    ['18:05頃／20:05頃','review','戻り時刻は未定','早帰り案と市内滞在案のどちらかで決まる'],
  ], stays:[['全員','Hotel FREIgeist Göttingen Innenstadt']] },
  { date:'10/23', dow:'金', shared:[
    ['09:00〜14:15頃','work','仕事','EuroBLECH 展示会視察（ハノーファー）'],
    ['17:14','move','移動','フランクフルト中央駅着'],
    ['17:30頃','stay','チェックイン','Toyoko Inn Frankfurt am Main Hauptbahnhof'],
  ], stays:[['全員','Toyoko Inn Frankfurt am Main Hauptbahnhof']] },
  { date:'10/24', dow:'土', shared:[
    ['10:15','move','移動','ホテル → フランクフルト空港'],
    ['13:40〜','flight','機内','CX288 Frankfurt FRA発。**翌朝まで連絡がつきにくい**'],
  ], stays:[['全員','機内']] },
  { date:'10/25', dow:'日', shared:[
    // 最終区間だけ「出発の行」が無い。09:35の香港発が乗り継ぎ行に吸収されていて、
    // 残るのは到着の行だけなので、便名を書く場所が他の6区間と違う。
    // 乗り継ぎ行が次の便を指すのは、次の便に独立した行が無いときだけにする。
    // 10/17・10/18は次の行が便そのもの（CX271・CX289）なので指さない。
    ['07:20〜09:35','transfer','乗り継ぎ','香港で2時間15分。09:35発 CX536 へ'],
    ['14:10','flight','帰着','セントレア NGO着'],
    ['15:00頃','move','帰宅','入国手続きを終えて各自帰宅'],
  ], stays:[['全員','帰宅']] },
];

// ============================================================
// 概要タブ（2026-08-16）
// ============================================================
// 概要は「動きが分かる」ためにある。EBは村上と美馬・金築が別の日に別の空港から
// 出て、別の街に泊まり、10/20の夜にゲッティンゲンで合流する。この形は日カードを
// 9枚めくらないと掴めない。**日程が割れていることは概要を作らない理由ではなく、
// 概要が要る理由である。**HRSは全員が同じ動きなので1本の表で足りたが、
// EBは合流するまで2本のレーンで見せる。レーンの色は旅程の人物レーンと同じものを
// 使う。色が2本から1本になることが、そのまま合流の合図になる。
//
// 中身はすべてFAMILY_DAYSとSTAYSから導く。手で書くと、日程を1日ずらした時点で
// 概要だけが古くなる。概要は全体を見る場所なので、ズレたときの実害が最も大きい。

// 宿の名前ではなく街の名前で動きを見せる。「どこで寝るか」が「どこにいるか」なので、
// 街が変われば動いたことが分かる。対応表に無い宿が出たらビルドを止める。
const STAY_CITY = {
  'Holiday Inn Express Amsterdam - Sloterdijk Station': 'アムステルダム',
  'Hotel FREIgeist Göttingen Innenstadt': 'ゲッティンゲン',
  'Toyoko Inn Frankfurt am Main Hauptbahnhof': 'フランクフルト',
  '機内': '機内',
  '帰宅': '帰宅',
};
const stayCity = name => {
  const city = STAY_CITY[name];
  if (!city) throw new Error(`Overview: no city for the stay "${name}"`);
  return city;
};

// 「。」以降は補足なので落とす。ただし括弧の中の「。」では切らない。
// 'EuroBLECH 展示会視察（3名合流。ハノーファー）' を素直に split すると
// '（3名合流' で終わって括弧が閉じない（2026-08-16に生成物で確認）。
const overviewHeadline = text => {
  const plain = text.replace(/<[^>]+>/g, '').replace(/\*\*/g, '');
  let depth = 0;
  for (let i = 0; i < plain.length; i++) {
    const ch = plain[i];
    if (ch === '（' || ch === '(') depth++;
    else if (ch === '）' || ch === ')') depth--;
    else if (ch === '。' && depth === 0) return plain.slice(0, i).trim();
  }
  return plain.trim();
};

// レーンごとの区分。1行の内容だけだと便名や会議名が並ぶばかりで、その日が
// そのレーンにとって何の日なのかが読めない。判定は上から順に最初に当たったものを採る。
//   出国    … そのレーンが最初に飛ぶ日。村上は10/17、美馬・金築は10/18でずれる
//   帰国    … 全日程の最終日
//   帰国便  … 機内泊（そのレーンの初日を除く）
//   イベント… work がある
//   移動    … flight / move / transfer / procedure がある
//   休日    … それ以外
//   日本    … 行事が無い。まだ発っていない（10/17の美馬・金築）
const overviewLaneKind = (events, { first, last, stay }) => {
  if (!events.length) return '日本';
  if (first) return '出国';
  if (last) return '帰国';
  if (stay === '機内') return '帰国便';
  if (events.some(e => e[1] === 'work')) return 'イベント';
  if (events.some(e => ['flight', 'move', 'transfer', 'procedure'].includes(e[1]))) return '移動';
  return '休日';
};
// 代表の1件を選ぶ順。work を先に見るのは、イベント日に「チェックイン」が
// 主役として出てしまうのを避けるため。flight は move より上（HRSと同じ理由で、
// 10/25が「入国手続きを終えて各自帰宅」を拾うと14:10のセントレア着が消える）。
const OVERVIEW_MAIN_KIND_ORDER = ['work', 'review', 'flight', 'procedure', 'move', 'transfer', 'stay'];
const overviewMain = events => {
  const pick = OVERVIEW_MAIN_KIND_ORDER.map(kind => events.find(ev => ev[1] === kind)).find(Boolean);
  return pick ? overviewHeadline(pick[3]) : '';
};

// レーンの並びは、その日に何本あるかで決まる。合流後は1本。
function overviewDayRows() {
  // 各レーンが最初に飛ぶ日を先に求める。「出国」はレーンごとに違う日になる。
  const firstFlight = {};
  FAMILY_DAYS.forEach(day => {
    [['murakami', day.murakami], ['team', day.team]].forEach(([who, events]) => {
      if (firstFlight[who]) return;
      if ((events || []).some(e => e[1] === 'flight')) firstFlight[who] = day.date;
    });
  });
  return FAMILY_DAYS.map((day, i, all) => {
    const last = i === all.length - 1;
    const rawStayOf = who => (day.stays.find(s => s[0] === who) || day.stays.find(s => s[0] === '全員') || [])[1];
    // 泊まりの行が無いレーンは、まだ日本にいる（10/17の美馬・金築）。空欄にすると
    // 「書き漏らし」に見えるので、居場所として日本と書く。
    const stayOf = who => { const name = rawStayOf(who); return name ? stayCity(name) : '日本'; };
    const lanes = day.shared
      ? [{ who: '全員', tone: 'shared', events: day.shared, stay: stayOf('全員') }]
      : [
        { who: '村上', tone: 'murakami', events: day.murakami || [], stay: stayOf('村上') },
        { who: '美馬・金築', tone: 'team', events: day.team || [], stay: stayOf('美馬・金築') },
      ];
    return {
      date: `${day.date}（${day.dow}）`,
      lanes: lanes.map(lane => ({
        ...lane,
        kind: overviewLaneKind(lane.events, {
          first: firstFlight[lane.tone] === day.date,
          last,
          stay: rawStayOf(lane.who),
        }),
        // まだ発っていないレーンは行事が無い。区分と居場所の両方が「日本」と
        // 言っているので、内容の行は出さない（'—' だけの行が1本増えるだけ）。
        main: overviewMain(lane.events),
        // 未確定が残る日はその理由を1行添える。札は付けない。状態を持つ単位は
        // 予定1件で、札の持ち主は旅程タブにある（同じ札を概要にも複製しない）。
        note: overviewHeadline((lane.events.find(e => e[1] === 'review') || [])[3] || ''),
      })),
    };
  });
}

// 出張概要が答えるのは「誰が何に行くか」である。経由地や便名ではない
// （2026-08-16にユーザーが指定）。村上はTechEx・EuroBLECH・ベンツ工場見学、
// 美馬・金築はAutostadt・EuroBLECH・ベンツ工場見学で、重なるのは後ろ2つ。
// この違いは日カードを開かないと分からないので、概要が持つ。
//
// イベント名は work の行から起こす。手で並べると、日程からイベントを1つ
// 落としたときに概要だけが古くなる。VIP Networking Drinks は TechEx の
// 一部なので TechEx へ寄せる（別のイベントとして数えない）。
// 4つは種類が違う。名前だけ並べても、何をしに行くのかが読めない。
// 語は「用語の決定」（CLAUDE.md）のとおりに使う。ここで別の言い回しを作らない。
//   TechEx Europe             … 参加（会議・展示。村上のみ）
//   Autostadt                 … 見学（美馬・金築のみ）
//   EuroBLECH                 … 展示会視察（本命。3名）
//   Mercedes-Benz Werk Bremen … 工場見学（予約確定。3名）
const OVERVIEW_EVENTS = [
  ['TechEx Europe', '参加', ['TechEx Europe', 'VIP Networking Drinks']],
  ['Autostadt', '見学', ['Autostadt']],
  ['EuroBLECH', '展示会視察', ['EuroBLECH']],
  ['Mercedes-Benz Werk Bremen', '工場見学', ['Mercedes-Benz Werk Bremen']],
];
// 場所と手配状況。日付と参加者はFAMILY_DAYSから数えるので、ここには持たせない。
// 二重管理になるものを固定文へ書かない。
const OVERVIEW_EVENT_NOTES = {
  'TechEx Europe': 'RAI Amsterdam。Gold Pass 取得済み（無償）',
  'Autostadt': 'ヴォルフスブルク。Wolfsburg Hbfから徒歩約10分',
  'EuroBLECH': 'ハノーファーメッセ。入場券はベッコフ経由で発行',
  'Mercedes-Benz Werk Bremen': 'ブレーメン。12:45〜14:00の枠は予約確定',
};
const overviewEvent = text => {
  const hit = OVERVIEW_EVENTS.filter(([, , keys]) => keys.some(key => text.includes(key)));
  // 知らない行事が増えたら止める。黙って落とすと、概要から1つ消えたことに
  // 誰も気付けない。増えたらこの表に足す。
  if (hit.length !== 1) throw new Error(`Overview: cannot name the event in "${text}" (matched ${hit.length})`);
  return { name: hit[0][0], kind: hit[0][1] };
};

// イベントごとの日付と参加者。出張概要とイベント概要が同じ表から出るので、
// 片方だけ古くなることがない。4つとも必ず出す（2026-08-16にAutostadtが
// イベント概要から抜けていた）。
function overviewEventRows() {
  const seen = new Map();
  FAMILY_DAYS.forEach(day => {
    const lanes = day.shared
      ? [['全員', day.shared]]
      : [['村上', day.murakami || []], ['美馬・金築', day.team || []]];
    lanes.forEach(([who, events]) => {
      events.filter(ev => ev[1] === 'work').forEach(ev => {
        const { name, kind } = overviewEvent(ev[3]);
        if (!seen.has(name)) seen.set(name, { name, kind, dates: [], byDay: new Map() });
        const row = seen.get(name);
        if (!row.dates.includes(day.date)) row.dates.push(day.date);
        // 日ごとに誰が行くかを持つ。会期のあいだ人数が変わるイベントがある
        // （EuroBLECHの10/20は美馬・金築だけ。村上はTechEx Day 2のため翌日合流）。
        // 「10/20〜10/23・3名」と書くと、初日に村上が居たことになってしまう。
        if (!row.byDay.has(day.date)) row.byDay.set(day.date, new Set());
        row.byDay.get(day.date).add(who);
      });
    });
  });
  if (seen.size !== OVERVIEW_EVENTS.length) {
    throw new Error(`Overview: expected ${OVERVIEW_EVENTS.length} events, found ${seen.size}`);
  }
  // 並びは日付順。OVERVIEW_EVENTSの並びではなく、実際に行く順で出す。
  return OVERVIEW_EVENTS.map(([name]) => seen.get(name))
    .sort((a, b) => a.dates[0].localeCompare(b.dates[0]))
    .map(row => {
      const label = date => {
        const who = [...row.byDay.get(date)];
        return who.includes('全員') ? '3名' : who.join('・');
      };
      const all = [...new Set(row.dates.map(label))];
      // 全日おなじ顔ぶれなら1つ。割れている日があれば、その日だけ但し書きにする。
      const who = all.length === 1
        ? all[0]
        : `3名（${row.dates.filter(date => label(date) !== '3名').map(date => `${date}は${label(date)}のみ`).join('・')}）`;
      return {
        name: row.name,
        kind: row.kind,
        span: row.dates.length > 1 ? `${row.dates[0]}〜${row.dates[row.dates.length - 1]}` : row.dates[0],
        who,
      };
    });
}

// 人ごとの「行く先」。合流後の shared は両方に足す。
function overviewPeople() {
  const people = [
    { who: '村上', tone: 'murakami', key: 'murakami' },
    { who: '美馬・金築', tone: 'team', key: 'team' },
  ];
  return people.map(person => {
    const events = [];
    let departure = '';
    let entry = '';
    FAMILY_DAYS.forEach(day => {
      const mine = day.shared || day[person.key] || [];
      mine.forEach(ev => {
        if (ev[1] === 'flight' && !departure) departure = day.date;
        if (ev[1] === 'procedure' && !entry && !day.shared) entry = overviewHeadline(ev[3]);
        if (ev[1] !== 'work') return;
        const event = overviewEvent(ev[3]);
        if (!events.some(e => e.name === event.name)) events.push(event);
      });
    });
    if (!departure) throw new Error(`Overview: no departure found for ${person.who}`);
    if (!events.length) throw new Error(`Overview: no events found for ${person.who}`);
    return { ...person, events, departure, entry };
  });
}

// 合流した日。レーンが1本になるのは10/21だが、実際に3名が同じ街で寝るのは
// 10/20の夜である（村上が20:30頃にゲッティンゲンへ着く）。印は動きが合流した日に
// 付ける。日中の行動がまだ別なので day.shared では拾えない。
// 判定は「全レーンの宿の街が同じで、前日は違った最初の日」。
function overviewMergeDate(rows) {
  for (let i = 1; i < rows.length; i++) {
    const cities = [...new Set(rows[i].lanes.map(l => l.stay))];
    const before = [...new Set(rows[i - 1].lanes.map(l => l.stay))];
    if (cities.length === 1 && before.length > 1) return rows[i].date;
  }
  throw new Error('Overview: the trip never converges — check FAMILY_DAYS stays');
}

// 概要タブのHTML。アイコンはtransformScript側の対応表を通るので、ここでは
// 絵文字で書いておく（生成物には1文字も残らない）。
function buildOverviewSection(source) {
  // 使う固有名詞はすべて元データの中にある。新しい事実を概要で作らない。
  // 元データが変わったら気付けるよう、使う前に在ることを確認する。
  const facts = [
    'RAI Amsterdam', 'ハノーファーメッセ', 'Hannover Messe', 'Mercedes-Benz Werk Bremen',
    'Gold Pass', 'ベッコフ', 'TechEx Europe 2026', 'EuroBLECH 2026',
    'Holiday Inn Express Amsterdam - Sloterdijk Station',
    'Hotel FREIgeist Göttingen Innenstadt',
    'Toyoko Inn Frankfurt am Main Hauptbahnhof',
  ];
  facts.forEach(fact => {
    if (!source.includes(fact)) throw new Error(`Overview fact missing from source: ${fact}`);
  });

  const rows = overviewDayRows();
  if (rows.length !== FAMILY_DAYS.length) throw new Error('Overview: day row count drifted from FAMILY_DAYS');
  const mergeDate = overviewMergeDate(rows);
  // 合流までに何日かかるかも導出する。手で「4日目」と書くと日程をずらしたとき
  // ここだけ古くなる。
  const mergeIndex = rows.findIndex(r => r.date === mergeDate);
  const mergeCity = rows[mergeIndex].lanes[0].stay;
  const people = overviewPeople();
  const eventRows = overviewEventRows();
  eventRows.forEach(row => {
    if (!OVERVIEW_EVENT_NOTES[row.name]) throw new Error(`Overview: no note for the event ${row.name}`);
  });

  const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const laneHtml = lane =>
    `<div class="ov-lane ov-lane-${lane.tone}">`
    + `<span class="ov-who">${esc(lane.who)}</span>`
    + `<span class="ov-kind"><span>${esc(lane.kind)}</span></span>`
    + `<span class="ov-main">${esc(lane.main)}${lane.note ? `<span class="ov-note">${esc(lane.note)}</span>` : ''}</span>`
    + `<span class="ov-city">${esc(lane.stay)}</span>`
    + '</div>';
  const dayHtml = row =>
    `<article class="ov-day${row.date === mergeDate ? ' ov-day-merge' : ''}">`
    + `<header>${esc(row.date)}</header>`
    + row.lanes.map(laneHtml).join('')
    + (row.date === mergeDate ? `<div class="ov-join">この夜から${esc(mergeCity)}で3名合流</div>` : '')
    + '</article>';

  return `<div class="tab" id="tab-overview" role="tabpanel" aria-label="概要">
  <div class="legacy-stack">

  <div class="ov-card">
    <div class="ov-head">🧳 出張概要</div>
    <div class="ov-body">
      <p class="ov-lead">10/17（土）発 〜 10/25（日）着｜${rows.length}日間｜3名</p>
      <div class="ov-split">
        ${people.map(person => `<div class="ov-split-lane ov-lane-${person.tone}">`
          + `<strong>${esc(person.who)}</strong>`
          + `<span class="ov-goes">${person.events.map(e => `<i><b>${esc(e.name)}</b>${esc(e.kind)}</i>`).join('')}</span>`
          + `</div>`).join('\n        ')}
      </div>
      <div class="ov-facts">
        <div><b>出国</b><span>村上が1日早い</span><span>${people.map(p => `${esc(p.who)} ${esc(p.departure)}`).join('／')}</span></div>
        <div><b>合流</b><span>${esc(mergeDate)}の夜</span><span>${esc(mergeCity)}</span></div>
        <div><b>帰国</b><span>10/25（日）全員</span><span>セントレア 14:10</span></div>
      </div>
    </div>
    <div class="ov-foot">💡 重なるのは EuroBLECH と Mercedes-Benz Werk Bremen の2つ。TechEx は村上だけ、Autostadt は美馬・金築だけ</div>
  </div>

  <div class="ov-card">
    <div class="ov-head">📅 日程概要</div>
    <div class="ov-body">
      <p class="ov-lead">出発から${mergeIndex + 1}日目まで村上と美馬・金築は別行動。色が2本から1本になる日が合流</p>
      <div class="ov-flow">
        ${rows.map(dayHtml).join('\n        ')}
      </div>
      <div class="ov-more no-print"><button class="btn" type="button" data-goto="itinerary">📅 日ごとの旅程へ</button></div>
    </div>
    <div class="ov-foot">💡 時刻・便名・乗り継ぎ・宿の住所は旅程タブが持ちます。ここは1日1行の俯瞰だけです</div>
  </div>

  <div class="ov-card">
    <div class="ov-head">🏛 イベント概要</div>
    <div class="ov-body">
      <!-- 4つとも出す。日付と参加者は overviewEventRows() が FAMILY_DAYS から
           数えるので、日程を直せばここも一緒に動く。場所と手配状況だけが
           元データ由来の固定文で、上の facts で在ることを確認している。 -->
      <div class="ov-events">
        ${eventRows.map(row => `<div class="ov-event">`
          + `<div class="ov-event-head"><span class="ov-kind"><span>${esc(row.kind)}</span></span><strong>${esc(row.name)}</strong></div>`
          + `<span>${esc(row.span)}・${esc(row.who)}｜${esc(OVERVIEW_EVENT_NOTES[row.name])}</span></div>`).join('\n        ')}
      </div>
      <div class="ov-more no-print"><button class="btn" type="button" data-goto="venue">📖 セッション表と当日メモへ</button></div>
    </div>
  </div>

  <div class="ov-card">
    <div class="ov-head">🏨 施設概要</div>
    <div class="ov-body">
      <div class="ov-facility">
        <div><b>会場</b><span>RAI Amsterdam ／ ハノーファーメッセ ／ Mercedes-Benz Werk Bremen</span></div>
        <div><b>宿</b><span>Holiday Inn Express Amsterdam - Sloterdijk Station ／ Hotel FREIgeist Göttingen Innenstadt ／ Toyoko Inn Frankfurt am Main Hauptbahnhof</span></div>
        <div><b>空港</b><span>往路 村上 NGO→HKG→AMS ／ 美馬・金築 NGO→HKG→FRA。復路 全員 FRA→HKG→NGO</span></div>
      </div>
      <div class="ov-more no-print"><button class="btn" type="button" data-goto="itinerary">📅 宿の住所・ラウンジ・便利リンクへ</button></div>
    </div>
    <div class="ov-foot">💡 準備タブは出発前に埋め切るものだけです。現地で開くものは旅程タブの末尾にあります</div>
  </div>

  </div>
</div>`;
}

function divRangeById(html, id) {
  const start = html.search(new RegExp(`<div\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i'));
  if (start < 0) throw new Error(`Missing #${id}`);
  const divTag = /<\/?div\b[^>]*>/gi;
  divTag.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = divTag.exec(html))) {
    depth += /^<\/div/i.test(match[0]) ? -1 : 1;
    if (depth === 0) return [start, divTag.lastIndex];
  }
  throw new Error(`Unclosed #${id}`);
}

// 置換文字列はLFで書いてある。core.autocrlf=trueのWindowsチェックアウトでは
// 作業ツリーがCRLFになるため、読み込み時にLFへそろえてから照合する。
const readSource = (file) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

let source = readSource(sourcePath);
for (const [from, to, scope] of SOURCE_TEXT_REPLACEMENTS) {
  if (!source.includes(from)) throw new Error('Missing source text replacement: ' + from.slice(0, 72));
  // 第3要素 'all' は、同一文が複数人・複数日に出る場合にすべて置き換える指定。
  source = scope === 'all' ? source.split(from).join(to) : source.replace(from, to);
}
source = source
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>TechEx Europe・EuroBLECH 2026 出張ガイド</title>')
  .replace(/<link[^>]+font-awesome[^>]*>/gi, '')
  .replace(/<script[^>]+cdn\.tailwindcss\.com[^>]*><\/script>/gi, '')
  .replace(/<style>[\s\S]*?<\/style>/i, '')
  .replace(/<script>[\s\S]*?<\/script>\s*<\/body>/i, '</body>')
  .replace('</head>', '<link rel="stylesheet" href="../202609_HumanoidSummitEurope/style.css">\n<link rel="stylesheet" href="style.css">\n</head>');

// 効いているクラスの一覧をCSSから作る。生成物が読み込む2枚を実際に走査する。
// ブラウザ内のCSSOMは使えない。ビルドは一時ディレクトリでページを開くため、
// 相対パスのlinkが解決されず document.styleSheets が空になる。
const cssSources = [
  readSource(join(here, '..', '202609_HumanoidSummitEurope', 'style.css')),
  readSource(join(here, 'style.css')),
].join('\n');
const cssKnownClasses = [...new Set(
  [...cssSources.matchAll(/\.((?:[\w-]|\\.)+)/g)].map(m => m[1].replace(/\\/g, ''))
)];
const cssKnownSubstrings = [...new Set(
  [...cssSources.matchAll(/\[class\*=("|')([^"']+)\1\]/g)].map(m => m[2])
)];
console.log(`CSS classes in use: ${cssKnownClasses.length}, [class*=] substrings: ${cssKnownSubstrings.length}`);

const transformScript = `
<script id="v3-build-transform">
(() => {
  const DAY_META = ${JSON.stringify(DAY_META)};
  const STAYS = ${JSON.stringify(STAYS)};
  const ROUTES = ${JSON.stringify(ROUTES)};
  const FAMILY_DAYS = ${JSON.stringify(FAMILY_DAYS)};
  const OVERVIEW_SECTION = ${JSON.stringify(buildOverviewSection(source))};
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const flightIcon = () => '<span class="flight-mark" role="img" aria-label="フライト"></span>';
  const plainTime = value => value.replace(/^\\d{1,2}\\/\\d{1,2}（.）/, '').trim();
  const routeDay = value => (value.match(/^(\\d{1,2})\\/(\\d{1,2})/) || []).slice(1).join('');
  const mapLink = place => '<a class="place" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place) + '" target="_blank" rel="noopener">' + esc(place) + '</a>';
  const isFlight = service => /^(?:CX|KL)\\d+/.test(service);
  // 交通手段は全部アイコンにする。フライトだけ絵で他が矢印、という不揃いをなくす。
  // 手段そのものが未定の場合だけ unknown。「列車候補を確認」は列車と決まっているので train。
  const MODE_ICONS = {
    train: '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M8 16l-2 4m10-4 2 4"/>',
    walk: '<circle cx="12" cy="4" r="2"/><path d="m10 8 3 3 3 1m-6-4-2 5-3 2m8-4-1 4 4 5m-4-5-5 6"/>',
    car: '<path d="M5 17h14M4 17v-4l2-5h12l2 5v4M4 17v2h2v-2m12 0v2h2v-2M6 13h12"/><circle cx="8" cy="15" r=".8"/><circle cx="16" cy="15" r=".8"/>',
    unknown: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.6a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  };
  const MODE_LABELS = { train: '鉄道', walk: '徒歩', car: 'タクシー', unknown: '手段は未定' };
  const modeKind = service => /タクシー|Uber|UBER/i.test(service) ? 'car'
    : /要検討|未定/.test(service) ? 'unknown'
    : /^徒歩/.test(service) && !/列車|鉄道|バス|メトロ/.test(service) ? 'walk'
    : 'train';
  const modeIcon = service => {
    if (isFlight(service)) return flightIcon();
    const kind = modeKind(service);
    return '<span class="mode-icon mode-icon-' + kind + '" role="img" aria-label="' + MODE_LABELS[kind] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + MODE_ICONS[kind] + '</svg></span>';
  };
  const routeMarkup = data => {
    const [dayId,, departWhen, departZone, departPlace, service, duration, arriveWhen, arriveZone, arrivePlace] = data;
    const depart = plainTime(departWhen);
    let arrive = plainTime(arriveWhen);
    if (routeDay(arriveWhen) && routeDay(arriveWhen) !== dayId) arrive += ' +1';
    return '<div class="row-time">' + esc(depart) + '</div>' +
      '<div class="endpoint"><span class="label">出発</span><time>' + esc(depart) + '</time><span class="tz">（' + esc(departZone) + '）</span>' + mapLink(departPlace) + '</div>' +
      '<div class="mode">' + modeIcon(service) + '<strong>' + esc(service) + '</strong><small>' + esc(duration.replace('所要時間未確認','時間未確認')) + '</small></div>' +
      '<div class="endpoint"><span class="label">到着</span><time>' + esc(arrive) + '</time><span class="tz">（' + esc(arriveZone) + '）</span>' + mapLink(arrivePlace) + '</div>';
  };
  // 空港での待ち時間と乗り継ぎは「やること」と「過ごし方」の2つだけにする。
  // ラウンジは過ごし方の一案であって、それ専用の見出しは作らない。
  // 手続き・確認・館内移動は、過ごし方ではなく「やること」に入れる。
  const todoFold = items => '<details class="fold mt-1"><summary>やること</summary><div class="fold-body">' + items.map(item => '<div>' + item + '</div>').join('') + '</div></details>';
  const spendFold = blocks => '<details class="fold mt-1"><summary>過ごし方</summary><div class="fold-body">' + blocks.join('') + '</div></details>';
  // ラウンジは4系統を必ず並べる。確認できていない系統も消さずに残す。
  // 資格の置き場所は2026-08-16に準備から旅程末尾へ移した（準備は畳めるタブなので、
  // 乗り継ぎ中に見るものを置かない）。この文の行き先も一緒に直す。
  const loungeOption = systems => '<div><strong>ラウンジ</strong>: 次の4系統のいずれか。利用資格は旅程末尾の「ラウンジ利用可否」に集約してある</div>' +
    systems.map(([label, body]) => '<div class="opt-sub"><strong>' + label + '</strong>: ' + body + '</div>').join('');
  const rows = day => Array.from(day.querySelectorAll('[class*="border-l-4"]'));
  const rowFor = (day, text) => rows(day).find(row => row.textContent.replace(/\\s+/g, ' ').includes(text));
  const routeRowFor = (day, text) => Array.from(day.querySelectorAll('.route-four')).find(row => row.textContent.replace(/\\s+/g, ' ').includes(text));
  const actionify = row => {
    if (!row || row.classList.contains('route-four') || row.classList.contains('action')) return;
    const children = Array.from(row.children);
    const time = children.find(el => {
      const text = el.textContent.trim();
      return text.length <= 32 && /^(?:\\d{1,2}:\\d{2}|\\d{1,2}:\\d{2}頃|\\d{1,2}:\\d{2}〜|朝|午前|午後|夕方|夜|日中|午前〜午後|午後〜|手続き後|14:00以降)/.test(text);
    });
    const timeText = time ? time.textContent.trim() : '—';
    if (time) time.remove();
    row.className = 'action' + (time ? '' : ' no-time');
    const body = document.createElement('div');
    body.className = 'action-body';
    while (row.firstChild) body.appendChild(row.firstChild);
    row.innerHTML = '<div class="row-time">' + esc(timeText) + '</div>';
    row.appendChild(body);
  };
  // 地図リンクは場所名そのものに張るのが標準。宿泊のホテル名も同じ扱いにする。
  // 「機内」「帰宅」は場所ではないのでリンクしない。
  const NON_PLACE_STAYS = ['機内', '帰宅'];
  const stayPlace = name => NON_PLACE_STAYS.includes(name) ? esc(name) : mapLink(name);
  const stayMarkup = stay => '<div class="stay stay-' + stay.tone + '"><span>' + esc(stay.who) + '</span><strong>宿泊：</strong>' + stayPlace(stay.name) + '</div>';
  const laneFrom = (sourceLane, tone, fallbackTitle, stay) => {
    const lane = document.createElement('div');
    lane.className = 'lane lane-' + tone;
    const oldHead = sourceLane.firstElementChild;
    let title = fallbackTitle;
    if (oldHead && /^(?:👤|👥)/.test(oldHead.textContent.trim())) {
      title = oldHead.textContent.trim();
      oldHead.remove();
    }
    lane.innerHTML = '<div class="lane-head">' + esc(title) + '</div>';
    while (sourceLane.firstChild) lane.appendChild(sourceLane.firstChild);
    lane.querySelectorAll('[class*="border-l-4"]').forEach(actionify);
    if (stay) lane.insertAdjacentHTML('beforeend', stayMarkup(stay));
    return lane;
  };

  document.querySelector('body > div')?.remove();
  document.getElementById('day-nav')?.remove();
  document.querySelector('nav.fixed')?.remove();

  const itinerary = document.getElementById('tab-itinerary');
  const prep = document.getElementById('tab-prep');
  const docs = document.getElementById('tab-docs');
  const venue = document.getElementById('tab-events');
  const family = document.getElementById('tab-family');
  if (!itinerary || !prep || !venue || !family) throw new Error('Required source panels are missing');

  const prepStack = prep.querySelector(':scope > div');
  const docsStack = docs?.querySelector(':scope > div');
  if (prepStack && docsStack) {
    const marker = document.createElement('div');
    marker.className = 'section-divider';
    marker.innerHTML = '<strong>📁 書類・予約情報</strong><span>旧「書類」タブの内容を準備へ統合</span>';
    prepStack.appendChild(marker);
    while (docsStack.firstChild) prepStack.appendChild(docsStack.firstChild);
  }
  docs?.remove();
  venue.id = 'tab-venue';

  const record = document.createElement('section');
  record.id = 'tab-rec';
  record.className = 'tab records-tab';
  record.setAttribute('role', 'tabpanel');
  record.innerHTML = '<div class="records-intro"><div><div class="eyebrow">FIELD NOTES</div><h2>日別記録</h2><p>入力はこのブラウザ内に自動保存されます。</p></div><div class="record-actions"><button type="button" id="export-records">Markdown書き出し</button><button type="button" id="clear-records">記録を消去</button></div></div><div id="record-days"></div>';

  const days = Array.from(itinerary.querySelectorAll('.day-card[id^="day-"]'));
  days.forEach(day => {
    const id = day.id.replace('day-', '');
    const meta = DAY_META[id];
    if (!meta) return;
    ROUTES.filter(route => route[0] === id).forEach(route => {
      const row = rowFor(day, route[1]);
      if (row) { row.className = 'route-four'; row.innerHTML = routeMarkup(route); }
    });
    // 日跨ぎ便は前日の4列交通に到着を残すが、到着日の人物レーンだけを見ても
    // どこに何時に着いたか分かるように、空港名を主表示、手続きを従表示にする。
    [['AMS 着','06:55','🛂 Amsterdam Airport Schiphol（AMS）着','入国審査・荷物受取'],['FRA 着','07:15','🛂 Frankfurt Airport（FRA）着','入国審査・荷物受取'],['HKG 着','07:20', flightIcon() + ' 香港国際空港（HKG）着','']].forEach(([match,time,label,sub]) => {
      const row = rowFor(day, match);
      if (row && !row.classList.contains('route-four')) row.innerHTML = '<div class="text-slate-500">' + time + '</div><div class="font-semibold">' + label + '</div>' + (sub ? '<div class="text-slate-600 text-xs">' + sub + '</div>' : '');
    });
    if (id === '1021') {
      const expo1021 = rowFor(day, 'EuroBLECH（Hannover Messe）');
      const back = ROUTES.find(route => route[0] === '1021' && route[1].includes('戻る'));
      expo1021?.insertAdjacentHTML('afterend', '<div class="route-four">' + routeMarkup(back) + '</div>');
    }
    if (id === '1022') {
      // 交通手段はタクシー（Uber）で決まり。時刻だけが目安。目安であることは
      // 「12:00頃」「所要は当日確認」と行の中に書いてあるので、枠線では示さない。
      // 10:45に着いてから12:45の見学までにランチを挟む。
      const before = rowFor(day, 'Mercedes-Benz Werk Bremen');
      before?.insertAdjacentHTML('beforebegin', '<div class="action"><div class="row-time">10:45〜12:00頃</div><div class="action-body"><div class="font-semibold">🍽 ブレーメンでランチ</div><div class="text-slate-600 text-xs">12:45の見学に間に合うよう、駅周辺で済ませる</div></div></div><div class="route-four">' + routeMarkup(['1022','','12:00頃','CEST','Bremen Hbf','タクシー（Uber）','所要は当日確認','12:45まで','CEST','Mercedes-Benz Werk Bremen']) + '</div>');
    }
    if (id === '1017') {
      // 13:10〜16:10は「空港到着目安 13:10」「昼食 13:40」「サクララウンジ 13:10〜15:40」の
      // 3行に割れていて、時刻も逆順だった。10/18の美馬・金築と同じ「過ごし方」1行にまとめる。
      const lounge = rowFor(day, 'JALサクララウンジ');
      const lunch = rowFor(day, 'セントレアで昼食');
      const arrival = rowFor(day, '空港到着目安');
      if (arrival) {
        arrival.innerHTML = '<div class="row-time">13:10〜16:10</div><div class="action-body"><div class="font-semibold">🕐 セントレアで出発待ち（約3時間）</div><div class="text-slate-600 text-xs">機内食は離陸1時間後が目安（17:10頃）。昼は軽く</div>' + todoFold([
          '国際線のため出発3時間前にチェックイン',
          '自動手荷物預けの対応可否は未確認のため、有人カウンターで預ける前提で動く',
          '保安検査と出国審査を済ませてから制限エリアへ',
          '事前の機内食予約は不要。「食事の選択」はファースト／ビジネス限定で、エコノミーで要るのは特別食（アレルギー・ベジタリアン等）の申請だけ',
        ]) + spendFold([
          loungeOption([
            ['エアライン', 'JALサクララウンジ（出国審査後の制限エリア内・2階）。<strong>搭乗券と会員証の提示が必要</strong>'],
            ['Priority Pass', 'セントレアの対象施設は未確認'],
            ['一般有料', 'プラザ・プレミアム・ラウンジ名古屋。料金と営業時間は当日確認'],
            ['カード付帯', 'プレミアムラウンジ セントレア／第2プレミアムラウンジ セントレア／QUALIA LOUNGE。<strong>出国審査の前</strong>なので、入るなら早めに'],
          ]),
          '<div><strong>昼食</strong>: 保安検査後に軽く済ませる。CX539はエコノミーでも主菜＋デザートが出て、16:10発・4時間20分なのでこれが実質の夕食になる</div>',
        ]) + '</div>';
        arrival.className = 'action';
      }
      lunch?.remove();
      lounge?.remove();
      const hkg1017 = rowFor(day, '香港で乗り継ぎ（3時間45分）');
      hkg1017?.insertAdjacentHTML('beforeend', todoFold([
        '23:15発のCX271へ乗り継ぐ',
        '搭乗ゲートは現地の案内で確認する',
      ]) + spendFold([
        loungeOption([
          ['エアライン', 'キャセイのビジネスクラスラウンジ。The Deck（Gate 6付近・L7）と The Pier, Business（Gate 65付近・L6）が05:30〜00:30、The Bridge（Gate 35付近・L6）が05:00〜最終キャセイ便。20:00〜22:30はいずれも営業時間内。The Pier, Business はシャワー14室'],
          ['Priority Pass', '香港の対象施設は未確認'],
          ['一般有料', 'Plaza Premium Lounge は Gate 60 が24時間・HKD 250〜（最安）、Gate 1 が24時間・HKD 650〜、Gate 35 が06:00〜01:00・HKD 650〜'],
          ['カード付帯', '香港での対象は未確認'],
        ]),
        '<div>⭐ <strong>無料シャワー</strong>: L5の Gate 12付近 / Gate 43付近が24時間。シャンプー等あり、タオルは近くの自販機で購入。<strong>ラウンジの可否と無関係に使える</strong>ので、総移動21時間45分の後半が楽になる</div>',
        '<div><strong>飲食</strong>: Gate 10〜11付近 Level 6 の Men Wah Bing Teng（香港式の茶餐廳）・McDonald&#39;s が<strong>24時間</strong>。Level 7 フードコート（Tasty Congee のお粥・雲呑麺など）は22〜23時台に閉まる可能性があるので、行くなら早めに。CX539の機内食のあとなので、食べるなら軽めにする</div>',
      ]));
      // 16:10発の機内食を時系列にも出す。出発待ちの一行と合わせて、昼の量を決められるようにする。
      routeRowFor(day, 'CX539')?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">17:10頃</div><div class="action-body"><div class="font-semibold">🍽 機内食（主菜＋デザート）</div><div class="text-slate-600 text-xs">離陸1時間後が目安。これが実質の夕食になる</div></div></div>');
    }
    if (id === '1018') {
      const rest = rowFor(day, '時差調整・休息');
      rest?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">15:00頃</div><div class="action-body"><div class="font-semibold">🏨 ホテルにチェックイン</div><div class="text-slate-600 text-xs">Holiday Inn Express Amsterdam - Sloterdijk Station</div></div></div>');
      const lounge = rowFor(day, 'ラウンジ候補');
      // 10/17と同じく、13:10の「空港到着目安」と重複していたので1行に寄せる。
      rowFor(day, '空港到着目安')?.remove();
      if (lounge) lounge.innerHTML = '<div class="text-slate-500">13:10〜16:10</div><div class="font-semibold">🕐 セントレアで出発待ち（約3時間）</div><div class="text-slate-600 text-xs">機内食は離陸1時間後が目安（17:10頃）。昼は軽く</div>' + todoFold([
        '国際線のため出発3時間前にチェックイン',
        '自動手荷物預けの対応可否は未確認のため、有人カウンターで預ける前提で動く',
        '保安検査と出国審査を済ませてから制限エリアへ',
      ]) + spendFold([
        loungeOption([
          ['エアライン', 'JALサクララウンジ（第1ターミナル・国際線制限エリア）'],
          ['Priority Pass', 'Plaza Premium Lounge／The Coral Finest Business Class Lounge'],
          ['一般有料', 'プラザ・プレミアム・ラウンジ名古屋。料金と営業時間は当日確認'],
          ['カード付帯', 'プレミアムラウンジ セントレア／第2プレミアムラウンジ セントレア／QUALIA LOUNGE。<strong>出国審査の前</strong>なので、入るなら早めに'],
        ]),
        '<div><strong>昼食</strong>: 保安検査後に軽く済ませる。CX539はエコノミーでも主菜＋デザートが出て、16:10発・4時間20分なのでこれが実質の夕食になる</div>',
      ]);
      const cx539 = routeRowFor(day, 'CX539');
      cx539?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">19:30〜23:55</div><div class="action-body"><div class="font-semibold">🕐 香港で乗り継ぎ（4時間25分）</div>' + todoFold([
        '23:20頃にCX289の搭乗口へ',
        '搭乗ゲートは現地の案内で確認する',
      ]) + spendFold([
        loungeOption([
          ['エアライン', 'キャセイのビジネスクラスラウンジ。The Deck（Gate 6付近・L7）と The Pier, Business（Gate 65付近・L6）が05:30〜00:30、The Bridge（Gate 35付近・L6）が05:00〜最終キャセイ便'],
          ['Priority Pass', '香港の対象施設は未確認'],
          ['一般有料', 'Plaza Premium Lounge は Gate 60 が24時間・HKD 250〜（最安）、Gate 1 が24時間・HKD 650〜、Gate 35 が06:00〜01:00・HKD 650〜'],
          ['カード付帯', '香港での対象は未確認'],
        ]),
        '<div>⭐ <strong>無料シャワー</strong>: L5の Gate 12付近 / Gate 43付近が24時間。シャンプー等あり、タオルは自販機で購入。ラウンジの可否と無関係に使える</div>',
        '<div><strong>飲食</strong>: Gate 10〜11付近 Level 6 の Men Wah Bing Teng・McDonald&#39;s が24時間。Level 7 フードコートは22〜23時台に閉まる可能性がある</div>',
      ]) + '</div></div>');
      // afterendは後から挿入したものが手前に来る。機内食(17:10)を乗り継ぎ(19:30)より前に置くため、
      // 乗り継ぎブロックを入れたあとに機内食を挿入する。
      cx539?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">17:10頃</div><div class="action-body"><div class="font-semibold">🍽 機内食（主菜＋デザート）</div><div class="text-slate-600 text-xs">離陸1時間後が目安。これが実質の夕食になる</div></div></div>');
    }
    if (id === '1019') {
      // 07:15着〜08:22発の1時間しかない行動なので、日トップではなく時系列に置く。
      rowFor(day, 'Frankfurt Airport（FRA）着')?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">07:45頃</div><div class="action-body"><div class="font-semibold">🍽 空港で買い出し</div><div class="text-slate-600 text-xs">08:22発の列車まで待ち時間。パンと飲み物を買っておく</div></div></div>');
      const techEx = rowFor(day, 'TechEx Day 1 — Gold Track');
      techEx?.insertAdjacentHTML('afterbegin', '<div class="text-slate-500">09:45–16:50</div>');
      Array.from(techEx?.querySelectorAll('div') || []).find(el => el.textContent.trim() === '18:00–21:00 VIP Networking Drinks（Gold Pass特典）')?.remove();
      const drinks = rowFor(day, 'VIP Networking Drinks');
      const drinksTime = Array.from(drinks?.children || []).find(el => el.textContent.trim() === '夕方');
      if (drinksTime) drinksTime.textContent = '18:00–21:00';
      const baggage = rowFor(day, 'ゲッティンゲン着 → Hotel FREIgeistへ荷物を預ける');
      if (baggage) baggage.innerHTML = '<div class="text-slate-500">10:35頃</div><div class="font-semibold">🏨 ホテルに荷物を預ける</div><div class="text-slate-600 text-xs">チェックイン前のため、日中預かりを依頼（要事前確認）</div>';
      const checkin = rowFor(day, 'ゲッティンゲン着 → 荷物ピックアップ・正式チェックイン');
      if (checkin) checkin.innerHTML = '<div class="text-slate-500">18:50頃</div><div class="font-semibold">🏨 荷物受取・チェックイン</div>';
    }
    if (id === '1020') {
      rowFor(day, 'Hannover Messe/Laatzen駅着')?.remove();
      const techEx = rowFor(day, 'TechEx Day 2');
      techEx?.insertAdjacentHTML('afterbegin', '<div class="text-slate-500">09:45–14:55</div>');
      const ice77 = routeRowFor(day, 'ICE77');
      ice77?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">20:30頃</div><div class="action-body"><div class="font-semibold">🏨 ホテルにチェックイン</div><div class="text-slate-600 text-xs">Göttingen Hbfから徒歩約3〜5分</div></div></div>');
      // 会場そのものへの地図リンクは場所名に張る。元資料の「📍 ハノーファーメッセ」は
      // 別リンクの旧形式なので、10/21・10/23と同じ「会場は<場所名>」にそろえる。
      // 検索キーは元資料の文字列。表示側は3日とも「EuroBLECH ＋ 誰が視察するか ＋ 会場」でそろえる。
      const expo = rowFor(day, 'EuroBLECH Day 1');
      if (expo) expo.innerHTML = '<div class="text-slate-500">09:00頃〜17:00</div><div class="font-semibold text-teal-800">🏛 EuroBLECH</div><div class="text-slate-600 text-xs">美馬・金築が終日視察。会場は' + mapLink('ハノーファーメッセ') + '</div>';
      const back = ROUTES.find(route => route[0] === '1020' && route[1].includes('戻る'));
      expo?.insertAdjacentHTML('afterend', '<div class="route-four">' + routeMarkup(back) + '</div>');
    }
    if (id === '1021') {
      const expo = rowFor(day, 'EuroBLECH（Hannover Messe）');
      if (expo) expo.innerHTML = '<div class="text-slate-500">09:00–17:00</div><div class="font-semibold text-teal-800">🏛 EuroBLECH</div><div class="text-slate-600 text-xs">全員で終日視察。会場は' + mapLink('ハノーファーメッセ') + '</div>';
      const back = Array.from(day.querySelectorAll('.route-four')).at(-1);
      back?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">19:00頃</div><div class="action-body"><div class="font-semibold">🍽 全員で夕食</div><div class="text-slate-600 text-xs">ゲッティンゲン旧市街</div></div></div>');
    }
    if (id === '1022') {
      // 復路は列車が2本あるので、案を文章で並べずに交通行を2本出す。
      // どちらも未決。選んだら片方を消す。未決であることは「列車候補を確認」と
      // 行の中に書いてある。34行のうち19行が「頃・約」で、印を正しく付けると
      // 半分以上に付いて区別にならないため、交通行に色や点線は使わない。
      const returnRoute = routeRowFor(day, '列車候補を確認');
      if (returnRoute) {
        const early = ['1022','','16:00頃','CEST','Bremen Hbf','列車候補を確認','約2時間の目安','18:00頃','CEST','Göttingen Hbf'];
        const late  = ['1022','','18:00頃','CEST','Bremen Hbf','列車候補を確認','約2時間の目安','20:00頃','CEST','Göttingen Hbf'];
        returnRoute.outerHTML =
          '<div class="choice-head"><strong>復路は2案</strong><span>どちらかを選んだら、もう片方の行を消す</span></div>' +
          '<div class="choice-label">早帰り案 — ホテル18:05頃着。夕方を資料整理に使う</div>' +
          '<div class="route-four">' + routeMarkup(early) + '</div>' +
          '<div class="choice-label">市内滞在案 — ホテル20:05頃着。ブレーメン市内を見る</div>' +
          '<div class="route-four">' + routeMarkup(late) + '</div>';
      }
    }
    if (id === '1023') {
      const expo1023 = rowFor(day, 'EuroBLECH（最終）');
      if (expo1023) expo1023.innerHTML = '<div class="text-slate-500">09:00〜14:15頃</div><div class="font-semibold text-teal-800">🏛 EuroBLECH</div><div class="text-slate-600 text-xs">全員で視察。会場は' + mapLink('ハノーファーメッセ') + '</div><div class="text-slate-600 text-xs">入場後は荷物をクロークへ。14:30発の列車に合わせて14:15頃退場</div>';
      const lastTrain = routeRowFor(day, 'ICE771');
      lastTrain?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">17:30頃</div><div class="action-body"><div class="font-semibold">🏨 ホテルにチェックイン</div><div class="text-slate-600 text-xs">フランクフルト中央駅南口から徒歩約2分</div></div></div><div class="action"><div class="row-time">18:30頃</div><div class="action-body"><div class="font-semibold">🍽 夕食</div><div class="text-slate-600 text-xs">フランクフルト中央駅周辺。夜は荷物・貴重品に注意。</div></div></div>');
    }
    if (id === '1024') {
      // 朝の要点は朝食ではなく10:00のチェックアウト。朝食は付随情報なので折り畳みへ。
      const firstRoute = day.querySelector('.route-four');
      firstRoute?.insertAdjacentHTML('beforebegin', '<div class="action"><div class="row-time">10:00</div><div class="action-body"><div class="font-semibold">🏨 チェックアウト</div><div class="text-slate-600 text-xs">荷物を持って10:15にホテルを出発</div><details class="fold mt-1"><summary>それまでにやること</summary><div class="fold-body"><div>07:00〜10:00に東横INNの無料朝食</div><div>この日から機内泊なので、着替えと充電器を手荷物へ移しておく</div></div></details></div></div>');
      // 空港も他日と同じ「出発待ち（所要）」1行にまとめる。手続きもラウンジも折り畳みへ。
      const airport = rowFor(day, 'FRA空港 到着');
      const lounge = rowFor(day, 'FRAラウンジ');
      lounge?.remove();
      if (airport) airport.innerHTML = '<div class="text-slate-500">10:40〜13:40</div><div class="font-semibold">🕐 フランクフルト空港で出発待ち（3時間）</div>' + todoFold([
        'CX288のチェックインカウンターと搭乗ゲートは当日の案内で確認',
        '10:40〜12:55を目安にチェックイン・保安検査・出国審査を済ませる',
        'Terminal 3発。ターミナル間の移動時間を見ておく',
      ]) + spendFold([
        loungeOption([
          ['エアライン', 'キャセイはFRAに自社ラウンジが無く契約ラウンジを使う。どこかは未確定'],
          ['Priority Pass', 'フランクフルトの対象施設は未確認'],
          ['一般有料', '対象施設は未確認'],
          ['カード付帯', '対象施設は未確認'],
        ]),
      ]);
    }
    if (id === '1025') {
      // 到着と乗り継ぎは別の出来事なので1行にまとめない。10/18 AMS・10/19 FRAと同じく
      // 「◯◯着」を出したうえで、乗り継ぎは他日と同じ「地点で乗り継ぎ（所要）」にする。
      // 館内移動と再検査は過ごし方ではなく「やること」。ラウンジは過ごし方に置く。
      const transfer = rows(day).find(row => row.textContent.includes('コンコース間の移動'));
      if (transfer) transfer.innerHTML = '<div class="text-slate-500">07:20〜09:35</div><div class="font-semibold">🕐 香港で乗り継ぎ（2時間15分）</div>' + todoFold([
        'セキュリティ再検査と液体物の追加検査がある',
        '<strong>搭乗ゲートのコンコースは搭乗券が出るまで分からない</strong>ので、先に確認する',
        'コンコース間の移動は、T1本館⇄Midfield が地下のAPMで約2.5分、T1本館⇄T1 Satellite が Sky Bridge を徒歩5〜10分（動く歩道あり）。<strong>Terminal 2 は乗継には無関係</strong>（チェックイン・出発処理専用でゲートが無い）',
        '⚠️ <strong>土産は往路（10/17・10/18の夜）に済ませておく</strong>。復路の早朝は開いていない店がある',
      ]) + spendFold([
        loungeOption([
          ['エアライン', 'キャセイのビジネスクラスラウンジ。07:20着の時点で The Bridge（05:00〜）、The Deck と The Pier, Business（05:30〜）はいずれも営業時間内。<strong>同伴は1名まで＝3名のうち1名が入れない</strong>ので、分かれるより3名で店に入る方が無駄がない'],
          ['Priority Pass', '香港の対象施設は未確認'],
          ['一般有料', 'Plaza Premium Lounge は Gate 60・Gate 1 が24時間。Plaza Premium First は West Hall 06:00〜／East Hall 06:30〜'],
          ['カード付帯', '香港での対象は未確認'],
        ]),
        '<div>⭐ <strong>無料シャワー</strong>: L5の Gate 12付近 / Gate 43付近が24時間</div>',
        '<div><strong>飲食</strong>: フードコートや免税店は開店07〜08時が多く、07:20着だと閉まっている可能性がある。確実なのは Gate 10〜11付近 Level 6 の Men Wah Bing Teng・McDonald&#39;s（<strong>24時間</strong>）。<strong>CX536で機内食が出る</strong>ので、食べるなら軽めにする</div>',
      ]);
      // CX536でも離陸1時間後に機内食が出る。往路のCX539と同じく時系列にも出して、
      // 乗り継ぎ中にどれだけ食べるかを決められるようにする。
      routeRowFor(day, 'CX536')?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">10:35頃</div><div class="action-body"><div class="font-semibold">🍽 機内食（昼食）</div><div class="text-slate-600 text-xs">離陸1時間後が目安。香港時刻</div></div></div>');
      const before = rowFor(day, '解散・帰宅');
      if (before) before.innerHTML = '<div class="text-slate-500">15:00頃</div><div class="font-semibold">🏠 セントレア発・各自帰宅</div><div class="text-slate-600 text-xs">空港から先は各自の経路へ</div>';
      before?.insertAdjacentHTML('beforebegin', '<div class="action"><div class="row-time">14:10〜15:00頃</div><div class="action-body"><div class="font-semibold">🛂 入国審査・荷物受取・税関</div>' + todoFold(['Visit Japan WebのQRコードを用意する']) + '</div></div>');
    }
    const absorbed = {
      '1017': ['HKG着（乗継 3時間45分）'],
      '1018': ['HKG着（乗継 4時間25分）'],
      '1025': ['中部国際空港（セントレア）着陸'],
    }[id] || [];
    absorbed.forEach(match => {
      const duplicate = rowFor(day, match);
      if (duplicate && !duplicate.classList.contains('route-four')) duplicate.remove();
    });

    const topicRows = rows(day).filter(row => /食事・.*スーパー/.test(row.textContent));
    const topicDetails = topicRows.map(row => {
      const heading = row.querySelector('.font-semibold');
      const title = (heading?.textContent || '食事・買い物').replace(/^[^\\p{L}\\p{N}]+/u, '').trim();
      heading?.remove();
      const html = row.innerHTML;
      row.remove();
      return '<details class="topic"><summary>' + esc(title) + '</summary><div class="topic-body">' + html + '</div></details>';
    }).join('');
    rows(day).filter(row => /選定済み（未購入|運賃は手配中/.test(row.textContent)).forEach(row => row.remove());
    rows(day).filter(row => /(?:に宿泊|泊（|機内泊)/.test(row.textContent) && !row.classList.contains('route-four')).forEach(row => row.remove());

    const oldHead = day.firstElementChild;
    const oldBody = oldHead?.nextElementSibling;
    const labels = oldHead ? Array.from(oldHead.querySelectorAll(':scope > span')).map(el => el.textContent.trim()) : [];
    const details = document.createElement('details');
    details.className = 'day'; details.id = day.id; details.open = true;
    details.dataset.label = labels[0]?.match(/\\d{1,2}\\/\\d{1,2}/)?.[0] || id;
    details.dataset.dow = labels[0]?.match(/（(.)）/)?.[1] || '';
    details.dataset.date = meta.date; details.dataset.kind = meta.kind;
    details.innerHTML = '<summary class="day-head"><span class="d">' + esc(labels[0] || id) + '</span><span class="t">' + esc(labels.slice(1).join(' ')) + '</span><span class="badge">' + esc(meta.badge) + '</span></summary>' +
      '<div class="day-zone">' + esc(meta.zone) + '</div><section class="day-topics"><h3>本日のトピックス</h3><p>' + esc(meta.focus) + '</p>' + topicDetails + '</section>';

    const split = oldBody?.querySelector(':scope > .split-grid');
    const stays = STAYS[id] || [];
    if (split) {
      const laneWrap = document.createElement('div'); laneWrap.className = 'lanes';
      const sources = Array.from(split.children);
      laneWrap.appendChild(laneFrom(sources[0], 'murakami', '👤 村上', stays.find(s => s.tone === 'murakami')));
      if (sources[1]) laneWrap.appendChild(laneFrom(sources[1], 'team', '👥 美馬・金築', stays.find(s => s.tone === 'team')));
      details.appendChild(laneWrap);
       if (id === '1020') details.insertAdjacentHTML('beforeend', '<div class="joinbar"><span>合流</span><strong>夜にゲッティンゲンで合流 — 以降は3名で行動</strong></div>');
      const shared = stays.find(s => s.tone === 'shared');
      if (shared) details.insertAdjacentHTML('beforeend', stayMarkup(shared));
    } else if (oldBody) {
      const source = oldBody.querySelector(':scope > .space-y-2') || oldBody;
      const tone = id === '1017' ? 'murakami' : 'all';
      const title = id === '1017' ? '👤 村上 — 1日先行' : '👥 全員';
      details.appendChild(laneFrom(source, tone, title, stays[0]));
    }
    day.replaceWith(details);
  });

  const stack = itinerary.querySelector(':scope > .max-w-2xl');
  if (stack) {
    stack.className = 'itinerary-stack';
    stack.querySelectorAll(':scope > :not(.day)').forEach(el => { if (!el.closest('.day')) el.classList.add('intro-card'); });
    // 日ヘッダーの色は予定の種類であって、決まっているかどうかではない。
    // 未定はオレンジの帯だけが示す、と凡例で明示しないと10/22のラベンダーが未定色に読まれる。
    stack.insertAdjacentHTML('afterbegin','<div class="day-toolbar no-print"><span>日付カード</span><button class="btn" id="days-tg" type="button" aria-expanded="true">すべて閉じる</button></div>');
    stack.insertAdjacentHTML('afterbegin','<div class="day-kind-legend" aria-label="日付カードの色の意味"><strong>日付カードの色</strong><span><i class="kind-swatch swatch-move"></i>移動・帰着</span><span><i class="kind-swatch swatch-conf"></i>展示会視察</span><span><i class="kind-swatch swatch-visit"></i>工場・企業見学（予約確定）</span><span><i class="kind-swatch swatch-review"></i>要検討（この帯だけが未定）</span></div>');
  }
  // 本文はエスケープしたうえで **…** だけを強調に戻す。生HTMLは通さない。
  const familyText = value => esc(value).replace(/\\*\\*(.+?)\\*\\*/g, '<b>$1</b>');
  const familyEventMarkup = event => '<div class="agenda-line"><time>' + esc(event[0]) + '</time><span class="schedule-tag kind-' + esc(event[1]) + '">' + esc(event[2]) + '</span><p>' + familyText(event[3]) + '</p></div>';
  const familySectionMarkup = (title, events) => '<section><h3>' + esc(title) + '</h3>' + (events.length ? events.map(familyEventMarkup).join('') : '<div class="agenda-empty">日本</div>') + '</section>';
  const familyStayMarkup = stays => '<aside><h3>宿泊</h3>' + stays.map(stay => '<p>' + stayPlace(stay[1]) + '<br><small>' + esc(stay[0]) + '</small></p>').join('') + '</aside>';
  const familyDayMarkup = day => {
    const body = day.shared
      ? '<section class="family-shared"><h3>全員</h3>' + day.shared.map(familyEventMarkup).join('') + '</section>'
      : familySectionMarkup('村上', day.murakami) + familySectionMarkup('美馬・金築', day.team);
    return '<article class="family-day-row' + (day.shared ? ' shared-day' : '') + '"><header><strong>' + esc(day.date) + '</strong><span>' + esc(day.dow) + '</span></header>' + body + familyStayMarkup(day.stays) + '</article>';
  };
  const familySchedule = family.querySelector('.family-schedule .schedule-body');
  if (familySchedule) familySchedule.innerHTML = '<div class="schedule-legend" aria-label="色の意味"><strong>表示の区別</strong><span class="schedule-tag kind-flight">フライト</span><span class="schedule-tag kind-move">地上移動</span><span class="schedule-tag kind-transfer">到着・乗り継ぎ</span><span class="schedule-tag kind-procedure">手続き</span><span class="schedule-tag kind-work">仕事</span><span class="schedule-tag kind-stay">滞在・宿</span><span class="schedule-tag kind-review">要検討</span></div>' + FAMILY_DAYS.map(familyDayMarkup).join('');
  // 「どこにいるか」一覧は作らない。9日間の居場所は日程詳細が日ごとに持っており、
  // HRSでも同じ理由で落とした。家族が2箇所を突き合わせる形にしない。
  family.querySelector('.flight-fares')?.remove();
  family.querySelectorAll('.flight-status').forEach(status => status.remove());
  family.querySelector('.timezone-note')?.remove();
  const timezoneLead = family.querySelector('.timezone-lead');
  if (timezoneLead) timezoneLead.innerHTML = '<strong>時刻はすべて、その場所の現地時刻</strong><span>日本＝JST／欧州＝CEST／香港＝HKT</span>';
  // 時差そのものを最大文字にする。タイムゾーン略号とUTCオフセットは補足に落とす。
  const timezoneCards = family.querySelector('.timezone-cards');
  if (timezoneCards) timezoneCards.innerHTML = [
    ['zone-japan','🇯🇵 日本','基準','','JST・UTC+9'],
    ['zone-europe','🇳🇱🇩🇪 欧州','−7','時間','CEST・UTC+2'],
    ['zone-hongkong','🇭🇰 香港','−1','時間','HKT・UTC+8'],
  ].map(([cls,label,diff,unit,note]) => '<div class="timezone-card ' + cls + '"><span>' + label + '</span><strong class="tz-diff">' + diff + (unit ? '<i>' + unit + '</i>' : '') + '</strong><small>' + note + '</small></div>').join('');
  // ラウンジは「空港での過ごし方」なので、置き場所は会場タブではなく準備タブ。
  // 旅程には4系統の名前と営業時間だけを残し、利用資格の確認はここへ集約する。
  // 区間ごとに4系統を必ず並べ、確認できていない系統は消さずに「未確認」で残す。
  // 未確認を「使えない」と読み替えない。断定を足すときは一次情報を読んでからにする。
  const LOUNGE_STATE = { ok: '利用可', tbd: '未確認' };
  const LOUNGE_SEGMENTS = [
    ['10/17 セントレア出発', '村上・約3時間', [
      ['エアライン', 'ok', 'JALサクララウンジ（国際線制限エリア・2階）。<strong>oneworld Sapphireでエコノミーでも利用可</strong>で、約2時間半使える。搭乗券と会員証の提示が必要。キャセイはセントレアに自社ラウンジを持たないため提携先になる。'],
      ['Priority Pass', 'tbd', 'セントレアの対象施設は未確認。会員本人のアプリで当日の対象と同伴条件を確認する。'],
      ['一般有料', 'ok', 'プラザ・プレミアム・ラウンジ名古屋。会員資格が無くても買える。料金と営業時間は当日確認。'],
      ['カード付帯', 'tbd', '出国審査前のプレミアムラウンジ セントレア／第2プレミアムラウンジ セントレア／QUALIA LOUNGE。対象になるカードかは保有カードの特典ページで確認する。'],
    ]],
    ['10/17 HKG乗継', '村上・3時間45分', [
      ['エアライン', 'ok', 'oneworld Sapphireでキャセイのビジネスクラスラウンジに<strong>本人＋同伴1名</strong>（キャセイ運航ラウンジのみ）。The Deck と The Pier, Business は05:30〜00:30、The Bridge は05:00〜最終キャセイ便。ファーストクラスラウンジ（The Wing, First / The Pier, First）と、その中の「ザ・カバナ」「ザ・ヘイヴン」は対象外。'],
      ['Priority Pass', 'tbd', '香港の対象施設は未確認。会員本人のアプリで当日の対象と同伴条件を確認する。'],
      ['一般有料', 'ok', 'Plaza Premium Lounge は Gate 60 が24時間・HKD 250〜（最安）、Gate 1 が24時間・HKD 650〜、Gate 35 が06:00〜01:00・HKD 650〜。Plaza Premium First は East Hall（Gate 1）06:30〜01:00／West Hall（Gate 35）06:00〜01:00・HKD 980〜。'],
      ['カード付帯', 'tbd', '香港での対象は未確認。保有カードの特典ページで当日確認する。'],
    ]],
    ['10/18 セントレア出発', '美馬・金築・約3時間', [
      ['エアライン', 'tbd', 'JALサクララウンジ（第1ターミナル・国際線制限エリア）。CX539での利用可否は、搭乗クラス・oneworld/Cathay等のステータス・航空会社の招待条件をチェックイン時に確認する。'],
      ['Priority Pass', 'tbd', 'Plaza Premium Lounge／The Coral Finest Business Class Lounge。当日の対象施設・同伴条件を会員本人のアプリで確認する。'],
      ['一般有料', 'ok', 'プラザ・プレミアム・ラウンジ名古屋。会員資格が無くても買える。料金と営業時間は当日確認。'],
      ['カード付帯', 'tbd', '出国審査前のプレミアムラウンジ セントレア／第2プレミアムラウンジ セントレア／QUALIA LOUNGE。対象になるカードかは保有カードの特典ページで確認する。'],
    ]],
    ['10/18 HKG乗継', '美馬・金築・4時間25分', [
      ['エアライン', 'tbd', 'キャセイのビジネスクラスラウンジ。搭乗クラスまたはoneworld/Cathay等のステータスが対象かを確認する。営業時間は The Deck と The Pier, Business が05:30〜00:30、The Bridge が05:00〜最終キャセイ便。'],
      ['Priority Pass', 'tbd', '香港の対象施設は未確認。会員本人のアプリで当日の対象と同伴条件を確認する。'],
      ['一般有料', 'ok', 'Plaza Premium Lounge は Gate 60 が24時間・HKD 250〜（最安）、Gate 1 が24時間・HKD 650〜、Gate 35 が06:00〜01:00・HKD 650〜。'],
      ['カード付帯', 'tbd', '香港での対象は未確認。保有カードの特典ページで当日確認する。'],
    ]],
    ['10/24 FRA出発', '全員・3時間', [
      ['エアライン', 'tbd', 'キャセイはFRAに自社ラウンジが無く契約ラウンジを使う。どこかは未確定。<strong>Terminal 3</strong>発（キャセイは2026/4移転済み、旧T2は2026/6/9閉鎖）。'],
      ['Priority Pass', 'tbd', 'フランクフルトの対象施設は未確認。'],
      ['一般有料', 'tbd', '対象施設は未確認。'],
      ['カード付帯', 'tbd', '対象施設は未確認。'],
    ]],
    ['10/25 HKG乗継', '全員・2時間15分', [
      ['エアライン', 'ok', '村上はSapphireでキャセイのビジネスクラスラウンジ可（本人＋同伴1名）。<strong>同伴は1名まで＝3名のうち1名が入れない</strong>。07:20着の時点で The Bridge（05:00〜）、The Deck と The Pier, Business（05:30〜）はいずれも営業時間内。'],
      ['Priority Pass', 'tbd', '香港の対象施設は未確認。会員本人のアプリで当日の対象と同伴条件を確認する。'],
      ['一般有料', 'ok', 'Plaza Premium Lounge は Gate 60・Gate 1 が24時間。会員資格が無くても買える。'],
      ['カード付帯', 'tbd', '香港での対象は未確認。保有カードの特典ページで当日確認する。'],
    ]],
  ];
  const loungeCard = Array.from(prepStack ? prepStack.children : []).find(card => card.firstElementChild && card.firstElementChild.textContent.includes('ラウンジ利用可否'));
  if (!loungeCard) throw new Error('Lounge card is missing');
  const loungeTable = loungeCard.querySelector('table');
  if (!loungeTable) throw new Error('Lounge table is missing');
  loungeTable.outerHTML = '<div class="lounge-groups">' + LOUNGE_SEGMENTS.map(segment => {
    const [title, who, systems] = segment;
    return '<article class="lounge-seg"><header><strong>' + esc(title) + '</strong><span>' + esc(who) + '</span></header><dl>' +
      systems.map(([label, state, body]) => '<div class="lounge-row lounge-' + state + '"><dt>' + esc(label) + '<i>' + LOUNGE_STATE[state] + '</i></dt><dd>' + body + '</dd></div>').join('') +
      '</dl></article>';
  }).join('') + '</div>';

  [prep, venue, family].forEach(panel => {
    panel.className = 'tab legacy-tab'; panel.setAttribute('role','tabpanel');
    const inner = panel.querySelector(':scope > div'); if (inner) inner.className = 'legacy-stack';
  });
  family.classList.add('family-tab');

  // ---------- 現地で使うものを準備から旅程へ移す（2026-08-16） ----------
  // 準備は出発前に埋め切ったら畳む前提のタブである。ところが中身の性質が2つに
  // 割れていた。畳んで困らないのは、出発前チェックリスト・航空券状況（未購入か
  // どうかの管理）・予算概算・書類の取得状況の4枚。困るのは次の3つで、いずれも
  // 出発したあとに開くものしかない。
  //   ホテル予約状況 … 住所・駅からの行き方・朝食時間・チェックアウト時刻。
  //                    ホテル名は日カードにあるが、住所はここにしか無い
  //   ラウンジ利用可否 … 4系統の利用資格と、その下の「ラウンジ利用の詳細」
  //                    「香港（HKG）乗継の共通メモ」。乗り継ぎ中に読むもの
  //   便利リンク      … DB Navigator・各社の予約管理・会場の公式サイト
  // 注意書きで守らず、畳んでも何も失われない配置にする。
  //
  // 移した先で見た目を保つために legacy-tab と legacy-stack を同じ箱に付ける。
  // このカード群の様式（bg-white の枠、bg-gray-700 の見出し、text-xs の字送り）は
  // すべて .legacy-tab / .legacy-stack に紐づいていて、クラス名からは読めない。
  // 箱ごと移さずに中身だけ移すと、静かに素のHTMLへ落ちる。
  // #tab-itinerary 側へ legacy-tab を付けるのではない。付けると日カードの
  // text-slate-600 や p-4 まで .legacy-tab の規則に当たって旅程の見た目が変わる。
  const itineraryStack = itinerary.querySelector('.itinerary-stack');
  if (!itineraryStack) throw new Error('itinerary stack not found for the on-site card move');
  const prepCardByTitle = title => Array.from(prepStack ? prepStack.children : [])
    .find(card => card.firstElementChild && card.firstElementChild.textContent.includes(title));
  const onSite = document.createElement('div');
  onSite.className = 'legacy-tab legacy-stack onsite-stack';
  onSite.setAttribute('aria-label', '現地で開く参照情報');
  ['ホテル予約状況', 'ラウンジ利用可否'].forEach(title => {
    const card = prepCardByTitle(title);
    if (!card) throw new Error('on-site card missing from the prep tab: ' + title);
    onSite.appendChild(card);
  });
  // 便利リンクは「重要書類・リンク集」カードの中の1ブロックでしかない。同じカードの
  // 他の3ブロック（Eチケット・ホテル確認書・イベントパスの取得状況）は出発前のもの
  // なので、リンクだけを外へ出し、残ったカードの名前から「・リンク集」を落とす。
  const docsCard = prepCardByTitle('重要書類');
  if (!docsCard) throw new Error('the documents card is missing from the prep tab');
  const linkBlock = Array.from(docsCard.querySelectorAll('.p-4 > div'))
    .find(block => block.firstElementChild && block.firstElementChild.textContent.includes('便利リンク'));
  if (!linkBlock) throw new Error('the useful-links block is missing from the documents card');
  const linkCard = document.createElement('div');
  linkCard.className = 'bg-white rounded-xl border border-slate-200/80';
  const linkHead = docsCard.firstElementChild.cloneNode(true);
  linkHead.innerHTML = linkBlock.firstElementChild.innerHTML;
  const linkBody = document.createElement('div');
  linkBody.className = 'p-4';
  linkBlock.firstElementChild.remove();
  while (linkBlock.firstChild) linkBody.appendChild(linkBlock.firstChild);
  linkBlock.remove();
  linkCard.appendChild(linkHead);
  linkCard.appendChild(linkBody);
  onSite.appendChild(linkCard);
  const docsHead = docsCard.firstElementChild;
  docsHead.innerHTML = docsHead.innerHTML.replace('重要書類・リンク集', '重要書類の取得状況');
  if (docsCard.textContent.includes('便利リンク')) throw new Error('the useful-links block stayed in the prep tab');
  // 元データはカードの前に <!-- ホテル予約状況 --> のような位置の目印を置いている。
  // カードだけ動かすと目印が何も指さないまま準備に残り、次に読む人が「まだ在る」と読む。
  ['ホテル予約状況', 'ラウンジ利用可否'].forEach(title => {
    Array.from(prepStack.childNodes)
      .filter(node => node.nodeType === 8 && node.nodeValue.includes(title))
      .forEach(node => node.remove());
  });
  itineraryStack.appendChild(onSite);
  if (prep.textContent.includes('ラウンジ利用可否') || prep.textContent.includes('ホテル予約状況')) {
    throw new Error('an on-site card is still inside the preparation tab');
  }
  // ---------- 家族向けをHRSの5構成へ組み直す ----------
  // 出張サマリー / 時差・気候 / 日程詳細 / 宿泊先情報 / 緊急連絡先 の順にそろえる。
  // 内側のマークアップはここでは触らない。Tailwind風をどこまで寄せるかは別途判断する。
  // 例外は緊急連絡先で、こちらは中身ごと組み直す（下の familyEmergencyBody）。
  const familyStack = family.querySelector('.legacy-stack');
  const familyBlockByText = text => [...familyStack.children].find(el => el.textContent.includes(text));
  const familySummaryBlock = familyBlockByText('ヨーロッパ出張');
  // サマリーだけ濃さを別に持つ。ページ全体の bg-*-50 は白に近い正規化がかかっていて、
  // 3ブロックの相対輝度が 0.904 / 0.921 / 0.936 と横並びになり、色相があっても
  // 面として分かれて見えなかった。国ごとの区別はここが最初に伝える情報なので、
  // ここだけ濃度を上げる。会場タブや宿泊カードの正規化には触らない。
  familySummaryBlock?.classList.add('family-summary');
  const familyHotelBlock = familyBlockByText('宿泊先情報');
  const familyEmergencyBlock = familyBlockByText('緊急連絡先');
  const familyTimezoneBlock = family.querySelector('.timezone-early');
  const familyScheduleBlock = family.querySelector('.family-schedule');
  const familyFlightsBlock = family.querySelector('.family-flights');
  // フライトブロックは載せない。7区間の出発・到着時刻はすべて日程詳細にあり、
  // 便名も6/7が日程詳細にある。連絡が取れない時間帯も日程詳細の「機内」が持っている。
  // 残るのはキャビンクラスと所要時間だけで、家族には使い道がない。
  // ページの20%（1,644px / 8,354px）を重複が占めていた。
  familyFlightsBlock?.remove();
  // 緊急連絡先は各公館の公式ページで確認した内容へ置き換える（2026-08-15確認）。
  // これまで「緊急時」として載せていた +49 30 21094-222 は大使館のFAX番号だった。
  // 時間外の緊急連絡は外部委託業者への転送番号が別にある。
  // オランダ大使館の番地も 2 ではなく 5 が正しい。
  if (familyEmergencyBlock) {
    const emergency = document.createElement('section');
    emergency.className = 'family-section family-emergency';
    emergency.innerHTML = '<div class="family-section-head">緊急連絡先</div>'
      + '<div class="family-section-body" style="display:grid;gap:8px">'
      + '<div class="small"><strong>村上・美馬・金築 携帯（現地ローミング）</strong><br>渡航前に番号を記入</div>'
      + '<div class="small"><strong>在ドイツ日本国大使館</strong><br>Hiroshimastraße 6, 10785 Berlin｜<a href="tel:+493021094-0">+49 30 21094-0</a>（代表）</div>'
      + '<div class="small"><strong>在ドイツ日本国大使館 時間外の緊急連絡</strong><br>ドイツ国内から <a href="tel:08001822330">0800-1822-330</a>（無料）／国外から <a href="tel:+18187554269">+1 818 7554 269</a><br><span class="muted">閉館時間・休館日は外部委託業者へ転送される</span></div>'
      + '<div class="small"><strong>在フランクフルト日本国総領事館</strong><br>MesseTurm 34, Friedrich-Ebert-Anlage 49, 60327 Frankfurt am Main｜<a href="tel:+4969238573-0">+49 69 238573-0</a></div>'
      + '<div class="small"><strong>在オランダ日本国大使館</strong><br>Tobias Asserlaan 5, 2517KC Den Haag｜<a href="tel:+31703469544">+31 70 346-9544</a>（代表）<br><span class="muted">電話受付 9:00〜17:00。人身事故等の緊急時は時間外も対応</span></div>'
      + '<div class="small"><strong>欧州共通緊急番号</strong>：<a href="tel:112">112</a>（警察・消防・救急）</div>'
      + '<div class="small"><a href="https://www.anzen.mofa.go.jp/" target="_blank" rel="noopener">外務省 海外安全ホームページ</a></div>'
      + '<div class="small muted">出典：在ドイツ日本国大使館・在フランクフルト日本国総領事館・在オランダ日本国大使館の各公式サイト、2026-08-15確認。</div>'
      + '</div>';
    familyEmergencyBlock.replaceWith(emergency);
  }
  // text-white は受けが無いので何もしていない。背景がクラス指定のものは背景側も
  // 効いていないため見た目は成立しているが、背景をインラインstyleで持つ要素だけは
  // 濃い地に黒文字で残る。宿泊カードの日付バッジ3件がそれで、ほぼ読めなかった。
  // インライン背景を持つものだけに色を当てる。クラス指定の13件は触らない。
  family.querySelectorAll('[class*="text-white"]').forEach(el => {
    const style = el.getAttribute('style') || '';
    if (!/background/i.test(style)) return;
    // ティールの開始色 #0d9488 は白文字とのコントラストが3.7:1しかなく、
    // 12pxの文字では足りない。同系の濃い色へ寄せて4.5:1を超えさせる。
    if (style.includes('#0d9488')) el.setAttribute('style', style.replace('#0d9488', '#0B6E66'));
    el.style.color = '#fff';
  });
  // 地図リンクは場所名そのものに張る。ホテル名の下に「地図で確認」のチップを
  // 別置きしていたが、名前は素のdivでリンクにも見出しにもなっていなかった。
  // 名前をリンクにして、チップ行ごと消す。
  if (familyHotelBlock) {
    familyHotelBlock.querySelectorAll('a[href*="maps."]').forEach(link => {
      if (!/地図/.test(link.textContent)) return;
      const card = link.closest('div.border');
      const name = card?.querySelector('.font-bold');
      if (!name) return;
      const place = document.createElement('a');
      place.className = 'place';
      place.href = link.getAttribute('href');
      place.target = '_blank';
      place.rel = 'noopener';
      place.textContent = name.textContent.trim();
      name.textContent = '';
      name.appendChild(place);
      const row = link.parentElement;
      link.remove();
      if (row && !row.querySelector('a')) row.remove();
    });
    // 日付バッジは使わない。日付は本文が持つ。
    // Göttingenは本文が「美馬・金築 10/19〜（4泊）・村上 10/20〜（3泊）」と人別に
    // 分かれているのに、バッジは1本の期間に潰していて、村上が1日遅れることが
    // 消えていた。重複しているうえに本文より情報が少なかった。
    // 残る2枚はバッジが唯一の日付だったので、本文の人数・泊数の行へ移してから消す。
    // これで3枚とも日付の置き場所が本文にそろい、濃い地に白文字のバッジも無くなる。
    // 区切り文字は入力元がEN DASH（–）で、〜への正規化はこの後に走る。
    // 判定は区切りに依存させず、日付が2つ並ぶことだけを見る。
    const DATE = /\\d{1,2}\\/\\d{1,2}/g;
    familyHotelBlock.querySelectorAll('div.border').forEach(card => {
      const badge = card.querySelector('[class*="text-white"]');
      if (!badge) return;
      const badgeText = badge.textContent.trim();
      DATE.lastIndex = 0;
      if ((badgeText.match(DATE) || []).length !== 2) return;
      DATE.lastIndex = 0;
      const hasDateInBody = DATE.test(card.textContent.replace(badgeText, ''));
      DATE.lastIndex = 0;
      if (!hasDateInBody) {
        const line = card.querySelector('[class*="text-slate-600"]');
        if (line) line.textContent = line.textContent.trim() + '（' + badgeText + '）';
      }
      const row = badge.parentElement;
      badge.remove();
      if (row) row.className = row.className.replace(/justify-between/, '').trim();
    });
  }
  // 並び順。出張サマリー / 時差・気候 / 日程詳細 / 宿泊先情報 / 緊急連絡先。
  [familySummaryBlock, familyTimezoneBlock, familyScheduleBlock, familyHotelBlock, family.querySelector('.family-emergency')]
    .forEach(block => { if (block) familyStack.appendChild(block); });
  // 5列の表は393pxで幅が足りず、カード側の overflow:hidden に当たって右端が切れる。
  // 表だけを横スクロールできる箱へ入れ、切らずに読めるようにする。
  document.querySelectorAll('.legacy-tab table').forEach(table => {
    const box = document.createElement('div');
    box.className = 'table-scroll';
    table.replaceWith(box);
    box.appendChild(table);
  });
  itinerary.className = 'tab on'; itinerary.setAttribute('role','tabpanel');

  const header = document.createElement('header');
  header.className = 'hdr';
  // 家族向けはfamily_print.htmlが正本なので、タブではなくヘッダーのリンクから開く。
  // アイコンはlineIconPathsの定義より前で使うため、ここだけ直接書く。
  const printIcon = '<span class="line-icon line-icon-print" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></span>';
  header.innerHTML = '<div class="wrap hdr-top"><div><div class="eyebrow">EUROPE BUSINESS TRIP 2026</div><h1>TechEx Europe・EuroBLECH 出張ガイド</h1><div class="subtitle">10/17（土）〜10/25（日）｜3名｜アムステルダム・ハノーファー・ブレーメン</div></div><div class="no-print header-actions"><a class="btn" href="family_print.html">' + printIcon + '家族</a><a class="btn" href="immigration_print.html" title="入国審査用（英語）">' + printIcon + '入国</a><button class="btn" type="button" onclick="window.print()" aria-label="印刷">印刷</button></div></div>';
  const nav = document.createElement('div');
  nav.className = 'field-nav';
  // 「会場」ではなく「視察」。そのタブに書くのは何を見に来たか・何を見たかであって、
  // 場所ではない。展示会・工場見学・企業訪問を全部覆うので、次のイベントでも使える。
  // 変えるのは表示名だけ。data-tab / id / ストレージの ses: キーは venue のままにする
  // （変えると保存済みのタブ状態と記録が読めなくなる）。2026-08-16、HRSに合わせた。
  //
  // 並びは 旅程 / 視察 / 準備 / 記録。HRSと同じ理屈で、現地で開くもの（旅程・視察）を
  // 先に固め、出発前に埋め切って畳む準備を後ろへ置く。準備が消えても並びが崩れない。
  // 概要を先頭に足して5タブ。概要は「動きが分かる」ためのタブで、EBは村上と
  // 美馬・金築が別々に出て10/20の夜に合流する。この形は日カードを9枚めくらないと
  // 掴めないので、俯瞰の置き場所が要る。
  nav.innerHTML = '<div class="wrap"><nav class="tabs" id="tabs" role="tablist" aria-label="主要セクション"><button data-tab="overview" role="tab" aria-selected="false"><span class="ic">🧭</span>概要</button><button data-tab="itinerary" class="on" role="tab" aria-selected="true"><span class="ic">📅</span>旅程</button><button data-tab="venue" role="tab" aria-selected="false"><span class="ic">🏢</span>視察</button><button data-tab="prep" role="tab" aria-selected="false"><span class="ic">✅</span>準備</button><button data-tab="rec" role="tab" aria-selected="false"><span class="ic">📝</span>記録</button></nav><div class="subbar" id="subbar"><div class="chips" id="day-chips"><span class="lbl">日付</span></div></div></div>';
  document.body.prepend(nav); document.body.prepend(header);
  const main = document.createElement('main'); main.className = 'wrap';
  // 概要のマークアップはNode側で組んである（FAMILY_DAYSとSTAYSから導出するため）。
  const overviewHost = document.createElement('div');
  overviewHost.innerHTML = OVERVIEW_SECTION;
  const overview = overviewHost.firstElementChild;
  if (!overview || overview.id !== 'tab-overview') throw new Error('Overview section did not parse');
  // パネルの並びもタブに合わせる。印刷はタブを全部開いて縦に並べるので、
  // ここが逆だと紙の上で準備が視察より前に出る。
  // 既定タブは旅程のまま。現地で開くのは旅程なので、起動でいきなり概要を出すと
  // 毎回1タップ余分になる。概要が効くのは出発前と机上。
  [overview, itinerary, venue, prep, record, family].forEach(panel => main.appendChild(panel));
  nav.after(main);
  document.body.insertAdjacentHTML('beforeend','<footer class="field-footer">TechEx Europe・EuroBLECH 2026 ・ field guide</footer><!--V3_SCRIPT-->');
  const legacyIconMap = { 'fa-train':'🚆', 'fa-industry':'🏭', 'fa-landmark':'🏛', 'fa-laptop':'💻', 'fa-building':'🏢', 'fa-hotel':'🏨' };
  document.querySelectorAll('i.fas').forEach(icon => {
    if (icon.classList.contains('fa-plane')) {
      const mark = document.createElement('span');
      mark.className = 'flight-mark inline-flight-mark';
      mark.setAttribute('role','img');
      mark.setAttribute('aria-label','フライト');
      icon.replaceWith(mark);
      return;
    }
    const replacement = Object.entries(legacyIconMap).find(([name]) => icon.classList.contains(name))?.[1] || '•';
    icon.replaceWith(document.createTextNode(replacement));
  });
  const planeNodes = [];
  const planeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (planeWalker.nextNode()) {
    const node = planeWalker.currentNode;
    if (!node.parentElement?.closest('script,style') && /✈[\uFE0E\uFE0F]?|🛫|🛬/.test(node.nodeValue)) planeNodes.push(node);
  }
  planeNodes.forEach(node => {
    const parent = node.parentElement;
    if (parent.matches('.flight-route > span')) {
      parent.className = 'flight-mark';
      parent.setAttribute('role','img');
      parent.setAttribute('aria-label','フライト');
      parent.textContent = '';
      return;
    }
    const parts = node.nodeValue.split(/(✈[\uFE0E\uFE0F]?|🛫|🛬)/g);
    const fragment = document.createDocumentFragment();
    parts.forEach(part => {
      if (/^(?:✈[\uFE0E\uFE0F]?|🛫|🛬)$/.test(part)) {
        const icon = document.createElement('span');
        icon.className = 'flight-mark inline-flight-mark';
        icon.setAttribute('role','img');
        icon.setAttribute('aria-label','フライト');
        fragment.appendChild(icon);
      } else if (part) fragment.appendChild(document.createTextNode(part));
    });
    node.replaceWith(fragment);
  });
  // 常時表示の補足行はラベルであって文章ではない。末尾の句点を落として統一する。
  // 折り畳みの中は複数文になるので触らない。
  document.querySelectorAll('#tab-itinerary .text-slate-600.text-xs').forEach(el => {
    if (el.closest('.fold-body')) return;
    el.innerHTML = el.innerHTML.replace(/。(\\s*)$/, '$1');
  });
  const lineIconPaths = {
    lounge: '<path d="M4 11V9.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V11M3 11h18v6H3zM6 17v2m12-2v2"/>',
    procedure: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="10" cy="9" r="2"/><path d="M8 14h4m3-6h2m-2 4h2m-2 4h2"/>',
    hotel: '<path d="M4 21V6h16v15M8 10h2m4 0h2m-8 4h2m4 0h2M9 21v-3h6v3"/>',
    meal: '<path d="M6 3v8m-2-8v5a2 2 0 0 0 4 0V3m-2 8v10M16 3v18m0-18c3 2 4 5 4 8h-4"/>',
    rest: '<path d="M19 15.5A8 8 0 0 1 8.5 5 8 8 0 1 0 19 15.5Z"/>',
    drinks: '<path d="M5 4h6l-1 7a2 2 0 0 1-4 0L5 4Zm3 9v6m-3 1h6m4-16h5l-1 7a2 2 0 0 1-4 0l0-7Zm2 9v6m-3 1h6"/>',
    factory: '<path d="M3 21V10l6-4v4l6-4v4l6-3v14H3Zm4-6h2m4 0h2m3 0h1"/>',
    walk: '<circle cx="12" cy="4" r="2"/><path d="m10 8 3 3 3 1m-6-4-2 5-3 2m8-4-1 4 4 5m-4-5-5 6"/>',
    home: '<path d="m3 11 9-8 9 8M5 10v11h14V10m-9 11v-6h4v6"/>',
    event: '<path d="M4 20h16M6 20V9h12v11M5 9l7-5 7 5M9 12v5m6-5v5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    car: '<path d="M5 17h14M4 17v-4l2-5h12l2 5v4M4 17v2h2v-2m12 0v2h2v-2M6 13h12"/><circle cx="8" cy="15" r=".8"/><circle cx="16" cy="15" r=".8"/>',
  };
  // 生成物に絵文字を1文字も残さない。既定表示が文字の絵文字（🍽 🏛 ℹ など）は
  // Windowsで黒い輪郭グリフになり、カラー絵文字はモノクロSVGと並ぶと不揃いに見える。
  Object.assign(lineIconPaths, {
    pin: '<circle cx="12" cy="9" r="6"/><circle cx="12" cy="9" r="2"/><path d="M8 13 12 21 16 13z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 6-6"/>',
    people: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20v-1l2-6h6l1 3"/><path d="M12 20v-1l2-6h6l1 6v1"/>',
    warning: '<path d="M12 3 21 20H3z"/><path d="M12 9v5"/><circle cx="12" cy="17" r="1"/>',
    star: '<path d="M12 3 15 9 21 10 16 14 18 21 12 17 6 21 8 14 3 10 9 9z"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M6 21v-2l2-7h8l2 7v2"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9h16M8 3v4m8-4v4"/><path d="M8 13h2m4 0h2m-8 4h2m4 0h2"/>',
    memo: '<rect x="4" y="3" width="13" height="18" rx="1"/><path d="M7 8h7M7 12h7"/><path d="M15 16l4-4 2 2-4 4h-2z"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 19h2"/>',
    map: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z"/><path d="M9 4v13m6-10.5V20"/>',
    train: '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M8 16l-2 4m10-4 2 4"/>',
    book: '<rect x="3" y="5" width="8" height="15" rx="1"/><rect x="13" y="5" width="8" height="15" rx="1"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="1"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 10h8M8 14h8M8 18h5"/>',
    cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M2 4h3l2.5 11h11L21 7H6"/>',
    pen: '<path d="M3 21l1-4L15 6l3 3L7 20z"/><path d="M14 7l3 3"/>',
    ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M14 7v2m0 3v2m0 3v0"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>',
    building: '<rect x="5" y="3" width="14" height="18"/><path d="M9 7h2m4 0h-2M9 11h2m4 0h-2M9 15h2m4 0h-2"/><path d="M10 21v-3h4v3"/>',
    money: '<path d="M9 3h6l-1.5 3h-3z"/><path d="M13.5 6c3 1 5.5 4 5.5 8a7 7 0 0 1-14 0c0-4 2.5-7 5.5-8"/><path d="M12 10v6m-2-4.5h3a1.25 1.25 0 0 1 0 2.5h-2a1.25 1.25 0 0 0 0 2.5h3"/>',
    folder: '<path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
    document: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 21 21"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M6 14h4"/>',
    baggage: '<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V4h6v3"/><path d="M5 12h14"/><path d="M9 20v1M15 20v1"/>',
    plug: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
    // 概要タブで使う3種。HRSが2026-08-16に描いたものをそのまま使う。
    // 同じ絵を2度描かない（形が微妙に違うと、同じ意味なのに別物に見える）。
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9 13 13 9 15 11 11z"/>',
    suitcase: '<rect x="4" y="8" width="16" height="12" rx="2"/><rect x="9" y="4" width="6" height="4" rx="1"/><path d="M4 14h16"/>',
    bulb: '<circle cx="12" cy="9" r="6"/><path d="M9 18h6M10 21h4"/><path d="M10 11l1-2 2 2 1-2"/>',
  });
  const lineIconMap = {
    '🛋':'lounge', '🛂':'procedure', '🏨':'hotel', '🍽':'meal', '😴':'rest', '🥂':'drinks',
    '🏭':'factory', '🚶':'walk', '🏠':'home', '🏛':'event', '🕐':'clock', '🕗':'clock', '🚗':'car',
    '📍':'pin', '🎯':'target', '✅':'checkCircle', '👥':'people', '⚠':'warning', '⭐':'star',
    '👤':'person', '📅':'calendar', '📝':'memo', '📱':'phone', '🗺':'map', '🚆':'train', '🚄':'train',
    '🛒':'cart', '✍':'pen', '🎫':'ticket', '🌐':'globe', '🌍':'globe', '🏢':'building',
    '💰':'money', '📁':'folder', '📄':'document', '💻':'laptop', '🔍':'search', '💳':'card',
    '🛄':'baggage', '🔌':'plug', '📋':'clipboard', '📘':'book',
    '🧭':'compass', '🧳':'suitcase', '💡':'bulb', '📖':'book',
  };
  const makeLineIcon = name => {
    const icon = document.createElement('span');
    icon.className = 'line-icon line-icon-' + name;
    icon.setAttribute('aria-hidden','true');
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + lineIconPaths[name] + '</svg>';
    return icon;
  };
  // 国旗は描かずに落とす。合成されず「DE」「JP」と2文字で出るため。
  // 直後の空白も一緒に食べる。国名・都市名は前後の文が持っている。
  const FLAG_RE = /[\\u{1F1E6}-\\u{1F1FF}]{2}[ \\u3000]?/gu;
  const PICTO_RE = /(\\p{Extended_Pictographic})\\uFE0F?[ \\u3000]?/gu;
  const unmapped = new Set();
  const emojiNodes = [];
  const emojiWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (emojiWalker.nextNode()) {
    const node = emojiWalker.currentNode;
    if (node.parentElement?.closest('script,style')) continue;
    if (FLAG_RE.test(node.nodeValue) || PICTO_RE.test(node.nodeValue)) emojiNodes.push(node);
    FLAG_RE.lastIndex = 0; PICTO_RE.lastIndex = 0;
  }
  emojiNodes.forEach(node => {
    const text = node.nodeValue.replace(FLAG_RE, '');
    const fragment = document.createDocumentFragment();
    let last = 0;
    for (const match of text.matchAll(PICTO_RE)) {
      const name = lineIconMap[match[1]];
      if (!name) { unmapped.add(match[1]); continue; }
      if (match.index > last) fragment.appendChild(document.createTextNode(text.slice(last, match.index)));
      fragment.appendChild(makeLineIcon(name));
      last = match.index + match[0].length;
    }
    const tail = text.slice(last);
    if (tail) fragment.appendChild(document.createTextNode(tail));
    node.replaceWith(fragment);
  });
  // 対応表に無い絵文字を黙って通さない。Node側が読んでビルドを止める。
  if (unmapped.size) document.documentElement.dataset.unmappedEmoji = [...unmapped].join(' ');
  const wordingWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (wordingWalker.nextNode()) {
    const node = wordingWalker.currentNode;
    if (node.parentElement?.closest('script,style')) continue;
    node.nodeValue = node.nodeValue
      .replaceAll('·', '・')
      .replace(/(村上|美馬・金築):/g, '$1：')
      .replace(/(\\d{1,2}\\/\\d{1,2}) \\(([月火水木金土日])\\)/g, '$1（$2）')
      .replace(/(\\d{1,2}\\/\\d{1,2})–(\\d{1,2}\\/\\d{1,2})/g, '$1〜$2')
      .replace(/(\\d{1,2}\\/\\d{1,2})–(\\d{1,2})(?!:)/g, '$1〜$2')
      .replace(/^7:45〜$/, '07:45〜')
      .replace(/^9:00(頃)?–/, '09:00$1–')
      .replace(/^9:45–/, '09:45–')
      .replace(/^乗り換え$/, '乗り継ぎ');
  }
  document.querySelectorAll('#tab-itinerary .row-time').forEach(time => {
    time.textContent = time.textContent.replaceAll('–', '〜');
  });
  document.querySelectorAll('#tab-itinerary .day-topics summary').forEach(summary => {
    summary.textContent = summary.textContent.replaceAll(' / ', '／').replace(/・\\s+/g, '・');
  });
  // ---------- 効いていないクラスを落とす ----------
  // Tailwind CDNは読み込んでいないので、Tailwind風のクラス名は本来どれも効かない。
  // 実際にはstyle.css側が一部を手書きで受けていて、効くものと効かないものが混在していた。
  // クラス名を見ても、それが効くかどうか読めない。2026-08-15に2件の不具合を踏んだ。
  //   日付バッジ … 背景はインラインstyleで効き、text-white は効かず黒文字で残った
  //   印刷版の背景 … bg-blue-50 が祖先の .legacy-tab に依存していると読めなかった
  // 読み込み済みのCSSを実際に走査し、どのルールも受けていないものだけを消す。
  // あとからCSSを足せば次のビルドで自動的に残るので、消し過ぎが固定化しない。
  // 対象はTailwind風の名前だけ。page.jsが使うクラス（on/off/today/chip/tab/day/t/d）は
  // 走査でTailwind風と判定されないため、そもそも対象外。
  // CSSはNode側で読んで渡す。ビルドは一時ディレクトリでページを開くため、
  // 相対パスのlinkは解決されず document.styleSheets は空になる。
  // ブラウザ内でCSSOMを見ると「どのルールも受けていない」が常に真になり、
  // 効いている40種まで巻き添えで消える（2026-08-15に実際に踏んだ）。
  const cssClasses = new Set(${JSON.stringify(cssKnownClasses)});
  const cssSubstrings = ${JSON.stringify(cssKnownSubstrings)};
  const TAILWINDISH = /^(text|bg|border|px|py|pl|pr|pt|pb|mt|mb|ml|mr|rounded|font|flex|gap|space|hover|shadow|items|justify|w|h|max|min|leading|opacity|inline|grid|truncate|underline|overflow|whitespace|shrink|self)(-|$|:)/;
  let droppedClasses = 0;
  document.querySelectorAll('[class]').forEach(el => {
    const before = [...el.classList];
    const kept = before.filter(name => {
      if (!TAILWINDISH.test(name)) return true;
      if (cssClasses.has(name)) return true;
      if (cssSubstrings.some(part => name.includes(part))) return true;
      droppedClasses++;
      return false;
    });
    if (kept.length === before.length) return;
    if (kept.length) el.className = kept.join(' ');
    else el.removeAttribute('class');
  });
  document.documentElement.dataset.droppedClasses = String(droppedClasses);
  document.querySelectorAll('script').forEach(script => { if (script.id !== 'v3-build-transform') script.remove(); });
  document.getElementById('v3-build-transform')?.remove();
})();
</script>`;

source = source.replace('</body>', `${transformScript}\n</body>`);

const tempRoot = mkdtempSync(join(tmpdir(), 'event-pages-v3-'));
const inputPath = join(tempRoot, 'build-input.html');
const profilePath = join(tempRoot, 'edge-profile');
writeFileSync(inputPath, source, 'utf8');

try {
  let output;
  try {
    output = execFileSync(browserPath, [
      '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${profilePath}`, '--virtual-time-budget=1500', '--dump-dom',
      pathToFileURL(inputPath).href,
    ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, windowsHide: true });
  } catch (headlessError) {
    const require = createRequire(import.meta.url);
    let chromium;
    try { ({ chromium } = require('playwright')); }
    catch { throw headlessError; }
    const browser = await chromium.launch({ headless: true, executablePath: browserPath });
    try {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(pathToFileURL(inputPath).href);
      await page.waitForTimeout(1500);
      output = await page.content();
      if (pageErrors.length) throw new Error('Build page error: ' + pageErrors.join(' | '));
    } finally {
      await browser.close();
    }
  }
  if (!output.includes('class="route-four"') || !output.includes('class="day"')) {
    throw new Error('Static HRS transformation did not complete');
  }
  // 変換スクリプトは最後に自分を消す。残っているのは途中で例外が出た証拠で、
  // 変換の後半が丸ごと抜けたまま生成物になる。--dump-domは黙って通すので、ここで止める。
  if (output.includes('v3-build-transform')) {
    throw new Error('Transform script did not remove itself; it threw partway through');
  }
  // 落としたクラス数を受け取って報告し、属性そのものは生成物へ残さない。
  const droppedAttr = output.match(/ data-dropped-classes="(\d+)"/);
  if (droppedAttr) {
    console.log(`Dropped ${droppedAttr[1]} class tokens that no CSS rule receives`);
    output = output.replace(droppedAttr[0], '');
  }
  // 対応表に無い絵文字が出たら止める。後から絵文字を足したらここで気づく。
  const unmappedAttr = output.match(/data-unmapped-emoji="([^"]+)"/);
  if (unmappedAttr) {
    const list = unmappedAttr[1].split(' ').map(c => `${c} U+${c.codePointAt(0).toString(16).toUpperCase()}`).join(', ');
    throw new Error('Unmapped emoji (add to lineIconMap and lineIconPaths): ' + list);
  }
  // ---------- 家族向け印刷版を切り出す ----------
  // 家族向けはオンライン版のタブではなくfamily_print.htmlが正本。ダンプ済みの
  // DOMから家族セクションを取り出し、静的な骨組みへ入れ直す。
  // メモ欄・クラウド同期・実行スクリプトは持ち込まない。窓口はwindow.print()だけ。
  const familyRange = divRangeById(output, 'tab-family');
  const familySection = output.slice(familyRange[0], familyRange[1]);
  // 元資料のコメントは並び順を書いたものが多く、5構成へ組み直した今は中身と食い違う。
  // 生成物に古い順序の説明を残さない。
  const familyInner = familySection
    .replace(/^<div\b[^>]*>/, '')
    .replace(/<\/div>\s*$/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n');
  if (/<script|onclick="(?!window\.print)|<textarea|data-trip-key/i.test(familyInner)) {
    throw new Error('Family print page would carry runtime markup');
  }
  let familyPrint = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>TechEx Europe・EuroBLECH 2026 家族向け予定表</title>
<link rel="stylesheet" href="../202609_HumanoidSummitEurope/style.css">
<link rel="stylesheet" href="style.css">
</head>
<body class="family-page" data-trip-layout="family-v1"><header class="family-head"><div class="wrap"><div class="eyebrow">EUROPE BUSINESS TRIP 2026</div><h1>家族向け予定表</h1><div class="subtitle">TechEx Europe・EuroBLECH 2026｜10/17（土）〜10/25（日）｜村上・美馬・金築</div><div class="no-print"><button class="btn" type="button" onclick="window.print()">印刷</button></div></div></header><main class="wrap"><div class="legacy-tab family-tab">${familyInner}</div></main></body></html>
`;
  familyPrint = familyPrint.split(/\r?\n/).map(line => line.trimEnd()).join('\n').replace(/\n*$/, '\n');
  writeFileSync(familyOutputPath, familyPrint, 'utf8');
  console.log(`Generated ${familyOutputPath}`);

  // ---------- 入国審査官に見せる1枚 ----------
  // 審査官はオランダ語・ドイツ語か英語しか読まないので、このページだけ英語で書く。
  // 氏名とパスポート番号は入力欄にして、どこにも保存しない。localStorageにも
  // Cloudflare同期にも乗せない。閉じれば消える。共用端末で開いても残らないため。
  // HRSと違い、シェンゲンへの入国地点が人によって割れる。村上はアムステルダム、
  // 美馬・金築はフランクフルト。どちらの審査官が見ても自分の分が読めるよう両方載せる。
  const immiRows = [
    ['Purpose of stay', 'Attending two industry trade fairs in the Netherlands and Germany: <strong>TechEx Europe 2026</strong> and <strong>EuroBLECH 2026</strong>, plus arranged company visits. Business trip, 3 travellers from Japan. No paid work in the Schengen area.'],
    ['Events', '<strong>TechEx Europe 2026</strong> — RAI Amsterdam, Netherlands, 19–20 Oct 2026<br><strong>EuroBLECH 2026</strong> — Hannover Messe (Laatzen), Germany, 20–23 Oct 2026<br><strong>Mercedes-Benz Werk Bremen</strong> — guided factory visit, 22 Oct 2026, 12:45–14:00 (booked)<br><strong>Autostadt Wolfsburg</strong> — 19 Oct 2026'],
    ['Entry into Schengen', '<strong>MURAKAMI</strong>: arrive <strong>18 Oct 2026, 06:55</strong> at Amsterdam (AMS), Cathay Pacific CX539 / CX271 via Hong Kong<br><strong>MIMA and KANECHIKU</strong>: arrive <strong>19 Oct 2026, 07:15</strong> at Frankfurt (FRA), Cathay Pacific CX539 / CX289 via Hong Kong'],
    ['Exit from Schengen', 'All three depart <strong>24 Oct 2026, 13:40</strong> from Frankfurt (FRA), Cathay Pacific CX288 / CX536 via Hong Kong<br>Arrive Nagoya (NGO) 25 Oct 2026, 14:10 — <strong>return ticket held</strong>'],
    ['Length of stay', 'MURAKAMI: <strong>6 nights</strong> (18–24 Oct 2026). MIMA and KANECHIKU: <strong>5 nights</strong> (19–24 Oct 2026).<br>Well within the 90-day visa-free limit for Japanese nationals.'],
    ['Accommodation', '18–20 Oct (MURAKAMI): <strong>Holiday Inn Express Amsterdam — Sloterdijk Station</strong><br>Zaventemweg 3, 1043 EH Amsterdam, Netherlands<br><br>19–23 Oct: <strong>Hotel FREIgeist Göttingen Innenstadt</strong><br>Berliner Strasse 30, 37073 Göttingen, Germany<br><br>23–24 Oct (all three): <strong>Toyoko Inn Frankfurt am Main Hauptbahnhof</strong><br>Stuttgarter Straße 35, 60329 Frankfurt am Main, Germany'],
    ['In case of enquiry', 'Embassy of Japan in the Netherlands<br>Tobias Asserlaan 5, 2517KC Den Haag — Tel +31 70 346-9544<br><br>Consulate-General of Japan in Frankfurt<br>MesseTurm 34, Friedrich-Ebert-Anlage 49, 60327 Frankfurt am Main — Tel +49 69 238573-0'],
  ].map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('\n      ');
  const immigrationPrint = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>TechEx Europe / EuroBLECH 2026 — Traveller Information</title>
<link rel="stylesheet" href="../202609_HumanoidSummitEurope/style.css">
<link rel="stylesheet" href="style.css">
</head>
<body class="immi-page" data-trip-layout="immigration-v1"><main class="wrap">
  <header class="immi-head">
    <div class="eyebrow">FOR BORDER CONTROL · NETHERLANDS / GERMANY</div>
    <h1>Traveller Information</h1>
    <p class="immi-sub">TechEx Europe 2026 · EuroBLECH 2026 · 18–24 October 2026</p>
    <div class="no-print"><button class="btn" type="button" onclick="window.print()">Print this page</button></div>
  </header>
  <section class="immi-id">
    <label><span>Full name (as in passport)</span><input type="text" autocomplete="off" spellcheck="false"></label>
    <label><span>Passport number</span><input type="text" autocomplete="off" spellcheck="false"></label>
    <p class="immi-note no-print">Type these just before printing. Nothing on this page is saved — close the page and the fields are empty again.</p>
  </section>
  <table class="immi-table">
    <tbody>
      ${immiRows}
    </tbody>
  </table>
  <p class="immi-foot">Prepared by the traveller. Details match the itinerary and the bookings held.</p>
</main></body></html>
`;
  writeFileSync(immigrationOutputPath, immigrationPrint.split(/\r?\n/).map(line => line.trimEnd()).join('\n').replace(/\n*$/, '\n'), 'utf8');
  console.log(`Generated ${immigrationOutputPath}`);

  // オンライン版から家族セクションを落とす。正本はfamily_print.htmlで、
  // タブからも外したので、残しても画面から開く方法が無い。
  output = output.slice(0, familyRange[0]) + output.slice(familyRange[1]);
  if (/id="tab-family"/.test(output)) throw new Error('Family section still present after removal');
  if (!output.includes('href="family_print.html"')) throw new Error('Family print link missing from index.html');
  output = output.replace('<!--V3_SCRIPT-->', '<script src="page.js"></script>');
  output = output.split(/\r?\n/).map(line => line.trimEnd()).join('\n').replace(/\n*$/, '\n');
  writeFileSync(outputPath, output, 'utf8');
  console.log(`Generated ${outputPath}`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
