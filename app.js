/* =========================================================
   たべきり冷蔵庫 の動き
   - データはブラウザ(localStorage)に保存します
   - 上から「データ」「便利関数」「画面を描く」「操作」の順に並んでいます
   ========================================================= */

// ---------- 保存場所の種類 ----------
const LOCATIONS = [
  { key: 'fridge', label: '冷蔵', emoji: '🥛' },
  { key: 'freezer', label: '冷凍', emoji: '🧊' },
  { key: 'vegetable', label: '野菜室', emoji: '🥬' },
  { key: 'pantry', label: '常温', emoji: '🥫' },
];
const QUICK_DAYS = [
  { label: '今日', days: 0 },
  { label: '明日', days: 1 },
  { label: '3日後', days: 3 },
  { label: '1週間', days: 7 },
  { label: '2週間', days: 14 },
  { label: '1ヶ月', days: 30 },
];
const STORAGE_KEY = 'tabekiri-fridge-v1';

// ---------- 日付の便利関数 ----------
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

function toDateString(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateString(d);
}
function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
// 期限まであと何日か(今日=0、昨日で切れた=-1)
function daysUntil(expiry) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(expiry) - today) / 86400000);
}
function formatJP(s) {
  const d = parseDate(s);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEK[d.getDay()]})`;
}
// 期限の状態:expired(切れ・今日) / soon(3日以内) / ok
function statusOf(expiry) {
  const n = daysUntil(expiry);
  if (n < 0) return { level: 'expired', label: `${-n}日過ぎ` };
  if (n === 0) return { level: 'expired', label: '今日まで' };
  if (n <= 3) return { level: 'soon', label: `あと${n}日` };
  return { level: 'ok', label: `あと${n}日` };
}

// ---------- その他の便利関数 ----------
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
// 名前などをHTMLに入れるときは必ずこれを通す(表示崩れ・いたずら対策)
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function locationOf(key) {
  return LOCATIONS.find((l) => l.key === key) || LOCATIONS[0];
}
const $ = (id) => document.getElementById(id);

// ---------- データ ----------
function sampleData() {
  const now = new Date().toISOString();
  const food = (name, location, quantity, days, memo) => ({
    id: newId(), name, location, quantity, expiry: addDays(days), memo: memo || '', photo: '', createdAt: now,
  });
  return {
    sample: true,
    foods: [
      food('牛乳', 'fridge', 1, 1, '開封済み'),
      food('ヨーグルト', 'fridge', 2, -1),
      food('豚こま肉', 'fridge', 1, 2),
      food('たまご', 'fridge', 6, 9),
      food('キャベツ', 'vegetable', 1, 5, '半玉'),
      food('にんじん', 'vegetable', 3, 12),
      food('冷凍うどん', 'freezer', 3, 60),
      food('カレールー', 'pantry', 1, 120),
    ],
    shopping: [
      { id: newId(), name: '食パン', done: false },
      { id: newId(), name: '豆腐', done: true },
    ],
    logs: [
      { id: newId(), name: 'もやし', kind: 'wasted', date: now },
      { id: newId(), name: '食パン', kind: 'used', date: now },
      { id: newId(), name: '豆腐', kind: 'used', date: now },
      { id: newId(), name: 'ほうれん草', kind: 'used', date: now },
      { id: newId(), name: 'もやし', kind: 'wasted', date: now },
      { id: newId(), name: '納豆', kind: 'used', date: now },
    ],
  };
}
function emptyData() {
  return { sample: false, foods: [], shopping: [], logs: [] };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyData(), ...JSON.parse(raw) };
  } catch (e) {
    /* 保存できない環境でも動くようにする */
  }
  return sampleData();
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('この端末では保存できませんでした!');
  }
}

let state = load();
let currentTab = 'fridge';
let currentFilter = 'all';

// ---------- 小さな部品:トースト・確認ダイアログ ----------
let toastTimer;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2200);
}

// ask('タイトル', 'メッセージ', [{label, value, style}]) → 押されたボタンの value を返す
function ask(title, message, buttons) {
  return new Promise((resolve) => {
    $('dlgTitle').textContent = title;
    $('dlgMsg').textContent = message;
    const box = $('dlgActions');
    box.innerHTML = '';
    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn ${b.style || 'btn-ghost'}`;
      btn.textContent = b.label;
      btn.addEventListener('click', () => {
        $('dialog').hidden = true;
        resolve(b.value);
      });
      box.appendChild(btn);
    });
    $('dialog').hidden = false;
    box.lastElementChild.focus();
  });
}

