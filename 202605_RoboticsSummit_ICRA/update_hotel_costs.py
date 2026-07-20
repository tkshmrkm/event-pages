with open('2026_Robotics_Summit_ICRA_Itinerary_Memo.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Simplify Hampton Inn cost to 1 room only
old_hampton = '''                    <span style="font-size:11px; color:#374151;">
                        室料: $821.75<br>
                        税込合計: <strong>$917.90</strong><br>
                        円換算(≒¥150/$): <strong>約¥137,700</strong><br>
                        ※3室合計: $2,753.70 (≒¥413,000)<br>
                        チェックイン時に室ごと別払い可
                    </span>'''

new_hampton = '''                    <span style="font-size:11px; color:#374151;">
                        室料: $821.75 / 税込: <strong>$917.90</strong><br>
                        円換算(¥150/$): <strong>約¥137,700</strong><br>
                        ※4泊分。チェックイン時に室ごと別払い可
                    </span>'''

content = content.replace(old_hampton, new_hampton)

# 2. Mercure Wien Westbahnhof check-in (Day 6, 5/30) - add cost for 6 nights
old_mercure_checkin = '''                <td class="notes"><strong>素泊まり(Room Only)確認</strong><br>Accor Silver特典 (7泊)</td>'''

new_mercure_checkin = '''                <td class="notes">
                    <strong>素泊まり(Room Only)確認</strong><br>
                    Accor Silver特典<br>
                    <span style="font-size:11px; font-weight:bold; color:#b45309; display:block; margin-top:4px;">💳 支払い目安 (6泊分)</span>
                    <span style="font-size:11px; color:#374151;">
                        6泊: <strong>€639.00</strong><br>
                        円換算(¥165/€): <strong>約¥105,500</strong><br>
                        (1泊あたり €106.50 / 約¥17,600)
                    </span>
                </td>'''

content = content.replace(old_mercure_checkin, new_mercure_checkin)

# 3. Find the Day 13 (6/6) checkout and add 1-night cost
old_day13_checkout = '''            <tr>
                <td class="time">07:00</td>
                <td class="icon"><span class="material-icons">hotel</span></td>
                <td class="content">
                    <span class="event-title">ホテルチェックアウト</span>
                    <span class="event-desc">空港へ向かう</span>
                </td>
                <td class="notes"></td>
            </tr>'''

new_day13_checkout = '''            <tr>
                <td class="time">07:00</td>
                <td class="icon"><span class="material-icons">hotel</span></td>
                <td class="content">
                    <span class="event-title">ホテルチェックアウト (Mercure)</span>
                    <span class="event-desc">空港へ向かう</span>
                </td>
                <td class="notes">
                    <span style="font-size:11px; font-weight:bold; color:#b45309;">💳 最終1泊分</span><br>
                    <span style="font-size:11px; color:#374151;">
                        1泊: <strong>€122.40</strong><br>
                        円換算(¥165/€): <strong>約¥20,200</strong>
                    </span>
                </td>
            </tr>'''

content = content.replace(old_day13_checkout, new_day13_checkout)

with open('2026_Robotics_Summit_ICRA_Itinerary_Memo.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("done hotel costs update")
