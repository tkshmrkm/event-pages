import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, 'index.html');
const familySourcePath = join(here, 'index_v2.html');
const outputPath = join(here, 'index_v3.html');
const browserPath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!browserPath) throw new Error('Chrome or Edge is required to build index_v3.html');

const DAY_META = {
  '1017': { date: '2026-10-17', kind: 'move', badge: '移動', zone: '各地点の現地時刻。香港は日本より1時間遅い', focus: '村上が1日先行。香港で夕食・シャワー後、アムステルダム行き深夜便へ' },
  '1018': { date: '2026-10-18', kind: 'move', badge: '別行動', zone: '村上は欧州現地時間（日本より7時間遅い）。美馬・金築は日本・香港の各現地時刻', focus: '村上はアムステルダム到着後に時差調整。美馬・金築は日本を出発' },
  '1019': { date: '2026-10-19', kind: 'conf', badge: 'TechEx', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: '村上はTechEx Europe Day 1。美馬・金築はEuroBLECH開幕前の自由日を利用してヴォルフスブルクへ日帰り。ゲッティンゲンが経路上にあるため、先にホテルへ荷物を預けて身軽に移動する' },
  '1020': { date: '2026-10-20', kind: 'conf', badge: '別行動', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: '村上はTechEx Day 2後、20:30頃にゲッティンゲンのホテルへ到着。美馬・金築はEuroBLECH Day 1を視察後、18:00頃に戻る目安' },
  '1021': { date: '2026-10-21', kind: 'conf', badge: 'EuroBLECH', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: '3名で09:00〜17:00にEuroBLECHを展示会視察。18:00頃にゲッティンゲンへ戻り、19:00頃に夕食' },
  '1022': { date: '2026-10-22', kind: 'visit', badge: '工場見学', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: 'Mercedes-Benz Werk Bremenを見学。復路は「早めに戻って資料整理」と「18:00頃まで市内滞在」の2案から決める' },
  '1023': { date: '2026-10-23', kind: 'conf', badge: 'EuroBLECH', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: 'EuroBLECH最終日。17:30頃にフランクフルトのホテルへチェックインし、18:30頃に夕食' },
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
  ['TechEx Day 2 → ゲッティンゲン移動（村上）/ EuroBLECH Day 1（美馬・金築）', 'TechEx Day 2・ゲッティンゲン移動（村上）／EuroBLECH Day 1（美馬・金築）'],
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
  ['<td>10/18 セントレア出発</td><td>美馬・金築</td><td>カードラウンジ（出国審査前）/ プラザ・プレミアム・ラウンジ名古屋（有料）</td>', '<td>10/18 セントレア出発</td><td>美馬・金築</td><td>航空会社：JALサクララウンジ<br>Priority Pass：Plaza Premium Lounge / The Coral Finest Business Class Lounge</td>'],
  ['<td>❌ サクララウンジは対象外。ゴールドカード以上があれば出国審査前のカードラウンジを無料で使える</td>', '<td>利用条件：搭乗クラス・航空会社ステータス・招待条件／Priority Passの当日対象施設・同伴条件</td>'],
  ['<td>10/18 HKG乗継 4時間25分</td><td>美馬・金築</td><td>—</td>', '<td>10/18 HKG乗継 4時間25分</td><td>美馬・金築</td><td>航空会社：Cathay Pacific Business Lounge<br>Priority Pass：Plaza Premium Lounge</td>'],
  ['<td>❌ 利用不可。ターミナル内で夕食をとって過ごす</td>', '<td>利用条件：搭乗クラス・航空会社ステータス／Priority Passの当日対象施設・同伴条件</td>'],
  ['美馬・金築は<strong>ゴールドカード以上ならセントレアの出国審査前カードラウンジが無料</strong>。', '美馬・金築は、航空会社ラウンジとPriority Passラウンジの利用条件を確認。'],
  ['<strong>有料ラウンジ</strong>: Plaza Premium は <strong>Gate 60 が24時間・HKD 250〜（最安）</strong>、Gate 1 が24時間・HKD 650〜。Plaza Premium First は West Hall 06:00〜／East Hall 06:30〜。', '<strong>一般有料ラウンジ</strong>: Plaza Premium Lounge は Gate 60 が24時間・HKD 250〜（最安）、Gate 1 が24時間・HKD 650〜、Gate 35 が06:00〜01:00・HKD 650〜。Plaza Premium First は East Hall（Gate 1）06:30〜01:00／West Hall（Gate 35）06:00〜01:00・HKD 980〜。Priority Passの対象施設かは未確認のため、会員本人のアプリで当日確認する。'],
  // 香港のラウンジ。営業時間はキャセイ公式のラウンジ個別ページで確認済み（2026-08-14時点）。
  // The Deck: L7・Gate 6付近・05:30-00:30 / The Pier, Business: L6・Gate 65付近・05:30-00:30・シャワー14室
  // The Bridge: L6・Gate 35付近・05:00〜最終キャセイ便（00:30-03:20の範囲）
  // oneworld Sapphireはビジネスクラスラウンジのみ本人＋同伴1名、キャセイ運航ラウンジに限る。ファーストは対象外。
  // The Wingは現行のHKGラウンジ一覧にFirstのみ在り、Business側の掲載が無い。
  // 乗り継ぎは「過ごし方」を主表示にする。ラウンジは選択肢の一つに落とし、
  // ラウンジ自体もエアライン／Priority Pass／一般有料／カード付帯の4系統に分けて並べる。
  // 10/17 村上の香港乗継 3時間45分。
  ['          <div class="font-semibold">🛋 ビジネスクラスラウンジで夕食＋シャワー</div>\n          <div class="text-slate-600 text-xs">Sapphireでビジネスクラスラウンジ可（The Pier ビジネス側はシャワー14室）。⚠️ <strong>営業時間が未確認</strong>のため、到着後にトランスファーデスクで開いているラウンジを聞く。</div>\n          <details class="fold mt-1">\n            <summary>閉まっていた場合の代替・無料シャワーの場所</summary>\n            <div class="fold-body">\n              <div>⭐ <strong>無料シャワー（L5・24時間）</strong>: Gate 12付近 / Gate 43付近。シャンプー等あり、タオルは近くの自販機で購入。<strong>ラウンジの可否と無関係に使える</strong>ので、総移動21時間45分の後半が楽になる。</div>\n              <div><strong>有料ラウンジ</strong>: Plaza Premium が Gate 60（24時間・HKD 250〜／最安）、Gate 1（24時間・HKD 650〜）。</div>\n              <div><strong>飲食</strong>: Gate 10〜11付近 Level 6 の Men Wah Bing Teng（香港式の茶餐廳）・McDonald\'s が<strong>24時間</strong>。Level 7 フードコート（Tasty Congee のお粥・雲呑麺など）は22〜23時台に閉まる可能性があるので、行くなら早めに。</div>\n              <div>ファースト側の「ザ・カバナ」「ザ・ヘイヴン」は Sapphire では対象外。</div>\n            </div>\n          </details>\n',
    '          <div class="font-semibold">🕐 香港で乗り継ぎ 3時間45分 — 過ごし方</div>\n          <div class="text-slate-600 text-xs">総移動21時間45分の後半。<strong>ラウンジは選択肢の一つ</strong>で、使えなくても無料シャワーと24時間営業の飲食で回せる。</div>\n          <details class="fold mt-1">\n            <summary>ラウンジで過ごす（4系統）</summary>\n            <div class="fold-body">\n              <div><strong>エアライン</strong>: oneworld Sapphireでキャセイのビジネスクラスラウンジに<strong>本人＋同伴1名</strong>（キャセイ運航ラウンジのみ）。The Deck（Gate 6付近・L7）と The Pier, Business（Gate 65付近・L6）が05:30〜00:30、The Bridge（Gate 35付近・L6）が05:00〜最終キャセイ便。20:00〜22:30はいずれも営業時間内。The Pier, Business はシャワー14室。</div>\n              <div><strong>Priority Pass</strong>: 香港の対象施設は未確認。会員本人のアプリで当日の対象と同伴条件を確認する。</div>\n              <div><strong>一般有料</strong>（会員資格が無くても買える）: Plaza Premium Lounge は Gate 60 が24時間・HKD 250〜（最安）、Gate 1 が24時間・HKD 650〜、Gate 35 が06:00〜01:00・HKD 650〜。</div>\n              <div><strong>カード付帯</strong>: 香港での対象は未確認。保有カードの特典ページで当日確認する。</div>\n              <div>ファーストクラスラウンジ（The Wing, First / The Pier, First）と、その中の「ザ・カバナ」「ザ・ヘイヴン」は Sapphire では対象外。</div>\n            </div>\n          </details>\n          <details class="fold mt-1">\n            <summary>ラウンジを使わずに過ごす</summary>\n            <div class="fold-body">\n              <div>⭐ <strong>無料シャワー（L5・24時間）</strong>: Gate 12付近 / Gate 43付近。シャンプー等あり、タオルは近くの自販機で購入。<strong>ラウンジの可否と無関係に使える</strong>ので、総移動21時間45分の後半が楽になる。</div>\n              <div><strong>飲食</strong>: Gate 10〜11付近 Level 6 の Men Wah Bing Teng（香港式の茶餐廳）・McDonald\'s が<strong>24時間</strong>。Level 7 フードコート（Tasty Congee のお粥・雲呑麺など）は22〜23時台に閉まる可能性があるので、行くなら早めに。</div>\n            </div>\n          </details>\n'],
  ['<td>10/17 HKG乗継 3時間45分</td><td>村上</td><td>キャセイ ビジネスクラスラウンジ（The Wing / The Pier / The Deck / The Bridge）</td>', '<td>10/17 HKG乗継 3時間45分</td><td>村上</td><td>キャセイ ビジネスクラスラウンジ（The Deck / The Pier, Business / The Bridge）</td>'],
  ['<td>✅ 利用可（Sapphire）。ファーストクラスラウンジは対象外</td>', '<td>✅ 利用可（Sapphire・本人＋同伴1名）。The Deck と The Pier, Business は05:30〜00:30、The Bridge は05:00〜最終キャセイ便。ファーストクラスラウンジは対象外</td>'],
  ['<div>⚠️ <strong>キャセイ自社ラウンジ（The Wing / The Pier / The Deck / The Bridge）の営業時間は未確認</strong>（公式サイトにアクセスできず特定できなかった）。<strong>夜23時台・早朝7時台は閉まっている可能性がある</strong>ため、出発前にキャセイに確認するか、到着後にトランスファーデスクで開いているラウンジを聞く。</div>', '<div>⭐ <strong>キャセイのビジネスクラスラウンジ営業時間</strong>: The Deck（L7・Gate 6付近）と The Pier, Business（L6・Gate 65付近）が<strong>05:30〜00:30</strong>、The Bridge（L6・Gate 35付近）が<strong>05:00〜最終キャセイ便（00:30〜03:20の範囲）</strong>。<strong>夜23時台も早朝7時台も営業時間内</strong>。The Wing は現行のラウンジ一覧では First のみで、Business側の掲載が無い。</div>'],
  // 10/25 全員の香港乗継 2時間15分。ここもラウンジを選択肢の一つとして並べる。
  ['<div class="font-semibold">⏱ 乗継2時間15分 — まず搭乗ゲートを確認</div>', '<div class="font-semibold">🕐 香港で乗り継ぎ 2時間15分 — 過ごし方</div>'],
  ['<summary>コンコース間の移動時間・早朝の営業状況</summary>', '<summary>ラウンジで過ごす（4系統）と、コンコース間の移動</summary>'],
  ['<div>村上はSapphireでビジネスクラスラウンジ可（営業時間は未確認）。無料シャワーは L5 の Gate 12付近 / Gate 43付近で24時間。</div>', '<div><strong>エアライン</strong>: 村上はSapphireでキャセイのビジネスクラスラウンジ可（本人＋同伴1名）。07:20着の時点で The Bridge（05:00〜）、The Deck と The Pier, Business（05:30〜）はいずれも営業時間内。</div><div><strong>Priority Pass</strong>: 香港の対象施設は未確認。会員本人のアプリで当日の対象と同伴条件を確認する。</div><div><strong>一般有料</strong>: Plaza Premium Lounge は Gate 60・Gate 1 が24時間。会員資格が無くても買える。</div><div><strong>カード付帯</strong>: 香港での対象は未確認。保有カードの特典ページで当日確認する。</div><div><strong>ラウンジを使わない場合</strong>: 無料シャワーは L5 の Gate 12付近 / Gate 43付近で24時間。</div>'],
  // EuroBLECHは展示会視察。TechExの「参加」、Mercedesの「工場見学」とは語を分ける。
  // アイコンも工場（🏭）ではなく展示会（🏛）にする。🏭はMercedes工場見学だけに残す。
  ['🏭 EuroBLECH Day 1', '🏛 EuroBLECH Day 1'],
  ['🏭 EuroBLECH（Hannover Messe）', '🏛 EuroBLECH（Hannover Messe）'],
  ['🏭 EuroBLECH（最終）', '🏛 EuroBLECH（最終）'],
  ['🏭 EuroBLECH 2026', '🏛 EuroBLECH 2026'],
  ['<i class="fas fa-industry"></i> EuroBLECH 公式サイト', '<i class="fas fa-landmark"></i> EuroBLECH 公式サイト'],
  ['EuroBLECH フル参加 — 全員合流', 'EuroBLECH 展示会視察 — 全員合流'],
  ['<!-- Day 5: 10/21 EuroBLECH フル参加（全員合流） -->', '<!-- Day 5: 10/21 EuroBLECH 展示会視察（全員合流） -->'],
  ['EuroBLECH フル参加（全員合流・ハノーファーメッセ）', 'EuroBLECH 展示会視察（全員合流・ハノーファーメッセ）'],
  ['<div class="text-sm text-slate-600 mt-1">村上・美馬・金築 全員参加</div>', '<div class="text-sm text-slate-600 mt-1">村上・美馬・金築 全員で終日視察</div>'],
  ['Hannover Messe · 10/20（火）– 10/23（金）· 全員参加', 'Hannover Messe ・ 10/20（火）– 10/23（金）・ 全員で展示会視察'],
  ['美馬・金築が20日朝ハノーファーへ移動して参加', '美馬・金築が20日朝ハノーファーへ移動して視察'],
  ['<div class="font-semibold">10/21（水）— 全員フル参加</div>', '<div class="font-semibold">10/21（水）— 全員で終日視察</div>'],
  ['10/22（木）12:45–14:00 · 全員参加・予約確定済み', '10/22（木）12:45–14:00 ・ 全員で工場見学・予約確定済み'],
  // 自動手荷物預けの対象便かは未確認。有人カウンター前提にそろえる（村上10/17・美馬金築10/18の両方）。
  ['<div class="text-slate-600 text-xs">国際線のため3時間前にチェックイン</div>', '<div class="text-slate-600 text-xs">国際線のため3時間前にチェックイン。自動手荷物預けの対応可否は未確認のため、有人カウンターで預ける前提で動く</div>', 'all'],
];