// =========================================================
//  画面を描く
// =========================================================
function renderAll() {
  renderFridge();
  renderShopping();
  renderStats();
  renderBadges();
}

function renderFridge() {
  const foods = state.foods;
  const expired = foods.filter((f) => statusOf(f.expiry).level === 'expired').length;
  const soon = foods.filter((f) => statusOf(f.expiry).level === 'soon').length;
  $('countExpired').textContent = expired;
  $('countSoon').textContent = soon;
  $('countAll').textContent = foods.length;
  $('sampleNote').hidden = !state.sample;

  // 絞り込みチップ
  const filters = [
    { key: 'all', label: 'すべて' },
    { key: 'urgent', label: `期限間近 ${expired + soon}` },
    ...LOCATIONS.map((l) => ({ key: l.key, label: `${l.emoji} ${l.label}` })),
  ];
  $('filters').innerHTML = filters
    .map((f) => `<button type="button" class="chip ${f.key === currentFilter ? 'is-active' : ''}" data-filter="${f.key}">${esc(f.label)}</button>`)
    .join('');

  // 絞り込み → 期限が近い順
  const shown = foods
    .filter((f) => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'urgent') return statusOf(f.expiry).level !== 'ok';
      return f.location === currentFilter;
    })
    .sort((a, b) => a.expiry.localeCompare(b.expiry));

  $('foodList').innerHTML = shown
    .map((f) => {
      const st = statusOf(f.expiry);
      const loc = locationOf(f.location);
      const thumb = f.photo ? `<img src="${f.photo}" alt="">` : loc.emoji;
      return `
        <li class="food level-${st.level}" data-id="${f.id}">
          <button type="button" class="food-thumb" data-action="edit" aria-label="${esc(f.name)}を編集">${thumb}</button>
          <button type="button" class="food-main" data-action="edit">
            <span class="food-name">${esc(f.name)}${f.quantity > 1 ? `<span class="food-qty">×${f.quantity}</span>` : ''}</span>
            <span class="food-meta">${loc.label}・${formatJP(f.expiry)}${f.memo ? `・${esc(f.memo)}` : ''}</span>
            <span class="badge ${st.level}">${st.label}</span>
          </button>
          <div class="food-actions">
            <button type="button" class="act act-use" data-action="use">使った</button>
            <button type="button" class="act act-waste" data-action="waste">捨てた</button>
          </div>
        </li>`;
    })
    .join('');

  $('foodEmpty').hidden = shown.length > 0;
  $('foodEmptyText').textContent =
    foods.length === 0 ? '下の「食材を追加」から登録しましょう' : 'この条件の食材はありません';
}

function renderShopping() {
  const items = [...state.shopping].sort((a, b) => Number(a.done) - Number(b.done));
  $('shopList').innerHTML = items
    .map(
      (s) => `
      <li class="shop-item ${s.done ? 'done' : ''}" data-id="${s.id}">
        <button type="button" class="check" data-action="toggle" aria-label="${esc(s.name)}を${s.done ? '未購入に戻す' : '買った'}">${s.done ? '✓' : ''}</button>
        <span class="shop-name">${esc(s.name)}</span>
        ${s.done ? '<button type="button" class="to-fridge" data-action="register">冷蔵庫へ</button>' : ''}
        <button type="button" class="remove" data-action="remove" aria-label="${esc(s.name)}を削除">×</button>
      </li>`
    )
    .join('');
  $('shopEmpty').hidden = items.length > 0;
  $('clearDone').hidden = !items.some((s) => s.done);
}

