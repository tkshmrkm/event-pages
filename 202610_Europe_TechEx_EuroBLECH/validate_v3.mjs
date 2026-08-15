import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'index.html'), 'utf8');
const css = readFileSync(join(here, 'v3.css'), 'utf8');
const js = readFileSync(join(here, 'v3.js'), 'utf8');
const hrsCss = readFileSync(join(here, '..', '202609_HumanoidSummitEurope', 'v3.css'), 'utf8');
const familyPrint = readFileSync(join(here, 'family_print.html'), 'utf8');
const immigration = readFileSync(join(here, 'immigration_print.html'), 'utf8');
const itinerary = html.slice(html.indexOf('id="tab-itinerary"'), html.indexOf('id="tab-prep"'));
const prep = html.slice(html.indexOf('id="tab-prep"'), html.indexOf('id="tab-venue"'));
const day1022 = itinerary.slice(itinerary.indexOf('id="day-1022"'), itinerary.indexOf('id="day-1023"'));
const day1025 = itinerary.slice(itinerary.indexOf('id="day-1025"'));
const rowTimes = [...itinerary.matchAll(/<div class="row-time">([\s\S]*?)<\/div>/g)].map(match => match[1].replace(/<[^>]+>/g, '').trim());

const count = pattern => (html.match(pattern) || []).length;
const countIn = (source, pattern) => (source.match(pattern) || []).length;
const checks = [
  ['HRS public stylesheet linked', html.includes('href="../202609_HumanoidSummitEurope/v3.css"')],
  ['local v3 assets linked', html.includes('href="v3.css"') && html.includes('src="v3.js"')],
  ['no v2 runtime dependency', !/v2\.(?:css|js)/.test(html)],
  // 家族はタブではなくfamily_print.htmlへ分けたので、主要タブは4つ。
  ['four primary tabs', count(/data-tab="(?:itinerary|prep|venue|rec)"/g) === 4 && count(/data-tab="/g) === 4],
  ['nine HRS detail day cards', count(/<details class="day"/g) === 9],
  ['all day cards initially open', count(/<details class="day"[^>]* open/g) === 9],
  ['nine day topic blocks', count(/class="day-topics"/g) === 9],
  ['all overnight lodging outcomes present', count(/class="stay stay-/g) === 10 && !day1025.includes('class="stay stay-')],
  ['static four-column routes present', count(/class="route-four(?:\s|\")/g) >= 30],
  // 日跨ぎ便で着いた日は、その日の先頭で「◯◯着」を示す（前日の4列交通しか到着を持たないため）。
  ['overnight arrivals are marked on the arrival day', ['Amsterdam Airport Schiphol（AMS）着', 'Frankfurt Airport（FRA）着', '香港国際空港（HKG）着'].every(t => itinerary.includes(t))],
  ['three overnight +1 arrivals', count(/<time>\d{2}:\d{2} \+1<\/time>/g) === 3],
  ['no repeated month/day in endpoints', !/class="endpoint"[\s\S]{0,180}<time>\d{1,2}\/\d{1,2}/.test(itinerary)],
  // 交通手段の列は全てアイコン。フライトだけ絵で他が矢印、という不揃いを許さない。
  ['every transport mode uses an icon', !itinerary.includes('class="arrow"') && count(/class="mode-icon mode-icon-/g) === 27 && css.includes('.mode .mode-icon svg')],
  // 10/22の現地交通はタクシー（Uber）に決まったので unknown は0件。決まった手段は車アイコン。
  ['decided transport uses its own icon', count(/mode-icon-unknown/g) === 0 && count(/mode-icon-car/g) === 1 && /mode-icon-car[\s\S]{0,900}タクシー（Uber）/.test(itinerary)],
  ['no colored airplane emoji in itinerary', !/[✈🛫🛬]\uFE0F/.test(itinerary)],
  // 家族向けを別ファイルへ分けた分だけ、index.html側のフライトアイコンは減る（20→13）。
  ['flight icons use outlined deterministic SVG mask', count(/class="flight-mark(?: inline-flight-mark)?"/g) >= 12 && css.includes('-webkit-mask:url("data:image/svg+xml') && css.includes("fill='none'") && css.includes('color:#0B5C60')],
  ['itinerary color legend and factory color present', html.includes('class="day-kind-legend"') && /id="day-1022"[^>]*data-kind="visit"/.test(html)],
  ['10/19 context moved to topics', itinerary.includes('美馬・金築はEuroBLECH開幕前の自由日') && !itinerary.includes('class="text-xs text-slate-500 px-1">EuroBLECHは10/20開幕')],
  ['lounge candidates are conditional without defensive prose', itinerary.includes('JALサクララウンジ') && itinerary.includes('Plaza Premium Lounge／The Coral Finest Business Class Lounge') && !itinerary.includes('利用不可とは断定せず') && !itinerary.includes('ステータス無し・プライオリティパス無し')],
  ['unnecessary one-day wording removed', !html.includes('参加できるのは実質この日だけ')],
  ['booking status belongs to preparation', !/選定済み（未購入|運賃は手配中/.test(itinerary) && prep.includes('航空券状況') && prep.includes('選定済み（未購入')],
  ['baggage-drop wording matches approved sample', (itinerary.match(/ホテルに荷物を預ける/g) || []).length === 2 && !itinerary.includes('ホテルフロントへ荷物預け') && !itinerary.includes('荷物預け（予約済み）')],
  // ホテル名は場所名と同じく、文字そのものが地図リンクである（2026-08-14からの標準）。
  ['hotel names are kept in lodging outcomes', (itinerary.match(/<strong>宿泊：<\/strong><a class="place"[^>]*>Holiday Inn Express Amsterdam - Sloterdijk Station<\/a>/g) || []).length === 2 && (itinerary.match(/<strong>宿泊：<\/strong><a class="place"[^>]*>Hotel FREIgeist Göttingen Innenstadt<\/a>/g) || []).length >= 4 && !/ホテルに荷物を預ける[\s\S]{0,250}(?:Holiday Inn Express|Hotel FREIgeist)/.test(itinerary)],
  ['lodging without a place is not linked', /<strong>宿泊：<\/strong>機内/.test(itinerary) && !/<a class="place"[^>]*>機内<\/a>/.test(html) && !/<a class="place"[^>]*>帰宅<\/a>/.test(html)],
  // セントレアの出発待ちは10/17村上と10/18美馬・金築の2回。どちらも1ブロックに寄せてある。
  // 残る「空港到着目安」は10/20のスキポールの1件だけ。
  ['pre-departure windows are single blocks', (itinerary.match(/セントレアで出発待ち（約3時間）/g) || []).length === 2 && (itinerary.match(/13:10〜16:10/g) || []).length === 2 && (itinerary.match(/空港到着目安/g) || []).length === 1 && !itinerary.includes('セントレアで昼食') && !itinerary.includes('JALサクララウンジ（国際線・出国審査後）')],
  // 待ち・乗り継ぎの見出しは「地点＋所要」だけ。理由や手順は折り畳みの中に置く。
  // 所要は交通手段と同じ規則で、推定には約を付け、時刻表どおりの区間には付けない。
  ['wait headings carry only place and duration', ['セントレアで出発待ち（約3時間）', '香港で乗り継ぎ（3時間45分）', '香港で乗り継ぎ（4時間25分）', '香港で乗り継ぎ（2時間15分）'].every(t => itinerary.includes(t)) && !itinerary.includes('— 過ごし方')],
  // 空港での待ちと乗り継ぎの折り畳みは「やること」と「過ごし方」の2つだけ。
  // ラウンジは過ごし方の一案なので、ラウンジ専用の見出しを作らない。
  // 過ごし方は6箇所（セントレア2・香港3・フランクフルト1）、やることはそれに10/25の入国手続きを足した7箇所。
  ['airport waits split into todo and ways to spend', count(/<summary>過ごし方<\/summary>/g) === 6 && !itinerary.includes('ラウンジで過ごす') && !itinerary.includes('ラウンジを使わずに過ごす') && count(/class="opt-sub"/g) === 24],
  // CX539の機内食は出発待ちの一行と、16:10発の直後の時系列の両方に出す。
  // 昼をどれだけ食べるかの判断に効くので、折り畳みの中に隠さない。
  ['CX539 meal is visible before departure', count(/機内食は離陸1時間後が目安（17:10頃）。昼は軽く/g) === 2 && count(/機内食（主菜＋デザート）/g) === 2 && /16:10[\s\S]{0,900}17:10頃[\s\S]{0,900}19:30/.test(itinerary)],
  // 復路のCX536も離陸1時間後に機内食が出る。乗り継ぎ中の食事量に効くので時系列に出す。
  ['CX536 meal is placed after departure', /<strong>CX536<\/strong>[\s\S]{0,900}<div class="row-time">10:35頃<\/div>[\s\S]{0,700}機内食（昼食）/.test(day1025) && day1025.includes('<strong>CX536で機内食が出る</strong>')],
  // やることの折り畳みは7件: 空港の待ち・乗り継ぎ6回と、10/25の入国手続き1回。
  // 手続き・確認・館内移動・Visit Japan Webは主表示に出さず、すべてここへ入れる。
  ['todo lists live inside folds', count(/<summary>やること<\/summary>/g) === 7 && !/text-slate-600 text-xs">[^<]*セキュリティ再検査/.test(itinerary) && !/text-slate-600 text-xs">Visit Japan Web/.test(itinerary)],
  // 人物レーンの見出しは絵文字からSVGアイコンへ変わったので、語だけを見る。
  ['10/19 granularity aligned', itinerary.includes('<div class="row-time">09:45〜16:50</div>') && itinerary.includes('美馬・金築（FRA着・ヴォルフスブルク日帰り）') && itinerary.includes('荷物受取・チェックイン') && !itinerary.includes('なぜ先にゲッティンゲンへ寄るのか')],
  ['10/19 networking time retained', /<div class="row-time">18:00〜21:00<\/div>[\s\S]{0,700}VIP Networking Drinks/.test(itinerary) && !/<div class="row-time">夕方<\/div>[\s\S]{0,700}VIP Networking Drinks/.test(itinerary)],
  ['10/19 movements use four-column rows', /class="route-four"[^>]*><div class="row-time">12:20頃[\s\S]*?<strong>徒歩<\/strong>[\s\S]*?<time>12:30頃<\/time>/.test(itinerary) && /class="route-four"[^>]*><div class="row-time">17:30頃[\s\S]*?<strong>ICE直通<\/strong>[\s\S]*?<time>18:45頃<\/time>/.test(itinerary)],
  // 復路は文章の2案から、交通行2本＋案の見出しへ変えた。未決であることは
  // 「列車候補を確認」という文字が示す。交通行に色や点線は使わない（2026-08-15）。
  ['10/22 decisions present', day1022.includes('class="choice-head"') && (day1022.match(/class="choice-label"/g) || []).length === 2 && day1022.includes('早帰り案 — ホテル18:05頃着') && day1022.includes('市内滞在案 — ホテル20:05頃着') && (day1022.match(/列車候補を確認/g) || []).length === 2 && day1022.includes('タクシー（Uber）') && day1022.includes('ブレーメンでランチ')],
  // 印を全廃した。3行だけ点線・2行だけオレンジという基準の無い状態には戻さない。
  ['no marker classes on transport rows', !html.includes('route-estimate') && !html.includes('route-review') && !css.includes('.route-estimate{') && !css.includes('.route-review{')],
  ['transport legend drops the marker rows', !html.includes('点線＝時刻は目安') && !html.includes('オレンジ＝手段や便が未定')],
  ['10/24 return-day sequence aligned', itinerary.includes('07:00〜10:00') && itinerary.includes('10:40〜12:55') && itinerary.includes('フランクフルト出発 → 香港（全員）') && !itinerary.includes('旧T2時代の案内・館内図は使えない')],
  // 到着と乗り継ぎは別の行。日跨ぎ到着なので「◯◯着」を先頭に出したうえで、
  // 乗り継ぎは他日と同じ「地点で乗り継ぎ（所要）」にそろえる。
  ['10/25 return sequence aligned', day1025.includes('香港国際空港（HKG）着') && day1025.includes('香港で乗り継ぎ（2時間15分）') && (day1025.match(/2時間15分/g) || []).length === 1 && /香港国際空港（HKG）着[\s\S]*香港で乗り継ぎ（2時間15分）/.test(day1025) && day1025.includes('14:10〜15:00頃') && day1025.includes('15:00頃') && day1025.includes('Visit Japan Web') && !/(?:15:28頃|16:45頃|名鉄ミュースカイ|新幹線 のぞみ)/.test(day1025)],
  ['baggage terminology aligned', !/手荷物受取|荷物ピックアップ/.test(html) && (itinerary.match(/荷物受取/g) || []).length >= 3],
  ['airport procedures use consistent outline icons', (itinerary.match(/line-icon-procedure/g) || []).length >= 3 && itinerary.includes('入国審査・荷物受取・税関') && itinerary.includes('保安検査と出国審査を済ませてから制限エリアへ')],
  ['itinerary times are zero-padded', !/<div class="row-time">[0-9]:[0-9]{2}/.test(itinerary)],
  ['Japanese prose uses Japanese city names', !/(?:Amsterdam行き|Amsterdam到着後|Wolfsburgへ日帰り|Hannoverへ|Bremenへ日帰り|午後にFrankfurtへ|Frankfurt空港から)/.test(itinerary)],
  ['duplicate station-arrival action removed', !itinerary.includes('Hannover Messe/Laatzen駅着')],
  ['Bremen return stays a decision rather than a confirmed booking', day1022.includes('列車候補を確認') && day1022.includes('約2時間の目安') && !day1022.includes('予約確定済み')],
  ['Bremen topic has no Hannover carryover', !day1022.includes('会場（メッセ）到着後') && day1022.includes('ゲッティンゲン駅・車内・ブレーメン到着後')],
  ['legacy icon placeholders removed', !html.includes('class="fas fa-') && !js.includes('✈︎')],
  ['event naming aligned', html.includes('<title>TechEx Europe・EuroBLECH 2026') && html.includes('TechEx Europe・EuroBLECH 2026 ・ field guide v3') && js.includes('# TechEx Europe・EuroBLECH 2026 記録') && !html.includes('VIP networking drinks')],
  ['Japanese punctuation normalized', !html.includes('·') && !/(?:村上|美馬・金築):/.test(html) && !/\d{1,2}\/\d{1,2} \([月火水木金土日]\)/.test(html)],
  ['outline action icons replace black-filled emoji', count(/class="line-icon line-icon-/g) >= 20 && hrsCss.includes('.line-icon svg') && !itinerary.includes('🛋') && !itinerary.includes('🛂')],
  // .line-iconの寸法は共通（core.css経由でHRSのv3.cssに入る1.15em）に任せる。
  // EB側で固定pxを持つと、13〜14pxの文字の中に文字より大きい箱が並ぶ。色だけ上書きしてよい。
  ['line icon size comes from the shared stylesheet', /\.line-icon\{[^}]*width:1\.15em/.test(hrsCss) && !/(^|[^ ])\.line-icon\{/m.test(css) && css.includes('[class*="bg-gray-700"] .line-icon')],
  ['no oversized itinerary time cells', rowTimes.every(value => value.length <= 32)],
  ['four-column mobile contract retained', /@media\(max-width:640px\)[\s\S]*\.route-four,.lanes \.route-four\{grid-template-columns:72px minmax\(0,1fr\) 74px minmax\(0,1fr\)\}/.test(css)],
  // ---------- 家族向け印刷版 ----------
  // 家族向けの正本はfamily_print.html。オンライン版のタブからは外したので、
  // 以下はindex.htmlではなくfamily_print.htmlを見る。
  ['family print page generated', familyPrint.length > 8000],
  ['family print page is fully static', !/<script/i.test(familyPrint) && !/<textarea/i.test(familyPrint) && !/data-trip-key/.test(familyPrint) && countIn(familyPrint, /onclick="/g) === 1 && familyPrint.includes('onclick="window.print()"')],
  ['online version no longer carries the family tab', !html.includes('id="tab-family"') && !html.includes('data-tab="family"')],
  ['online version links the family print page', html.includes('href="family_print.html"')],
  // HRSと同じ5構成。出張サマリー / 時差・気候 / 日程詳細 / 宿泊先情報 / 緊急連絡先。
  ['family print section order', ['ヨーロッパ出張', '現地時刻の見方', '日程詳細', '宿泊先情報', '緊急連絡先'].every(t => familyPrint.includes(t))
    && familyPrint.indexOf('現地時刻の見方') < familyPrint.indexOf('日程詳細')
    && familyPrint.indexOf('日程詳細') < familyPrint.indexOf('宿泊先情報') && familyPrint.indexOf('宿泊先情報') < familyPrint.indexOf('緊急連絡先')],
  ['family print drops the where-overview', !familyPrint.includes('family-where') && !familyPrint.includes('どこにいるか')],
  // 地図リンクは場所名そのものに張る。「地図」「地図で確認」の別リンクは作らない。
  ['map links live on the place name', !familyPrint.includes('地図で確認') && !/>地図<\/a>/.test(familyPrint) && !html.includes('地図で確認')
    && countIn(familyPrint, /<div class="font-bold[^"]*"><a class="place"/g) === 3],
  // フライトブロックは載せない。7区間の出発・到着時刻はすべて日程詳細にあり、
  // 便名も6/7が日程詳細にある。残るのはキャビンクラスと所要時間だけで家族には要らない。
  // ページの20%を重複が占めていた。復活させない。
  ['family print drops the flight block', !familyPrint.includes('class="family-flights"') && !familyPrint.includes('予約クラス') && !familyPrint.includes('キャビンクラス')],
  // サマリーは面として分かれて見えること。上位の bg-*-50 正規化は白に近く、
  // 3ブロックの相対輝度が 0.904/0.921/0.936 と横並びで区別がつかなかった。
  ['family summary blocks are visually separated', familyPrint.includes('family-summary')
    && /\.family-summary \[class\*="bg-blue-50"\]\{background:#DBE8F6/.test(css)
    && /\.family-summary \[class\*="bg-teal-50"\]/.test(css)],
  ['family schedule distinguishes flight and ground movement', ['kind-flight', 'kind-move', 'kind-transfer', 'kind-procedure'].every(k => familyPrint.includes(k))],
  ['family schedule avoids redundant date prefixes', !/<article class="family-day-row[\s\S]*?<p>[^<]*10\/(?:17|18|19|20|21|22|23|24|25)/.test(familyPrint)],
  ['family print omits fares and daylight-saving note', !familyPrint.includes('class="flight-fares"') && !familyPrint.includes('欧州夏時間が終了')],
  ['family times are visually prominent', css.includes('.agenda-line time{color:#0B4F5A;font-size:14px;font-weight:800')],
  ['nine family day rows', countIn(familyPrint, /class="family-day-row/g) === 9],
  // 家族向けは2026-08-14に家族視点へ圧縮した。細かい駅間移動は載せないが、
  // 香港乗継・帰着・帰宅の3点は残す。Visit Japan Webは旅程タブ側で担保する。
  ['family final arrival and airport procedures present', ['香港で2時間15分', 'セントレア NGO着', '入国手続きを終えて各自帰宅'].every(t => familyPrint.includes(t))],
  // フライトブロックを落としたので、便名は日程詳細だけが持つ。7区間すべてに出ること。
  // 最終区間だけ出発の行が無く（09:35の香港発が乗り継ぎ行に吸収されている）、
  // 乗り継ぎ行がCX536を指すことで揃えてある。
  ['every flight number appears in the family schedule', ['CX539', 'CX271', 'CX289', 'KL1791', 'CX288', 'CX536']
    .every(code => familyPrint.slice(familyPrint.indexOf('family-schedule')).includes(code))],
  ['Visit Japan Web retained in itinerary', itinerary.includes('Visit Japan Web')],
  ['family time difference is the dominant type', familyPrint.includes('class="tz-diff"') && /\.timezone-card \.tz-diff\{[^}]*font-size:38px/.test(css) && familyPrint.includes('−7<i>時間</i>') && familyPrint.includes('−1<i>時間</i>')],
  // 圧縮前は52行。現在31行。駅間移動を戻すと再び膨らむので上限で歯止めをかける。
  ['family day detail stays compressed', countIn(familyPrint, /class="agenda-line"/g) <= 36],
  ['family print drops event-type distinctions', familyPrint.includes('schedule-tag kind-work') && !/schedule-legend[\s\S]{0,400}kind-euro/.test(familyPrint)],
  // 緊急連絡先は各公館の公式サイトで確認した内容（2026-08-15）。
  // +49 30 21094-222 は大使館のFAX番号で、緊急連絡先ではない。復活させない。
  ['embassy fax number is not presented as an emergency line', !familyPrint.includes('21094-222') && !html.includes('21094-222')],
  ['verified embassy contacts present', ['+49 30 21094-0', '0800-1822-330', '+1 818 7554 269', '+49 69 238573-0', '+31 70 346-9544', 'Tobias Asserlaan 5', 'tel:112'].every(t => familyPrint.includes(t))],
  // 絵文字は数えずに、Unicodeの Extended_Pictographic が0件であることを見る。
  // 特定の3文字だけ数える検査は、残り49箇所を素通りさせた実績がある。
  // v3.jsも見る。チェックリストは実行時にinnerHTMLへ入るので、HTMLだけ直しても画面に出る。
  ['no emoji anywhere in the generated pages', [['index.html', html], ['family_print.html', familyPrint], ['v3.js', js]]
    .every(([, text]) => !/\p{Extended_Pictographic}/u.test(text))],
  ['no flag emoji anywhere', [['index.html', html], ['family_print.html', familyPrint], ['v3.js', js]]
    .every(([, text]) => !/[\u{1F1E6}-\u{1F1FF}]{2}/u.test(text))],
  ['every icon resolves to an svg', count(/class="line-icon line-icon-[a-zA-Z]+"[^>]*><svg /g) === count(/class="line-icon line-icon-/g)
    && countIn(familyPrint, /class="line-icon line-icon-[a-zA-Z]+"[^>]*><svg /g) === countIn(familyPrint, /class="line-icon line-icon-/g)],
  // ---------- 入国審査用の1枚 ----------
  // 審査官は英語（かオランダ語・ドイツ語）しか読まないので英語で書く。
  // 氏名とパスポート番号はどこにも保存しない。localStorageにも同期にも乗せない。
  ['immigration page is fully static', !/<script/i.test(immigration) && countIn(immigration, /onclick="/g) === 1 && immigration.includes('onclick="window.print()"')],
  ['immigration page never persists passport details', !/localStorage|sessionStorage|TripField|cloudEndpoint/.test(immigration) && countIn(immigration, /<input/g) === 2],
  ['immigration page is English only', !/[぀-ヿ一-鿿]/.test(immigration) && !/\p{Extended_Pictographic}/u.test(immigration)],
  // シェンゲンへの入国地点が人によって割れる。村上はAMS、美馬・金築はFRA。
  // どちらの審査官が見ても自分の分が読めるよう、両方を載せる。
  ['immigration page states both Schengen entry points', immigration.includes('MURAKAMI') && immigration.includes('MIMA and KANECHIKU')
    && immigration.includes('Amsterdam (AMS)') && immigration.includes('Frankfurt (FRA)')],
  ['immigration page states the return ticket', immigration.includes('return ticket held') && immigration.includes('CX288') && immigration.includes('CX536')],
  ['immigration page lists all three hotels', ['Holiday Inn Express Amsterdam', 'Hotel FREIgeist Göttingen Innenstadt', 'Toyoko Inn Frankfurt am Main Hauptbahnhof']
    .every(hotel => immigration.includes(hotel))],
  ['online version links the immigration page', html.includes('href="immigration_print.html"')],
  ['no nested action bodies', !html.includes('action-body"><div class="action-body')],
  ['HRS final font stack', hrsCss.includes("--font:'BIZ UDPGothic','Yu Gothic UI','Meiryo',system-ui,sans-serif")],
  // 日付カードの一括開閉。旅程タブ専用の操作なのでヘッダーには置かない。
  ['day cards can be collapsed and expanded together', itinerary.includes('id="days-tg"') && itinerary.includes('class="day-toolbar no-print"') && !html.includes('id="detail-tg"') && js.includes('function syncDaysToggle()') && js.includes('days.forEach(day => { day.open = !closing; })') && css.includes('.day-toolbar{')],
  ['HRS date navigation behavior', js.includes('function markDay()') && js.includes("todayCard.classList.add('today')") && js.includes('day.open = true')],
  ['browser-local records retained', js.includes("const FIELD_KEY = 'eurotrip2026-v3'") && js.includes('localStorage.setItem')],
];

new vm.Script(js, { filename: 'v3.js' });
const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([label, ok]) => console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`));
if (failed.length) process.exit(1);
