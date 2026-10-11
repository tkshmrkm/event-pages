'use strict';
// 本人提示の案・履歴と、今回開いて確認した開催情報。全体計画は更新しない。
window.PERSONAL_INSPECTION_CONTEXT = {
  revision: '2026-10-03-user-plan',
  providedAt: '2026-10-03',
  seeds: [
    {id:'20270316-logimat-2027', tripStart:'2027-03-15', tripEnd:'2027-03-20', next:'LogiMATとGTCのどちらに行くか決める', memo:'本人提示：LogiMAT@Stuttgart 3/15–20、もしくはGTC。同時参加を前提にしない'},
    {id:'20270314-gtc-2027', next:'LogiMATとの比較と、公式ページ間の開始日表記差を確認', memo:'LogiMATの代案。GTCの出張期間は本人未指定'},
    {id:'20270419-promat-2027', next:'事業部の出展計画と、本人の参加要否・役割を確認', memo:'本人情報：事業部がアルファボットを出すようだ。出展確定・内容・本人参加は未確認'},
    {id:'20270524-icra-2027', tripStart:'2027-05-24', tripEnd:'2027-05-28', next:'参加日・狙い・移動日を具体化', memo:'本人提示：ICRA@Seoul 5/24–28。移動日を含むかは未確認'},
    {id:'personal-robocup-2027', tripStart:'2027-06-15', tripEnd:'2027-06-25', next:'一般見学日、シンポジウム参加、ミュンヘンへ移動する日を決める', memo:'本人提示：RoboCup–automatica@Germany 6/15–25。2イベントをまとめた期間案'},
    {id:'20270622-automatica-2027', tripStart:'2027-06-15', tripEnd:'2027-06-25', next:'RoboCupと共通の出張として会場別の視察日を決める', memo:'RoboCupと同じ期間案。6/15–25をautomatica単独の開催日や視察日としない'},
    {id:'20270706-rss-2027', tripStart:'2027-07-04', tripEnd:'2027-07-13', next:'参加するか、6月のドイツ視察と合わせた負担・目的を検討', memo:'本人提示：( RSS@Athens 7/4–13 )。括弧付きの任意候補として保持'},
    {id:'20270916-itma-2027', tripStart:'2027-09-16', tripEnd:'2027-09-22', next:'本人が見る日・担当範囲・移動日を決める', memo:'本人提示：ITMA@Hannover 9/16–22。出張確定・予約は未確認'},
    {id:'20270926-iros-2027', next:'EMOとの連続参加の可否と、ITMAから一度帰国するかを検討', memo:'本人提示：IROSとEMOがつながるようだ。連続参加は未決定'},
    {id:'20271004-emo-milano-2027', next:'IROS後の移動日と、EMOの視察日・帰国日を決める', memo:'IROSとの連続参加候補。元の俯瞰資料は10/4–9、今回の公式表示は10/4–8'}
  ],
  groups: [
    {title:'LogiMAT ／ GTC', period:'2027-03-15 – 2027-03-20（LogiMAT案）', place:'Stuttgart ／ San Jose', ids:['20270316-logimat-2027','20270314-gtc-2027'], label:'二者択一', note:'開催期間が重なる。GTC案の本人期間は未指定'},
    {title:'ProMat', period:'本人期間は未指定', place:'Chicago', ids:['20270419-promat-2027'], label:'参加要否を検討', note:'事業部の出展予定と、本人の視察・支援の役割を確認'},
    {title:'ICRA', period:'2027-05-24 – 2027-05-28', place:'Seoul', ids:['20270524-icra-2027'], label:'本人提示案', note:'参加日と移動日を分ける'},
    {title:'RoboCup → automatica', period:'2027-06-15 – 2027-06-25', place:'Nuremberg → Munich', ids:['personal-robocup-2027','20270622-automatica-2027'], label:'連続視察案', note:'一般見学は6/17–20。6/21シンポジウムから6/22開幕へつなぐ案'},
    {title:'RSS', period:'2027-07-04 – 2027-07-13', place:'Athens', ids:['20270706-rss-2027'], label:'任意候補', note:'括弧付きで提示された候補。参加は未決定'},
    {title:'ITMA', period:'2027-09-16 – 2027-09-22', place:'Hannover', ids:['20270916-itma-2027'], label:'本人提示案', note:'会期と本人提示期間が一致。前後の移動日は未指定'},
    {title:'IROS → EMO Milano', period:'本人期間は未指定', place:'Florence → Milan', ids:['20270926-iros-2027','20271004-emo-milano-2027'], label:'連続参加を検討', note:'IROSは10/1終了、EMOは10/4開始。10/2–3が間の日'}
  ],
  history: [
    ['2024-02','JEC World'],['2024-03','Logimat'],['2024-06','ICNAP'],['2024-10','ITMA-ASIA'],['2024-11','Fraunhofer IME'],['2024-12','ICNAP'],
    ['2025-01','CES'],['2025-04','GITEX-ASIA'],['2025-05','Tech Ex North America, Humanoid Summit'],['2025-08','Fraunhofer IFA, IPA, IML'],['2025-09','EMO'],['2025-12','ICNAP'],
    ['2026-05','Semicon SEA'],['2026-05','Robotics Summit & Expo, ICRA'],['2026-07','RSS'],['2026-09','Humanoid Robots Summit'],['2026-10','EuroBLECH, Tech Ex Euro']
  ],
  decisions: [
    {title:'3月：LogiMATかGTCか', text:'本人提示は二者択一。LogiMATは2027-03-16〜2027-03-18。GTCはトップで2027-03-15〜2027-03-18、FAQで2027-03-14〜2027-03-18。開始日の範囲は公式内でも不一致だが、会期の重複は確認できる', next:'具体的な訪問先・セッションと今回の視察目的を比べて選ぶ'},
    {title:'4月：ProMatに本人も行くか', text:'事業部がアルファボットを出すようだ、という本人情報。出展の確定、製品名表記、支援役割、本人参加は社内確認前。公開資料から出展を確認した事実とは扱わない', next:'事業部の計画と、自分が現地で担う役割を確認する'},
    {title:'6〜7月：ドイツ視察と任意のRSS', text:'RoboCupは一般見学2027-06-17〜2027-06-20、シンポジウムは2027-06-21。automaticaは2027-06-22〜2027-06-25。RSS会期は2027-07-06〜2027-07-11で、本人提示は2027-07-04〜2027-07-13', next:'RoboCupの入場区分と移動日を決め、RSSを追加する目的・期間負担を検討する'},
    {title:'9〜10月：ITMA、IROS、EMOの組み方', text:'ITMA終了2027-09-22からIROS開始2027-09-26までの間の日は9/23〜25。IROS終了2027-10-01からEMO開始2027-10-04までの間の日は10/2〜3。日程上の接続可能性であり、交通・宿泊・全期間滞在の承認は未確認', next:'ITMAとIROSの間で帰国するか、IROS＋EMOだけを続けるか、本人の参加日を決める'}
  ],
  extraEvents: [
    {id:'personal-robocup-2027', name:'RoboCup 2027', dateStatus:'confirmed', sortDate:'2027-06-15', year:2027, dateLabel:'公式表記：6/15–21 ／ 大会サイト6/17–21', location:'Nuremberg Exhibition Center, Nuremberg, Germany', status:'個人候補', assignment:'村上（本人提示案）', purpose:'個人予定用に追加。一般見学は6/17–20、シンポジウムは6/21（別途有効なチケットが必要）。6/15–16に一般見学できるとは判断しない'}
  ],
  official: {
    '20270316-logimat-2027':{label:'2027-03-16 – 2027-03-18', location:'Messe Stuttgart, Stuttgart, Germany', sources:[['LogiMAT公式','https://www.logimat-messe.de/en/node']]},
    '20270314-gtc-2027':{label:'2027-03-15 – 2027-03-18（トップ）／2027-03-14 – 2027-03-18（FAQ）', location:'San Jose, California, United States', note:'公式ページ間で開始日が不一致。登録時に対象日・プログラムを再確認', sources:[['NVIDIA GTC','https://www.nvidia.com/gtc/'],['NVIDIA FAQ','https://www.nvidia.com/gtc/faq/']]},
    '20270419-promat-2027':{label:'2027-04-19 – 2027-04-21', location:'Chicago, Illinois, United States', sources:[['MHI公式出展案内（PDF）','https://www.promatshow.com/downloads/exhibitors/exhibitor-brochure.pdf']]},
    '20270524-icra-2027':{label:'2027-05-24 – 2027-05-28', location:'Seoul, Republic of Korea', sources:[['ICRA公式','https://2027.ieee-icra.org/about/']]},
    'personal-robocup-2027':{label:'全体6/15–21 ／ 大会サイト6/17–21 ／ 一般見学6/17–20（2027年）', location:'Nuremberg Exhibition Center, Nuremberg, Germany', note:'6/21は別チケットのシンポジウム。見学時間・入場条件は今後の発表を確認', sources:[['RoboCup Deutschland','https://wm.robocup.de/'],['RoboCup 2027','https://2027.robocup.org/wm27/de/'],['一般見学案内','https://wm.robocup.de/wm27/visit/visitors']]},
    '20270622-automatica-2027':{label:'2027-06-22 – 2027-06-25', location:'Trade Fair Center Messe München, Munich, Germany', sources:[['Messe München公式','https://messe-muenchen.de/en/events/automatica-2027.html']]},
    '20270706-rss-2027':{label:'2027-07-06 – 2027-07-11', location:'Athens, Greece（詳細会場は未発表）', sources:[['RSS公式','https://roboticsconference.org/']]},
    '20270916-itma-2027':{label:'2027-09-16 – 2027-09-22', location:'Messegelaende Hannover, Hannover, Germany', sources:[['ITMA公式FAQ','https://itma.com/faqs']]},
    '20270926-iros-2027':{label:'2027-09-26 – 2027-10-01', location:'Florence, Italy', note:'大会URLは確認時に2023年ページへ転送されたため、IEEE RASの将来開催一覧を出典に使用', sources:[['IEEE RAS公式一覧','https://www.ieee-ras.org/conferences-workshops/financially-co-sponsored/iros/iros-past-and-future-venues/']]},
    '20271004-emo-milano-2027':{label:'2027-10-04 – 2027-10-08', location:'Fieramilano, Milan, Italy', note:'全体俯瞰の10/4–9と差がある。個人ページの開催期間は今回確認した公式表示', sources:[['EMO公式','https://www.emo-milan.com/']]}
  }
};