function renderStats() {
  const now = new Date();
  $('rateTitle').textContent = `${now.getMonth() + 1}月の使い切り率`;
  const thisMonth = state.logs.filter((l) => {
    const d = new Date(l.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const used = thisMonth.filter((l) => l.kind === 'used').length;
  const wasted = thisMonth.filter((l) => l.kind === 'wasted').length;
  const total = used + wasted;
  const rate = total === 0 ? null : Math.round((used / total) * 100);

  $('rate').textContent = rate === null ? '--' : rate;
  $('usedCount').textContent = used;
  $('wastedCount').textContent = wasted;
  $('ratioUsed').style.flex = String(used);
  $('ratioWasted').style.flex = String(wasted);
  $('rateMessage').textContent =
    rate === null
      ? '食材を「使った」「捨てた」で記録すると、ここに集計されます'
      : rate >= 90
        ? 'ほとんど使い切れています。この調子です'
        : rate >= 70
          ? 'いい調子です。期限間近の食材から使っていきましょう'
          : '買う量を少し減らすと、捨てる食材が減りそうです';

  // よく捨てる食材ランキング
  const counts = {};
  state.logs.filter((l) => l.kind === 'wasted').forEach((l) => (counts[l.name] = (counts[l.name] || 0) + 1));
  const ranking = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  $('rankPanel').hidden = ranking.length === 0;
  $('rankList').innerHTML = ranking
    .map(([name, n]) => `<li><span class="rank-name">${esc(name)}</span><span class="rank-count">${n}回</span></li>`)
    .join('');

  // 最近の記録
  $('logList').innerHTML =
    state.logs.length === 0
      ? '<li class="hint">まだ記録がありません</li>'
      : state.logs
          .slice(0, 10)
          .map((l) => {
            const d = new Date(l.date);
            return `<li>
              <span class="log-kind ${l.kind}">${l.kind === 'used' ? '使い切り' : '廃棄'}</span>
              <span class="log-name">${esc(l.name)}</span>
              <span class="log-date">${d.getMonth() + 1}/${d.getDate()}</span>
            </li>`;
          })
          .join('');
}

function renderBadges() {
  const urgent = state.foods.filter((f) => statusOf(f.expiry).level !== 'ok').length;
  const shop = state.shopping.filter((s) => !s.done).length;
  $('badgeFridge').hidden = urgent === 0;
  $('badgeFridge').textContent = urgent;
  $('badgeShop').hidden = shop === 0;
  $('badgeShop').textContent = shop;
}

// =========================================================
//  操作
// =========================================================

// 変更したら必ずこれを呼ぶ(保存して描き直す)
function commit() {
  save();
  renderAll();
}

// ---------- タブ ----------
const TITLES = { fridge: 'たべきり冷蔵庫', shopping: '買い物リスト', stats: 'フードロス記録' };

function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  ['fridge', 'shopping', 'stats'].forEach((t) => ($(`view-${t}`).hidden = t !== tab));
  $('pageTitle').textContent = TITLES[tab];
  $('addBtn').hidden = tab !== 'fridge';
  window.scrollTo(0, 0);
}
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

// ---------- 絞り込み ----------
function setFilter(key) {
  currentFilter = key;
  renderFridge();
}
$('filters').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-filter]');
  if (chip) setFilter(chip.dataset.filter);
});
document.querySelectorAll('.stat').forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));

// ---------- 食材カードのボタン ----------
$('foodList').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.closest('.food').dataset.id;
  const food = state.foods.find((f) => f.id === id);
  if (!food) return;

  if (btn.dataset.action === 'edit') openForm({ food });
  if (btn.dataset.action === 'use') useOne(food);
  if (btn.dataset.action === 'waste') waste(food);
});

function finishFood(food, kind) {
  state.foods = state.foods.filter((f) => f.id !== food.id);
  state.logs.unshift({ id: newId(), name: food.name, kind, date: new Date().toISOString() });
  commit();
}

async function offerShopping(title, name) {
  const answer = await ask(title, `「${name}」を買い物リストに追加しますか?`, [
    { label: 'いいえ', value: false },
    { label: '追加する', value: true, style: 'btn-primary' },
  ]);
  if (answer) {
    addShopping(name);
    toast('買い物リストに追加しました');
  }
}

