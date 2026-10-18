/* =========================================================
   発表用デモ:Supabase の「代わり」をブラウザの中だけで動かす
   - 本番と同じ app.js / cloud.js が、そのまま動きます
   - 相手はすべて架空の北大生です(ネットにはつながりません)
   - ページを再読み込みすると、最初の状態に戻ります
   ========================================================= */
(function () {
  // ---------- 日付 ----------
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const day = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return ymd(d);
  };
  const ago = (n, h = 19) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
  };
  const TONIGHT = `${day(0)}|night`;
  const TMR_LUNCH = `${day(1)}|lunch`;
  const TMR_NIGHT = `${day(1)}|night`;
  const PLACES = ['寮の共用キッチン', '学生会館の調理室', '国際交流センター'];
  const QUICK = [
    '向かっています / On my way',
    '少し遅れます / Running a bit late',
    "着きました / I'm here",
    '楽しみにしています! / Looking forward to it!',
    '今日はありがとう! / Thank you for today!',
  ];

  // ---------- 発表する人(あなた)の冷蔵庫:読み込むたびに作り直す ----------
  const now = new Date().toISOString();
  let seq = 0;
  const food = (name, location, quantity, days, memo = '') => ({
    id: `f${++seq}`, name, location, quantity, expiry: day(days), memo, photo: '', createdAt: now,
  });
  const log = (name, kind) => ({ id: `l${++seq}`, name, kind, date: now });
  try {
    localStorage.setItem('nokori-pitch-demo-v1', JSON.stringify({
      sample: false,
      foods: [
        food('もやし', 'vegetable', 1, 0),
        food('豚こま肉', 'fridge', 1, 1, '200g'),
        food('牛乳', 'fridge', 1, 1, '開封済み'),
        food('トマト', 'vegetable', 2, 1),
        food('キャベツ', 'vegetable', 1, 2, '半玉'),
        food('豆腐', 'fridge', 1, 2),
        food('にんじん', 'vegetable', 2, 3),
        food('たまご', 'fridge', 4, 3),
        food('玉ねぎ', 'vegetable', 2, 9),
        food('冷凍うどん', 'freezer', 3, 60),
        food('カレールー', 'pantry', 1, 120),
      ],
      shopping: [{ id: 's1', name: '食パン', done: false }],
      logs: [
        log('ほうれん草', 'used'), log('納豆', 'used'), log('食パン', 'used'), log('鶏むね肉', 'used'),
        log('しめじ', 'used'), log('もやし', 'wasted'), log('レタス', 'wasted'),
      ],
      invites: {},
    }));
  } catch (e) {
    /* 保存できない環境でも、サンプルの冷蔵庫で動く */
  }

  // ---------- 架空の北大生 ----------
  const ME_ID = 'me';
  const me = {
    id: ME_ID, display_name: 'あおい', avatar: 'original', country: '日本', flag: '🇯🇵', student_type: 'jp',
    faculty_year: '水産学部 4年', bio: '余った野菜を、だれかと一緒に使い切りたい', langs: ['日本語', 'English'],
    diet: [], allergies: '', gender: 'female', gender_public: false, same_gender_only: false,
    cooking_level: 'ふつう', fav_cuisines: ['和食', '東南アジア料理'], match_on: true,
    slots: [TONIGHT, TMR_NIGHT], places: [...PLACES],
  };
  // foods は [食材名, 期限まであと何日](3日以内だけ共有されている、という設定)
  const P = (id, o) => ({ id, allergies: '', gender_public: false, same_gender_only: false, match_on: true, places: [...PLACES], ...o });
  const people = [
    P('u-mai', { display_name: 'Mai', avatar: 'onigiri', country: 'ベトナム', flag: '🇻🇳', student_type: 'intl', faculty_year: '工学部 修士1年',
      bio: '日本の家庭料理を覚えたい', langs: ['やさしい日本語', 'English', 'Tiếng Việt'], diet: [], gender: 'female',
      cooking_level: '得意', fav_cuisines: ['東南アジア料理', '和食'], slots: [TONIGHT, TMR_NIGHT],
      foods: [['鶏むね肉', 1], ['パクチー', 1], ['ねぎ', 2]] }),
    P('u-jiwoo', { display_name: 'Ji-woo', avatar: 'carrot', country: '韓国', flag: '🇰🇷', student_type: 'intl', faculty_year: '文学部 3年',
      bio: 'みんなで韓国料理を作りたい', langs: ['日本語', '한국어'], diet: [], gender: 'male', gender_public: true,
      cooking_level: '得意', fav_cuisines: ['韓国料理'], slots: [TONIGHT],
      foods: [['にら', 1], ['ひき肉', 2]] }),
    P('u-aisha', { display_name: 'Aisha', avatar: 'bowls', country: 'マレーシア', flag: '🇲🇾', student_type: 'intl', faculty_year: '農学部 3年',
      bio: '日本人の友達がほしい!', langs: ['English', 'やさしい日本語', 'Bahasa'], diet: ['halal'], gender: 'female', same_gender_only: true,
      cooking_level: '得意', fav_cuisines: ['東南アジア料理', 'インド料理'], slots: [TONIGHT, TMR_NIGHT],
      foods: [['鶏もも肉', 1], ['じゃがいも', 2]] }),
    P('u-lucas', { display_name: 'Lucas', avatar: 'flag', country: 'ブラジル', flag: '🇧🇷', student_type: 'intl', faculty_year: '理学部 博士2年',
      bio: '日本語で雑談する練習がしたい', langs: ['English', 'Português', 'やさしい日本語'], diet: [], gender: 'male',
      cooking_level: 'ふつう', fav_cuisines: ['中南米料理', '洋食'], slots: [TMR_NIGHT],
      foods: [['ひき肉', 1], ['レタス', 1], ['チーズ', 3]] }),
    P('u-li', { display_name: 'Li Na', avatar: 'flag', country: '中国', flag: '🇨🇳', student_type: 'intl', faculty_year: '経済学院 修士2年',
      bio: '本場の麻婆豆腐を教えます', langs: ['中文', '日本語'], diet: [], gender: 'female',
      cooking_level: '得意', fav_cuisines: ['中華'], slots: [TONIGHT],
      foods: [['ひき肉', 1], ['ねぎ', 1]] }),
    P('u-priya', { display_name: 'Priya', avatar: 'flag', country: 'インド', flag: '🇮🇳', student_type: 'intl', faculty_year: '情報科学院 博士1年',
      bio: 'スパイスの使い方を教えたい', langs: ['English'], diet: ['vegetarian'], gender: 'female',
      cooking_level: '得意', fav_cuisines: ['インド料理'], slots: [TMR_LUNCH, TMR_NIGHT],
      foods: [['ヨーグルト', 1], ['きゅうり', 2]] }),
    P('u-kenta', { display_name: 'けんた', avatar: 'fridge', country: '日本', flag: '🇯🇵', student_type: 'jp', faculty_year: '経済学部 2年',
      bio: '一人ごはんが続いて、ちょっと寂しい', langs: ['日本語'], diet: [], gender: 'male',
      cooking_level: 'ふつう', fav_cuisines: ['和食', '中華'], slots: [TONIGHT],
      foods: [['白菜', 1], ['しめじ', 2]] }),
    P('u-haruka', { display_name: 'はるか', avatar: 'flag', country: '日本', flag: '🇯🇵', student_type: 'jp', faculty_year: '教育学部 1年',
      bio: '留学生と話してみたい', langs: ['日本語', 'English'], diet: [], gender: 'female', gender_public: true,
      cooking_level: '苦手', fav_cuisines: ['和食', '洋食'], slots: [TONIGHT, TMR_NIGHT],
      foods: [['鮭', 1], ['ピーマン', 2]] }),
    P('u-sota', { display_name: 'そうた', avatar: 'flag', country: '日本', flag: '🇯🇵', student_type: 'jp', faculty_year: '水産学部 3年',
      bio: 'カレーを大量に作ってみんなで食べたい', langs: ['日本語'], diet: [], gender: 'male',
      cooking_level: '得意', fav_cuisines: ['和食', 'インド料理'], slots: [TMR_NIGHT],
      foods: [['じゃがいも', 1], ['鶏もも肉', 3]] }),
  ];

  // ---------- 写真(デモ用のイラスト) ----------
  function dishPhoto(emoji, bg) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="${bg}"/>
      <circle cx="200" cy="215" r="150" fill="#ffffff" opacity=".9"/>
      <circle cx="200" cy="215" r="118" fill="#F4F1EA"/>
      <text x="200" y="262" font-size="140" text-anchor="middle">${emoji}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // ---------- 架空のデータベース ----------
  const nameOf = (id) => (id === ME_ID ? me : people.find((p) => p.id === id));
  let n = 0;
  const newId = () => `x${Date.now().toString(36)}${++n}`;
  const db = {
    profiles: [me, ...people.map(({ foods, ...p }) => p)],
    shared_foods: people.flatMap((p) => p.foods.map(([name, d]) => ({ user_id: p.id, name, expiry: day(d) }))),
    invites: [],
    messages: [],
    meal_posts: [],
    photos: {}, // パス → 画像のURL
  };

  // 過去のごはん会(履歴と「みんなで作ったごはん」に出る)
  function pastMeal(fromId, toId, recipe, emoji, daysAgo, isPublic, bg) {
    const a = nameOf(fromId);
    const b = nameOf(toId);
    const id = newId();
    db.invites.push({
      id, created_at: ago(daysAgo + 1, 12), status: 'accepted', from_id: fromId, to_id: toId,
      from_name: a.display_name, from_flag: a.flag, from_avatar: a.avatar,
      to_name: b.display_name, to_flag: b.flag, to_avatar: b.avatar,
      recipe, recipe_emoji: emoji, slot: `${day(-daysAgo)}|night`, place: PLACES[daysAgo % 3],
      from_foods: [], to_foods: [], from_photo_ok: isPublic, to_photo_ok: isPublic,
    });
    const path = `${id}/${fromId}.jpg`;
    db.photos[path] = dishPhoto(emoji, bg);
    db.meal_posts.push({ id: newId(), invite_id: id, user_id: fromId, author_name: a.display_name, author_flag: a.flag, recipe, photo_path: path, created_at: ago(daysAgo) });
  }
  pastMeal(ME_ID, 'u-haruka', '鮭のちゃんちゃん焼き', '🐟', 5, true, '#F5C34A');
  pastMeal('u-mai', 'u-aisha', '鶏肉のフォー風スープ', '🍲', 3, true, '#5CC1C4');
  pastMeal('u-mai', 'u-kenta', '親子丼', '🍚', 10, false, '#F08A82');
  pastMeal('u-jiwoo', 'u-lucas', '野菜チヂミ', '🥞', 2, true, '#F29B38');
  pastMeal('u-li', 'u-sota', '麻婆豆腐', '🌶️', 8, true, '#F08A82');
  pastMeal('u-aisha', 'u-priya', 'ミルクシチュー', '🍵', 12, true, '#B8D8A8');
  pastMeal('u-sota', 'u-kenta', '野菜たっぷりカレー', '🍛', 6, false, '#F5C34A');
  pastMeal('u-priya', 'u-mai', 'かんたんラッシー', '🥛', 15, false, '#5CC1C4');

  // ---------- 見てよいかの判定(本番の SQL と同じ考え方) ----------
  const inviteById = (id) => db.invites.find((i) => i.id === id);
  const involved = (i, uid) => i.from_id === uid || i.to_id === uid;
  const canSeeMeal = (i, uid) => !!i && (involved(i, uid) || (i.from_photo_ok && i.to_photo_ok));
  const mealCount = (id) => db.invites.filter((i) => i.status === 'accepted' && involved(i, id) && db.meal_posts.some((m) => m.invite_id === i.id)).length;
  const today = () => day(0);
  const within3 = (e) => e >= today() && e <= day(3);
  function genderOk(a, b) {
    const same = a.gender === b.gender && !['private', 'other', ''].includes(a.gender || '');
    if (a.same_gender_only && !same) return false;
    if (b.same_gender_only && !same) return false;
    return true;
  }
  function publicProfile(target, uid) {
    const p = db.profiles.find((x) => x.id === target);
    if (!p) return [];
    const ok = p.match_on || target === uid || db.invites.some((i) => involved(i, uid) && involved(i, target));
    if (!ok) return [];
    return [{
      id: p.id, display_name: p.display_name, country: p.country, flag: p.flag, avatar: p.avatar, student_type: p.student_type,
      faculty_year: p.faculty_year, bio: p.bio, langs: p.langs, diet: p.diet, cooking_level: p.cooking_level, fav_cuisines: p.fav_cuisines,
      gender_label: p.gender_public ? p.gender : null, meal_count: mealCount(p.id),
    }];
  }

  // ---------- RPC ----------
  function rpc(name, args, uid) {
    const mine = db.profiles.find((p) => p.id === uid);
    if (name === 'match_candidates') {
      if (!mine || !mine.match_on) return [];
      return db.profiles
        .filter((p) => p.id !== uid && p.match_on && genderOk(mine, p))
        .map((p) => ({
          ...publicProfile(p.id, uid)[0],
          allergies: p.allergies, slots: p.slots, places: p.places,
          foods: db.shared_foods.filter((f) => f.user_id === p.id && within3(f.expiry)).sort((a, b) => a.expiry.localeCompare(b.expiry)).map((f) => ({ name: f.name, expiry: f.expiry })),
        }));
    }
    if (name === 'public_profile') return publicProfile(args.target, uid);
    if (name === 'meal_history') {
      if (!publicProfile(args.target, uid).length) return [];
      return db.invites
        .filter((i) => i.status === 'accepted' && involved(i, args.target))
        .map((i) => {
          const m = db.meal_posts.filter((x) => x.invite_id === i.id).sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
          if (!m) return null;
          return { invite_id: i.id, recipe: i.recipe, recipe_emoji: i.recipe_emoji, meal_date: m.created_at, photo_path: canSeeMeal(i, uid) ? m.photo_path : null, is_public: !!(i.from_photo_ok && i.to_photo_ok) };
        })
        .filter(Boolean);
    }
    throw new Error(`unknown rpc ${name}`);
  }

  // ---------- 相手の自動の返事(本番では相手が自分のスマホで押す) ----------
  function refresh() {
    // cloud.js は「画面に戻ってきたとき」に読み込み直すので、それを使って表示を更新する
    document.dispatchEvent(new Event('visibilitychange'));
  }
  function later(ms, fn) {
    setTimeout(() => {
      fn();
      refresh();
    }, ms);
  }
  function partnerSays(inv, text) {
    const partnerId = inv.from_id === ME_ID ? inv.to_id : inv.from_id;
    db.messages.push({ id: newId(), invite_id: inv.id, sender_id: partnerId, sender_name: nameOf(partnerId).display_name, text, created_at: new Date().toISOString() });
  }
  function afterInsertInvite(inv) {
    if (inv.from_id !== ME_ID) return;
    later(2600, () => {
      if (inv.status !== 'pending') return;
      inv.status = 'accepted';
      later(1800, () => partnerSays(inv, QUICK[3]));
    });
  }
  function afterUpdateInvite(inv, row) {
    const myKey = inv.from_id === ME_ID ? 'from_photo_ok' : 'to_photo_ok';
    const theirKey = myKey === 'from_photo_ok' ? 'to_photo_ok' : 'from_photo_ok';
    if (row[myKey] === true && !inv[theirKey]) {
      later(2200, () => {
        inv[theirKey] = true;
        if (window.toast) window.toast(`${nameOf(inv.from_id === ME_ID ? inv.to_id : inv.from_id).display_name}さんも写真の公開を許可しました`);
      });
    }
    if (row.status === 'accepted' && inv.to_id === ME_ID) later(1500, () => partnerSays(inv, QUICK[3]));
  }
  const REPLIES = { 0: 2, 1: 3, 2: 0, 3: 3, 4: 4 }; // 送った文 → 相手の返事
  function afterInsertMessage(msg) {
    const inv = inviteById(msg.invite_id);
    if (!inv || msg.sender_id !== ME_ID) return;
    later(1800, () => partnerSays(inv, QUICK[REPLIES[QUICK.indexOf(msg.text)] ?? 3]));
  }

  // 発表中に「誘いが届く」を見せるための、用意しておいた誘い
  const INCOMING = [
    ['u-li', '麻婆豆腐', '🌶️', ['ひき肉', 'ねぎ'], ['豆腐'], TONIGHT, '学生会館の調理室'],
    ['u-jiwoo', '野菜チヂミ', '🥞', ['にら'], ['たまご', 'にんじん'], TONIGHT, '寮の共用キッチン'],
    ['u-mai', '鶏肉のフォー風スープ', '🍲', ['鶏むね肉', 'パクチー'], ['もやし'], TONIGHT, '国際交流センター'],
    ['u-kenta', '白菜と豚のミルフィーユ鍋', '🍲', ['白菜'], ['豚こま肉'], TONIGHT, '寮の共用キッチン'],
  ];
  window.demoIncomingInvite = function () {
    const busy = (id) => db.invites.some((i) => ['pending', 'accepted'].includes(i.status) && i.slot >= today() && involved(i, id));
    const next = INCOMING.find(([id]) => !busy(id));
    if (!next) return false;
    const [fromId, recipe, emoji, fromFoods, toFoods, slot, place] = next;
    const a = nameOf(fromId);
    db.invites.push({
      id: newId(), created_at: new Date().toISOString(), status: 'pending', from_id: fromId, to_id: ME_ID,
      from_name: a.display_name, from_flag: a.flag, from_avatar: a.avatar,
      to_name: me.display_name, to_flag: me.flag, to_avatar: me.avatar,
      recipe, recipe_emoji: emoji, slot, place, from_foods: fromFoods, to_foods: toFoods, from_photo_ok: false, to_photo_ok: false,
    });
    refresh();
    return true;
  };

  // ---------- テーブルの読み書き ----------
  const match = (row, filters) =>
    filters.every(([op, col, val]) => (op === 'eq' ? row[col] === val : op === 'in' ? val.includes(row[col]) : true));
  function visibleRows(table, uid) {
    if (table === 'profiles') return db.profiles.filter((p) => p.id === uid);
    if (table === 'invites') return db.invites.filter((i) => involved(i, uid));
    if (table === 'messages') return db.messages.filter((m) => involved(inviteById(m.invite_id) || {}, uid));
    if (table === 'meal_posts') return db.meal_posts.filter((m) => canSeeMeal(inviteById(m.invite_id), uid));
    if (table === 'shared_foods') return db.shared_foods.filter((f) => f.user_id === uid);
    return [];
  }
  const copy = (x) => JSON.parse(JSON.stringify(x));

  async function run(q) {
    await new Promise((r) => setTimeout(r, 80)); // 通信しているように少しだけ待つ
    const uid = session && session.user.id;
    if (!uid) return { data: null, error: { message: 'ログインしてください' } };
    const t = q.table;
    if (q.op === 'select') {
      let rows = visibleRows(t, uid).filter((r) => match(r, q.filters));
      if (q.order) {
        const [col, asc] = q.order;
        rows = [...rows].sort((a, b) => String(a[col]).localeCompare(String(b[col])) * (asc ? 1 : -1));
      }
      if (q.limit) rows = rows.slice(0, q.limit);
      return { data: q.single ? copy(rows[0] || null) : copy(rows), error: null };
    }
    if (q.op === 'insert') {
      const rows = (Array.isArray(q.payload) ? q.payload : [q.payload]).map((r) => ({ id: newId(), created_at: new Date().toISOString(), ...r }));
      for (const r of rows) {
        if (t === 'messages' && !QUICK.includes(r.text)) return { data: null, error: { message: 'このメッセージは送れません(決まった文だけ送れます)' } };
        if (t === 'invites') Object.assign(r, { status: 'pending', from_photo_ok: false, to_photo_ok: false });
      }
      db[t].push(...rows);
      rows.forEach((r) => {
        if (t === 'invites') afterInsertInvite(r);
        if (t === 'messages') afterInsertMessage(r);
      });
      return { data: null, error: null };
    }
    if (q.op === 'update') {
      visibleRows(t, uid)
        .filter((r) => match(r, q.filters))
        .forEach((r) => {
          if (t === 'invites') {
            const row = { ...q.payload };
            Object.assign(r, row);
            afterUpdateInvite(r, row);
          } else Object.assign(r, q.payload);
        });
      return { data: null, error: null };
    }
    if (q.op === 'upsert') {
      const r = db.profiles.find((p) => p.id === uid);
      if (r) Object.assign(r, q.payload);
      else db.profiles.push({ ...q.payload });
      return { data: null, error: null };
    }
    if (q.op === 'delete') {
      const del = visibleRows(t, uid).filter((r) => match(r, q.filters));
      db[t] = db[t].filter((r) => !del.includes(r));
      return { data: null, error: null };
    }
    return { data: null, error: { message: 'unsupported' } };
  }

  // ---------- ログイン(デモでは最初からログイン済み) ----------
  let session = { user: { id: ME_ID, email: 'aoi.demo@eis.hokudai.ac.jp' } };
  const listeners = [];
  const setSession = (s) => {
    session = s;
    listeners.forEach((fn) => setTimeout(() => fn(s ? 'SIGNED_IN' : 'SIGNED_OUT', s), 0));
  };

  function builder(table) {
    const q = { table, op: 'select', filters: [], order: null, limit: null, payload: null, single: false };
    const b = {
      select() { return b; },
      eq(col, val) { q.filters.push(['eq', col, val]); return b; },
      in(col, vals) { q.filters.push(['in', col, vals]); return b; },
      order(col, opts) { q.order = [col, !opts || opts.ascending !== false]; return b; },
      limit(k) { q.limit = k; return b; },
      maybeSingle() { q.single = true; return b; },
      insert(rows) { q.op = 'insert'; q.payload = rows; return b; },
      upsert(row) { q.op = 'upsert'; q.payload = row; return b; },
      update(row) { q.op = 'update'; q.payload = row; return b; },
      delete() { q.op = 'delete'; return b; },
      then(res, rej) { return run(q).then(res, rej); },
    };
    return b;
  }

  window.NOKORI_CONFIG = { supabaseUrl: 'demo', supabaseAnonKey: 'demo' };
  window.supabase = {
    createClient() {
      return {
        auth: {
          onAuthStateChange(fn) { listeners.push(fn); return { data: { subscription: { unsubscribe() {} } } }; },
          async getSession() { return { data: { session } }; },
          async signInWithOtp() { return { error: null }; },
          async verifyOtp({ email, token }) {
            if (!/^\d{6}$/.test(token)) return { error: { message: 'invalid' } };
            setSession({ user: { id: ME_ID, email } });
            return { error: null };
          },
          async signOut() { setSession(null); return { error: null }; },
        },
        from: (t) => builder(t),
        rpc: async (name, args) => {
          await new Promise((r) => setTimeout(r, 80));
          if (!session) return { data: null, error: { message: 'ログインしてください' } };
          return { data: copy(rpc(name, args || {}, session.user.id)), error: null };
        },
        storage: {
          from() {
            return {
              async upload(path, blob) {
                const inv = inviteById(path.split('/')[0]);
                if (!inv || inv.status !== 'accepted' || !involved(inv, session.user.id)) return { data: null, error: { message: '写真を上げられるのは、マッチが成立した2人だけです' } };
                db.photos[path] = URL.createObjectURL(blob);
                return { data: { path }, error: null };
              },
              async createSignedUrls(paths) {
                const uid = session && session.user.id;
                return {
                  data: paths.map((p) => {
                    const inv = inviteById(p.split('/')[0]);
                    return canSeeMeal(inv, uid) && db.photos[p] ? { path: p, signedUrl: db.photos[p], error: null } : { path: p, signedUrl: null, error: 'not allowed' };
                  }),
                  error: null,
                };
              },
            };
          },
        },
      };
    },
  };
})();
