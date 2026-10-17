/* =========================================================
   のこりものクラブ:北大生どうしの「本物のごはんマッチ」
   - config.js に Supabase の設定が入っているときだけ動きます
   - 設定がないとき・Supabase を読み込めないときは何もしません
     (app.js のデモ版のマッチが、そのまま動きます)
   ========================================================= */
(function () {
  const cfg = window.NOKORI_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase || !window.supabase.createClient) return;

  // メールのリンクを押して戻ってきたときに、自動でログイン状態にする
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit' },
  });
  // リンクを押したあとに戻ってくるページ(今開いているページ)
  const RETURN_URL = location.origin + location.pathname;

  // 北大のメールアドレス(〜@hokudai.ac.jp、〜@xxx.hokudai.ac.jp)
  const HOKUDAI_EMAIL = /@([a-z0-9-]+\.)*hokudai\.ac\.jp$/i;

  // ---------- 選択肢 ----------
  const COUNTRIES = [
    ['日本', '🇯🇵'], ['中国', '🇨🇳'], ['韓国', '🇰🇷'], ['台湾', '🇹🇼'], ['ベトナム', '🇻🇳'], ['タイ', '🇹🇭'],
    ['マレーシア', '🇲🇾'], ['インドネシア', '🇮🇩'], ['インド', '🇮🇳'], ['モンゴル', '🇲🇳'], ['ネパール', '🇳🇵'],
    ['アメリカ', '🇺🇸'], ['ブラジル', '🇧🇷'], ['フランス', '🇫🇷'], ['ドイツ', '🇩🇪'], ['イギリス', '🇬🇧'], ['その他', '🌏'],
  ];
  const STUDENT_TYPES = [['jp', '日本人学生'], ['intl', '留学生']];
  const LANGS = ['日本語', 'やさしい日本語', 'English', '中文', '한국어', 'Tiếng Việt', 'Bahasa'];
  const DIETS = [['halal', 'ハラール'], ['vegetarian', 'ベジタリアン']];
  const GENDERS = [['female', '女性'], ['male', '男性'], ['other', 'その他'], ['private', '回答しない']];
  const COOKING = ['苦手', 'ふつう', '得意'];
  const SLOT_DEFS = [
    { label: '今日の夜', day: 0, part: 'night' },
    { label: '明日の昼', day: 1, part: 'lunch' },
    { label: '明日の夜', day: 1, part: 'night' },
  ];
  const PART_TIME = { lunch: '12:00', night: '19:00' };
  const PART_LABEL = { lunch: '昼', night: '夜' };
  const MATCH_PLACES = ['寮の共用キッチン', '学生会館の調理室', '国際交流センター'];
  // ※ supabase-setup.sql の messages の一覧と、一字一句同じにしてください
  const QUICK_MESSAGES = [
    '向かっています / On my way',
    '少し遅れます / Running a bit late',
    "着きました / I'm here",
    '楽しみにしています! / Looking forward to it!',
    '今日はありがとう! / Thank you for today!',
  ];
  const POLL_MS = 15000; // 15秒ごとに新しい誘いを確認

  // ---------- 状態 ----------
  const cloud = {
    session: null,
    profile: null,
    profileLoaded: false,
    candidates: [],
    invites: [],
    messages: {},
    posts: [],
    error: '',
    login: { step: 'email', email: '', code: '', error: '', sending: false },
    seenStatus: {}, // 誘いの状態の変化を知らせるため
    photoInvite: null,
  };
  window.cloud = cloud; // 調べもの用

  const uid = () => (cloud.session ? cloud.session.user.id : null);

  // ---------- 時間帯('2026-10-18|night' の形で保存) ----------
  const slotKey = (def) => `${addDays(def.day)}|${def.part}`;
  const slotDate = (s) => s.split('|')[0];
  const slotPart = (s) => s.split('|')[1];
  const isActiveSlot = (s) => !!s && slotDate(s) >= addDays(0);
  function slotLabel(s) {
    const d = daysUntil(slotDate(s));
    const day = d === 0 ? '今日' : d === 1 ? '明日' : formatJP(slotDate(s));
    return `${day}の${PART_LABEL[slotPart(s)] || ''} ${PART_TIME[slotPart(s)] || ''}`;
  }
  const activeSlots = (list) => (list || []).filter(isActiveSlot);

  // ---------- app.js の部品を「本物」に差し替える ----------
  window.myProfile = () => cloud.profile;

  window.matchUsers = function () {
    const p = cloud.profile;
    if (!p || !p.match_on || !activeSlots(p.slots).length) return [];
    return cloud.candidates.map(toUser).filter(Boolean);
  };

  // すでに誘っている/誘われている相手は、候補に出さない
  window.isInvitedUser = function (id) {
    return cloud.invites.some(
      (i) => ['pending', 'accepted'].includes(i.status) && isActiveSlot(i.slot) && (i.from_id === id || i.to_id === id)
    );
  };

  window.renderMatches = renderCloud;

  const baseCommit = window.commit;
  window.commit = function () {
    baseCommit();
    scheduleFoodSync();
  };

  const baseShowTab = window.showTab;
  window.showTab = function (tab) {
    baseShowTab(tab);
    if (tab === 'party' && uid()) loadAll();
  };

  const baseRenderBadges = window.renderBadges;
  window.renderBadges = function () {
    baseRenderBadges();
    if (!uid()) return;
    const n = incoming().length;
    $('badgeParty').hidden = n === 0;
    $('badgeParty').textContent = n;
  };

  // サーバーから来た相手のデータを、app.js のマッチ判定で使える形にする
  function toUser(c) {
    const mine = activeSlots(cloud.profile.slots);
    const common = activeSlots(c.slots).filter((s) => mine.includes(s)).sort();
    if (!common.length) return null; // 空いている時間が合わない
    const slot = common[0];
    const myPlaces = cloud.profile.places || [];
    const theirPlaces = c.places && c.places.length ? c.places : MATCH_PLACES;
    const place = theirPlaces.find((p) => myPlaces.includes(p)) || theirPlaces[0];
    return {
      id: c.id,
      name: c.display_name,
      flag: c.flag || '🌏',
      country: c.country || '',
      type: c.student_type,
      profile: c.faculty_year || '',
      want: c.bio || '',
      langs: c.langs || [],
      diet: c.diet || [],
      allergies: c.allergies || '',
      cooking: c.cooking_level,
      favs: c.fav_cuisines || [],
      mealCount: Number(c.meal_count || 0),
      genderLabel: c.gender_label,
      slot,
      place,
      when: { day: daysUntil(slotDate(slot)), time: PART_TIME[slotPart(slot)] },
      foods: (c.foods || []).map((f) => ({ name: f.name, expiry: String(f.expiry).slice(0, 10) })),
    };
  }

  // ---------- 誘いの仕分け ----------
  const partnerOf = (i) =>
    i.from_id === uid() ? { name: i.to_name, flag: i.to_flag } : { name: i.from_name, flag: i.from_flag };
  const myFoodsIn = (i) => (i.from_id === uid() ? i.from_foods : i.to_foods) || [];
  const theirFoodsIn = (i) => (i.from_id === uid() ? i.to_foods : i.from_foods) || [];
  const recent = (i) => slotDate(i.slot) >= addDays(-1); // 写真を上げられるよう、昨日の分まで表示
  const incoming = () => cloud.invites.filter((i) => i.to_id === uid() && i.status === 'pending' && isActiveSlot(i.slot));
  const outgoing = () => cloud.invites.filter((i) => i.from_id === uid() && i.status === 'pending' && isActiveSlot(i.slot));
  const accepted = () => cloud.invites.filter((i) => i.status === 'accepted' && recent(i));
  const declined = () => cloud.invites.filter((i) => i.from_id === uid() && i.status === 'declined' && isActiveSlot(i.slot));

  // =========================================================
  //  サーバーとのやりとり
  // =========================================================
  function errorText(e) {
    const msg = (e && (e.message || e.error_description)) || String(e);
    if (/fetch|network/i.test(msg)) return 'サーバーにつながりません。電波を確認してください';
    if (/rate|429/i.test(msg)) return '短い時間に送りすぎました。少し待ってからもう一度試してください';
    return msg;
  }
  function showError(e) {
    cloud.error = errorText(e);
    toast(cloud.error);
    renderCloud();
  }

  let loading = false;
  async function loadAll() {
    if (!uid() || loading) return;
    loading = true;
    try {
      if (!cloud.profileLoaded) {
        const { data, error } = await sb.from('profiles').select('*').eq('id', uid()).maybeSingle();
        if (error) throw error;
        cloud.profile = data || null;
        cloud.profileLoaded = true;
      }
      if (cloud.profile) {
        const [cand, inv, posts] = await Promise.all([
          cloud.profile.match_on ? sb.rpc('match_candidates') : Promise.resolve({ data: [], error: null }),
          sb.from('invites').select('*').order('created_at', { ascending: false }).limit(40),
          sb.from('meal_posts').select('*').order('created_at', { ascending: false }).limit(12),
        ]);
        [cand, inv, posts].forEach((r) => {
          if (r.error) throw r.error;
        });
        cloud.candidates = cand.data || [];
        cloud.invites = inv.data || [];
        cloud.posts = posts.data || [];

        const ids = cloud.invites.filter((i) => i.status === 'accepted').map((i) => i.id);
        cloud.messages = {};
        if (ids.length) {
          const { data, error } = await sb.from('messages').select('*').in('invite_id', ids).order('created_at', { ascending: true });
          if (error) throw error;
          (data || []).forEach((m) => (cloud.messages[m.invite_id] = [...(cloud.messages[m.invite_id] || []), m]));
        }
        notifyChanges();
      }
      cloud.error = '';
    } catch (e) {
      cloud.error = errorText(e);
    } finally {
      loading = false;
    }
    renderAll();
  }

  // 新しい誘い・返事が届いたら知らせる
  function notifyChanges() {
    const first = Object.keys(cloud.seenStatus).length === 0;
    cloud.invites.forEach((i) => {
      const before = cloud.seenStatus[i.id];
      cloud.seenStatus[i.id] = i.status;
      if (first || before === i.status) return;
      if (!before && i.to_id === uid() && i.status === 'pending') toast(`${i.from_flag} ${i.from_name}さんから、ごはんの誘いが届きました`);
      if (before === 'pending' && i.from_id === uid() && i.status === 'accepted') toast(`${i.to_flag} ${i.to_name}さんがOKしました!マッチ成立です`);
      if (before === 'pending' && i.from_id === uid() && i.status === 'declined') toast(`${i.to_name}さんは、今回はパスでした`);
    });
    if (first) cloud.seenStatus.__ready = 'yes';
  }

  // マッチONのときだけ、期限が3日以内(期限切れは除く)の食材を共有する
  let syncTimer;
  function scheduleFoodSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncFoods, 1200);
  }
  async function syncFoods() {
    if (!uid() || !cloud.profile) return;
    const rows = cloud.profile.match_on
      ? state.foods
          .filter((f) => {
            const d = daysUntil(f.expiry);
            return d >= 0 && d <= 3;
          })
          .map((f) => ({ user_id: uid(), name: f.name.slice(0, 40), expiry: f.expiry }))
      : [];
    const del = await sb.from('shared_foods').delete().eq('user_id', uid());
    if (del.error) return showError(del.error);
    if (rows.length) {
      const ins = await sb.from('shared_foods').insert(rows);
      if (ins.error) return showError(ins.error);
    }
  }

  async function updateProfile(fields) {
    const { error } = await sb.from('profiles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', uid());
    if (error) return showError(error);
    cloud.profile = { ...cloud.profile, ...fields };
    renderAll();
    if ('match_on' in fields) await syncFoods();
    loadAll();
  }

  // ---------- ログイン(北大メールに届く確認コード) ----------
  sb.auth.onAuthStateChange((_event, session) => handleSession(session));
  sb.auth.getSession().then(({ data }) => handleSession(data.session));

  function handleSession(session) {
    const before = uid();
    if (session && !HOKUDAI_EMAIL.test(session.user.email || '')) {
      cloud.login.error = '北大のメールアドレス(〜hokudai.ac.jp)でログインしてください';
      sb.auth.signOut();
      session = null;
    }
    cloud.session = session || null;
    if (uid() !== before) {
      Object.assign(cloud, { profile: null, profileLoaded: false, candidates: [], invites: [], messages: {}, posts: [], seenStatus: {} });
    }
    if (uid()) loadAll();
    else renderAll();
  }

  async function sendCode() {
    const email = cloud.login.email.trim();
    if (!HOKUDAI_EMAIL.test(email)) return setLoginError('北大のメールアドレス(〜hokudai.ac.jp で終わるもの)を入力してください');
    cloud.login.sending = true;
    cloud.login.error = '';
    renderCloud();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: RETURN_URL },
    });
    cloud.login.sending = false;
    if (error) return setLoginError(errorText(error));
    cloud.login.step = 'code';
    cloud.login.code = '';
    renderCloud();
  }

  async function verifyCode() {
    const token = (cloud.login.code || '').replace(/\D/g, '');
    if (token.length < 6) return setLoginError('メールに届いた数字を入力してください');
    cloud.login.sending = true;
    renderCloud();
    const { error } = await sb.auth.verifyOtp({ email: cloud.login.email.trim(), token, type: 'email' });
    cloud.login.sending = false;
    if (error) return setLoginError('コードが違うか、有効期限が切れています。もう一度コードを送ってください');
    cloud.login = { step: 'email', email: '', code: '', error: '', sending: false };
  }

  function setLoginError(text) {
    cloud.login.error = text;
    renderCloud();
  }

  // =========================================================
  //  画面
  // =========================================================
  function renderCloud() {
    const area = $('cloudArea');
    if (!uid()) {
      area.innerHTML = loginHtml();
      return;
    }
    if (!cloud.profileLoaded) {
      area.innerHTML = `${errorHtml()}<p class="lead">読み込んでいます…</p>`;
      return;
    }
    if (!cloud.profile) {
      area.innerHTML = welcomeHtml();
      return;
    }
    area.innerHTML = [errorHtml(), settingsHtml(), invitesHtml(), candidatesHtml(), feedHtml(), safetyHtml()].join('');
  }

  const errorHtml = () => (cloud.error ? `<p class="cloud-error" role="alert">${esc(cloud.error)}</p>` : '');
  const safetyHtml = () =>
    '<p class="safety-note">表示されるのは、北大のメールアドレスで認証した学生だけです。初めての相手とは学内の共用スペースで会い、住所や連絡先は教えないでください。</p>';

  function loginHtml() {
    const l = cloud.login;
    const body =
      l.step === 'email'
        ? `<label class="field-label" for="loginEmail">北大のメールアドレス</label>
           <input type="email" id="loginEmail" value="${esc(l.email)}" placeholder="例:xxxx@eis.hokudai.ac.jp" autocomplete="email" inputmode="email">
           <button type="submit" class="btn btn-primary wide" ${l.sending ? 'disabled' : ''}>${l.sending ? '送っています…' : 'ログイン用のメールを送る'}</button>`
        : `<p class="hint"><b>${esc(l.email)}</b> にログイン用のメールを送りました(迷惑メールフォルダも確認してください)。</p>
           <p class="login-step"><b>メールの「Sign in」リンクを押す</b>と、このアプリが開いてログインできます。</p>
           <p class="hint">メールに6桁の数字が書かれている場合は、下に入力してもログインできます。</p>
           <label class="field-label" for="loginCode">確認コード(数字がある場合のみ)</label>
           <input type="text" id="loginCode" value="${esc(l.code)}" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="123456">
           <button type="submit" class="btn btn-primary wide" ${l.sending ? 'disabled' : ''}>${l.sending ? '確認しています…' : 'ログイン'}</button>
           <button type="button" class="link-btn center" data-cloud="change-email">メールアドレスを入れ直す</button>`;
    return `
      <form class="panel cloud-panel" data-cloud-form="login" novalidate>
        <p class="panel-title">北大生どうしで、ごはんマッチ</p>
        <p class="hint">北大のメールアドレス(〜hokudai.ac.jp)でログインすると、期限間近の食材を持ち寄って一緒にごはんを作れる相手が見つかります。パスワードは不要です。</p>
        ${body}
        ${l.error ? `<p class="form-error">${esc(l.error)}</p>` : ''}
      </form>`;
  }

  function welcomeHtml() {
    return `
      <div class="panel cloud-panel">
        <p class="panel-title">ログインしました</p>
        <p class="hint">まずはプロフィールを作りましょう。国、話せる言語、食の制限、料理の得意・不得意をもとに、相手を探します。</p>
        <button type="button" class="btn btn-primary wide" data-cloud="edit-profile">プロフィールを作る</button>
        <button type="button" class="link-btn center" data-cloud="logout">ログアウト</button>
      </div>`;
  }

  function settingsHtml() {
    const p = cloud.profile;
    const slots = activeSlots(p.slots);
    const slotChips = SLOT_DEFS.map((d) => {
      const key = slotKey(d);
      return `<button type="button" class="chip ${slots.includes(key) ? 'is-on' : ''}" data-cloud="slot" data-slot="${key}">${d.label}</button>`;
    }).join('');
    const placeChips = MATCH_PLACES.map(
      (pl) => `<button type="button" class="chip ${(p.places || []).includes(pl) ? 'is-on' : ''}" data-cloud="place" data-place="${esc(pl)}">${esc(pl)}</button>`
    ).join('');
    return `
      <div class="panel cloud-panel">
        <div class="switch-row">
          <div>
            <p class="panel-title">${esc(p.flag)} ${esc(p.display_name)}さんのマッチ</p>
            <p class="hint">ONの間だけ、期限が3日以内の食材が相手に表示されます</p>
          </div>
          <button type="button" class="switch ${p.match_on ? 'on' : ''}" role="switch" aria-checked="${p.match_on}" aria-label="マッチ" data-cloud="toggle-match"><span></span></button>
        </div>
        <p class="field-label">空いている時間</p>
        <div class="chips wrap">${slotChips}</div>
        <p class="field-label">会える場所</p>
        <div class="chips wrap">${placeChips}</div>
        <button type="button" class="link-btn" data-cloud="edit-profile">プロフィールを編集</button>
      </div>`;
  }

  function foodChips(names) {
    return names.length ? `<ul class="ings">${names.map((n) => `<li class="ing have">${esc(n)}</li>`).join('')}</ul>` : '<p class="hint">なし</p>';
  }

  function inviteCard(i, kind) {
    const partner = partnerOf(i);
    const combo = `
      <div class="combo">
        <div class="combo-side"><p class="combo-label">あなたの食材</p>${foodChips(myFoodsIn(i))}</div>
        <span class="combo-plus" aria-hidden="true">＋</span>
        <div class="combo-side"><p class="combo-label">${esc(partner.name)}さんの食材</p>${foodChips(theirFoodsIn(i))}</div>
      </div>`;
    const head = `
      <div class="match-recipe">
        <span class="recipe-emoji" aria-hidden="true">${esc(i.recipe_emoji || '🍳')}</span>
        <div>
          <p class="match-recipe-name">${esc(i.recipe)}</p>
          <p class="match-when">${esc(slotLabel(i.slot))}・${esc(i.place)}</p>
        </div>
      </div>`;

    if (kind === 'incoming') {
      return `
        <li class="match" data-invite="${i.id}">
          <p class="match-name">${esc(i.from_flag)} ${esc(i.from_name)}さんから、ごはんの誘いが届きました</p>
          ${head}${combo}
          <div class="match-actions">
            <button type="button" class="btn btn-primary" data-cloud="accept">OK!</button>
            <button type="button" class="btn btn-ghost" data-cloud="decline">今回はパス</button>
          </div>
        </li>`;
    }
    if (kind === 'outgoing') {
      return `
        <li class="match" data-invite="${i.id}">
          <p class="match-name">${esc(i.to_flag)} ${esc(i.to_name)}さんの返事待ち<span class="verified pending">返事待ち</span></p>
          ${head}
          <div class="match-actions">
            <button type="button" class="link-btn" data-cloud="cancel">誘いを取り消す</button>
          </div>
        </li>`;
    }
    // マッチ成立
    const msgs = (cloud.messages[i.id] || [])
      .slice(-6)
      .map((m) => `<li><b>${esc(m.sender_name)}</b>:${esc(m.text)} <span>${new Date(m.created_at).toTimeString().slice(0, 5)}</span></li>`)
      .join('');
    const ended = (state.endedInvites || []).includes(i.id);
    return `
      <li class="match done" data-invite="${i.id}">
        <p class="match-name">${esc(partner.flag)} ${esc(partner.name)}さんとマッチ成立<span class="verified">マッチ成立</span></p>
        ${head}${combo}
        <div class="msg-box">
          <p class="combo-label">メッセージ(決まった文だけ送れます)</p>
          ${msgs ? `<ul class="msg-list">${msgs}</ul>` : ''}
          <div class="quick-msgs">
            ${QUICK_MESSAGES.map((t, n) => `<button type="button" class="chip" data-cloud="message" data-msg="${n}">${esc(t.split(' / ')[0])}</button>`).join('')}
          </div>
        </div>
        <div class="match-actions">
          <button type="button" class="btn btn-soft" data-cloud="photo">📷 ごはんの写真をシェア</button>
          ${ended
            ? '<span class="match-status">✓ 使い切りとして記録済み</span>'
            : '<button type="button" class="btn btn-ghost" data-cloud="ended">ごはん会が終わった</button>'}
        </div>
      </li>`;
  }

  function invitesHtml() {
    const parts = [];
    const inc = incoming();
    const acc = accepted();
    const out = outgoing();
    const dec = declined();
    if (inc.length) parts.push(`<p class="section-label">届いた誘い</p><ul class="match-list">${inc.map((i) => inviteCard(i, 'incoming')).join('')}</ul>`);
    if (acc.length) parts.push(`<p class="section-label">決まったごはん会</p><ul class="match-list">${acc.map((i) => inviteCard(i, 'accepted')).join('')}</ul>`);
    if (out.length) parts.push(`<p class="section-label">返事待ち</p><ul class="match-list">${out.map((i) => inviteCard(i, 'outgoing')).join('')}</ul>`);
    if (dec.length) parts.push(dec.map((i) => `<p class="hint">${esc(i.to_name)}さんへの「${esc(i.recipe)}」の誘いは、今回はパスでした。</p>`).join(''));
    return parts.join('');
  }

  function candidatesHtml() {
    const p = cloud.profile;
    const head = '<p class="section-label">おすすめの相手</p>';
    if (!p.match_on) return `${head}<p class="hint">マッチをONにすると、一緒にごはんを作れる相手が表示されます。</p>`;
    if (!activeSlots(p.slots).length) return `${head}<p class="hint">「空いている時間」を1つ以上選んでください。</p>`;

    const filter = `<div class="chips">${[
      ['all', 'だれとでも'],
      ['intl', '留学生と'],
      ['jp', '日本人学生と'],
    ]
      .map(([k, label]) => `<button type="button" class="chip ${matchFilter === k ? 'is-active' : ''}" data-cloud="filter" data-filter="${k}">${label}</button>`)
      .join('')}</div>`;

    const list = computeMatches().filter((m) => matchFilter === 'all' || m.user.type === matchFilter);
    if (!list.length) {
      return `${head}${filter}<p class="hint">今の食材と時間で一緒に作れる相手は、まだ見つかりません。期限が3日以内の食材があるか、時間の選び方を確認してください。15秒ごとに自動で探し直します。</p>`;
    }
    const shown = matchShowAll ? list : list.slice(0, 3);
    const cards = shown.map((m) => {
      const u = m.user;
      const missing = m.items.filter((i) => !i.food);
      const facts = [
        u.cooking ? `料理:${u.cooking}` : '',
        u.mealCount ? `ごはん会の写真 ${u.mealCount}枚` : 'はじめてのごはん会',
        u.genderLabel ? (GENDERS.find(([k]) => k === u.genderLabel) || [, ''])[1] : '',
      ].filter(Boolean);
      return `
        <li class="match" data-user="${u.id}">
          <div class="match-person">
            <span class="match-avatar" aria-hidden="true">${esc(u.flag)}</span>
            <div>
              <p class="match-name">${esc(u.name)}さん<span class="verified">北大認証済み</span></p>
              <p class="match-profile">${esc(u.country)}・${u.type === 'intl' ? '留学生' : '日本人学生'}${u.profile ? `・${esc(u.profile)}` : ''}</p>
              <p class="match-profile">${facts.map(esc).join('・')}</p>
            </div>
          </div>
          ${u.want ? `<p class="match-want">「${esc(u.want)}」</p>` : ''}
          <div class="match-recipe">
            <span class="recipe-emoji" aria-hidden="true">${m.recipe.emoji}</span>
            <div>
              <p class="match-recipe-name">${esc(m.recipe.name)}</p>
              <p class="match-when">${esc(slotLabel(u.slot))}・${esc(u.place)}</p>
            </div>
          </div>
          <div class="combo">
            <div class="combo-side"><p class="combo-label">あなたの食材</p><ul class="ings">${ingChips(m.mine)}</ul></div>
            <span class="combo-plus" aria-hidden="true">＋</span>
            <div class="combo-side"><p class="combo-label">${esc(u.name)}さんの食材</p><ul class="ings">${ingChips(m.them)}</ul></div>
          </div>
          ${missing.length ? `<p class="hint">あと少し:${missing.map((i) => esc(i.label)).join('、')}</p>` : ''}
          ${u.langs.length ? `<div class="tags">${u.langs.map((l) => `<span class="tag">${esc(l)}</span>`).join('')}</div>` : ''}
          <div class="reasons">${matchReasons(m).map((r) => `<span class="reason ${r.cls || ''}">${esc(r.text)}</span>`).join('')}</div>
          <div class="match-actions">
            <button type="button" class="btn btn-primary" data-cloud="invite">${esc(u.name)}さんをごはんに誘う</button>
          </div>
        </li>`;
    });
    const more = !matchShowAll && list.length > 3 ? '<button type="button" class="link-btn center" data-cloud="more">ほかの候補も見る</button>' : '';
    return `${head}${filter}<ul class="match-list">${cards.join('')}</ul>${more}`;
  }

  function photoUrl(path) {
    return sb.storage.from('meal-photos').getPublicUrl(path).data.publicUrl;
  }

  function feedHtml() {
    const head = '<p class="section-label">みんなで作ったごはん</p>';
    if (!cloud.posts.length) return `${head}<p class="hint">ごはん会のあとに写真をシェアすると、ここに並びます。写真の枚数は、料理の実績としてプロフィールにも表示されます。</p>`;
    return `${head}<div class="meal-grid">${cloud.posts
      .map((p) => {
        const d = new Date(p.created_at);
        return `
          <figure class="meal-photo">
            <img src="${esc(photoUrl(p.photo_path))}" alt="${esc(p.recipe)}の写真" loading="lazy">
            <figcaption>${esc(p.recipe)}<span>${esc(p.author_flag)} ${esc(p.author_name)}・${d.getMonth() + 1}/${d.getDate()}</span></figcaption>
          </figure>`;
      })
      .join('')}</div>`;
  }

  // =========================================================
  //  操作
  // =========================================================
  const area = $('cloudArea');

  area.addEventListener('input', (e) => {
    if (e.target.id === 'loginEmail') cloud.login.email = e.target.value;
    if (e.target.id === 'loginCode') cloud.login.code = e.target.value;
  });

  area.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-cloud-form="login"]')) return;
    e.preventDefault();
    if (cloud.login.sending) return;
    if (cloud.login.step === 'email') sendCode();
    else verifyCode();
  });

  area.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-cloud]');
    if (!btn || btn.disabled) return;
    const action = btn.dataset.cloud;
    const inviteEl = btn.closest('[data-invite]');
    const inv = inviteEl && cloud.invites.find((i) => i.id === inviteEl.dataset.invite);
    const p = cloud.profile;

    if (action === 'change-email') {
      cloud.login.step = 'email';
      cloud.login.error = '';
      renderCloud();
    }
    if (action === 'edit-profile') openProfile();
    if (action === 'logout') logout();
    if (action === 'toggle-match') updateProfile({ match_on: !p.match_on });
    if (action === 'slot') {
      const key = btn.dataset.slot;
      const slots = activeSlots(p.slots);
      updateProfile({ slots: slots.includes(key) ? slots.filter((s) => s !== key) : [...slots, key].sort() });
    }
    if (action === 'place') {
      const pl = btn.dataset.place;
      const places = p.places || [];
      updateProfile({ places: places.includes(pl) ? places.filter((x) => x !== pl) : [...places, pl] });
    }
    if (action === 'filter') {
      matchFilter = btn.dataset.filter;
      renderCloud();
    }
    if (action === 'more') {
      matchShowAll = true;
      renderCloud();
    }
    if (action === 'invite') sendInvite(btn.closest('[data-user]').dataset.user);
    if (action === 'accept' && inv) answer(inv, 'accepted');
    if (action === 'decline' && inv) answer(inv, 'declined');
    if (action === 'cancel' && inv) answer(inv, 'cancelled');
    if (action === 'message' && inv) sendMessage(inv, Number(btn.dataset.msg));
    if (action === 'photo' && inv) {
      cloud.photoInvite = inv;
      $('mealPhotoInput').value = '';
      $('mealPhotoInput').click();
    }
    if (action === 'ended' && inv) endMeal(inv);
  });

  async function sendInvite(userId) {
    const u = matchUsers().find((x) => x.id === userId);
    const m = u && bestMatchFor(u);
    if (!m) return toast('この相手とは、今の食材ではマッチできなくなりました');
    const ok = await ask(
      `${u.name}さんをごはんに誘いますか?`,
      `${slotLabel(u.slot)}・${u.place}で「${m.recipe.name}」。相手がOKするとマッチ成立です`,
      [
        { label: 'やめる', value: false },
        { label: '誘う', value: true, style: 'btn-primary' },
      ]
    );
    if (!ok) return;
    const p = cloud.profile;
    const { error } = await sb.from('invites').insert({
      from_id: uid(),
      to_id: u.id,
      from_name: p.display_name,
      from_flag: p.flag,
      to_name: u.name,
      to_flag: u.flag,
      recipe: m.recipe.name,
      recipe_emoji: m.recipe.emoji,
      slot: u.slot,
      place: u.place,
      from_foods: m.mine.map((i) => i.food.name),
      to_foods: m.them.map((i) => i.food.name),
    });
    if (error) return showError(error);
    toast(`${u.name}さんに誘いを送りました`);
    loadAll();
  }

  async function answer(inv, status) {
    if (status === 'cancelled') {
      const ok = await ask('誘いを取り消しますか?', `${inv.to_name}さんへの誘いを取り消します`, [
        { label: 'やめる', value: false },
        { label: '取り消す', value: true, style: 'btn-danger' },
      ]);
      if (!ok) return;
    }
    const { error } = await sb.from('invites').update({ status }).eq('id', inv.id);
    if (error) return showError(error);
    cloud.seenStatus[inv.id] = status;
    toast(status === 'accepted' ? 'マッチ成立!当日は学内で会いましょう' : status === 'declined' ? 'パスしました' : '取り消しました');
    loadAll();
  }

  async function sendMessage(inv, n) {
    const text = QUICK_MESSAGES[n];
    if (!text) return;
    const { error } = await sb.from('messages').insert({
      invite_id: inv.id,
      sender_id: uid(),
      sender_name: cloud.profile.display_name,
      text,
    });
    if (error) return showError(error);
    toast('送りました');
    loadAll();
  }

  // ごはん会が終わったら、持っていった自分の食材を「料理会で使い切り」として記録
  function endMeal(inv) {
    let n = 0;
    myFoodsIn(inv).forEach((name) => {
      const food = state.foods.find((f) => normalize(f.name) === normalize(name));
      if (food) {
        finishFood(food, 'used', 'party');
        n++;
      }
    });
    state.endedInvites = [...(state.endedInvites || []), inv.id];
    commit();
    toast(n ? `${n}品を使い切りとして記録しました` : '記録しました');
  }

  // ---------- ごはんの写真 ----------
  $('mealPhotoInput').addEventListener('change', async () => {
    const file = $('mealPhotoInput').files[0];
    const inv = cloud.photoInvite;
    if (!file || !inv) return;
    try {
      toast('写真をアップロードしています…');
      const dataUrl = await shrinkImage(file, 1024);
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${inv.id}/${uid()}-${Date.now()}.jpg`;
      const up = await sb.storage.from('meal-photos').upload(path, blob, { contentType: 'image/jpeg' });
      if (up.error) throw up.error;
      const { error } = await sb.from('meal_posts').insert({
        invite_id: inv.id,
        user_id: uid(),
        author_name: cloud.profile.display_name,
        author_flag: cloud.profile.flag,
        recipe: inv.recipe,
        photo_path: path,
      });
      if (error) throw error;
      toast('写真をシェアしました');
      loadAll();
    } catch (e) {
      showError(e);
    }
  });

  async function logout() {
    const ok = await ask('ログアウトしますか?', 'マッチをONのままにすると、ログアウト中も食材は相手に表示されます', [
      { label: 'やめる', value: false },
      { label: 'マッチをOFFにしてログアウト', value: 'off', style: 'btn-primary' },
    ]);
    if (!ok) return;
    if (cloud.profile && cloud.profile.match_on) {
      await sb.from('profiles').update({ match_on: false }).eq('id', uid());
      await sb.from('shared_foods').delete().eq('user_id', uid());
    }
    $('profileSheet').hidden = true;
    await sb.auth.signOut();
  }

  // =========================================================
  //  プロフィールの入力シート
  // =========================================================
  const pf = { type: '', langs: [], diet: [], gender: '', cooking: '', cuisines: [] };

  $('pfCountry').innerHTML = COUNTRIES.map(([name, flag]) => `<option value="${name}">${flag} ${name}</option>`).join('');

  function chip(group, value, label, on) {
    return `<button type="button" class="chip ${on ? 'is-on' : ''}" data-pf="${group}" data-value="${esc(value)}">${esc(label)}</button>`;
  }
  function renderProfileChips() {
    $('pfType').innerHTML = STUDENT_TYPES.map(([v, l]) => chip('type', v, l, pf.type === v)).join('');
    $('pfLangs').innerHTML = LANGS.map((l) => chip('langs', l, l, pf.langs.includes(l))).join('');
    $('pfDiet').innerHTML = DIETS.map(([v, l]) => chip('diet', v, l, pf.diet.includes(v))).join('');
    $('pfGender').innerHTML = GENDERS.map(([v, l]) => chip('gender', v, l, pf.gender === v)).join('');
    $('pfCooking').innerHTML = COOKING.map((c) => chip('cooking', c, c, pf.cooking === c)).join('');
    $('pfCuisines').innerHTML = CUISINES.map((c) => chip('cuisines', c, c, pf.cuisines.includes(c))).join('');
    const isPrivate = pf.gender === 'private';
    $('pfSameGender').disabled = isPrivate;
    if (isPrivate) $('pfSameGender').checked = false;
    $('pfGenderPublic').disabled = isPrivate;
    if (isPrivate) $('pfGenderPublic').checked = false;
  }

  function openProfile() {
    const p = cloud.profile || {};
    $('pfName').value = p.display_name || '';
    $('pfCountry').value = p.country || '日本';
    $('pfFaculty').value = p.faculty_year || '';
    $('pfBio').value = p.bio || '';
    $('pfAllergy').value = p.allergies || '';
    $('pfGenderPublic').checked = !!p.gender_public;
    $('pfSameGender').checked = !!p.same_gender_only;
    Object.assign(pf, {
      type: p.student_type || '',
      langs: [...(p.langs || [])],
      diet: [...(p.diet || [])],
      gender: p.gender || '',
      cooking: p.cooking_level || '',
      cuisines: [...(p.fav_cuisines || [])],
    });
    $('profileError').hidden = true;
    renderProfileChips();
    $('profileSheet').hidden = false;
  }

  document.querySelector('#profileSheet .sheet').addEventListener('click', (e) => {
    const c = e.target.closest('[data-pf]');
    if (!c) return;
    const { pf: group, value } = c.dataset;
    if (Array.isArray(pf[group])) {
      pf[group] = pf[group].includes(value) ? pf[group].filter((v) => v !== value) : [...pf[group], value];
    } else {
      pf[group] = value;
    }
    renderProfileChips();
  });
  $('profileCancel').addEventListener('click', () => ($('profileSheet').hidden = true));
  $('profileSheet').addEventListener('click', (e) => {
    if (e.target === $('profileSheet')) $('profileSheet').hidden = true;
  });
  $('logoutBtn').addEventListener('click', logout);

  $('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = (text) => {
      $('profileError').textContent = text;
      $('profileError').hidden = false;
    };
    const name = $('pfName').value.trim();
    if (!name) return err('表示名を入れてください');
    if (!pf.type) return err('「日本人学生」か「留学生」を選んでください');
    if (!pf.gender) return err('性別を選んでください(「回答しない」も選べます)');
    if (!pf.cooking) return err('料理の得意・不得意を選んでください');
    if ($('pfSameGender').checked && pf.gender === 'private') return err('同性のみにするには、性別を選んでください');

    const country = $('pfCountry').value;
    const row = {
      id: uid(),
      display_name: name.slice(0, 30),
      country,
      flag: (COUNTRIES.find(([n]) => n === country) || ['', '🌏'])[1],
      student_type: pf.type,
      faculty_year: $('pfFaculty').value.trim().slice(0, 30),
      bio: $('pfBio').value.trim().slice(0, 80),
      langs: pf.langs,
      diet: pf.diet,
      allergies: $('pfAllergy').value.trim().slice(0, 60),
      gender: pf.gender,
      gender_public: $('pfGenderPublic').checked,
      same_gender_only: $('pfSameGender').checked,
      cooking_level: pf.cooking,
      fav_cuisines: pf.cuisines,
      updated_at: new Date().toISOString(),
    };
    if (!cloud.profile) {
      // はじめて作るときの初期値(マッチは本人がONにするまでOFF)
      Object.assign(row, { match_on: false, slots: [], places: [...MATCH_PLACES] });
    }
    $('profileSubmit').disabled = true;
    const { error } = await sb.from('profiles').upsert(row);
    $('profileSubmit').disabled = false;
    if (error) return err(errorText(error));
    cloud.profile = { ...(cloud.profile || {}), ...row };
    $('profileSheet').hidden = true;
    toast('プロフィールを保存しました');
    loadAll();
  });

  // ---------- 起動 ----------
  $('demoArea').hidden = true;
  $('cloudArea').hidden = false;
  setInterval(() => {
    if (uid() && !document.hidden) loadAll();
  }, POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && uid()) loadAll();
  });
  renderAll();
})();