const FAMILY_DAYS = [
  { date:'10/17', dow:'土', murakami:[
    ['11:30頃','move','移動','京都駅 → 名古屋駅 12:06頃 → セントレア 13:03'],
    ['16:10','flight','フライト','CX539 セントレア発 → 香港 19:30着'],
    ['19:30〜23:15','transfer','乗り継ぎ','香港で夕食・シャワー。23:15にCX271で出発'],
  ], team:[], stays:[['村上','機内']] },
  { date:'10/18', dow:'日', murakami:[
    ['06:55','procedure','到着・手続き','Amsterdam AMS着。入国審査・荷物受取'],
    ['07:30頃','move','移動','Schiphol Airport Station → Amsterdam Sloterdijk 07:40頃'],
    ['07:45頃','stay','荷物','ホテルに荷物を預けて時差調整'],
    ['15:00頃','stay','チェックイン','Holiday Inn Express Amsterdam - Sloterdijk Station'],
  ], team:[
    ['11:30頃','move','移動','京都駅 → 名古屋駅 12:06頃 → セントレア 13:03'],
    ['16:10','flight','フライト','CX539 セントレア発 → 香港 19:30着'],
    ['19:30〜23:20','transfer','乗り継ぎ','香港で夕食・休憩。23:20頃に搭乗口へ'],
    ['23:55','flight','フライト','CX289 香港発（機内泊）'],
  ], stays:[['村上','Holiday Inn Express Amsterdam - Sloterdijk Station'],['美馬・金築','機内']] },
  { date:'10/19', dow:'月', murakami:[
    ['08:30','move','移動','ホテル → RAI Amsterdam 08:55頃'],
    ['09:45〜16:50','techex','TechEx','TechEx Europe Day 1'],
    ['18:00〜21:00','techex','交流会','VIP Networking Drinks'],
    ['21:00頃','move','移動','RAI Amsterdam → ホテル 21:25頃'],
  ], team:[
    ['07:15','procedure','到着・手続き','Frankfurt FRA着。入国審査・荷物受取'],
    ['08:22','move','移動','Frankfurt空港駅 → Göttingen Hbf 10:31'],
    ['10:35頃','stay','荷物','ホテルに荷物を預ける'],
    ['11:00頃','move','移動','Göttingen Hbf → Wolfsburg Hbf 12:20頃 → Autostadt 12:30頃'],
    ['12:30〜17:20頃','visit','見学','Autostadt'],
    ['17:30頃','move','移動','Wolfsburg Hbf → Göttingen Hbf 18:45頃'],
    ['18:50頃','stay','チェックイン','Hotel FREIgeist Göttingen Innenstadt'],
  ], stays:[['村上','Holiday Inn Express Amsterdam - Sloterdijk Station'],['美馬・金築','Hotel FREIgeist Göttingen Innenstadt']] },
  { date:'10/20', dow:'火', murakami:[
    ['08:30頃','move','移動','ホテル → RAI Amsterdam 08:55頃'],
    ['09:45〜14:55','techex','TechEx','TechEx Europe Day 2'],
    ['14:55','move','移動','RAI Amsterdam → Schiphol AMS 15:20頃'],
    ['16:50','flight','フライト','KL1791 Amsterdam AMS発 → Hannover HAJ 17:45着'],
    ['19:06','move','移動','Hannover Flughafen → Hannover Hbf 19:23 → Göttingen Hbf 20:25'],
    ['20:30頃','stay','チェックイン','Hotel FREIgeist Göttingen Innenstadt'],
  ], team:[
    ['07:55','move','移動','Göttingen Hbf → Hannover Messe/Laatzen 08:23'],
    ['09:00〜17:00','euro','EuroBLECH','Day 1'],
    ['17:30頃','move','移動目安','Hannover Messe/Laatzen → Göttingen Hbf 18:00頃'],
  ], stays:[['全員','Hotel FREIgeist Göttingen Innenstadt']] },
  { date:'10/21', dow:'水', shared:[
    ['07:55','move','移動','Göttingen Hbf → Hannover Messe/Laatzen 08:23'],
    ['09:00〜17:00','euro','EuroBLECH','全員で終日視察'],
    ['17:30頃','move','移動目安','Hannover Messe/Laatzen → Göttingen Hbf 18:00頃'],
    ['19:00頃','meal','夕食','ゲッティンゲン旧市街'],
  ], stays:[['全員','Hotel FREIgeist Göttingen Innenstadt']] },
  { date:'10/22', dow:'木', shared:[
    ['09:00','move','移動','Göttingen Hbf → Bremen Hbf 10:45'],
    ['10:45以降','review','要検討','Bremen Hbf → Mercedes-Benz Werk Bremenの交通手段を決める'],
    ['12:45〜14:00','visit','工場見学','Mercedes-Benz Werk Bremen'],
    ['16:00頃／18:00頃','review','復路検討','早帰りならホテル18:05頃・資料整理。市内滞在ならホテル20:05頃'],
  ], stays:[['全員','Hotel FREIgeist Göttingen Innenstadt']] },
  { date:'10/23', dow:'金', shared:[
    ['07:55','move','移動','Göttingen Hbf → Hannover Messe/Laatzen 08:23'],
    ['09:00〜14:15頃','euro','EuroBLECH','最終日。14:15頃に退場'],
    ['14:30','move','移動','Hannover Messe/Laatzen → Hannover Hbf 14:38 → Frankfurt(Main) Hbf 17:14'],
    ['17:30頃','stay','チェックイン','Toyoko Inn Frankfurt am Main Hauptbahnhof'],
    ['18:30頃','meal','夕食','フランクフルト中央駅周辺'],
  ], stays:[['全員','Toyoko Inn Frankfurt am Main Hauptbahnhof']] },
  { date:'10/24', dow:'土', shared:[
    ['07:00〜10:00','meal','朝食','ホテルで朝食・チェックアウト'],
    ['10:15','move','移動','ホテル → Frankfurt Airport Terminal 3 10:40'],
    ['10:40〜12:55','procedure','出国手続き','チェックイン・保安検査・出国審査'],
    ['13:40','flight','フライト','CX288 Frankfurt FRA発（機内泊）'],
  ], stays:[['全員','機内']] },
  { date:'10/25', dow:'日', shared:[
    ['07:20','transfer','到着・乗り継ぎ','香港 HKG着 → 09:35 CX536出発'],
    ['09:35','flight','フライト','香港 HKG発 → セントレア NGO 14:10着'],
    ['14:10〜15:00頃','procedure','入国手続き','入国審査・荷物受取・税関。Visit Japan Webを用意'],
    ['15:00頃','move','帰宅','セントレア発 → 各自帰宅'],
  ], stays:[['全員','帰宅']] },
];

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

