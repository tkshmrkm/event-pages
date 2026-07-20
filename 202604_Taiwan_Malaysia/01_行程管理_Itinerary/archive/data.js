// 旅程データ
const TRIP_DATA = {
    title: '出張旅程 TW-MY 2026',
    period: '4/28 (火) - 5/7 (木)',

    // 現金必要額
    cash: {
        taiwan: {
            amount: '1,000 TWD',
            jpy: '≈ 4,700円',
            method: '空港ATMで引出',
            purpose: '💡 夜市用（1回分+予備）',
            period: '台湾 (4/28-5/2)',
            color: 'teal'
        },
        malaysia: {
            amount: '150 MYR',
            jpy: '≈ 5,000円',
            method: '空港ATMで引出',
            purpose: '💡 ホーカー昼食3-4回分',
            period: 'マレーシア (5/2-5/6)',
            color: 'purple'
        },
        note: 'その他はカード可: コンビニ、Uber/Grab、ホテル、レストラン'
    },

    // ホテル情報
    hotels: [
        {
            name: 'K Hotel Dunnan',
            nameLatin: '柯達大飯店 台北敦南',
            period: '4/28-5/2',
            address: 'No. 238, Section 2, Dunhua S Rd, Da\'an District, Taipei',
            phone: '+886227323333',
            color: 'teal'
        },
        {
            name: 'Holiday Inn Express KLCC',
            period: '5/2-5/6',
            address: '84, Jalan Raja Chulan, 50200 Kuala Lumpur',
            phone: '+60321611111',
            color: 'purple'
        }
    ],

    // チェックリスト
    checklist: [
        '🇹🇼 台湾 入国カード (任意・e-Gate用)',
        '🇲🇾 MDAC登録 (4/30以降必須)',
        '💳 Revolut チャージ & 設定確認',
        '📱 Uber (台湾) / Grab (MY) アプリ',
        '📄 E-Ticket / ホテル予約書印刷',
        '🔌 変換プラグ (BFタイプ)',
        '📋 名刺 (SEMICON用に多めに)',
        '💊 常備薬・胃腸薬'
    ],

    // 緊急連絡先
    emergency: [
        { name: '会社緊急連絡先', phone: '0300000000' },
        { name: '🇹🇼 台湾 日本窓口', phone: '+886227138000' },
        { name: '🇲🇾 マレーシア大使館', phone: '+60321772600' }
    ],

    // フライト情報
    flights: [
        {
            title: '✈️ 往路1: 日本→台湾',
            date: '4/28(火)',
            departure: '18:30 関空(KIX)発',
            arrival: '20:30 台北桃園(TPE)着',
            details: 'EVA Air NH805 / 約3時間',
            color: 'gray'
        },
        {
            title: '✈️ 往路2: 台湾→マレーシア',
            date: '5/2(土)',
            departure: '15:10 台北桃園(TPE)発',
            arrival: '20:05 クアラルンプール(KUL)着',
            details: 'Malaysia Airlines MH367 / 約5時間',
            color: 'purple'
        },
        {
            title: '✈️ 復路: マレーシア→日本',
            date: '5/6(水)',
            departure: '22:25 クアラルンプール(KUL)発',
            arrival: '5/7(木) 05:40 関空(KIX)着',
            details: 'Malaysia Airlines MH052 / 約6時間 (深夜便)',
            color: 'green'
        }
    ],

    // 日別スケジュール
    schedule: [
        {
            date: '4/28(火)',
            location: '08:00-12:00 自宅WEB会議\n18:30 KIX発 → 22:00-22:30台湾着',
            contactTime: '22:30以降'
        },
        {
            date: '4/29(水)',
            location: '台湾(実験)',
            contactTime: '21時以降'
        },
        {
            date: '4/30(木)',
            location: '台湾(実験)',
            contactTime: '21時以降'
        },
        {
            date: '5/1(金)',
            location: '台湾(終日WEB会議)\nホテルで在宅勤務',
            contactTime: '19時以降',
            highlight: true
        },
        {
            date: '5/2(土)',
            location: '台湾→マレーシア移動\n15:10 TPE発 → 22:30-23:00 KL着',
            contactTime: '23:30以降'
        },
        {
            date: '5/3(日)',
            location: 'マレーシア(観光)\nツインタワー・市内散策',
            contactTime: '終日OK',
            highlight: true
        },
        {
            date: '5/4(月)',
            location: 'マレーシア(市場視察)',
            contactTime: '20時以降'
        },
        {
            date: '5/5(火)',
            location: 'マレーシア(SEMICON展示会1日目)',
            contactTime: '20時以降'
        },
        {
            date: '5/6(水)',
            location: 'マレーシア(展示会2日目)→帰国\n22:25 KUL発(深夜便)',
            contactTime: '18時まで'
        },
        {
            date: '5/7(木)',
            location: '帰宅\n05:40 KIX着 → 08:00頃自宅',
            contactTime: '機内(連絡不可)',
            highlight: true
        }
    ],

    // 審査官提示カード
    immigrationCards: [
        {
            id: 'tw',
            country: '🇹🇼 台湾',
            date: '4/28 (火)',
            lang: 'zh',
            accentColor: '#0e7490',   // teal-700
            lightColor:  '#f0fdfa',   // teal-50
            borderColor: '#14b8a6',   // teal-500
            purpose: {
                label: '渡航目的',
                en: 'Technical meeting with local partner',
                local: '技術会議（現地パートナーとの打合せ）',
                localLang: '技術會議（與當地合作夥伴）'
            },
            stay: {
                label: '滞在期間',
                en: '5 nights (Apr 28 – May 2)',
                local: '5泊'
            },
            hotel: {
                label: '宿泊先',
                en: 'K Hotel Dunnan, Taipei',
                local: '柯達大飯店 台北敦南'
            },
            job: {
                label: '職業',
                en: 'Engineer (Japanese company)',
                local: 'エンジニア（日本企業）'
            },
            qa: [
                { q: 'Purpose of visit?', a: 'Technical meeting. I\'m an engineer attending discussions with our local partner.' },
                { q: 'How long will you stay?', a: '5 nights. I leave on May 2nd.' },
                { q: 'Where are you staying?', a: 'K Hotel Dunnan in Taipei.' },
                { q: 'Do you have a return ticket?', a: 'Yes. Malaysia Airlines MH367 on May 2nd.' }
            ]
        },
        {
            id: 'my',
            country: '🇲🇾 マレーシア',
            date: '5/2 (土)',
            lang: 'ms',
            accentColor: '#7e22ce',   // purple-800
            lightColor:  '#faf5ff',   // purple-50
            borderColor: '#a855f7',   // purple-500
            purpose: {
                label: '渡航目的',
                en: 'Attending SEMICON SEA 2026 (trade exhibition)',
                local: '半導体展示会（SEMICON SEA）参加',
                localLang: 'Menghadiri pameran SEMICON SEA 2026'
            },
            stay: {
                label: '滞在期間',
                en: '4 nights (May 2 – May 6)',
                local: '4泊'
            },
            hotel: {
                label: '宿泊先',
                en: 'Holiday Inn Express KLCC, Kuala Lumpur',
                local: 'Holiday Inn Express KLCC'
            },
            job: {
                label: '職業',
                en: 'Engineer (Japanese company)',
                local: 'エンジニア（日本企業）'
            },
            qa: [
                { q: 'Purpose of visit?', a: 'I\'m attending SEMICON SEA, a semiconductor trade exhibition at MITEC.' },
                { q: 'How long will you stay?', a: '4 nights. I leave on May 6th.' },
                { q: 'Where are you staying?', a: 'Holiday Inn Express KLCC in Kuala Lumpur.' },
                { q: 'Do you have a return ticket?', a: 'Yes. Malaysia Airlines MH052 on May 6th.' },
                { q: 'Do you have MDAC registration?', a: 'Yes, I registered before arrival.' }
            ]
        }
    ],

    // イミグレ書類チェック
    immigrationDocs: {
        taiwan: {
            label: '🇹🇼 台湾入国 (4/28)',
            color: 'teal',
            items: [
                { id: 'tw_passport', label: 'パスポート', note: '有効期限6ヶ月以上・入国日確認' },
                { id: 'tw_return', label: '帰りのチケット (E-Ticket)', note: 'MH367 5/2 TPE→KUL' },
                { id: 'tw_hotel', label: 'ホテル予約確認書', note: 'K Hotel Dunnan 4/28-5/2' },
                { id: 'tw_egate', label: 'e-Gate登録 (任意)', note: '登録済みなら入国審査が高速化' }
            ]
        },
        malaysia: {
            label: '🇲🇾 マレーシア入国 (5/2)',
            color: 'purple',
            items: [
                { id: 'my_passport', label: 'パスポート', note: '有効期限6ヶ月以上' },
                { id: 'my_mdac', label: 'MDAC登録完了', note: '4/30以降に登録・スクリーンショット保存推奨', required: true },
                { id: 'my_return', label: '帰りのチケット (E-Ticket)', note: 'MH052 5/6 KUL→KIX' },
                { id: 'my_hotel', label: 'ホテル予約確認書', note: 'Holiday Inn Express KLCC 5/2-5/6' },
                { id: 'my_semicon', label: 'SEMICON SEA 入場パス (QR)', note: '5/5・5/6 MITEC会場' }
            ]
        }
    }
};