async function useOne(food) {
  if (food.quantity > 1) {
    food.quantity -= 1;
    commit();
    toast(`${food.name}:残り${food.quantity}`);
    return;
  }
  finishFood(food, 'used');
  await offerShopping('使い切りました', food.name);
}

async function waste(food) {
  const ok = await ask('捨てましたか?', `「${food.name}」をフードロスとして記録します`, [
    { label: 'キャンセル', value: false },
    { label: '捨てた', value: true, style: 'btn-danger' },
  ]);
  if (!ok) return;
  finishFood(food, 'wasted');
  await offerShopping('記録しました', food.name);
}

// ---------- 買い物リスト ----------
function addShopping(name) {
  const n = name.trim();
  if (!n) return;
  if (state.shopping.some((s) => s.name === n && !s.done)) return; // 同じものは重複させない
  state.shopping.push({ id: newId(), name: n, done: false });
  commit();
}

$('shopForm').addEventListener('submit', (e) => {
  e.preventDefault();
  addShopping($('shopInput').value);
  $('shopInput').value = '';
  $('shopInput').focus();
});

$('shopList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.closest('.shop-item').dataset.id;
  const item = state.shopping.find((s) => s.id === id);
  if (!item) return;

  if (btn.dataset.action === 'toggle') {
    item.done = !item.done;
    commit();
  }
  if (btn.dataset.action === 'remove') {
    state.shopping = state.shopping.filter((s) => s.id !== id);
    commit();
  }
  if (btn.dataset.action === 'register') {
    openForm({ name: item.name, shoppingId: item.id });
  }
});

$('clearDone').addEventListener('click', () => {
  state.shopping = state.shopping.filter((s) => !s.done);
  commit();
});

// ---------- 記録タブのデータ操作 ----------
$('clearSample').addEventListener('click', () => {
  state = emptyData();
  commit();
  toast('空の冷蔵庫から始めます');
});
$('loadSample').addEventListener('click', () => {
  state = sampleData();
  commit();
  showTab('fridge');
  toast('サンプルデータを入れました');
});
$('resetAll').addEventListener('click', async () => {
  const ok = await ask('すべて削除しますか?', '食材・買い物リスト・記録がすべて消えます', [
    { label: 'キャンセル', value: false },
    { label: '削除する', value: true, style: 'btn-danger' },
  ]);
  if (!ok) return;
  state = emptyData();
  commit();
  toast('削除しました');
});

// =========================================================
//  食材の登録フォーム
// =========================================================
const form = {
  editingId: null,
  shoppingId: null,
  location: 'fridge',
  quantity: 1,
  photo: '',
};

function renderLocationChips() {
  $('locationChips').innerHTML = LOCATIONS.map(
    (l) => `<button type="button" class="chip ${l.key === form.location ? 'is-active' : ''}" data-loc="${l.key}">${l.emoji} ${l.label}</button>`
  ).join('');
}
function renderQuickDays() {
  const current = $('expiryInput').value;
  $('quickDays').innerHTML = QUICK_DAYS.map((q) => {
    const value = addDays(q.days);
    return `<button type="button" class="chip ${value === current ? 'is-active' : ''}" data-date="${value}">${q.label}</button>`;
  }).join('');
}
function renderExpiryBadge() {
  const v = $('expiryInput').value;
  const badge = $('expiryBadge');
  if (!isValidDate(v)) {
    badge.hidden = true;
    return;
  }
  const st = statusOf(v);
  badge.hidden = false;
  badge.className = `badge ${st.level}`;
  badge.textContent = `${formatJP(v)} ${st.label}`;
}
function renderPhoto() {
  $('photoPreview').hidden = !form.photo;
  if (form.photo) $('photoPreview').src = form.photo;
  $('photoEmpty').hidden = !!form.photo;
  $('photoRemove').hidden = !form.photo;
}