function replaceDivById(html, id, replacement) {
  const [start, end] = divRangeById(html, id);
  return html.slice(0, start) + replacement + html.slice(end);
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
const familySource = readSource(familySourcePath);
const [familyStart, familyEnd] = divRangeById(familySource, 'tab-family');
source = replaceDivById(source, 'tab-family', familySource.slice(familyStart, familyEnd));
source = source
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>TechEx Europe・EuroBLECH 2026 フィールドガイド v3</title>')
  .replace(/<link[^>]+font-awesome[^>]*>/gi, '')
  .replace(/<script[^>]+cdn\.tailwindcss\.com[^>]*><\/script>/gi, '')
  .replace(/<style>[\s\S]*?<\/style>/i, '')
  .replace(/<script>[\s\S]*?<\/script>\s*<\/body>/i, '</body>')
  .replace('</head>', '<link rel="stylesheet" href="../202609_HumanoidSummitEurope/v3.css">\n<link rel="stylesheet" href="v3.css">\n</head>');

const transformScript = `
<script id="v3-build-transform">
(() => {
  const DAY_META = ${JSON.stringify(DAY_META)};
  const STAYS = ${JSON.stringify(STAYS)};
  const ROUTES = ${JSON.stringify(ROUTES)};
  const FAMILY_DAYS = ${JSON.stringify(FAMILY_DAYS)};
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const flightIcon = () => '<span class="flight-mark" role="img" aria-label="フライト"></span>';
  const plainTime = value => value.replace(/^\\d{1,2}\\/\\d{1,2}（.）/, '').trim();
  const routeDay = value => (value.match(/^(\\d{1,2})\\/(\\d{1,2})/) || []).slice(1).join('');
  const mapLink = place => '<a class="place" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place) + '" target="_blank" rel="noopener">' + esc(place) + '</a>';
  const isFlight = service => /^(?:CX|KL)\\d+/.test(service);
  const routeMarkup = data => {
    const [dayId,, departWhen, departZone, departPlace, service, duration, arriveWhen, arriveZone, arrivePlace] = data;
    const depart = plainTime(departWhen);
    let arrive = plainTime(arriveWhen);
    if (routeDay(arriveWhen) && routeDay(arriveWhen) !== dayId) arrive += ' +1';
    return '<div class="row-time">' + esc(depart) + '</div>' +
      '<div class="endpoint"><span class="label">出発</span><time>' + esc(depart) + '</time><span class="tz">（' + esc(departZone) + '）</span>' + mapLink(departPlace) + '</div>' +
      '<div class="mode">' + (isFlight(service) ? flightIcon() : '<span class="arrow">→</span>') + '<strong>' + esc(service) + '</strong><small>' + esc(duration.replace('所要時間未確認','時間未確認')) + '</small></div>' +
      '<div class="endpoint"><span class="label">到着</span><time>' + esc(arrive) + '</time><span class="tz">（' + esc(arriveZone) + '）</span>' + mapLink(arrivePlace) + '</div>';
  };
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
  const stayMarkup = stay => '<div class="stay stay-' + stay.tone + '"><span>' + esc(stay.who) + '</span><strong>宿泊：</strong>' + esc(stay.name) + '</div>';
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
    [['AMS 着','06:55','🛂 Amsterdam Airport Schiphol（AMS）着','入国審査・荷物受取'],['FRA 着','07:15','🛂 Frankfurt Airport（FRA）着','入国審査・荷物受取'],['HKG 着','07:20','香港で乗り継ぎ（2時間15分）','']].forEach(([match,time,label,sub]) => {
      const row = rowFor(day, match);
      if (row && !row.classList.contains('route-four')) row.innerHTML = '<div class="text-slate-500">' + time + '</div><div class="font-semibold">' + label + '</div>' + (sub ? '<div class="text-slate-600 text-xs">' + sub + '</div>' : '');
    });
    if (id === '1021') {
      const before = Array.from(day.querySelectorAll('.font-semibold')).find(el => /宿泊/.test(el.textContent))?.closest('[class*="border-l-4"]');
      const back = ROUTES.find(route => route[0] === '1021' && route[1].includes('戻る'));
      before?.insertAdjacentHTML('beforebegin', '<div class="route-four route-estimate">' + routeMarkup(back) + '</div>');
    }
    if (id === '1022') {
      const before = rowFor(day, 'Mercedes-Benz Werk Bremen');
      before?.insertAdjacentHTML('beforebegin', '<div class="route-four route-review">' + routeMarkup(['1022','','10:45以降','CEST','Bremen Hbf','現地交通を要検討','所要時間未確認','12:45まで','CEST','Mercedes-Benz Werk Bremen']) + '</div>');
    }
    if (id === '1018') {
      const rest = rowFor(day, '時差調整・休息');
      rest?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">15:00頃</div><div class="action-body"><div class="font-semibold">🏨 ホテルにチェックイン</div><div class="text-slate-600 text-xs">Holiday Inn Express Amsterdam - Sloterdijk Station</div></div></div>');
      const lounge = rowFor(day, 'ラウンジ候補');
      if (lounge) lounge.innerHTML = '<div class="text-slate-500">13:10〜16:10</div><div class="font-semibold">🕐 セントレアで出発待ち 3時間 — 過ごし方</div><div class="text-slate-600 text-xs"><strong>ラウンジは選択肢の一つ</strong>。利用資格は当日に確認し、決まらなければ制限エリア内の飲食で待つ。</div><details class="fold mt-1"><summary>ラウンジで過ごす（4系統）</summary><div class="fold-body"><div><strong>エアライン</strong>: JALサクララウンジ（第1ターミナル・国際線制限エリア）。CX539での利用可否は、搭乗クラス・oneworld/Cathay等のステータス・航空会社の招待条件をチェックイン時に確認。</div><div><strong>Priority Pass</strong>: Plaza Premium Lounge／The Coral Finest Business Class Lounge。当日の対象施設・同伴条件を会員本人のアプリで確認。</div><div><strong>一般有料</strong>: プラザ・プレミアム・ラウンジ名古屋。料金と営業時間は当日確認。</div><div><strong>カード付帯</strong>: 出国審査前のプレミアムラウンジ セントレア／第2プレミアムラウンジ セントレア／QUALIA LOUNGE。対象になるカードかは保有カードの特典ページで確認。出国審査の前なので、入るなら早めに。</div></div></details>';
      const cx539 = routeRowFor(day, 'CX539');
      cx539?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">19:30〜23:20</div><div class="action-body"><div class="font-semibold">🕐 香港で乗り継ぎ 3時間50分 — 過ごし方</div><div class="text-slate-600 text-xs"><strong>ラウンジは選択肢の一つ</strong>。使えなくても無料シャワーと24時間営業の飲食で回せる。23:20頃にCX289の搭乗口へ。</div><details class="fold mt-1"><summary>ラウンジで過ごす（4系統）</summary><div class="fold-body"><div><strong>エアライン</strong>: キャセイのビジネスクラスラウンジ。搭乗クラスまたはoneworld/Cathay等のステータスが対象かを確認。The Deck（Gate 6付近・L7）と The Pier, Business（Gate 65付近・L6）が05:30〜00:30、The Bridge（Gate 35付近・L6）が05:00〜最終キャセイ便。</div><div><strong>Priority Pass</strong>: 香港の対象施設は未確認。会員本人のアプリで当日の対象と同伴条件を確認する。</div><div><strong>一般有料</strong>: Plaza Premium Lounge は Gate 60 が24時間・HKD 250〜（最安）、Gate 1 が24時間・HKD 650〜、Gate 35 が06:00〜01:00・HKD 650〜。</div><div><strong>カード付帯</strong>: 香港での対象は未確認。保有カードの特典ページで当日確認する。</div></div></details><details class="fold mt-1"><summary>ラウンジを使わずに過ごす</summary><div class="fold-body"><div>⭐ <strong>無料シャワー（L5・24時間）</strong>: Gate 12付近 / Gate 43付近。シャンプー等あり、タオルは自販機で購入。ラウンジの可否と無関係に使える。</div><div><strong>飲食</strong>: Gate 10〜11付近 Level 6 の Men Wah Bing Teng・McDonald&#39;s が24時間。Level 7 フードコートは22〜23時台に閉まる可能性がある。</div></div></details></div></div>');
    }
    if (id === '1019') {
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
      const expo = rowFor(day, 'EuroBLECH Day 1');
      const back = ROUTES.find(route => route[0] === '1020' && route[1].includes('戻る'));
      expo?.insertAdjacentHTML('afterend', '<div class="route-four route-estimate">' + routeMarkup(back) + '</div>');
    }
    if (id === '1021') {
      const expo = rowFor(day, 'EuroBLECH（Hannover Messe）');
      if (expo) expo.innerHTML = '<div class="text-slate-500">09:00–17:00</div><div class="font-semibold text-teal-800">🏛 EuroBLECH</div><div class="text-slate-600 text-xs">全員で終日視察</div>';
      const back = Array.from(day.querySelectorAll('.route-estimate')).at(-1);
      back?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">19:00頃</div><div class="action-body"><div class="font-semibold">🍽 全員で夕食</div><div class="text-slate-600 text-xs">ゲッティンゲン旧市街</div></div></div>');
    }
    if (id === '1022') {
      const returnRoute = routeRowFor(day, '列車候補を確認');
      returnRoute?.classList.add('route-review');
      returnRoute?.insertAdjacentHTML('beforebegin', '<div class="return-choice"><strong>復路は要検討</strong><span>早帰り案：16:00頃 Bremen Hbf発 → 18:05頃ホテル着・資料整理</span><span>市内滞在案：18:00頃 Bremen Hbf発 → 20:05頃ホテル着</span></div>');
    }
    if (id === '1023') {
      const lastTrain = routeRowFor(day, 'ICE771');
      lastTrain?.insertAdjacentHTML('afterend', '<div class="action"><div class="row-time">17:30頃</div><div class="action-body"><div class="font-semibold">🏨 ホテルにチェックイン</div><div class="text-slate-600 text-xs">フランクフルト中央駅南口から徒歩約2分</div></div></div><div class="action"><div class="row-time">18:30頃</div><div class="action-body"><div class="font-semibold">🍽 夕食</div><div class="text-slate-600 text-xs">フランクフルト中央駅周辺。夜は荷物・貴重品に注意。</div></div></div>');
    }
    if (id === '1024') {
      const firstRoute = day.querySelector('.route-four');
      firstRoute?.insertAdjacentHTML('beforebegin', '<div class="action"><div class="row-time">07:00–10:00</div><div class="action-body"><div class="font-semibold">🍽 朝食・チェックアウト</div><div class="text-slate-600 text-xs">東横INNの無料朝食後、10:15にホテルを出発</div></div></div>');
      const airport = rowFor(day, 'FRA空港 到着');
      if (airport) airport.innerHTML = '<div class="text-slate-500">10:40–12:55</div><div class="font-semibold">🛂 チェックイン・保安検査・出国審査</div><div class="text-slate-600 text-xs">CX288のチェックインカウンターと搭乗ゲートは当日の案内で確認</div>';
      const lounge = rowFor(day, 'FRAラウンジ');
      if (lounge) lounge.innerHTML = '<div class="text-slate-500">12:55頃</div><div class="font-semibold">🛋 ラウンジ候補</div><div class="text-slate-600 text-xs">搭乗開始まで時間がある場合、航空会社指定ラウンジとPriority Pass対象施設を確認。</div>';
    }
    if (id === '1025') {
      const arrival = rowFor(day, '香港で乗り継ぎ');
      if (arrival) arrival.innerHTML = '<div class="text-slate-500">07:20〜09:35</div><div class="font-semibold">香港国際空港着・乗り継ぎ（2時間15分）</div><div class="text-slate-600 text-xs">CX536の搭乗ゲートを先に確認</div>';
      rowFor(day, '乗継2時間15分 — まず搭乗ゲートを確認')?.remove();
      const before = rowFor(day, '解散・帰宅');
      if (before) before.innerHTML = '<div class="text-slate-500">15:00頃</div><div class="font-semibold">🏠 セントレア発・各自帰宅</div><div class="text-slate-600 text-xs">空港から先は各自の経路へ</div>';
      before?.insertAdjacentHTML('beforebegin', '<div class="action"><div class="row-time">14:10〜15:00頃</div><div class="action-body"><div class="font-semibold">🛂 入国審査・荷物受取・税関</div><div class="text-slate-600 text-xs">Visit Japan WebのQRコードを用意</div></div></div>');
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
    stack.insertAdjacentHTML('afterbegin','<div class="day-kind-legend" aria-label="日付カードの色の意味"><strong>日付カードの色</strong><span><i class="kind-swatch swatch-move"></i>移動・帰着</span><span><i class="kind-swatch swatch-conf"></i>展示会視察</span><span><i class="kind-swatch swatch-visit"></i>工場・企業見学（予約確定）</span><span><i class="kind-swatch swatch-review"></i>要検討（この帯だけが未定）</span></div>');
  }
  const familyEventMarkup = event => '<div class="agenda-line"><time>' + esc(event[0]) + '</time><span class="schedule-tag kind-' + esc(event[1]) + '">' + esc(event[2]) + '</span><p>' + esc(event[3]) + '</p></div>';
  const familySectionMarkup = (title, events) => '<section><h3>' + esc(title) + '</h3>' + (events.length ? events.map(familyEventMarkup).join('') : '<div class="agenda-empty">日本</div>') + '</section>';
  const familyStayMarkup = stays => '<aside><h3>宿泊</h3>' + stays.map(stay => '<p>' + esc(stay[1]) + '<br><small>' + esc(stay[0]) + '</small></p>').join('') + '</aside>';
  const familyDayMarkup = day => {
    const body = day.shared
      ? '<section class="family-shared"><h3>全員</h3>' + day.shared.map(familyEventMarkup).join('') + '</section>'
      : familySectionMarkup('村上', day.murakami) + familySectionMarkup('美馬・金築', day.team);
    return '<article class="family-day-row' + (day.shared ? ' shared-day' : '') + '"><header><strong>' + esc(day.date) + '</strong><span>' + esc(day.dow) + '</span></header>' + body + familyStayMarkup(day.stays) + '</article>';
  };
  const familySchedule = family.querySelector('.family-schedule .schedule-body');
  if (familySchedule) familySchedule.innerHTML = '<div class="schedule-legend" aria-label="色の意味"><strong>表示の区別</strong><span class="schedule-tag kind-flight">フライト</span><span class="schedule-tag kind-move">地上移動</span><span class="schedule-tag kind-transfer">到着・乗り継ぎ</span><span class="schedule-tag kind-procedure">手続き</span><span class="schedule-tag kind-techex">TechEx</span><span class="schedule-tag kind-euro">EuroBLECH</span><span class="schedule-tag kind-visit">工場・企業見学</span><span class="schedule-tag kind-review">要検討</span></div>' + FAMILY_DAYS.map(familyDayMarkup).join('');
  family.querySelector('.flight-fares')?.remove();
  family.querySelectorAll('.flight-status').forEach(status => status.remove());
  family.querySelector('.timezone-note')?.remove();
  const timezoneLead = family.querySelector('.timezone-lead');
  if (timezoneLead) timezoneLead.innerHTML = '<strong>時刻はすべて、その場所の現地時刻</strong><span>日本＝JST／欧州＝CEST／香港＝HKT</span>';
  const returnFooter = family.querySelector('.flight-return > footer');
  if (returnFooter) returnFooter.textContent = '総移動 約17時間30分・全員同便';
  [prep, venue, family].forEach(panel => {
    panel.className = 'tab legacy-tab'; panel.setAttribute('role','tabpanel');
    const inner = panel.querySelector(':scope > div'); if (inner) inner.className = 'legacy-stack';
  });
  family.classList.add('family-tab');
  itinerary.className = 'tab on'; itinerary.setAttribute('role','tabpanel');

  const header = document.createElement('header');
  header.className = 'hdr';
  header.innerHTML = '<div class="wrap hdr-top"><div><div class="eyebrow">EUROPE BUSINESS TRIP 2026</div><h1>TechEx Europe・EuroBLECH 出張ガイド</h1><div class="subtitle">10/17（土）〜10/25（日）｜3名｜アムステルダム・ハノーファー・ブレーメン</div></div><div class="no-print header-actions"><button class="btn" type="button" onclick="window.print()" aria-label="印刷">印刷</button></div></div>';
  const nav = document.createElement('div');
  nav.className = 'field-nav';
  nav.innerHTML = '<div class="wrap"><nav class="tabs" id="tabs" role="tablist" aria-label="主要セクション"><button data-tab="itinerary" class="on" role="tab" aria-selected="true"><span class="ic">📅</span>旅程</button><button data-tab="prep" role="tab" aria-selected="false"><span class="ic">✅</span>準備</button><button data-tab="venue" role="tab" aria-selected="false"><span class="ic">🏢</span>会場</button><button data-tab="rec" role="tab" aria-selected="false"><span class="ic">📝</span>記録</button><button data-tab="family" role="tab" aria-selected="false"><span class="ic">🏠</span>家族</button></nav><div class="subbar" id="subbar"><div class="chips" id="day-chips"><span class="lbl">日付</span></div></div></div>';
  document.body.prepend(nav); document.body.prepend(header);
  const main = document.createElement('main'); main.className = 'wrap';
  [itinerary, prep, venue, record, family].forEach(panel => main.appendChild(panel));
  nav.after(main);
  document.body.insertAdjacentHTML('beforeend','<footer class="field-footer">TechEx Europe・EuroBLECH 2026 ・ field guide v3</footer><!--V3_SCRIPT-->');
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
  };
  const lineIconMap = { '🛋':'lounge', '🛂':'procedure', '🏨':'hotel', '🍽':'meal', '😴':'rest', '🥂':'drinks', '🏭':'factory', '🚶':'walk', '🏠':'home', '🏛':'event' };
  const iconNodes = [];
  const iconWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (iconWalker.nextNode()) {
    const node = iconWalker.currentNode;
    if (!node.parentElement?.closest('script,style,.tabs') && /^[\\s]*(?:🛋|🛂|🏨|🍽|😴|🥂|🏭|🚶|🏠|🏛)/u.test(node.nodeValue)) iconNodes.push(node);
  }
  iconNodes.forEach(node => {
    const match = node.nodeValue.match(/^(\\s*)(🛋|🛂|🏨|🍽|😴|🥂|🏭|🚶|🏠|🏛)\\s*/u);
    if (!match) return;
    const fragment = document.createDocumentFragment();
    if (match[1]) fragment.appendChild(document.createTextNode(match[1]));
    const icon = document.createElement('span');
    const name = lineIconMap[match[2]];
    icon.className = 'line-icon line-icon-' + name;
    icon.setAttribute('aria-hidden','true');
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + lineIconPaths[name] + '</svg>';
    fragment.appendChild(icon);
    const rest = node.nodeValue.slice(match[0].length);
    if (rest) fragment.appendChild(document.createTextNode(' ' + rest));
    node.replaceWith(fragment);
  });
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
  output = output.replace('<!--V3_SCRIPT-->', '<script src="v3.js"></script>');
  output = output.split(/\r?\n/).map(line => line.trimEnd()).join('\n').replace(/\n*$/, '\n');
  writeFileSync(outputPath, output, 'utf8');
  console.log(`Generated ${outputPath}`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