// 日程データ
const ITINERARY_DAYS = [
    {
        date: '4/28 (火)',
        title: '移動日 JP→TW',
        gradient: 'from-red-400 to-blue-400',
        sections: [
            {
                type: 'timeline',
                time: '🏠 08:00 - 12:00',
                title: '自宅でWEB会議',
                borderColor: 'orange-300',
                content: '• 背景・マイク確認必須<br>• 機材セットアップ完了'
            },
            {
                type: 'timeline',
                time: '12:00 - 14:00',
                title: '昼食・出発準備',
                borderColor: 'green-300',
                content: '• 荷物最終チェック<br>• 忘れ物確認（パスポート・充電器・薬等）'
            },
            {
                type: 'transport',
                time: '14:00 自宅出発',
                title: '中書島 → 京都駅 → 関西空港',
                borderColor: 'blue-300',
                routes: [
                    { name: '京阪+はるか', departure: '14:00頃', arrival: '16:05', duration: '2h', note: '推奨', recommended: true },
                    { name: 'タクシー+はるか', departure: '14:00頃', arrival: '16:05', duration: '2h', note: '楽' },
                    { name: 'リムジンバス', departure: '14:30', arrival: '16:10', duration: '1h40m', note: '直行' }
                ],
                details: '14:00 自宅出発 → <strong>14:08 中書島駅着（徒歩8分）</strong><br>14:10頃 京阪中書島発 → 14:25頃 京都駅着（京阪15分）<br>→ 駅構内で軽食・休憩（30分）<br>14:55頃 はるか乗り場へ移動<br><strong>15:00 JR特急はるか 京都発</strong><br><strong>16:05 関西空港着</strong>',
                cost: '京阪 220円 + はるか自由席 1,200円 + 乗車券 = <strong>約1,800円</strong>'
            },
            {
                type: 'checkin',
                title: 'チェックイン時間',
                subtitle: '16:00-16:15 到着 (18:30発の2.5h前)',
                bgColor: '#bfdbfe'
            },
            {
                type: 'airport-plans',
                time: '16:00 - 18:30',
                title: '関西空港での過ごし方 (2.5時間)',
                plans: [
                    {
                        title: '📋 プランA: 即チェックイン型 (推奨)',
                        color: 'green',
                        content: '16:05 到着 → 16:10 EVAカウンター → 16:25 保安検査 → 16:40 KIX Lounge Kansai入室<br><strong>メリット:</strong> ラウンジで約2時間ゆっくり休憩・軽食可能'
                    },
                    {
                        title: '🛍️ プランB: 買い物型',
                        color: 'blue',
                        content: '16:05 到着 → エアロプラザで買い物(40分) → 16:50 EVAカウンター → 17:10 ラウンジ<br><strong>メリット:</strong> お土産・忘れ物購入できる'
                    },
                    {
                        title: '☕ プランC: 制限区域外休憩型',
                        color: 'purple',
                        content: '16:05 到着 → カフェで仕事/メール処理(1h) → 17:10 EVAカウンター → 17:30 ラウンジ<br><strong>メリット:</strong> WiFi作業、最後まで自由に動ける'
                    }
                ],
                lounge: 'KIX Lounge Kansai',
                flight: 'EVA Air NH805 18:30 → TPE 20:30 (3h)'
            },
            {
                type: 'arrival',
                time: '20:30 到着',
                title: '台北桃園空港 (TPE)',
                borderColor: 'blue-300',
                processingTime: '⏱️ 入国手続き時間: 入国審査(e-Gate)+荷物受取で約30-40分<br>→ <strong>21:00-21:10頃</strong>に到着ロビーへ',
                tasks: [
                    '入国審査 (e-Gate利用: 比較的早い)',
                    '荷物受取（ターンテーブル待ち込み）',
                    '<strong>Revolut ATM両替: 1,000 TWD</strong>',
                    'eSIM ON',
                    'Uber手配 (約50分 / カード決済)'
                ]
            },
            {
                type: 'hotel-arrival',
                time: '22:00-22:30',
                hotel: 'K Hotel Dunnan',
                checkin: '15:00',
                note: '深夜到着OK',
                bgColor: '#bfdbfe'
            }
        ]
    },
    {
        date: '4/29 (水)',
        title: '実験 Day1 🎌',
        gradient: 'from-blue-500 to-blue-600',
        sections: [
            { type: 'simple', time: '08:30', title: 'ホテル出発 → 実験会場', borderColor: 'blue-300', content: 'Uber手配、機材搬入確認' },
            { type: 'simple', time: '09:00 - 18:00', title: '【業務】技術実験', borderColor: 'orange-300', content: '終日対応、昼食は施設近隣（カード可）' },
            { type: 'simple', time: '18:00 -', title: '夕食 / 現地会食', borderColor: 'green-300', content: '現地スタッフと会食の可能性（カード可）' }
        ]
    },
    {
        date: '4/30 (木)',
        title: '実験 Day2',
        gradient: 'from-blue-500 to-blue-600',
        sections: [
            { type: 'simple', time: '09:00 - 18:00', title: '【業務】技術実験', borderColor: 'orange-300', content: '終日対応、実験終了・撤収' },
            { type: 'simple', time: '19:00 -', title: '夕食 (台北市内)', borderColor: 'green-300', content: '大安区レストラン（カード可） または 通化街夜市（<strong>現金 500-800 TWD</strong>）' },
            { type: 'warning', title: '重要: MDAC登録', content: 'マレーシア入国3日前。本日中に登録必須。' }
        ]
    },
    {
        date: '5/01 (金)',
        title: 'WEB会議 (祝日)',
        gradient: '',
        color: 'blue-400',
        sections: [
            { type: 'warning-box', borderColor: 'orange-300', title: '⚠️ 時差注意: 日本09:00 = 現地08:00', content: '【業務】WEB会議 (終日)<br>背景設定・マイク確認必須<br>昼食: Uber Eats（カード可） or コンビニ（カード可）' },
            { type: 'info-box', borderColor: 'green-300', title: '<i class="fas fa-suitcase mr-2"></i>夕方: パッキング & MDAC確認', content: '明日移動。Revolut両替推奨(週末手数料回避)。', textColor: 'blue-800' }
        ]
    },
    {
        date: '5/02 (土)',
        title: '移動 TW→MY',
        gradient: 'from-blue-400 to-purple-400',
        sections: [
            { type: 'simple', time: '10:30-11:30', title: 'ホテルチェックアウト準備', borderColor: 'green-400', content: '荷物整理・忘れ物チェック' },
            { type: 'simple', time: '11:30', title: 'K Hotel Dunnan チェックアウト', borderColor: 'green-300', content: '<strong>桃園空港へタクシー移動</strong><br>• 所要時間: 約50-60分（交通状況により変動）<br>• 料金: カード決済可<br>• 推奨: 11:40までにタクシー出発' },
            { type: 'checkin', title: 'チェックイン時間', subtitle: '12:30-12:40 到着 (15:10発の2.5h前)', note: '国際線推奨: 最低でも13:10（2h前）', bgColor: '#bfdbfe' },
            { type: 'lounge', time: '12:40 - 15:10', title: '台北桃園空港ラウンジ', borderColor: 'blue-300', lounges: ['Cathay Pacific Lounge (OneWorld Sapphire)', 'Priority Pass対象ラウンジも利用可'], flight: 'MH367 15:10 → KUL 20:05 (4h55m)' },
            { type: 'arrival', time: '20:05 到着', title: 'クアラルンプール空港 (KLIA)', borderColor: 'purple-600', alert: 'MDAC提示必須', processingTime: '⏱️ 入国手続き時間: 入国審査(MDAC)+荷物受取で約30-40分<br>→ <strong>20:45-21:00頃</strong>に到着ロビーへ', tasks: ['入国審査 (MDAC提示・Autogate利用可)', '荷物受取（ターンテーブル待ち込み）', '<strong>Revolut ATM両替: 150 MYR</strong>', 'Grab手配 (Door 3/4付近 / 約60分 / カード決済)'] },
            { type: 'hotel-arrival', time: '22:30-23:00', hotel: 'Holiday Inn Express KLCC', checkin: '15:00', note: 'デポジット必要 (Amex等)', bgColor: '#e9d5ff' }
        ]
    },
    {
        date: '5/03 (日)',
        title: '観光＆リラックス 🌟',
        gradient: '',
        color: 'purple-400',
        sections: [
            { type: 'simple', time: '09:00 - 10:00', title: '朝食 & 準備', borderColor: 'green-300', content: 'ホテルまたはKLCC Suria内（カード可）' },
            { type: 'simple', time: '10:00 - 12:00', title: 'ペトロナスツインタワー展望台', borderColor: 'blue-300', content: '🎫 <strong>事前予約推奨</strong> (公式サイトまたは現地購入)<br>• Sky Bridge (41-42F) + Observation Deck (86F)<br>• 料金: 約85 MYR（カード可）<br>• 📸 絶景撮影スポット・KL一望' },
            { type: 'simple', time: '12:00 - 13:00', title: '昼食: KLCC Suria / Pavilion KL', borderColor: 'green-300', content: 'フードコートで現地料理（<strong>現金 20-30 MYR</strong>）または<br>レストラン（カード可・Din Tai Fung等）' },
            { type: 'activity', time: '13:00 - 13:30', title: 'KLCC公園散策', borderColor: 'green-500', content: '• 噴水ショー（昼12時・夕方6時）<br>• のんびり散歩・写真撮影<br>• 徒歩圏内（ホテルから5分）' },
            { type: 'rest', time: '14:00 - 17:30', title: 'ホテルで休憩', content: '💤 仮眠・シャワー<br>🧺 洗濯<br>📧 メール処理・明日準備<br>☕ ホテル周辺カフェでゆっくり（任意）' },
            { type: 'simple', time: '18:00 - 19:30', title: 'KL Tower サンセット展望（任意）', borderColor: 'pink-500', content: '• Grab 10分（往復 約40 MYR）<br>• 入場料: 約60 MYR<br>• 360度パノラマビュー・夕景最高<br>• <strong>疲れていればスキップ可</strong>' },
            { type: 'simple', time: '19:30 - 21:00', title: '夕食: Jalan Alor 屋台街（推奨）', borderColor: 'red-500', content: '• Grab 10分（片道 約15 MYR）<br>• 有名な屋台グルメストリート<br>• 予算: <strong>現金 40-60 MYR</strong><br>• 🍜 海鮮BBQ、チキンウィング、炒め物等<br><strong>代替案:</strong> 疲れている場合はPavilion KL内レストラン（徒歩圏）' },
            { type: 'budget', title: '予算目安（5/3）', items: ['展望台: 85 MYR（カード可）', '昼食: 20-30 MYR（現金）or 50-80 MYR（カード）', 'KL Tower: 60 MYR + Grab 40 MYR（任意）', '夕食: 40-60 MYR（現金）'], total: '合計: 約145-270 MYR（休日満喫版）' }
        ]
    },
    {
        date: '5/04 (月)',
        title: '市場視察',
        gradient: '',
        color: 'purple-400',
        sections: [
            { type: 'simple', time: '10:00 -', title: '視察① The Exchange TRX', borderColor: 'blue-300', content: 'Grab約10分、最新モールの物流動線確認' },
            { type: 'simple', time: '12:00 -', title: '昼食 (ホーカー等)', borderColor: 'green-300', content: 'ホーカー/フードコート（<strong>現金 20-30 MYR</strong>）推奨' },
            { type: 'simple', time: '14:00 -', title: '視察② Pavilion KL', borderColor: 'blue-300', content: '徒歩圏内、小売店舗の省人化確認' }
        ]
    },
    {
        date: '5/05 (火)',
        title: 'SEMICON Day1',
        gradient: '',
        color: 'purple-400',
        sections: [
            { type: 'warning-box', borderColor: 'blue-300', title: 'ホテル → MITEC会場', time: '08:30 出発', content: '⚠️ 朝の渋滞注意 (通常20分→40分想定)<br>Grab推奨（カード可）' },
            { type: 'simple', time: '10:00 - 18:00', title: 'SEMICON SEA 参加', borderColor: 'orange-300', content: '入場パス(QR)・名刺・メモ準備' },
            { type: 'simple', time: '12:00 -', title: '昼食', borderColor: 'green-300', content: '会場内フードコート（<strong>現金 30-40 MYR</strong>）またはレストラン（カード可）' }
        ]
    },
    {
        date: '5/06 (水)',
        title: '帰国日',
        gradient: 'from-purple-400 to-red-400',
        sections: [
            { type: 'simple', time: '08:00', title: 'チェックアウト', borderColor: 'green-400', content: '荷物をホテルへ預けて会場へ' },
            { type: 'simple', time: '09:30 - 16:00', title: 'SEMICON SEA 2日目', borderColor: 'orange-300', content: '16:00撤収、ホテルで荷物ピック' },
            { type: 'simple', time: '12:00 -', title: '昼食', borderColor: 'green-300', content: '会場内（<strong>現金 30-40 MYR</strong>）' },
            { type: 'transport', time: '16:30 - 17:30', title: 'KLCC → KL Sentral → KLIA空港', borderColor: 'blue-300', routes: [
                { name: 'KLIA Express', departure: '17:00', arrival: '17:33', cost: '55 MYR', risk: '☆☆☆ 最低', recommended: true },
                { name: 'KLIA Express', departure: '18:00', arrival: '18:33', cost: '55 MYR', risk: '★☆☆ やや不安' },
                { name: 'Grab', departure: '17:30', arrival: '18:00-19:00', cost: '80 MYR', risk: '★★★ 渋滞大' }
            ], details: 'KL Sentral駅まで徒歩 or Grab 5分、Express 33分で空港着（カード可）' },
            { type: 'checkin', title: 'チェックイン時間', subtitle: '17:33 到着 (22:25発の5h前)', note: '推奨チェックイン: 19:55（2.5h前）～20:25（2h前）', bgColor: '#e9d5ff' },
            { type: 'lounge-detailed', time: '17:40 - 22:25', title: 'KLIAラウンジ（約4.5時間）', borderColor: 'gray-300', lounges: [
                { name: 'Malaysia Airlines Golden Lounge', color: 'green', access: 'OneWorld Sapphire', features: '🚿 シャワー・着替え / 💤 仮眠室 / 🍽️ 食事', note: '深夜便前の長時間滞在に最適' },
                { name: 'Priority Pass対象ラウンジ', color: 'blue', facilities: ['Plaza Premium Lounge（複数箇所）', 'Sama-Sama Express KLIA Lounge'], note: 'シャワー・軽食（ラウンジにより異なる）<br>注意: 滞在時間制限あり（通常3時間）' }
            ], flight: 'MH052 22:25 → KIX 翌05:40 (6h15m)' }
        ]
    },
    {
        date: '5/07 (木)',
        title: '帰国完了',
        gradient: '',
        color: 'red-400',
        sections: [
            { type: 'simple', time: '05:40 着', title: '関西国際空港 (KIX) 到着', borderColor: 'gray-300', content: 'お帰りなさい。自動化ゲートで入国。' },
            { type: 'simple', time: '06:30 頃', title: '自宅へ移動', borderColor: 'blue-400', content: 'はるか / リムジンバス / MK（カード可）<br>朝ラッシュ注意' },
            { type: 'complete', title: '🏁 08:00 京都到着・出張完了', content: 'お疲れ様でした!' }
        ]
    }
];