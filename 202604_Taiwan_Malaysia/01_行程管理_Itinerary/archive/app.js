// ユーティリティ関数
const utils = {
    // HTML要素を作成
    createElement(tag, classes = '', content = '') {
        const el = document.createElement(tag);
        if (classes) el.className = classes;
        if (content) el.innerHTML = content;
        return el;
    },

    // 電話リンクを生成
    createPhoneLink(phone, displayText = '電話') {
        return `<a href="tel:${phone}" class="flex-1 bg-gray-500 text-white text-center py-2 rounded font-semibold text-sm">
            <i class="fas fa-phone mr-1"></i>${displayText}
        </a>`;
    },

    // 地図リンクを生成
    createMapLink(address) {
        const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
        return `<a href="${url}" target="_blank" class="flex-1 bg-gray-500 text-white text-center py-2 rounded font-semibold text-sm">
            <i class="fas fa-map-marker-alt mr-1"></i>地図
        </a>`;
    }
};

// コンポーネント生成関数
const components = {
    // 現金必要額サマリー
    cashSummary(data) {
        return `
            <div class="bg-white rounded-lg shadow p-4">
                <h2 class="font-bold text-lg mb-3"><i class="fas fa-money-bill-wave text-green-600 mr-2"></i>現金必要額</h2>
                <div class="grid grid-cols-2 gap-4">
                    ${this.cashItem(data.taiwan, 'gray')}
                    ${this.cashItem(data.malaysia, 'purple')}
                </div>
                <div class="mt-3 bg-gray-50 border-l-4 border-blue-400 p-3 text-sm">
                    <strong>その他はカード可:</strong> ${data.note}
                </div>
            </div>
        `;
    },

    cashItem(item, borderColor) {
        return `
            <div class="border-l-4 border-${borderColor}-${borderColor === 'gray' ? '300' : '500'} pl-3">
                <div class="text-sm text-gray-600">${item.period}</div>
                <div class="text-2xl font-bold text-${item.color}-600">${item.amount}</div>
                <div class="text-xs text-gray-500 mt-1">${item.jpy} / ${item.method}</div>
                <div class="text-xs text-gray-600 mt-2">${item.purpose}</div>
            </div>
        `;
    },

    // 日付カード
    dayCard(day) {
        const headerClass = day.gradient ?
            `bg-gradient-to-r ${day.gradient}` :
            `bg-${day.color}`;

        return `
            <div class="bg-white rounded-lg shadow">
                <div class="${headerClass} text-white p-4 font-bold">
                    ${day.date} ${day.title}
                </div>
                <div class="p-4 space-y-${day.sections.some(s => s.type === 'transport') ? '4' : '3'}">
                    ${day.sections.map(s => this.renderSection(s)).join('')}
                </div>
            </div>
        `;
    },

    // セクションをレンダリング
    renderSection(section) {
        const renderers = {
            'simple': this.simpleSection,
            'timeline': this.simpleSection,
            'transport': this.transportSection,
            'checkin': this.checkinSection,
            'airport-plans': this.airportPlansSection,
            'arrival': this.arrivalSection,
            'hotel-arrival': this.hotelArrivalSection,
            'warning': this.warningSection,
            'warning-box': this.warningBoxSection,
            'info-box': this.infoBoxSection,
            'lounge': this.loungeSection,
            'activity': this.simpleSection,
            'rest': this.restSection,
            'budget': this.budgetSection,
            'lounge-detailed': this.loungeDetailedSection,
            'complete': this.completeSection
        };

        const renderer = renderers[section.type] || this.simpleSection;
        return renderer.call(this, section);
    },

    simpleSection(s) {
        return `
            <div class="border-l-4 border-${s.borderColor} pl-4 py-2${s.type === 'activity' ? ' bg-gray-50' : ''}">
                ${s.time ? `<div class="text-sm text-gray-600">${s.time}</div>` : ''}
                <div class="font-semibold${s.title.includes('【業務】') ? ' text-lg' : ''}">${s.title}</div>
                ${s.content ? `<div class="text-sm text-gray-600${s.time ? ' mt-2' : ' mt-1'}">${s.content}</div>` : ''}
            </div>
        `;
    },

    transportSection(s) {
        return `
            <div class="border-l-4 border-${s.borderColor} pl-4 py-2">
                <div class="text-sm text-gray-600">${s.time}</div>
                <div class="font-semibold text-lg">${s.title}</div>
                <div class="mt-3">
                    <div class="text-sm font-semibold mb-2">移動${s.routes[0].cost ? '手段' : 'ルート'}比較</div>
                    <table class="transport-table">
                        <thead>
                            <tr>
                                <th>${s.routes[0].cost ? '手段' : 'ルート'}</th>
                                <th>出発</th>
                                <th>到着</th>
                                <th>${s.routes[0].cost ? '料金' : '所要'}</th>
                                <th>${s.routes[0].risk ? 'リスク' : '備考'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${s.routes.map(r => `
                                <tr${r.recommended ? ' class="recommended"' : ''}>
                                    <td>${r.recommended ? '<strong>' + r.name + '</strong>' : r.name}</td>
                                    <td>${r.departure}</td>
                                    <td>${r.arrival}</td>
                                    <td>${r.cost || r.duration}</td>
                                    <td class="${r.risk ? this.getRiskClass(r.risk) : 'risk-low'}">${r.risk || r.note}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="mt-2 text-sm text-blue-700 font-semibold">
                        <i class="fas fa-check-circle mr-1"></i>推奨: ${s.routes.find(r => r.recommended).name} ${s.routes.find(r => r.recommended).departure}発${s.routes[0].risk ? ' (余裕3h / 確実性最高)' : ''}
                    </div>
                    ${s.details ? `
                        <div class="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
                            <strong>詳細${s.routes[0].cost ? '' : 'ルート（推奨プラン）'}:</strong><br>
                            ${s.details}
                        </div>
                    ` : ''}
                    ${s.cost ? `
                        <div class="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                            <strong>料金:</strong> ${s.cost}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    getRiskClass(risk) {
        if (risk.includes('☆☆☆')) return 'risk-low';
        if (risk.includes('★☆☆')) return 'risk-mid';
        if (risk.includes('★★★')) return 'risk-high';
        return 'risk-low';
    },

    checkinSection(s) {
        return `
            <div class="checkin-box" style="background: ${s.bgColor};">
                <i class="fas fa-${s.hotel ? 'hotel' : 'plane-arrival'} text-2xl"></i>
                <div>
                    <div class="text-${s.hotel ? 'sm opacity-90' : 'base'}">${s.hotel ? 'ホテル到着予定' : s.title}</div>
                    <div class="text-lg">${s.subtitle || s.time + ' ' + s.hotel}</div>
                    ${s.note ? `<div class="text-xs opacity-90 mt-1">${s.note.includes('チェックイン') ? '標準チェックイン: ' + s.checkin + ' / ' : ''}${s.note}</div>` : ''}
                </div>
            </div>
        `;
    },

    hotelArrivalSection(s) {
        return this.checkinSection({ ...s, hotel: true });
    },

    airportPlansSection(s) {
        return `
            <div class="border-l-4 border-gray-300 pl-4 py-2 bg-gray-50">
                <div class="text-sm text-gray-600">${s.time}</div>
                <div class="font-semibold">${s.title}</div>
                <div class="mt-3 space-y-2">
                    ${s.plans.map(p => `
                        <div class="bg-white p-3 rounded border-l-2 border-${p.color}-300">
                            <div class="font-semibold text-sm text-${p.color}-700">${p.title}</div>
                            <div class="text-xs text-gray-600 mt-1">${p.content}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3 bg-yellow-50 p-2 rounded text-xs">
                    <i class="fas fa-lightbulb text-yellow-600 mr-1"></i>
                    <strong>国際線推奨:</strong> 出発2時間前までにチェックイン完了が安心
                </div>
                <ul class="text-sm text-gray-600 mt-3 space-y-1">
                    <li>• EVAカウンター通常レーン（Star Alliance便）</li>
                    <li>• <strong>ラウンジ: ${s.lounge}</strong>
                        <div class="text-xs mt-1 ml-3">
                            ✅ <strong>SFC資格</strong>（スターアライアンスゴールド）で入場<br>
                            📝 ANAラウンジ閉鎖後はKIX Lounge Kansaiを利用<br>
                            🍛 軽食、🚿 シャワー、📶 WiFi<br>
                            👥 同伴者1名も入室可
                        </div>
                    </li>
                </ul>
                <div class="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded font-semibold text-center">
                    ✈️ ${s.flight}
                </div>
            </div>
        `;
    },

    arrivalSection(s) {
        return `
            <div class="border-l-4 border-${s.borderColor} pl-4 py-2">
                <div class="text-sm text-gray-600">${s.time}</div>
                <div class="font-semibold">${s.title}</div>
                ${s.alert ? `<div class="text-sm font-semibold text-red-600 mt-2">${s.alert}</div>` : ''}
                <div class="bg-gray-50 p-2 rounded mt-2 text-xs text-orange-800">
                    <strong>${s.processingTime}</strong>
                </div>
                <ol class="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                    ${s.tasks.map(task => `<li>${task}</li>`).join('')}
                </ol>
            </div>
        `;
    },

    warningSection(s) {
        return `
            <div class="border-l-4 border-red-500 p-3">
                <div class="font-semibold text-red-800"><i class="fas fa-exclamation-triangle mr-2"></i>${s.title}</div>
                <div class="text-sm text-red-700 mt-1">${s.content}</div>
            </div>
        `;
    },

    warningBoxSection(s) {
        return `
            <div class="border-l-4 border-${s.borderColor} p-3">
                ${s.time ? `<div class="text-sm text-gray-600">${s.time}</div>` : ''}
                <div class="font-semibold text-${s.borderColor === 'orange-300' ? 'red' : 'blue'}-800">${s.title}</div>
                <div class="text-sm text-gray-700 mt-2">${s.content}</div>
            </div>
        `;
    },

    infoBoxSection(s) {
        return `
            <div class="border-l-4 border-${s.borderColor} p-3">
                <div class="font-semibold text-${s.textColor}">${s.title}</div>
                <div class="text-sm ${s.textColor.replace('800', '700')} mt-1">${s.content}</div>
            </div>
        `;
    },

    loungeSection(s) {
        return `
            <div class="border-l-4 border-${s.borderColor} pl-4 py-2">
                <div class="text-sm text-gray-600">${s.time}</div>
                <div class="font-semibold">${s.title}</div>
                <div class="text-sm text-gray-600 mt-2">
                    <strong>ラウンジ選択肢:</strong><br>
                    <div class="ml-3 mt-1">
                        ${s.lounges.map((l, i) => `
                            ✅ <strong>${l}</strong>${i === 0 ? ' (OneWorld Sapphire)' : ''}<br>
                            ${i === 0 ? '<span class="text-xs">└ ヌードルバーで昼食推奨、シャワー可</span>' : '<span class="text-xs">└ Plaza Premium Lounge等</span>'}
                            ${i < s.lounges.length - 1 ? '<br>' : ''}
                        `).join('')}
                    </div>
                </div>
                <div class="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded font-semibold text-center">
                    ✈️ ${s.flight}
                </div>
            </div>
        `;
    },

    restSection(s) {
        return `
            <div class="bg-gray-50 border-l-4 border-gray-400 p-3">
                <div class="font-semibold text-gray-800">${s.time} ${s.title}</div>
                <div class="text-sm text-gray-600 mt-2">${s.content}</div>
            </div>
        `;
    },

    budgetSection(s) {
        return `
            <div class="bg-gray-50 border-l-4 border-gray-300 p-3">
                <div class="font-semibold text-sm text-blue-800">
                    <i class="fas fa-info-circle mr-1"></i>${s.title}
                </div>
                <div class="text-xs text-gray-700 mt-2">
                    ${s.items.map(item => `• ${item}<br>`).join('')}
                    <strong>${s.total}</strong>
                </div>
            </div>
        `;
    },

    loungeDetailedSection(s) {
        return `
            <div class="border-l-4 border-${s.borderColor} pl-4 py-2 bg-gray-50">
                <div class="text-sm text-gray-600">${s.time}</div>
                <div class="font-semibold">${s.title}</div>
                <div class="mt-3 text-sm">
                    ${s.lounges.map(l => `
                        <div class="bg-white p-3 rounded border-l-2 border-gray-300${s.lounges.indexOf(l) < s.lounges.length - 1 ? ' mb-2' : ''}">
                            <div class="font-semibold text-${l.color}-800">
                                ✅ <strong>${l.name}</strong>${l.access ? ' (推奨)' : ''}
                            </div>
                            <div class="text-xs text-gray-700 mt-1 ml-4">
                                ${l.access ? `• アクセス: <strong>${l.access}</strong><br>• 設備: ${l.features}<br>• 特徴: ${l.note}` :
                                            `• ${l.facilities.join('<br>• ')}<br>• ${l.note}`}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded font-semibold text-center">
                    ✈️ ${s.flight}
                </div>
            </div>
        `;
    },

    completeSection(s) {
        return `
            <div class="bg-gray-50 border-l-4 border-green-500 p-3">
                <div class="font-semibold text-green-800 text-lg">${s.title}</div>
                <div class="text-sm text-green-700">${s.content}</div>
            </div>
        `;
    },

    // ホテル情報カード
    hotelCard(hotel) {
        const bgColor = hotel.color === 'teal' ? 'teal-50' : 'gray-50';
        const periodBg = hotel.color === 'teal' ? 'from-blue-500 to-blue-600' : 'purple-400';

        return `
            <div class="mb-4 border-l-4 border-gray-300 pl-4 py-2 bg-${bgColor}">
                <div class="flex justify-between items-start mb-2">
                    <div class="font-bold">${hotel.name}</div>
                    <span class="text-xs bg-${hotel.color === 'teal' ? 'gradient-to-r ' + periodBg : periodBg} text-white px-2 py-1 rounded">${hotel.period}</span>
                </div>
                ${hotel.nameLatin ? `<div class="text-sm text-gray-700 mb-2">${hotel.nameLatin}</div>` : ''}
                <div class="text-xs text-gray-600 bg-white p-2 rounded mb-2">${hotel.address}</div>
                <div class="flex gap-2">
                    ${utils.createPhoneLink(hotel.phone)}
                    ${utils.createMapLink(hotel.address)}
                </div>
            </div>
        `;
    },

    // チェックリスト
    checklist(items) {
        return `
            <div class="bg-white rounded-lg shadow">
                <div class="bg-gray-700 text-white p-4 font-bold flex justify-between items-center">
                    <span><i class="fas fa-clipboard-check mr-2"></i>準備チェックリスト</span>
                    <span id="checkProgress" class="bg-white/20 px-3 py-1 rounded-full text-sm">0/${items.length}</span>
                </div>
                <div class="p-4 space-y-2" id="checklistContainer"></div>
            </div>
        `;
    },

    // 緊急連絡先
    emergencyContacts(contacts) {
        return `
            <div class="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
                <h3 class="font-bold text-red-800 mb-3"><i class="fas fa-exclamation-triangle mr-2"></i>緊急連絡先</h3>
                <div class="space-y-2">
                    ${contacts.map(c => `
                        <a href="tel:${c.phone}" class="flex justify-between items-center p-3 bg-white rounded">
                            <span class="font-semibold">${c.name}</span>
                            <span class="text-red-600 font-bold"><i class="fas fa-phone mr-1"></i>発信</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // イミグレ書類チェックリスト（1国分）
    immigrationDocSection(country) {
        const borderColor = country.color === 'teal' ? 'teal-500' : 'purple-500';
        const headerBg = country.color === 'teal' ? 'from-teal-500 to-teal-600' : 'from-purple-500 to-purple-600';
        const checkBg = country.color === 'teal' ? 'teal-50' : 'purple-50';

        return `
            <div class="rounded-lg overflow-hidden border border-${country.color === 'teal' ? 'teal' : 'purple'}-200">
                <div class="bg-gradient-to-r ${headerBg} text-white px-4 py-3 flex justify-between items-center">
                    <span class="font-bold">${country.label}</span>
                    <span id="imgprog_${country.color}" class="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        0/${country.items.length}
                    </span>
                </div>
                <div class="divide-y divide-gray-100">
                    ${country.items.map(item => {
                        const checked = `localStorage.getItem('img_${item.id}') === 'true'`;
                        return `
                        <label id="imglabel_${item.id}"
                            class="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-${checkBg} transition-colors
                                   ${item.required ? 'bg-red-50' : 'bg-white'}"
                            onclick="toggleImgDoc('${item.id}', '${country.color}', ${country.items.length})">
                            <input type="checkbox" id="imgchk_${item.id}"
                                class="mt-0.5 w-5 h-5 accent-${country.color === 'teal' ? 'teal' : 'purple'}-500 flex-shrink-0"
                                onchange="event.stopPropagation()">
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-sm flex items-center gap-1">
                                    ${item.required ? '<span class="text-red-500 text-xs font-bold">必須</span>' : ''}
                                    <span id="imgtxt_${item.id}">${item.label}</span>
                                </div>
                                <div class="text-xs text-gray-500 mt-0.5">${item.note}</div>
                            </div>
                            <i id="imgicon_${item.id}" class="fas fa-circle-check text-gray-200 text-lg flex-shrink-0 mt-0.5"></i>
                        </label>`;
                    }).join('')}
                </div>
            </div>
        `;
    },

    // フライト情報
    flightInfo(flights) {
        return `
            <div class="bg-white rounded-lg shadow mt-4">
                <div class="bg-gray-600 text-white p-3 font-bold">
                    <i class="fas fa-plane mr-2"></i>フライト情報（全便）
                </div>
                <div class="p-4 space-y-3 text-sm">
                    ${flights.map(f => `
                        <div class="border-l-4 border-${f.color}-${f.color === 'gray' ? '300' : '500'} pl-3 py-2 bg-${f.color === 'purple' ? 'purple-50' : 'gray-50'}">
                            <div class="font-semibold">${f.title}</div>
                            <div class="text-gray-700 mt-1">
                                ${f.date} <strong>${f.departure.split(' ')[0]}</strong> ${f.departure.substring(f.departure.indexOf(' ') + 1)}<br>
                                → <strong>${f.arrival.split(' ')[0]}</strong> ${f.arrival.substring(f.arrival.indexOf(' ') + 1)}<br>
                                <span class="text-xs text-gray-600">${f.details}</span>
                            </div>
                        </div>
                    `).join('')}
                    <div class="bg-gray-50 p-3 rounded">
                        <div class="font-semibold text-gray-800">📍 帰国後</div>
                        <div class="text-gray-700">
                            05:55 関空着 → 自宅へ移動<br>
                            <strong>08:15頃 京都自宅到着予定</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // スケジュールテーブル
    scheduleTable(schedule) {
        return `
            <div class="bg-white rounded-lg shadow mt-4">
                <div class="bg-gray-600 text-white p-3 font-bold">
                    <i class="fas fa-calendar-alt mr-2"></i>日別スケジュール（日本時間）
                </div>
                <div class="p-4">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr class="border-b">
                                <th class="px-3 py-2 text-left font-semibold">日付</th>
                                <th class="px-3 py-2 text-left font-semibold">居場所・予定</th>
                                <th class="px-3 py-2 text-left font-semibold">連絡可</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${schedule.map(s => `
                                <tr${s.highlight ? ' class="bg-' + (s.contactTime === '終日OK' ? 'purple' : s.contactTime.includes('機内') ? 'gray' : 'yellow') + '-50"' : ''}>
                                    <td class="px-3 py-3">${s.date}</td>
                                    <td class="px-3 py-3">
                                        ${s.location.split('\n').map((line, i) =>
                                            i === 0 && s.highlight && !s.contactTime.includes('機内') ?
                                            `<strong>${line}</strong>` :
                                            (i > 0 ? `<div class="text-xs text-gray-600">${line}</div>` : line)
                                        ).join('')}
                                    </td>
                                    <td class="px-3 py-3 text-${
                                        s.contactTime.includes('機内') ? 'gray-400' :
                                        s.contactTime.includes('まで') ? 'orange' :
                                        'green'
                                    }-600 font-semibold">${s.contactTime}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

// ページ管理
const app = {
    init() {
        this.renderItinerary();
        this.renderPrep();
        this.renderFamily();
        this.renderImmigre();
        this.setupTabs();
        this.loadChecklist();
    },

    renderItinerary() {
        const container = document.getElementById('tab-itinerary');
        container.innerHTML = components.cashSummary(TRIP_DATA.cash) +
            ITINERARY_DAYS.map(day => components.dayCard(day)).join('');
    },

    renderPrep() {
        const container = document.getElementById('tab-prep');
        container.innerHTML = `
            ${components.checklist(TRIP_DATA.checklist)}
            ${this.renderImmigrationDocs()}
            <div class="bg-white rounded-lg shadow p-4">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-hotel text-purple-600 mr-2"></i>ホテル情報</h3>
                ${TRIP_DATA.hotels.map(h => components.hotelCard(h)).join('')}
            </div>
            ${components.emergencyContacts(TRIP_DATA.emergency)}
            ${this.renderImmigrationInfo()}
            ${this.renderMDACInfo()}
        `;
        this.loadImmigrationDocs();
    },

    renderImmigrationDocs() {
        const { taiwan, malaysia } = TRIP_DATA.immigrationDocs;
        return `
            <div class="bg-white rounded-lg shadow">
                <div class="bg-gray-700 text-white px-4 py-3 font-bold flex items-center gap-2">
                    <i class="fas fa-passport"></i>
                    <span>入国書類チェック</span>
                </div>
                <div class="p-4 space-y-4">
                    ${components.immigrationDocSection(taiwan)}
                    ${components.immigrationDocSection(malaysia)}
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-xs text-yellow-800">
                        <i class="fas fa-lightbulb mr-1"></i>
                        <strong>ヒント:</strong> 各書類はスクリーンショットまたは印刷してオフラインでも確認できるようにしておくと安心です。
                    </div>
                </div>
            </div>
        `;
    },

    loadImmigrationDocs() {
        const allItems = [
            ...TRIP_DATA.immigrationDocs.taiwan.items,
            ...TRIP_DATA.immigrationDocs.malaysia.items
        ];
        allItems.forEach(item => {
            const checked = localStorage.getItem(`img_${item.id}`) === 'true';
            const chk = document.getElementById(`imgchk_${item.id}`);
            if (chk) chk.checked = checked;
            this.applyImgDocStyle(item.id, checked);
        });
        this.updateImgProgress('teal', TRIP_DATA.immigrationDocs.taiwan.items);
        this.updateImgProgress('purple', TRIP_DATA.immigrationDocs.malaysia.items);
    },

    applyImgDocStyle(id, checked) {
        const label = document.getElementById(`imglabel_${id}`);
        const txt = document.getElementById(`imgtxt_${id}`);
        const icon = document.getElementById(`imgicon_${id}`);
        if (!label) return;
        if (checked) {
            label.classList.add('opacity-50');
            if (txt) txt.classList.add('line-through');
            if (icon) { icon.classList.remove('text-gray-200'); icon.classList.add('text-green-500'); }
        } else {
            label.classList.remove('opacity-50');
            if (txt) txt.classList.remove('line-through');
            if (icon) { icon.classList.add('text-gray-200'); icon.classList.remove('text-green-500'); }
        }
    },

    updateImgProgress(color, items) {
        const count = items.filter(item => localStorage.getItem(`img_${item.id}`) === 'true').length;
        const el = document.getElementById(`imgprog_${color}`);
        if (el) el.textContent = `${count}/${items.length}`;
    },

    renderImmigrationInfo() {
        return `
            <div class="bg-white rounded-lg shadow p-4">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-passport text-red-600 mr-2"></i>入国審査対策</h3>
                <div class="space-y-3 text-sm">
                    <div class="border-l-4 border-red-500 p-3">
                        <div class="font-bold text-red-800">❌ NGワード: "Work"</div>
                        <div class="text-gray-700">就労と誤解されトラブルの元</div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <div class="font-bold text-gray-800 mb-2">Q: Purpose?</div>
                        <div class="text-gray-600">
                            🇹🇼 "Technical meeting"<br>
                            🇲🇾 "Attending SEMICON SEA conference"
                        </div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <div class="font-bold text-gray-800 mb-2">Q: How long?</div>
                        <div class="text-gray-600">"5 days. Return on May 6th"</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderMDACInfo() {
        return `
            <div class="bg-gray-600 text-white rounded-lg shadow p-4 text-center">
                <h3 class="font-bold text-lg mb-2">🇲🇾 MDAC登録 (必須)</h3>
                <p class="text-sm opacity-90 mb-3">
                    到着3日前(4/30以降)に登録<br>
                    登録後、最初の入国でもAutogate利用可
                </p>
                <a href="https://imigresen-online.imi.gov.my/mdac/main" target="_blank"
                    class="block bg-white text-blue-600 font-bold py-3 px-4 rounded-lg">
                    登録サイトを開く <i class="fas fa-external-link-alt ml-1"></i>
                </a>
            </div>
        `;
    },

    renderImmigre() {
        const container = document.getElementById('tab-immigre');
        if (!container) return;
        container.innerHTML = `
            <div class="space-y-6">
                <!-- 説明 -->
                <div class="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-900 rounded">
                    <i class="fas fa-hand-point-up mr-1"></i>
                    審査官に<strong>画面を見せながら</strong>話してください。タップで国を切り替えられます。
                </div>

                <!-- 国切り替えボタン -->
                <div class="flex gap-2">
                    ${TRIP_DATA.immigrationCards.map((c, i) => `
                        <button onclick="switchImmigreCard('${c.id}')"
                            id="imgbtn_${c.id}"
                            class="flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all
                                   ${i === 0 ? 'text-white' : 'bg-white text-gray-500 border-gray-200'}"
                            style="${i === 0 ? `background:${c.accentColor};border-color:${c.accentColor}` : ''}">
                            ${c.country}<br>
                            <span class="text-xs font-normal">${c.date}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- カード表示エリア -->
                ${TRIP_DATA.immigrationCards.map((c, i) => `
                <div id="imgcard_${c.id}" class="${i !== 0 ? 'hidden' : ''}">

                    <!-- ─── メイン提示カード ─── -->
                    <div class="rounded-2xl overflow-hidden shadow-lg border-2" style="border-color:${c.borderColor}">

                        <!-- ヘッダー -->
                        <div class="text-white px-5 py-4" style="background:${c.accentColor}">
                            <div class="text-xs opacity-80 mb-1">入国審査 / Immigration</div>
                            <div class="text-2xl font-bold">${c.country}</div>
                            <div class="text-sm opacity-90 mt-1">日本国籍 / Japanese Passport Holder</div>
                        </div>

                        <!-- 情報グリッド（審査官に見せる部分） -->
                        <div class="bg-white divide-y divide-gray-100">

                            <div class="px-5 py-4">
                                <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Purpose of Visit　渡航目的</div>
                                <div class="text-xl font-bold text-gray-900 leading-snug">${c.purpose.en}</div>
                                <div class="text-sm text-gray-500 mt-1">${c.purpose.localLang}</div>
                            </div>

                            <div class="grid grid-cols-2 divide-x divide-gray-100">
                                <div class="px-5 py-4">
                                    <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Duration　滞在</div>
                                    <div class="text-lg font-bold text-gray-900">${c.stay.en}</div>
                                </div>
                                <div class="px-5 py-4">
                                    <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Occupation　職業</div>
                                    <div class="text-lg font-bold text-gray-900">${c.job.en}</div>
                                </div>
                            </div>

                            <div class="px-5 py-4">
                                <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Accommodation　宿泊先</div>
                                <div class="text-lg font-bold text-gray-900">${c.hotel.en}</div>
                                <div class="text-sm text-gray-500 mt-0.5">${c.hotel.local}</div>
                            </div>

                        </div>
                    </div>

                    <!-- ─── Q&A 想定問答 ─── -->
                    <div class="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden mt-4">
                        <div class="px-4 py-3 font-bold text-sm flex items-center gap-2" style="background:${c.lightColor};color:${c.accentColor}">
                            <i class="fas fa-comments"></i> 想定問答（タップで回答を表示）
                        </div>
                        <div class="divide-y divide-gray-100">
                            ${c.qa.map((item, qi) => `
                            <div>
                                <button onclick="toggleQA('${c.id}_${qi}')"
                                    class="w-full text-left px-4 py-3 flex justify-between items-center gap-2 hover:bg-gray-50 transition-colors">
                                    <span class="font-semibold text-sm text-gray-800">
                                        <i class="fas fa-comment-dots mr-1" style="color:${c.borderColor}"></i>
                                        ${item.q}
                                    </span>
                                    <i id="qa_icon_${c.id}_${qi}" class="fas fa-chevron-down text-gray-400 flex-shrink-0 transition-transform"></i>
                                </button>
                                <div id="qa_ans_${c.id}_${qi}" class="hidden px-4 pb-3">
                                    <div class="rounded-xl px-4 py-3 text-base font-semibold text-gray-900 leading-relaxed"
                                         style="background:${c.lightColor};border-left:4px solid ${c.borderColor}">
                                        💬 "${item.a}"
                                    </div>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- ─── NGワード ─── -->
                    <div class="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mt-4">
                        <div class="font-bold text-red-700 text-sm mb-2"><i class="fas fa-ban mr-1"></i>NGワード</div>
                        <div class="flex flex-wrap gap-2">
                            <span class="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-sm line-through">"Work"</span>
                            <span class="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-sm line-through">"Business"</span>
                        </div>
                        <div class="text-xs text-red-600 mt-2">就労・商用と誤解されるため使用厳禁。代わりに <strong>"meeting" / "conference" / "exhibition"</strong> を使用。</div>
                    </div>

                </div>
                `).join('')}
            </div>
        `;
    },

    renderFamily() {
        const container = document.getElementById('tab-family');
        container.innerHTML = `
            ${this.renderFamilySummary()}
            ${components.flightInfo(TRIP_DATA.flights)}
            ${this.renderFamilyHotels()}
            ${this.renderTimezoneInfo()}
            ${this.renderFamilyEmergency()}
            ${components.scheduleTable(TRIP_DATA.schedule)}
        `;
    },

    renderFamilySummary() {
        return `
            <div class="bg-white rounded-lg shadow">
                <div class="bg-gray-700 text-white p-4 font-bold">
                    <i class="fas fa-users mr-2"></i>家族共有情報
                </div>
                <div class="p-4 space-y-3">
                    <div class="bg-white border-l-4 border-gray-300 p-3 text-sm">
                        <i class="fas fa-info-circle text-yellow-600 mr-2"></i>
                        <strong>台湾・マレーシア2カ国出張</strong><br>
                        4/28(火)出発 → 5/7(木)朝8時帰宅予定
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="bg-gray-50 p-3 rounded">
                            <div class="font-semibold text-blue-800">🇹🇼 台湾滞在</div>
                            <div class="text-gray-700">4/28夜～5/2昼</div>
                        </div>
                        <div class="bg-purple-50 p-3 rounded">
                            <div class="font-semibold text-purple-800">🇲🇾 マレーシア滞在</div>
                            <div class="text-gray-700">5/2夜～5/6夜</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderFamilyHotels() {
        return `
            <div class="bg-white rounded-lg shadow mt-4">
                <div class="bg-gray-600 text-white p-3 font-bold">
                    <i class="fas fa-hotel mr-2"></i>宿泊先情報
                </div>
                <div class="p-4 space-y-4">
                    <div class="border border-teal-200 rounded p-3 bg-teal-50">
                        <div class="flex justify-between items-start mb-2">
                            <div class="font-bold text-teal-900">🇹🇼 K Hotel Dunnan</div>
                            <span class="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded">4/28-5/2</span>
                        </div>
                        <div class="text-sm text-gray-700 space-y-1">
                            <div>📍 台北市大安区</div>
                            <div>📞 <a href="tel:+886227050707" class="text-blue-600 underline">+886-2-2705-0707</a></div>
                            <div class="text-xs text-gray-600">チェックイン: 4/28 22:00-22:30 / チェックアウト: 5/2 11:30</div>
                        </div>
                    </div>
                    <div class="border border-purple-200 rounded p-3 bg-purple-50">
                        <div class="flex justify-between items-start mb-2">
                            <div class="font-bold text-purple-900">🇲🇾 Holiday Inn Express KLCC</div>
                            <span class="text-xs bg-purple-400 text-white px-2 py-1 rounded">5/2-5/6</span>
                        </div>
                        <div class="text-sm text-gray-700 space-y-1">
                            <div>📍 クアラルンプール(KLCCエリア)</div>
                            <div>📞 <a href="tel:+60321105000" class="text-blue-600 underline">+60-3-2110-5000</a></div>
                            <div class="text-xs text-gray-600">チェックイン: 5/2 22:30-23:00 / チェックアウト: 5/6 08:00</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderTimezoneInfo() {
        return `
            <div class="bg-white rounded-lg shadow mt-4">
                <div class="bg-gray-600 text-white p-3 font-bold">
                    <i class="fas fa-clock mr-2"></i>時差・連絡のタイミング
                </div>
                <div class="p-4 space-y-3">
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        <div class="font-semibold text-orange-800 mb-2">⏰ 時差早見表</div>
                        <div class="grid grid-cols-3 gap-2 text-center">
                            <div class="font-semibold text-gray-700">日本</div>
                            <div class="font-semibold text-blue-700">🇹🇼 台湾</div>
                            <div class="font-semibold text-purple-700">🇲🇾 マレーシア</div>
                            <div class="bg-white p-2 rounded">12:00</div>
                            <div class="bg-blue-100 p-2 rounded">11:00 (-1h)</div>
                            <div class="bg-purple-100 p-2 rounded">11:00 (-1h)</div>
                        </div>
                        <div class="text-xs text-gray-600 mt-2">
                            ※台湾・マレーシアともに日本より<strong>1時間遅れ</strong>
                        </div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        <div class="font-semibold text-green-800 mb-2">📱 連絡しやすい時間帯</div>
                        <div class="text-gray-700 space-y-1">
                            <div>• 平日夜: <strong>21:00以降</strong>（現地20時以降）</div>
                            <div>• 休日(5/3): <strong>終日OK</strong></div>
                            <div>• 機内(5/6夜～5/7朝): <strong>連絡不可</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderFamilyEmergency() {
        return `
            <div class="bg-white rounded-lg shadow mt-4">
                <div class="bg-gray-600 text-white p-3 font-bold">
                    <i class="fas fa-phone-alt mr-2"></i>緊急連絡先
                </div>
                <div class="p-4 space-y-2">
                    <a href="tel:+81xxxxxxxxxx" class="block border-l-4 border-red-500 p-3 rounded">
                        <div class="font-semibold text-red-800">📱 本人携帯</div>
                        <div class="text-sm text-gray-700">+81-xx-xxxx-xxxx</div>
                        <div class="text-xs text-gray-600">LINE・WhatsApp利用可</div>
                    </a>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        <div class="font-semibold text-gray-800 mb-2">🏢 日本大使館</div>
                        <div class="text-gray-700 space-y-1">
                            <div>🇹🇼 台湾: <a href="tel:+886223495103" class="text-blue-600">+886-2-2349-5103</a></div>
                            <div>🇲🇾 マレーシア: <a href="tel:+60321772600" class="text-blue-600">+60-3-2177-2600</a></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    setupTabs() {
        switchTab('itinerary');
    },

    loadChecklist() {
        const container = document.getElementById('checklistContainer');
        if (!container) return;

        container.innerHTML = TRIP_DATA.checklist.map((item, idx) => {
            const checked = localStorage.getItem(`c${idx}`) === 'true';
            return `
                <label class="flex items-center gap-3 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 ${checked ? 'opacity-50' : ''}">
                    <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleCheck(${idx})" class="w-5 h-5">
                    <span class="flex-1 ${checked ? 'line-through' : ''}">${item}</span>
                </label>
            `;
        }).join('');
        this.updateCheckProgress();
    },

    updateCheckProgress() {
        const checked = TRIP_DATA.checklist.filter((_, i) => localStorage.getItem(`c${i}`) === 'true').length;
        const el = document.getElementById('checkProgress');
        if (el) el.textContent = `${checked}/${TRIP_DATA.checklist.length}`;
    }
};

// グローバル関数
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.target === tabId) {
            btn.classList.add('active', 'text-blue-600');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('active', 'text-blue-600');
            btn.classList.add('text-gray-400');
        }
    });
    window.scrollTo(0, 0);
}

function toggleCheck(idx) {
    localStorage.setItem(`c${idx}`, event.target.checked);
    app.loadChecklist();
}

function switchImmigreCard(id) {
    TRIP_DATA.immigrationCards.forEach(c => {
        const card = document.getElementById(`imgcard_${c.id}`);
        const btn  = document.getElementById(`imgbtn_${c.id}`);
        if (!card || !btn) return;
        if (c.id === id) {
            card.classList.remove('hidden');
            btn.style.background   = c.accentColor;
            btn.style.borderColor  = c.accentColor;
            btn.style.color        = '#fff';
        } else {
            card.classList.add('hidden');
            btn.style.background  = '#fff';
            btn.style.borderColor = '#e5e7eb';
            btn.style.color       = '#6b7280';
        }
    });
}

function toggleQA(key) {
    const ans  = document.getElementById(`qa_ans_${key}`);
    const icon = document.getElementById(`qa_icon_${key}`);
    if (!ans) return;
    const open = !ans.classList.contains('hidden');
    ans.classList.toggle('hidden', open);
    if (icon) icon.style.transform = open ? '' : 'rotate(180deg)';
}

function toggleImgDoc(id, color, total) {
    const chk = document.getElementById(`imgchk_${id}`);
    if (!chk) return;
    const newVal = !chk.checked;
    chk.checked = newVal;
    localStorage.setItem(`img_${id}`, newVal);
    app.applyImgDocStyle(id, newVal);
    const items = color === 'teal'
        ? TRIP_DATA.immigrationDocs.taiwan.items
        : TRIP_DATA.immigrationDocs.malaysia.items;
    app.updateImgProgress(color, items);
}

// 初期化
document.addEventListener('DOMContentLoaded', () => app.init());