// openForm({ food }) で編集、openForm({ name, shoppingId }) で買い物リストから登録
function openForm({ food, name, shoppingId } = {}) {
  form.editingId = food ? food.id : null;
  form.shoppingId = shoppingId || null;
  form.location = food ? food.location : 'fridge';
  form.quantity = food ? food.quantity : 1;
  form.photo = food ? food.photo : '';

  $('sheetTitle').textContent = food ? '食材を編集' : '食材を追加';
  $('submitBtn').textContent = food ? '変更を保存' : '冷蔵庫に追加';
  $('deleteBtn').hidden = !food;
  $('nameInput').value = food ? food.name : name || '';
  $('memoInput').value = food ? food.memo : '';
  $('expiryInput').value = food ? food.expiry : addDays(7);
  $('qtyValue').textContent = form.quantity;
  $('formError').hidden = true;
  $('photoInput').value = '';

  renderLocationChips();
  renderQuickDays();
  renderExpiryBadge();
  renderPhoto();
  $('sheet').hidden = false;
}
function closeForm() {
  $('sheet').hidden = true;
}

$('addBtn').addEventListener('click', () => openForm());
$('sheetCancel').addEventListener('click', closeForm);
$('sheet').addEventListener('click', (e) => {
  if (e.target === $('sheet')) closeForm(); // 外側をタップで閉じる
});

$('locationChips').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-loc]');
  if (!chip) return;
  form.location = chip.dataset.loc;
  renderLocationChips();
});
$('quickDays').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-date]');
  if (!chip) return;
  $('expiryInput').value = chip.dataset.date;
  renderQuickDays();
  renderExpiryBadge();
});
$('expiryInput').addEventListener('input', () => {
  renderQuickDays();
  renderExpiryBadge();
});
$('qtyMinus').addEventListener('click', () => {
  form.quantity = Math.max(1, form.quantity - 1);
  $('qtyValue').textContent = form.quantity;
});
$('qtyPlus').addEventListener('click', () => {
  form.quantity += 1;
  $('qtyValue').textContent = form.quantity;
});

// 写真:小さく縮めてから保存(そのままだと容量オーバーになる)
$('photoInput').addEventListener('change', async () => {
  const file = $('photoInput').files[0];
  if (!file) return;
  try {
    form.photo = await shrinkImage(file, 320);
    renderPhoto();
  } catch (e) {
    toast('この写真は読み込めませんでした');
  }
});
$('photoRemove').addEventListener('click', () => {
  form.photo = '';
  renderPhoto();
});

function shrinkImage(file, maxSize) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function showFormError(text) {
  $('formError').textContent = text;
  $('formError').hidden = false;
}

$('foodForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('nameInput').value.trim();
  const expiry = $('expiryInput').value;
  if (!name) return showFormError('食材の名前を入れてください');
  if (!isValidDate(expiry)) return showFormError('賞味期限の日付を選んでください');

  const data = {
    name,
    location: form.location,
    quantity: form.quantity,
    expiry,
    memo: $('memoInput').value.trim(),
    photo: form.photo,
  };

  if (form.editingId) {
    const food = state.foods.find((f) => f.id === form.editingId);
    Object.assign(food, data);
    toast('保存しました');
  } else {
    state.foods.push({ id: newId(), createdAt: new Date().toISOString(), ...data });
    toast(`${name}を追加しました`);
  }
  if (form.shoppingId) {
    state.shopping = state.shopping.filter((s) => s.id !== form.shoppingId);
  }
  commit();
  closeForm();
  if (currentTab !== 'fridge') showTab('fridge');
});

$('deleteBtn').addEventListener('click', async () => {
  const ok = await ask('削除しますか?', '間違えて登録したときに使います。記録には残りません', [
    { label: 'キャンセル', value: false },
    { label: '削除する', value: true, style: 'btn-danger' },
  ]);
  if (!ok) return;
  state.foods = state.foods.filter((f) => f.id !== form.editingId);
  commit();
  closeForm();
  toast('削除しました');
});

// ---------- 起動 ----------
$('today').textContent = (() => {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WEEK[d.getDay()]})`;
})();
renderAll();
showTab('fridge');
