/* =========================================================
   のこりものクラブ の動き
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

// ---------- レシピの一覧 ----------
// ingredients の「|」は「どれか1つあればOK」という意味(例:'鶏肉|鶏もも|鶏むね')
// 醤油・塩・油などの調味料は、家にある前提で書いていません
const RECIPES = [
  { name: '具だくさん豚汁', origin: '日本', emoji: '🥣', minutes: 25,
    ingredients: ['豚こま肉|豚肉|豚バラ', 'にんじん', '大根', '玉ねぎ', '味噌'],
    steps: ['野菜と肉を食べやすく切る', '鍋で肉を炒め、野菜と水を入れて煮る', '火を止めて味噌を溶かす'] },
  { name: 'キャベツと豚の回鍋肉', origin: '中国', emoji: '🥬', minutes: 15,
    ingredients: ['キャベツ', '豚こま肉|豚肉|豚バラ', 'ピーマン'],
    steps: ['キャベツはざく切り、ピーマンは細切り', '豚肉を炒めて色が変わったら野菜を加える', '味噌・醤油・砂糖で味つけ'] },
  { name: '焼きうどん', origin: '日本', emoji: '🍜', minutes: 15,
    ingredients: ['うどん', 'キャベツ', '豚こま肉|豚肉|豚バラ', 'にんじん'],
    steps: ['冷凍うどんはレンジで解凍する', '肉と野菜を炒める', 'うどんを加え、醤油とかつお節で仕上げる'] },
  { name: '野菜たっぷりカレー', origin: '日本', emoji: '🍛', minutes: 40,
    ingredients: ['カレールー', 'にんじん', '玉ねぎ', 'じゃがいも', '豚こま肉|豚肉|鶏肉|牛肉'],
    steps: ['材料を一口大に切って炒める', '水を入れて野菜がやわらかくなるまで煮る', '火を止めてルーを溶かし、再び煮込む'] },
  { name: '野菜チヂミ', origin: '韓国', emoji: '🥞', minutes: 20,
    ingredients: ['にら|ねぎ', 'たまご|卵', 'にんじん', '小麦粉'],
    steps: ['野菜を細切りにする', '小麦粉・卵・水と混ぜる', '多めの油で両面をカリッと焼く'] },
  { name: 'トマトと卵の炒め物', origin: '中国', emoji: '🍅', minutes: 10,
    ingredients: ['トマト', 'たまご|卵'],
    steps: ['卵を半熟に炒めて取り出す', 'トマトを炒めて砂糖・塩を加える', '卵を戻してさっと混ぜる'] },
  { name: 'フレンチトースト', origin: 'フランス', emoji: '🍞', minutes: 15,
    ingredients: ['食パン|パン', 'たまご|卵', '牛乳'],
    steps: ['卵・牛乳・砂糖を混ぜる', 'パンを浸してしみこませる', 'バターで両面を焼く'] },
  { name: 'かんたんラッシー', origin: 'インド', emoji: '🥛', minutes: 5,
    ingredients: ['ヨーグルト', '牛乳', 'バナナ|はちみつ'],
    steps: ['ヨーグルトと牛乳を同じ量ずつ入れる', '砂糖かはちみつで甘さを調整', 'よく混ぜて冷やす'] },
  { name: '鶏肉のフォー風スープ', origin: 'ベトナム', emoji: '🍲', minutes: 25,
    ingredients: ['鶏肉|鶏もも|鶏むね', 'もやし', 'ねぎ', 'しょうが'],
    steps: ['鶏肉をしょうがと一緒にゆでてスープをとる', 'ナンプラーか塩で味をととのえる', 'もやしとねぎをのせる'] },
  { name: 'キャロットラペ', origin: 'フランス', emoji: '🥕', minutes: 10,
    ingredients: ['にんじん', 'レモン|酢'],
    steps: ['にんじんを細切りにして塩をふる', '水気をしぼる', 'オリーブオイル・酢・砂糖であえる'] },
  { name: 'ミルクシチュー', origin: 'ヨーロッパ', emoji: '🍵', minutes: 35,
    ingredients: ['牛乳', 'にんじん', '玉ねぎ', 'じゃがいも', '鶏肉|鶏もも|鶏むね'],
    steps: ['材料を切って炒める', '水で野菜がやわらかくなるまで煮る', '牛乳とシチューの素を加えて煮込む'] },
  { name: 'ザジキ(ヨーグルトのディップ)', origin: 'ギリシャ', emoji: '🥒', minutes: 10,
    ingredients: ['ヨーグルト', 'きゅうり', 'にんにく'],
    steps: ['きゅうりをすりおろして水気をしぼる', 'ヨーグルトとにんにくを混ぜる', 'オリーブオイルと塩で味つけ'] },
  { name: '肉野菜炒め', origin: '日本', emoji: '🍳', minutes: 10,
    ingredients: ['キャベツ', 'にんじん', 'もやし', '豚こま肉|豚肉|豚バラ'],
    steps: ['野菜を切る', '強火で肉→かたい野菜→やわらかい野菜の順に炒める', '塩こしょうと醤油で味つけ'] },
  { name: 'だし巻き卵', origin: '日本', emoji: '🥚', minutes: 10,
    ingredients: ['たまご|卵'],
    steps: ['卵にだしと醤油を混ぜる', '卵焼き器で少しずつ巻きながら焼く', '形を整えて切る'] },
  { name: '親子丼', origin: '日本', emoji: '🍚', minutes: 20,
    ingredients: ['鶏肉|鶏もも|鶏むね', 'たまご|卵', '玉ねぎ'],
    steps: ['玉ねぎを薄切り、鶏肉を一口大に切る', 'めんつゆと水で煮て、鶏肉に火を通す', '溶き卵を回し入れ、半熟でごはんにのせる'] },
  { name: '麻婆豆腐', origin: '中国', emoji: '🌶️', minutes: 15,
    ingredients: ['豆腐', 'ひき肉|豚こま肉|豚肉', 'ねぎ'],
    steps: ['豆腐をさいの目に切る', 'ひき肉を炒め、麻婆豆腐の素か豆板醤・味噌で味つけ', '豆腐を加えて煮て、水溶き片栗粉でとろみをつける'] },
  { name: 'サバの味噌煮', origin: '日本', emoji: '🐟', minutes: 25,
    ingredients: ['さば|サバ|鯖', 'しょうが', 'ねぎ'],
    steps: ['水・酒・砂糖・しょうがを煮立てる', 'サバを入れて落としぶたで10分煮る', '味噌を溶き入れ、煮汁をかけながら煮つめる'] },
  { name: '鮭のちゃんちゃん焼き', origin: '日本(北海道)', emoji: '🍣', minutes: 20,
    ingredients: ['鮭|さけ|サケ|サーモン', 'キャベツ', '玉ねぎ', 'にんじん', '味噌'],
    steps: ['味噌・みりん・砂糖を混ぜてタレを作る', 'フライパンに鮭と野菜をのせ、タレをかける', 'ふたをして蒸し焼きにし、ほぐしながら食べる'] },

  // ----- ラム肉 -----
  { name: 'ジンギスカン', origin: '日本(北海道)', emoji: '🐑', minutes: 30,
    ingredients: ['ラム|マトン|羊', 'もやし', '玉ねぎ', 'ピーマン|にんじん|キャベツ'],
    steps: ['しょうゆ・砂糖・すりおろしたにんにくと玉ねぎ(またはりんご)でタレを作り、肉を15分漬ける', 'フライパンかホットプレートに野菜を敷き、真ん中で肉を焼く', '肉の脂がしみた野菜と一緒に、タレをつけて食べる'] },
  { name: 'ラム肉のクミン炒め', origin: '中国(新疆)', emoji: '🐑', minutes: 15,
    ingredients: ['ラム|マトン|羊', '玉ねぎ', 'ピーマン|パプリカ'],
    steps: ['肉を薄切りにして、しょうゆと酒で下味をつける', '強火で肉を炒め、玉ねぎとピーマンを加える', 'クミン・唐辛子・塩で味つけ(クミンがなければカレー粉でも)'] },
  { name: 'ラムチョップのハーブ焼き', origin: 'フランス', emoji: '🐑', minutes: 25,
    ingredients: ['ラム|マトン|羊', 'にんにく', 'じゃがいも'],
    steps: ['肉に塩こしょう、にんにく、乾燥ハーブ(ローズマリーなど)をまぶす', 'じゃがいもはくし切りにしてレンジで加熱する', 'フライパンで肉とじゃがいもを両面こんがり焼く'] },
  { name: 'ラムのキーマカレー', origin: 'インド', emoji: '🍛', minutes: 25,
    ingredients: ['ラム|マトン|羊', '玉ねぎ', 'トマト', 'カレールー|カレー粉'],
    steps: ['肉を細かく刻み(ひき肉でも可)、みじん切りの玉ねぎと炒める', 'ざく切りのトマトを加えて煮つめる', 'カレールーかカレー粉で味をととのえる'] },

  // ----- ひき肉・肉 -----
  { name: 'ハンバーグ', origin: 'ドイツ発祥', emoji: '🍔', minutes: 30,
    ingredients: ['ひき肉', '玉ねぎ', 'たまご|卵'],
    steps: ['みじん切りの玉ねぎを炒めて冷ます', 'ひき肉・玉ねぎ・卵・パン粉・塩こしょうをよくこねる', '形を整えて両面を焼き、ふたをして中まで火を通す'] },
  { name: 'ガパオライス', origin: 'タイ', emoji: '🌿', minutes: 15,
    ingredients: ['ひき肉|鶏肉|鶏もも|鶏むね', 'ピーマン|パプリカ', '玉ねぎ', 'たまご|卵'],
    steps: ['にんにくと唐辛子を炒め、ひき肉を加える', '玉ねぎとピーマンを加え、ナンプラー(なければしょうゆ)とオイスターソースで味つけ', 'ごはんにのせ、目玉焼きをのせる'] },
  { name: 'タコライス', origin: 'メキシコ×沖縄', emoji: '🌮', minutes: 15,
    ingredients: ['ひき肉', 'トマト', 'レタス|キャベツ', 'チーズ'],
    steps: ['ひき肉を炒め、ケチャップ・ソース・カレー粉で味つけ', 'ごはんに細切りのレタスと肉をのせる', '角切りトマトとチーズをのせる'] },
  { name: '肉じゃが', origin: '日本', emoji: '🥔', minutes: 30,
    ingredients: ['じゃがいも', '玉ねぎ', 'にんじん', '豚こま肉|豚肉|牛肉'],
    steps: ['材料を食べやすく切って炒める', '水・しょうゆ・みりん・砂糖を入れる', '落としぶたをして、じゃがいもがやわらかくなるまで煮る'] },
  { name: '白菜と豚のミルフィーユ鍋', origin: '日本', emoji: '🍲', minutes: 20,
    ingredients: ['白菜', '豚バラ|豚肉|豚こま肉'],
    steps: ['白菜と豚肉を交互に重ねる', '鍋の高さに切って、すき間なく詰める', 'だしを入れて煮込み、ポン酢で食べる'] },

  // ----- 魚介・野菜 -----
  { name: 'エビチリ', origin: '中国', emoji: '🦐', minutes: 15,
    ingredients: ['えび|エビ|海老', 'ねぎ', 'にんにく|しょうが'],
    steps: ['えびの殻と背わたを取り、片栗粉をまぶす', 'にんにく・しょうが・豆板醤を炒め、えびを加える', 'ケチャップ・鶏ガラスープを加え、ねぎを入れてとろみをつける'] },
  { name: 'アボカドサーモン丼', origin: 'ハワイ風', emoji: '🥑', minutes: 10,
    ingredients: ['アボカド', '鮭|サーモン|まぐろ|マグロ'],
    steps: ['アボカドと刺身を角切りにする', 'しょうゆ・わさび・ごま油であえる', 'ごはんにのせる'] },
  { name: '麻婆なす', origin: '中国', emoji: '🍆', minutes: 15,
    ingredients: ['なす|ナス', 'ひき肉|豚肉', 'ねぎ'],
    steps: ['なすを切って、多めの油で炒める', 'ひき肉を加え、麻婆の素か豆板醤・味噌で味つけ', '水溶き片栗粉でとろみをつけ、ねぎをのせる'] },
  { name: 'ポテトサラダ', origin: '日本', emoji: '🥗', minutes: 20,
    ingredients: ['じゃがいも', 'きゅうり', 'にんじん', 'たまご|卵'],
    steps: ['じゃがいもとにんじんをゆでて(レンジでも可)、じゃがいもをつぶす', 'きゅうりは薄切りにして塩もみ、卵はゆでて刻む', 'マヨネーズと塩こしょうで全部あえる'] },
];

// ---------- 一覧にない食材のための「かんたんアレンジ」 ----------
// 食材の名前から種類を判定して、基本の料理を自動で組み立てます。
// キーワードや料理を足したいときは、ここに追加してください。
const FOOD_GROUPS = [
  // 乳製品は「牛」「豆」などの文字で肉や大豆と間違えないよう、先に判定する(アレンジは作らない)
  { key: 'dairy', emoji: '🥛',
    words: ['牛乳', 'ヨーグルト', 'チーズ', 'バター', '生クリーム', '豆乳'] },
  { key: 'meat', emoji: '🍖',
    words: ['肉', 'ひき肉', 'ベーコン', 'ハム', 'ソーセージ', 'ウインナー', '鶏', '豚', '牛', 'ささみ', 'ラム', 'マトン', '羊'] },
  // 果物は魚より先に判定する(「すいか」の中の「いか」を魚と間違えないため)
  { key: 'fruit', emoji: '🍎',
    words: ['りんご', 'バナナ', 'みかん', 'いちご', 'ぶどう', 'キウイ', 'オレンジ', 'もも', '梨', '柿', 'すいか', 'メロン', 'パイナップル', 'マンゴー', '果物', 'フルーツ'] },
  { key: 'fish', emoji: '🐟',
    words: ['さんま', '秋刀魚', 'さば', 'サバ', '鯖', '鮭', 'さけ', 'サケ', 'サーモン', 'あじ', 'アジ', '鯵', 'いわし', 'イワシ', 'ぶり', 'ブリ', 'たら', 'タラ', '鱈', 'まぐろ', 'マグロ', 'かつお', 'カツオ', 'ほっけ', 'ホッケ', 'かれい', 'カレイ', '白身魚', '魚', 'えび', 'エビ', 'いか', 'イカ', 'たこ', 'タコ', 'ほたて', 'ホタテ', 'あさり', 'しじみ'] },
  { key: 'mushroom', emoji: '🍄',
    words: ['しいたけ', 'えのき', 'しめじ', 'まいたけ', 'エリンギ', 'きのこ', 'マッシュルーム'] },
  { key: 'soy', emoji: '🫘',
    words: ['豆腐', '厚揚げ', '油揚げ', '納豆'] },
  { key: 'veg', emoji: '🥗',
    words: ['キャベツ', '白菜', 'レタス', 'ほうれん草', '小松菜', 'にんじん', '大根', '玉ねぎ', 'じゃがいも', 'なす', 'ピーマン', 'トマト', 'きゅうり', 'ブロッコリー', 'かぼちゃ', 'もやし', 'ねぎ', 'ごぼう', 'れんこん', 'オクラ', 'アスパラ', 'セロリ', 'さつまいも', 'チンゲン菜', '水菜', 'にら', 'ズッキーニ', 'パプリカ', '野菜'] },
];

// n = 食材の名前。ingredients の先頭は必ずその食材にする
const ARRANGE_TEMPLATES = {
  fish: [
    (n) => ({ name: `${n}の塩焼き`, minutes: 20, ingredients: [n, '大根'],
      steps: [`${n}に塩をふって10分おき、出てきた水分をふく`, '魚焼きグリルかフライパンで両面をこんがり焼く', '大根おろしとしょうゆを添える'] }),
    (n) => ({ name: `${n}の蒲焼き丼`, minutes: 20, ingredients: [n, 'ねぎ'],
      steps: [`${n}に片栗粉か小麦粉を薄くまぶす`, 'フライパンで両面を焼く', 'しょうゆ・みりん・砂糖を同じ量ずつ入れて煮からめ、ごはんにのせる'] }),
    (n) => ({ name: `${n}のホイル焼き`, minutes: 25, ingredients: [n, '玉ねぎ', 'しめじ|えのき|しいたけ|きのこ'],
      steps: ['アルミホイルに玉ねぎときのこを敷く', `${n}をのせてバターと塩こしょうをふり、包む`, 'フライパンにのせ、ふたをして15分ほど蒸し焼きにする'] }),
  ],
  meat: [
    (n) => ({ name: `${n}の生姜焼き`, minutes: 15, ingredients: [n, '玉ねぎ', 'しょうが'],
      steps: [`${n}と薄切りの玉ねぎを炒める`, 'しょうゆ・みりん・すりおろした生姜を混ぜて加える', 'たれがからんだら完成'] }),
    (n) => ({ name: `${n}と野菜の炒め物`, minutes: 15, ingredients: [n, 'キャベツ', 'にんじん'],
      steps: ['野菜を食べやすく切る', `${n}を炒めて火を通す`, '野菜を加えて炒め、塩こしょうとしょうゆで味つけ'] }),
  ],
  mushroom: [
    (n) => ({ name: `${n}のバター醤油炒め`, minutes: 10, ingredients: [n],
      steps: [`${n}を食べやすくほぐす`, 'バターで炒める', '最後にしょうゆをひと回し'] }),
    (n) => ({ name: `${n}の炊き込みごはん`, minutes: 60, ingredients: [n, 'にんじん', '油揚げ'],
      steps: ['米を洗って、しょうゆ・みりん・だしを入れて水加減する', `${n}と細切りのにんじん・油揚げをのせる`, 'ふつうに炊いて、全体を混ぜる'] }),
  ],
  soy: [
    (n) => ({ name: `${n}の味噌汁`, minutes: 10, ingredients: [n, 'ねぎ', '味噌'],
      steps: ['だしを温める', `${n}とねぎを入れてひと煮立ちさせる`, '火を止めて味噌を溶かす'] }),
    (n) => ({ name: `${n}のねぎしょうゆがけ`, minutes: 5, ingredients: [n, 'ねぎ'],
      steps: [`${n}を器に盛る`, '刻んだねぎをのせる', 'しょうゆとごま油をかける'] }),
  ],
  fruit: [
    (n) => ({ name: `${n}のヨーグルトがけ`, minutes: 5, ingredients: [n, 'ヨーグルト'],
      steps: [`${n}を食べやすく切る`, 'ヨーグルトをかける', 'はちみつをかけて完成'] }),
    (n) => ({ name: `${n}のスムージー`, minutes: 5, ingredients: [n, '牛乳|ヨーグルト'],
      steps: [`${n}を切る`, '牛乳かヨーグルトと一緒にミキサーにかける', '甘さが足りなければはちみつを足す'] }),
  ],
  veg: [
    (n) => ({ name: `${n}の味噌汁`, minutes: 10, ingredients: [n, '味噌'],
      steps: [`${n}を食べやすく切る`, 'だしで火が通るまで煮る', '火を止めて味噌を溶かす'] }),
    (n) => ({ name: `${n}のベーコン炒め`, minutes: 10, ingredients: [n, 'ベーコン'],
      steps: [`${n}とベーコンを食べやすく切る`, 'ベーコンを炒めて脂を出す', `${n}を加えて炒め、塩こしょうで味つけ`] }),
    (n) => ({ name: `${n}のナムル`, minutes: 10, ingredients: [n],
      steps: [`${n}をゆでるかレンジで加熱する`, '水気をしっかりきる', 'ごま油・塩・すりごまであえる'] }),
  ],
};

// ---------- 表記ゆれをそろえる ----------
// 比べるときだけ使います(画面に出す名前は入力したまま)。
// 言い換えを増やしたいときは、ここに「'書き方': 'そろえる先'」を1行足してください。
const SYNONYMS = {
  '人参': 'にんじん', '玉葱': 'たまねぎ', '玉ねぎ': 'たまねぎ', '卵': 'たまご', '玉子': 'たまご',
  '葱': 'ねぎ', '胡瓜': 'きゅうり', '茄子': 'なす', '大蒜': 'にんにく', '生姜': 'しょうが',
  '椎茸': 'しいたけ', '馬鈴薯': 'じゃがいも', '南瓜': 'かぼちゃ', '牛蒡': 'ごぼう', '蓮根': 'れんこん',
  '甘藷': 'さつまいも', '薩摩芋': 'さつまいも', 'だいこん': '大根', 'ほうれんそう': 'ほうれん草',
  'はくさい': '白菜', 'とり肉': '鶏肉', 'ぎゅうにゅう': '牛乳', 'とうふ': '豆腐',
  '秋刀魚': 'さんま', '鮭': 'さけ', '鯖': 'さば', '鯵': 'あじ', '鰯': 'いわし', '鰤': 'ぶり', '鱈': 'たら',
  '鮪': 'まぐろ', '海老': 'えび', '烏賊': 'いか', '蛸': 'たこ', '帆立': 'ほたて',
  '苺': 'いちご', '林檎': 'りんご', '蜜柑': 'みかん', '葡萄': 'ぶどう', '檸檬': 'れもん',
};
const SYNONYM_KEYS = Object.keys(SYNONYMS).sort((a, b) => b.length - a.length); // 長い言葉から置き換える

const normalizeCache = new Map(); // 同じ言葉を何度も変換しないように覚えておく
function normalize(text) {
  const key = String(text);
  if (normalizeCache.has(key)) return normalizeCache.get(key);
  const result = normalizeRaw(key);
  normalizeCache.set(key, result);
  return result;
}
function normalizeRaw(text) {
  let s = String(text).normalize('NFKC'); // 全角英数などをそろえる
  s = s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)); // カタカナ→ひらがな
  SYNONYM_KEYS.forEach((k) => {
    s = s.split(k).join(SYNONYMS[k]);
  });
  return s;
}

function foodGroupOf(name) {
  const n = normalize(name);
  return FOOD_GROUPS.find((g) => g.words.some((w) => n.includes(normalize(w))));
}

// レシピを探すリンク(クックパッドの検索結果を開く)
function searchUrl(name) {
  return `https://cookpad.com/jp/search/${encodeURIComponent(name)}`;
}

// ---------- 料理会の選択肢 ----------
const PLACES = ['寮の共用キッチン', '学生会館の調理室', '国際交流センター', '主催者の家'];
const PARTY_TAGS = ['English OK', 'やさしい日本語', '初心者歓迎', 'ハラール対応', 'ベジタリアン対応'];
const ME = { name: 'あなた', flag: '🙂', country: '' };

// ---------- ごはんマッチの相手(デモ用のダミーユーザー) ----------
// 本番では、同じ大学のユーザーのデータをサーバーから読み込む想定です。
// foods は [食材名, 期限まであと何日] 、when.day は 0=今日 / 1=明日
const MATCH_USERS = [
  { id: 'mai', name: 'Mai', flag: '🇻🇳', country: 'ベトナム', type: 'intl', profile: '工学部 修士1年', diet: [],
    want: '日本の家庭料理を覚えたい', langs: ['English OK', 'やさしい日本語'],
    when: { day: 0, time: '19:00' }, place: '寮の共用キッチン',
    foods: [['鶏むね肉', 1], ['もやし', 2], ['パクチー', 1], ['たまご', 5]] },
  { id: 'kenta', name: 'Kenta', flag: '🇯🇵', country: '日本', type: 'jp', profile: '経済学部 2年', diet: [],
    want: '一人ごはんが続いて、ちょっと寂しい', langs: ['日本語'],
    when: { day: 0, time: '20:00' }, place: '学生会館の調理室',
    foods: [['キャベツ', 2], ['豚バラ肉', 1], ['冷凍うどん', 10]] },
  { id: 'aisha', name: 'Aisha', flag: '🇲🇾', country: 'マレーシア', type: 'intl', profile: '農学部 3年', diet: ['halal'],
    want: '日本人の友達がほしい', langs: ['English OK', 'やさしい日本語', 'ハラール対応'],
    when: { day: 1, time: '18:30' }, place: '国際交流センター',
    foods: [['鶏もも肉', 2], ['じゃがいも', 6], ['玉ねぎ', 3], ['トマト', 1]] },
  { id: 'jiwoo', name: 'Ji-woo', flag: '🇰🇷', country: '韓国', type: 'intl', profile: '文学部 3年', diet: [],
    want: 'みんなで韓国料理を作りたい', langs: ['日本語OK', '한국어'],
    when: { day: 0, time: '18:00' }, place: '寮の共用キッチン',
    foods: [['にら', 1], ['豆腐', 2], ['ねぎ', 3]] },
  { id: 'haruka', name: 'Haruka', flag: '🇯🇵', country: '日本', type: 'jp', profile: '教育学部 1年', diet: [],
    want: '留学生と話してみたい', langs: ['日本語', 'English少し'],
    when: { day: 1, time: '19:00' }, place: '学生会館の調理室',
    foods: [['鮭', 1], ['白菜', 3], ['しめじ', 2], ['味噌', 60]] },
  { id: 'priya', name: 'Priya', flag: '🇮🇳', country: 'インド', type: 'intl', profile: '情報科学院 博士1年', diet: ['vegetarian'],
    want: 'スパイスの使い方を教えたい', langs: ['English OK', 'ベジタリアン'],
    when: { day: 1, time: '12:00' }, place: '国際交流センター',
    foods: [['ヨーグルト', 1], ['きゅうり', 2], ['トマト', 3], ['じゃがいも', 5]] },
  { id: 'lucas', name: 'Lucas', flag: '🇧🇷', country: 'ブラジル', type: 'intl', profile: '理学部 博士2年', diet: [],
    want: '日本語を練習したい', langs: ['English OK', 'Português'],
    when: { day: 1, time: '19:30' }, place: '寮の共用キッチン',
    foods: [['ひき肉', 1], ['トマト', 2], ['チーズ', 7], ['レタス', 2]] },
];
const MATCH_TYPES = { intl: '留学生', jp: '日本人学生' };

// デモの相手のプロフィール詳細と、作った料理の履歴
// meals は [料理名, 絵文字, 何日前, 2人とも写真の公開を許可したか]
const DEMO_PROFILES = {
  mai: { cooking: '得意', favs: ['東南アジア料理', '和食'],
    meals: [['鶏肉のフォー風スープ', '🍲', 3, true], ['親子丼', '🍚', 10, false], ['野菜チヂミ', '🥞', 18, true]] },
  kenta: { cooking: 'ふつう', favs: ['和食', '中華'], meals: [['焼きうどん', '🍜', 6, true]] },
  aisha: { cooking: '得意', favs: ['東南アジア料理', 'インド料理'],
    meals: [['ミルクシチュー', '🍵', 4, true], ['肉じゃが', '🥔', 12, true], ['ガパオライス', '🌿', 20, false], ['キャロットラペ', '🥕', 27, true]] },
  jiwoo: { cooking: '得意', favs: ['韓国料理'], meals: [['野菜チヂミ', '🥞', 2, true], ['麻婆豆腐', '🌶️', 9, false]] },
  haruka: { cooking: '苦手', favs: ['和食', '洋食'], meals: [] },
  priya: { cooking: '得意', favs: ['インド料理'], meals: [['ザジキ(ヨーグルトのディップ)', '🥒', 5, true], ['かんたんラッシー', '🥛', 15, false]] },
  lucas: { cooking: 'ふつう', favs: ['中南米料理', '洋食'], meals: [['タコライス', '🌮', 8, true]] },
};
MATCH_USERS.forEach((u) => {
  const d = DEMO_PROFILES[u.id] || {};
  u.cooking = d.cooking;
  u.favs = d.favs || [];
});

// =========================================================
//  相手のプロフィール(デモ版と本物で共通の画面)
//  p = { flag, name, sub, bio, tags, cooking, favs, mealCount, meals, loading, error }
//  meals の1件 = { recipe, emoji, date, photoUrl, isPublic }
// =========================================================
function partnerHtml(p) {
  const meals = p.meals || [];
  const mealTiles = meals
    .map((m) => {
      const d = new Date(m.date);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const visual = m.photoUrl
        ? `<img src="${esc(m.photoUrl)}" alt="${esc(m.recipe)}の写真" loading="lazy">`
        : `<span class="meal-ph ${m.isPublic ? '' : 'locked'}" aria-hidden="true">${esc(m.emoji || '🍳')}</span>`;
      const state = m.photoUrl ? '' : m.isPublic ? '<span class="meal-state">写真公開中</span>' : '<span class="meal-state lock">🔒 写真は非公開</span>';
      return `<figure class="meal-photo">${visual}<figcaption>${esc(m.recipe)}<span>${label}${state}</span></figcaption></figure>`;
    })
    .join('');
  const tags = [...(p.tags || []), ...(p.favs || []).map((f) => `${f}好き`)];
  return `
    <div class="pf-head">
      <span class="pf-avatar" aria-hidden="true">${esc(p.flag || '🌏')}</span>
      <div>
        <p class="pf-name">${esc(p.name)}さん<span class="verified">北大認証済み</span></p>
        <p class="match-profile">${esc(p.sub || '')}</p>
      </div>
    </div>
    ${p.bio ? `<p class="match-want">「${esc(p.bio)}」</p>` : ''}
    <div class="pf-stats">
      <div><b>${p.mealCount ?? meals.length}</b><span>ごはん会</span></div>
      <div><b>${esc(p.cooking || '—')}</b><span>料理</span></div>
    </div>
    ${tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    <p class="section-label">作った料理の履歴</p>
    ${p.loading ? '<p class="hint">読み込んでいます…</p>' : ''}
    ${p.error ? `<p class="cloud-error">${esc(p.error)}</p>` : ''}
    ${!p.loading && !p.error && !meals.length ? '<p class="hint">まだごはん会の記録はありません</p>' : ''}
    ${meals.length ? `<div class="meal-grid">${mealTiles}</div>` : ''}
    <p class="safety-note">写真は、ごはん会の2人がどちらも「公開を許可」したものだけ、ほかの北大生にも表示されます。どちらかが許可を取り消すと、すぐに見えなくなります。</p>`;
}

function openPartnerSheet(p) {
  $('partnerBody').innerHTML = partnerHtml(p);
  $('partnerSheet').hidden = false;
}

function openDemoPartner(id) {
  const u = MATCH_USERS.find((x) => x.id === id);
  if (!u) return;
  const d = DEMO_PROFILES[id] || { meals: [] };
  openPartnerSheet({
    flag: u.flag,
    name: u.name,
    sub: `${u.country}・${MATCH_TYPES[u.type]}・${u.profile}`,
    bio: u.want,
    tags: u.langs,
    cooking: d.cooking,
    favs: d.favs,
    meals: (d.meals || []).map(([recipe, emoji, ago, isPublic]) => ({
      recipe, emoji, isPublic, photoUrl: null, date: parseDate(addDays(-ago)),
    })),
  });
}

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
    events: sampleEvents(),
    invites: {},
  };
}
// キャンパスの料理会(デモ用。本番ではみんなのデータをサーバーから読み込む想定)
function sampleEvents() {
  const p = (name, flag, country) => ({ name, flag, country });
  const mai = p('Mai', '🇻🇳', 'ベトナム');
  const jiwoo = p('Ji-woo', '🇰🇷', '韓国');
  const aisha = p('Aisha', '🇲🇾', 'マレーシア');
  const lucas = p('Lucas', '🇧🇷', 'ブラジル');
  const kenta = p('Kenta', '🇯🇵', '日本');
  const tom = p('Tom', '🇺🇸', 'アメリカ');
  return [
    {
      id: newId(), title: 'ベトナム風フォーを作ろう', menu: '鶏肉のフォー', date: addDays(2), time: '18:30',
      place: '寮の共用キッチン', capacity: 6, tags: ['English OK', 'やさしい日本語'],
      host: mai, mine: false, joined: false,
      participants: [mai, jiwoo, kenta],
      bring: [{ who: 'Mai', item: '米粉麺' }, { who: 'Ji-woo', item: 'もやし' }, { who: 'Kenta', item: '鶏むね肉' }],
    },
    {
      id: newId(), title: '余り野菜でチヂミパーティー', menu: '野菜チヂミ', date: addDays(4), time: '12:00',
      place: '学生会館の調理室', capacity: 8, tags: ['初心者歓迎', 'ベジタリアン対応'],
      host: jiwoo, mine: false, joined: false,
      participants: [jiwoo, lucas, aisha],
      bring: [{ who: 'Ji-woo', item: 'にら' }, { who: 'Lucas', item: 'たまご' }],
    },
    {
      id: newId(), title: 'ハラールカレーの会', menu: 'チキンカレー', date: addDays(6), time: '18:00',
      place: '国際交流センター', capacity: 10, tags: ['ハラール対応', 'English OK'],
      host: aisha, mine: false, joined: false,
      participants: [aisha, mai, tom],
      bring: [{ who: 'Aisha', item: 'スパイス' }, { who: 'Tom', item: 'じゃがいも' }],
    },
  ];
}

function emptyData() {
  // 料理会は「他の人が開いているもの」なので、空にしても残す
  return { sample: false, foods: [], shopping: [], logs: [], events: sampleEvents(), invites: {} };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const data = { ...emptyData(), ...saved };
      if (!saved.events) data.events = sampleEvents(); // 古い保存データには料理会がない
      return data;
    }
  } catch (e) {
    /* 保存できない環境でも動くようにする */
  }
  return sampleData();
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('この端末では保存できませんでした');
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
  renderRecipes();
  renderParty();
  renderShopping();
  renderStats();
  renderBadges();
}

// 期限が近い順に並べた食材
function foodsByExpiry() {
  return [...state.foods].sort((a, b) => a.expiry.localeCompare(b.expiry));
}
function urgentFoods() {
  return foodsByExpiry().filter((f) => statusOf(f.expiry).level !== 'ok');
}

function renderFridge() {
  const foods = state.foods;
  const expired = foods.filter((f) => statusOf(f.expiry).level === 'expired').length;
  const soon = foods.filter((f) => statusOf(f.expiry).level === 'soon').length;
  $('countExpired').textContent = expired;
  $('countSoon').textContent = soon;
  $('countAll').textContent = foods.length;
  $('sampleNote').hidden = !state.sample;

  // 一番相性の良いごはんマッチを、冷蔵庫の画面でも自動で知らせる
  const top = computeMatches()[0];
  $('matchCta').hidden = !top;
  if (top) {
    const mine = top.mine.map((i) => `「${i.food.name}」`).slice(0, 2).join('');
    $('matchCtaFace').textContent = top.user.flag;
    $('matchCtaTitle').textContent = `${top.user.name}さんと「${top.recipe.name}」が作れそう`;
    $('matchCtaSub').textContent = top.urgentMine
      ? `あなたの期限間近の${mine}を使えます・${whenLabel(top.user)}`
      : `あなたの${mine}と${top.user.name}さんの食材で・${whenLabel(top.user)}`;
  }

  // 期限間近の食材があれば、レシピへの案内を出す
  const urgent = urgentFoods();
  $('recipeCta').hidden = urgent.length === 0;
  if (urgent.length > 0) {
    const names = urgent.slice(0, 2).map((f) => `「${f.name}」`).join('');
    $('recipeCtaText').textContent = `${names}${urgent.length > 2 ? 'など' : ''}を使うレシピを見る`;
  }

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

  const viaParty = thisMonth.filter((l) => l.via === 'party').length;
  $('partyStat').hidden = viaParty === 0;
  $('partyStat').textContent = `料理会で使い切った食材 ${viaParty}品`;

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
  const joined = upcomingEvents().filter((e) => e.joined).length;
  $('badgeParty').hidden = joined === 0;
  $('badgeParty').textContent = joined;
}

// =========================================================
//  レシピ
// =========================================================
let recipeFocus = 'auto'; // 'auto' = おすすめ順、それ以外は食材のid

// レシピの材料1つと、冷蔵庫の食材が同じものか
// 表記ゆれ(人参・にんじん・ニンジン など)はそろえてから比べる
function ingredientMatches(ingredient, food) {
  const name = normalize(food.name);
  return ingredient.split('|').some((alt) => {
    const a = normalize(alt);
    if (a === 'ねぎ' && name.includes('たまねぎ')) return false; // 玉ねぎは長ねぎの代わりにしない
    return name.includes(a) || a.includes(name);
  });
}

// 1つのレシピについて「冷蔵庫にあるもの・ないもの」を調べる
function checkRecipe(recipe) {
  // 期限が近いものを優先して当てはめる。食材を選んで絞り込み中なら、その食材を最優先にする
  const foods = foodsByExpiry().sort((a, b) => (b.id === recipeFocus) - (a.id === recipeFocus));
  const items = recipe.ingredients.map((ing) => {
    const food = foods.find((f) => ingredientMatches(ing, f));
    return { label: ing.split('|')[0], food };
  });
  const have = items.filter((i) => i.food);
  const urgent = have.filter((i) => statusOf(i.food.expiry).level !== 'ok');
  return { recipe, items, have, urgent, missing: items.filter((i) => !i.food) };
}

// 一覧のレシピ + 冷蔵庫の食材に合わせて作った「かんたんアレンジ」
function allRecipes() {
  const fixed = RECIPES;
  const arranged = [];
  const names = new Set(fixed.map((r) => r.name));
  foodsByExpiry().forEach((food) => {
    // 一覧のレシピで2品以上作れる食材は、アレンジを足さない
    const fixedCount = fixed.filter((r) => r.ingredients.some((ing) => ingredientMatches(ing, food))).length;
    if (fixedCount >= 2) return;
    const group = foodGroupOf(food.name);
    if (!group || !ARRANGE_TEMPLATES[group.key]) return;
    ARRANGE_TEMPLATES[group.key].forEach((make) => {
      const r = make(food.name);
      if (names.has(r.name)) return;
      names.add(r.name);
      arranged.push({ ...r, origin: 'かんたんアレンジ', emoji: group.emoji, arranged: true, mainFood: food.name });
    });
  });
  return [...fixed, ...arranged];
}

function renderRecipes() {
  // 絞り込みチップ:おすすめ + 冷蔵庫の食材(期限が近い順に8個まで)
  const foods = foodsByExpiry().slice(0, 8);
  if (recipeFocus !== 'auto' && !state.foods.some((f) => f.id === recipeFocus)) recipeFocus = 'auto';
  $('recipeFocus').innerHTML = [
    `<button type="button" class="chip ${recipeFocus === 'auto' ? 'is-active' : ''}" data-focus="auto">おすすめ</button>`,
    ...foods.map((f) => {
      const urgent = statusOf(f.expiry).level !== 'ok';
      return `<button type="button" class="chip ${recipeFocus === f.id ? 'is-active' : ''}" data-focus="${f.id}">${esc(f.name)}${urgent ? '<small>期限間近</small>' : ''}</button>`;
    }),
  ].join('');

  const list = allRecipes();
  let results = list.map(checkRecipe).filter((r) => r.have.length > 0);
  if (recipeFocus !== 'auto') {
    results = results.filter((r) => r.have.some((i) => i.food.id === recipeFocus));
  }
  // 期限間近の食材を多く使う → 冷蔵庫にある材料の割合が高い の順
  results.sort(
    (a, b) =>
      b.urgent.length - a.urgent.length ||
      b.have.length / b.items.length - a.have.length / a.items.length
  );

  $('recipeList').innerHTML = results
    .map((r, index) => {
      const urgentNames = r.urgent.map((i) => `「${esc(i.food.name)}」`).join('');
      const ings = r.items
        .map((i) => {
          const cls = !i.food ? '' : statusOf(i.food.expiry).level !== 'ok' ? 'have urgent' : 'have';
          return `<li class="ing ${cls}">${i.food ? '✓ ' : ''}${esc(i.label)}</li>`;
        })
        .join('');
      return `
        <li class="recipe" data-index="${list.indexOf(r.recipe)}">
          <div class="recipe-head">
            <span class="recipe-emoji" aria-hidden="true">${r.recipe.emoji}</span>
            <div>
              <p class="recipe-name">${esc(r.recipe.name)}</p>
              <p class="recipe-meta">${r.recipe.origin}・${r.recipe.minutes}分・材料 ${r.have.length}/${r.items.length} そろっています</p>
            </div>
          </div>
          ${r.urgent.length ? `<p class="recipe-use">期限間近の${urgentNames}を使えます</p>` : ''}
          <ul class="ings">${ings}</ul>
          <details ${index === 0 ? 'open' : ''}>
            <summary>作り方</summary>
            <ol>${r.recipe.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
          </details>
          <div class="recipe-actions">
            <button type="button" class="btn btn-primary" data-action="party">この料理で料理会を開く</button>
            ${r.missing.length ? `<button type="button" class="btn btn-soft" data-action="shop">足りない材料を買い物リストへ</button>` : ''}
          </div>
          ${r.recipe.arranged ? `<a class="more-link" href="${searchUrl(r.recipe.mainFood)}" target="_blank" rel="noopener">クックパッドで「${esc(r.recipe.mainFood)}」のレシピをもっと探す ↗</a>` : ''}
        </li>`;
    })
    .join('');

  // 食材を選んでいるときは、その食材のレシピを探すリンクを出す
  const focusFood = state.foods.find((f) => f.id === recipeFocus);
  $('recipeMore').hidden = !focusFood;
  if (focusFood) {
    $('recipeMore').href = searchUrl(focusFood.name);
    $('recipeMore').textContent = `クックパッドで「${focusFood.name}」のレシピを探す ↗`;
  }

  $('recipeEmpty').hidden = results.length > 0;
  $('recipeEmptyText').textContent =
    state.foods.length === 0
      ? '冷蔵庫に食材を登録すると、作れる料理が表示されます'
      : 'この食材を使うレシピは、まだアプリに入っていません。下のリンクから探せます';
}

// =========================================================
//  料理会
// =========================================================
function upcomingEvents() {
  const today = addDays(0);
  return (state.events || [])
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

// =========================================================
//  ごはんマッチ
//  あなたの食材 + 相手の食材 で1つの料理になる組み合わせを探し、
//  期限間近の食材をたくさん救える相手から順に提案する
// =========================================================
let matchFilter = 'all'; // all / intl / jp
let matchShowAll = false;

const PORK_WORDS = ['豚', 'ベーコン', 'ハム', 'ソーセージ', 'ウインナー'];
function groupWords(key) {
  return (FOOD_GROUPS.find((g) => g.key === key) || { words: [] }).words;
}

function whenLabel(user) {
  return `${user.when.day === 0 ? '今日' : '明日'} ${user.when.time}`;
}

// 料理の系統(プロフィールの「好きな料理」と照らし合わせる)
const CUISINES = ['和食', '中華', '韓国料理', '東南アジア料理', 'インド料理', '洋食', '中南米料理'];
function cuisineOf(recipe) {
  const o = recipe.origin || '';
  if (/韓国/.test(o)) return '韓国料理';
  if (/中国/.test(o)) return '中華';
  if (/ベトナム|タイ|マレーシア|インドネシア|ハワイ/.test(o)) return '東南アジア料理';
  if (/インド/.test(o)) return 'インド料理';
  if (/メキシコ|ブラジル/.test(o)) return '中南米料理';
  if (/日本|かんたんアレンジ/.test(o)) return '和食';
  return '洋食';
}

// 自分のプロフィール(ログイン中だけ cloud.js が中身を返す。デモでは null)
function myProfile() {
  return null;
}

// マッチの相手の一覧(デモではダミー。ログイン中は cloud.js が本物の相手に差し替える)
function matchUsers() {
  return MATCH_USERS;
}
function isInvitedUser(id) {
  return !!(state.invites || {})[id];
}

// 食の制限・アレルギーに合わない料理なら false
// person = { diet: ['halal' | 'vegetarian'], allergies: 'えび、そば' }
function fitsPerson(person, items) {
  const texts = items.flatMap((i) => [i.label, i.food && i.food.name].filter(Boolean)).map(normalize);
  const hasAny = (words) => texts.some((t) => words.some((w) => w && t.includes(normalize(w))));
  const diet = person.diet || [];
  if (diet.includes('halal') && hasAny(PORK_WORDS)) return false;
  if (diet.includes('vegetarian') && hasAny([...groupWords('meat'), ...groupWords('fish')])) return false;
  const allergyWords = String(person.allergies || '')
    .split(/[、,,\s・/]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (allergyWords.length && hasAny(allergyWords)) return false;
  return true;
}

// 1人の相手について、一番良い料理を探す
function bestMatchFor(user) {
  const me = myProfile();
  // 料理が苦手な人どうしは組ませない(どちらかが「ふつう」以上)
  if (me && me.cooking_level === '苦手' && user.cooking === '苦手') return null;

  const myFoods = foodsByExpiry();
  // 相手の食材は [名前, あと何日](デモ) か { name, expiry }(本物) のどちらか
  const theirFoods = user.foods.map((f) => (Array.isArray(f) ? { name: f[0], expiry: addDays(f[1]) } : f));
  let best = null;

  allRecipes().forEach((recipe) => {
    const items = recipe.ingredients.map((ing) => {
      const label = ing.split('|')[0];
      const mine = myFoods.find((f) => ingredientMatches(ing, f));
      const theirs = theirFoods.find((f) => ingredientMatches(ing, f));
      // 2人とも持っていたら、期限が近いほうを使う(同じなら自分の食材)
      if (mine && (!theirs || mine.expiry <= theirs.expiry)) return { label, food: mine, who: 'me' };
      if (theirs) return { label, food: theirs, who: 'them' };
      return { label };
    });
    const mine = items.filter((i) => i.who === 'me');
    const them = items.filter((i) => i.who === 'them');
    if (!mine.length || !them.length) return; // 2人の食材を合わせて作れる料理だけ
    if (!fitsPerson(user, items)) return; // 相手の食の制限・アレルギー
    if (me && !fitsPerson(me, items)) return; // 自分の食の制限・アレルギー

    const isUrgent = (i) => statusOf(i.food.expiry).level !== 'ok';
    const urgentMine = mine.filter(isUrgent).length;
    const urgentThem = them.filter(isUrgent).length;
    const have = mine.length + them.length;
    const sameCountry = !!user.country && recipe.origin.includes(user.country);
    const cuisine = cuisineOf(recipe);
    const theyLike = (user.favs || []).includes(cuisine);
    const iLike = !!me && (me.fav_cuisines || []).includes(cuisine);
    const score =
      urgentMine * 4 + urgentThem * 3 + (have / items.length) * 6 +
      (sameCountry ? 3 : 0) + (theyLike ? 2 : 0) + (iLike ? 2 : 0);

    if (!best || score > best.score) {
      best = { user, recipe, items, mine, them, urgentMine, urgentThem, have, sameCountry, cuisine, theyLike, iLike, score };
    }
  });
  return best;
}

function computeMatches() {
  return matchUsers()
    .filter((u) => !isInvitedUser(u.id))
    .map(bestMatchFor)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

// マッチした理由(カードに表示する)
function matchReasons(m) {
  const reasons = [];
  const saved = m.urgentMine + m.urgentThem;
  if (saved) reasons.push({ text: `期限間近の食材を${saved}品救える`, cls: 'save' });
  if (m.sameCountry && m.user.type === 'intl') reasons.push({ text: `${m.user.country}料理を教えてもらえる` });
  else if (m.user.type === 'intl') reasons.push({ text: '国際交流' });
  else reasons.push({ text: '一人ごはん仲間' });
  if (m.have === m.items.length) reasons.push({ text: '材料が全部そろう' });
  if (m.theyLike && m.iLike) reasons.push({ text: `2人とも${m.cuisine}好き` });
  else if (m.theyLike) reasons.push({ text: `相手の好きな${m.cuisine}` });
  return reasons;
}

function ingChips(list) {
  return list
    .map((i) => `<li class="ing have ${statusOf(i.food.expiry).level !== 'ok' ? 'urgent' : ''}">${esc(i.food.name)}</li>`)
    .join('');
}

function renderMatches() {
  $('matchFilter').innerHTML = [
    { key: 'all', label: 'だれとでも' },
    { key: 'intl', label: '留学生と' },
    { key: 'jp', label: '日本人学生と' },
  ]
    .map((f) => `<button type="button" class="chip ${f.key === matchFilter ? 'is-active' : ''}" data-mfilter="${f.key}">${f.label}</button>`)
    .join('');

  // 誘った相手(マッチ成立)
  const invites = state.invites || {};
  const doneCards = MATCH_USERS.filter((u) => invites[u.id])
    .map((u) => {
      const ev = state.events.find((e) => e.id === invites[u.id]);
      if (!ev) return '';
      const accepted = ev.participants.some((p) => p.name === u.name);
      return `
        <li class="match done" data-user="${u.id}">
          <button type="button" class="match-person person-btn" data-action="profile" aria-label="${esc(u.name)}さんのプロフィールを見る">
            <span class="match-avatar" aria-hidden="true">${u.flag}</span>
            <span class="person-text">
              <span class="match-name">${esc(u.name)}さん<span class="verified">${accepted ? 'マッチ成立' : '返事待ち'}</span></span>
              <span class="match-profile">${esc(ev.menu)}・${formatJP(ev.date)} ${esc(ev.time)}・${esc(ev.place)}</span>
            </span>
            <span class="person-more" aria-hidden="true">履歴 ›</span>
          </button>
          <div class="match-actions">
            <span class="match-status">${accepted ? `✓ ${esc(u.name)}さんが参加OKしました` : '招待を送りました'}</span>
          </div>
        </li>`;
    })
    .join('');

  let matches = computeMatches().filter((m) => matchFilter === 'all' || m.user.type === matchFilter);
  const total = matches.length;
  if (!matchShowAll) matches = matches.slice(0, 3);

  const cards = matches
    .map((m) => {
      const u = m.user;
      const missing = m.items.filter((i) => !i.food);
      return `
        <li class="match" data-user="${u.id}">
          <button type="button" class="match-person person-btn" data-action="profile" aria-label="${esc(u.name)}さんのプロフィールを見る">
            <span class="match-avatar" aria-hidden="true">${u.flag}</span>
            <span class="person-text">
              <span class="match-name">${esc(u.name)}さん<span class="verified">大学認証済み</span></span>
              <span class="match-profile">${esc(u.country)}・${MATCH_TYPES[u.type]}・${esc(u.profile)}${u.cooking ? `・料理:${esc(u.cooking)}` : ''}</span>
            </span>
            <span class="person-more" aria-hidden="true">履歴 ›</span>
          </button>
          <p class="match-want">「${esc(u.want)}」</p>
          <div class="match-recipe">
            <span class="recipe-emoji" aria-hidden="true">${m.recipe.emoji}</span>
            <div>
              <p class="match-recipe-name">${esc(m.recipe.name)}</p>
              <p class="match-when">${whenLabel(u)}・${esc(u.place)}</p>
            </div>
          </div>
          <div class="combo">
            <div class="combo-side">
              <p class="combo-label">あなたの食材</p>
              <ul class="ings">${ingChips(m.mine)}</ul>
            </div>
            <span class="combo-plus" aria-hidden="true">＋</span>
            <div class="combo-side">
              <p class="combo-label">${esc(u.name)}さんの食材</p>
              <ul class="ings">${ingChips(m.them)}</ul>
            </div>
          </div>
          ${missing.length ? `<p class="hint">あと少し:${missing.map((i) => esc(i.label)).join('、')}</p>` : ''}
          <div class="reasons">${matchReasons(m).map((r) => `<span class="reason ${r.cls || ''}">${esc(r.text)}</span>`).join('')}</div>
          <div class="match-actions">
            <button type="button" class="btn btn-primary" data-action="invite">${esc(u.name)}さんをごはんに誘う</button>
          </div>
        </li>`;
    })
    .join('');

  $('matchList').innerHTML = doneCards + cards;
  $('matchMore').hidden = matchShowAll || total <= 3;
  $('matchEmpty').hidden = total > 0 || doneCards !== '';
  $('matchEmptyText').textContent =
    state.foods.length === 0
      ? '冷蔵庫に食材を登録すると、一緒にごはんを作れる相手が見つかります'
      : 'この条件で、今の食材から作れる相手は見つかりませんでした';
}

// 相手をごはんに誘う → 会を自動で作り、少したつと相手が参加OKする(デモ)
function inviteMatch(userId) {
  const user = MATCH_USERS.find((u) => u.id === userId);
  const m = user && bestMatchFor(user);
  if (!m) return;
  const ev = {
    id: newId(),
    title: `${user.name}さんと${m.recipe.name}`,
    menu: m.recipe.name,
    date: addDays(user.when.day),
    time: user.when.time,
    place: user.place,
    capacity: 4,
    tags: [...user.langs],
    host: ME, mine: true, joined: true,
    participants: [ME],
    bring: m.them.map((i) => ({ who: user.name, item: i.food.name })),
  };
  state.events.push(ev);
  state.invites = { ...(state.invites || {}), [user.id]: ev.id };
  bringFoods(ev, m.mine.map((i) => i.food.id));
  commit();
  toast(`${user.name}さんに招待を送りました`);

  // デモ用:少したつと相手が参加OKする(本番では相手の操作で決まる)
  setTimeout(() => {
    const target = state.events.find((e) => e.id === ev.id);
    if (!target || target.participants.some((p) => p.name === user.name)) return;
    target.participants.push({ name: user.name, flag: user.flag, country: user.country });
    commit();
    toast(`${user.flag} ${user.name}さんが参加OKしました!`);
  }, 2500);
}

function renderParty() {
  renderMatches();
  const urgent = urgentFoods();
  $('partyHeroText').textContent = urgent.length
    ? `期限が近い${urgent.slice(0, 2).map((f) => `「${f.name}」`).join('')}を持ち寄って、留学生や友達と料理会をしませんか?`
    : '冷蔵庫の食材を持ち寄って、留学生や友達と料理会をしませんか?';

  const events = upcomingEvents();
  $('partyList').innerHTML = events
    .map((e) => {
      const d = parseDate(e.date);
      const full = e.participants.length >= e.capacity;
      const faces = e.participants
        .slice(0, 5)
        .map((p) => `<span class="face" title="${esc(p.name)}">${p.flag}</span>`)
        .join('');
      const bring = e.bring.length
        ? `<div class="bring">
             <p class="bring-label">持ち寄る食材</p>
             <ul>${e.bring
               .map((b) => `<li class="${b.who === ME.name ? 'from-me' : ''}">${esc(b.item)} <span>(${esc(b.who)})</span></li>`)
               .join('')}</ul>
           </div>`
        : '';
      let buttons;
      if (e.mine) {
        buttons = `<button type="button" class="btn btn-soft" data-action="bring">食材を追加</button>`;
      } else if (e.joined) {
        buttons = `
          <button type="button" class="btn btn-soft" data-action="bring">食材を持っていく</button>
          <button type="button" class="btn btn-ghost" data-action="leave">参加をやめる</button>`;
      } else {
        buttons = `<button type="button" class="btn btn-primary" data-action="join" ${full ? 'disabled' : ''}>${full ? '満員です' : '参加する'}</button>`;
      }
      return `
        <li class="party ${e.mine ? 'mine' : ''}" data-id="${e.id}">
          <div class="party-date">
            <span class="d">${d.getMonth() + 1}/${d.getDate()}</span>
            <span class="w">${WEEK[d.getDay()]}曜</span>
            <span class="t">${esc(e.time)}</span>
          </div>
          <div class="party-body">
            <p class="party-title">${esc(e.title)}${e.mine ? '<span class="mine-badge">主催</span>' : e.joined ? '<span class="mine-badge">参加予定</span>' : ''}</p>
            <p class="party-meta">${esc(e.menu)}・${esc(e.place)}</p>
            <p class="party-host">主催 ${e.host.flag} ${esc(e.host.name)}${e.host.country ? `(${esc(e.host.country)})` : ''}</p>
            ${e.tags.length ? `<div class="tags">${e.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
            ${bring}
            <div class="party-foot">
              <div class="people">
                <span class="faces">${faces}</span>
                <span class="seats">${e.participants.length}/${e.capacity}人</span>
              </div>
              <div class="party-buttons">${buttons}</div>
            </div>
          </div>
        </li>`;
    })
    .join('');
  $('partyEmpty').hidden = events.length > 0;
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
const TITLES = {
  fridge: 'のこりものクラブ',
  recipe: '作れるレシピ',
  party: 'ごはんマッチ',
  shopping: '買い物リスト',
  stats: 'フードロス記録',
};

function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  Object.keys(TITLES).forEach((t) => ($(`view-${t}`).hidden = t !== tab));
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

// via を 'party' にすると「料理会で使った」として記録される
function finishFood(food, kind, via) {
  state.foods = state.foods.filter((f) => f.id !== food.id);
  const log = { id: newId(), name: food.name, kind, date: new Date().toISOString() };
  if (via) log.via = via;
  state.logs.unshift(log);
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

// =========================================================
//  レシピ・料理会の操作
// =========================================================
$('recipeCta').addEventListener('click', () => {
  recipeFocus = 'auto';
  renderRecipes();
  showTab('recipe');
});

$('recipeFocus').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-focus]');
  if (!chip) return;
  recipeFocus = chip.dataset.focus;
  renderRecipes();
});

$('recipeList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const recipe = allRecipes()[Number(btn.closest('.recipe').dataset.index)];
  if (!recipe) return;
  const result = checkRecipe(recipe);

  if (btn.dataset.action === 'shop') {
    result.missing.forEach((i) => addShopping(i.label));
    toast(`${result.missing.length}品を買い物リストに追加しました`);
  }
  if (btn.dataset.action === 'party') {
    openPartyForm({
      title: `${recipe.name}を一緒に作ろう`,
      menu: recipe.name,
      foodIds: result.have.map((i) => i.food.id),
    });
  }
});

// ---------- ごはんマッチの操作 ----------
$('matchCta').addEventListener('click', () => {
  matchFilter = 'all';
  renderMatches();
  showTab('party');
});
$('matchFilter').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-mfilter]');
  if (!chip) return;
  matchFilter = chip.dataset.mfilter;
  renderMatches();
});
$('matchMore').addEventListener('click', () => {
  matchShowAll = true;
  renderMatches();
});
$('matchList').addEventListener('click', async (e) => {
  const prof = e.target.closest('[data-action="profile"]');
  if (prof) return openDemoPartner(prof.closest('.match').dataset.user);
  const btn = e.target.closest('[data-action="invite"]');
  if (!btn) return;
  const card = btn.closest('.match');
  const user = MATCH_USERS.find((u) => u.id === card.dataset.user);
  const ok = await ask(
    `${user.name}さんをごはんに誘いますか?`,
    `${whenLabel(user)}・${user.place}。選ばれた食材は持ち寄り用として冷蔵庫から外れます`,
    [
      { label: 'やめる', value: false },
      { label: '誘う', value: true, style: 'btn-primary' },
    ]
  );
  if (ok) inviteMatch(user.id);
});

$('hostBtn').addEventListener('click', () => {
  openPartyForm({ foodIds: urgentFoods().map((f) => f.id) });
});

$('partyList').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn || btn.disabled) return;
  const ev = state.events.find((x) => x.id === btn.closest('.party').dataset.id);
  if (!ev) return;

  if (btn.dataset.action === 'join') {
    ev.joined = true;
    ev.participants.push(ME);
    commit();
    toast(`「${ev.title}」に参加します`);
    if (state.foods.length > 0) {
      const bring = await ask('食材を持っていきますか?', '冷蔵庫の食材を持ち寄ると、ロスを減らしながら料理会に貢献できます', [
        { label: 'あとで', value: false },
        { label: '選ぶ', value: true, style: 'btn-primary' },
      ]);
      if (bring) openPick(ev);
    }
  }
  if (btn.dataset.action === 'leave') {
    ev.joined = false;
    ev.participants = ev.participants.filter((p) => p.name !== ME.name);
    commit();
    toast('参加をやめました');
  }
  if (btn.dataset.action === 'bring') {
    if (state.foods.length === 0) return toast('冷蔵庫に食材がありません');
    openPick(ev);
  }
});

// 選んだ食材を料理会に持っていく(冷蔵庫から外して「料理会で使い切り」と記録)
function bringFoods(ev, ids) {
  const foods = state.foods.filter((f) => ids.includes(f.id));
  foods.forEach((f) => {
    ev.bring.push({ who: ME.name, item: f.name });
    finishFood(f, 'used', 'party');
  });
  return foods.length;
}

// ---------- 食材を選ぶシート ----------
const pick = { event: null, selected: [] };

function foodChip(f, selected) {
  const urgent = statusOf(f.expiry).level !== 'ok';
  return `<button type="button" class="chip ${selected ? 'is-on' : ''}" data-food="${f.id}">${esc(f.name)}${urgent ? `<small>${statusOf(f.expiry).label}</small>` : ''}</button>`;
}

function renderPick() {
  $('pickChips').innerHTML = foodsByExpiry().map((f) => foodChip(f, pick.selected.includes(f.id))).join('');
  $('pickConfirm').disabled = pick.selected.length === 0;
  $('pickConfirm').textContent = pick.selected.length ? `${pick.selected.length}品を持っていく` : '食材を選んでください';
}
function openPick(ev) {
  pick.event = ev;
  pick.selected = [];
  $('pickTitle').textContent = '持っていく食材';
  renderPick();
  $('pickSheet').hidden = false;
}
function closePick() {
  $('pickSheet').hidden = true;
}
$('pickChips').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-food]');
  if (!chip) return;
  const id = chip.dataset.food;
  pick.selected = pick.selected.includes(id) ? pick.selected.filter((x) => x !== id) : [...pick.selected, id];
  renderPick();
});
$('pickCancel').addEventListener('click', closePick);
$('pickSheet').addEventListener('click', (e) => {
  if (e.target === $('pickSheet')) closePick();
});
$('pickConfirm').addEventListener('click', () => {
  if (!pick.event || pick.selected.length === 0) return;
  const n = bringFoods(pick.event, pick.selected);
  commit();
  closePick();
  toast(`${n}品を料理会で使い切ります`);
});

// ---------- 料理会を開くシート ----------
const party = { place: PLACES[0], capacity: 6, tags: [], foodIds: [] };

function renderPartyChips() {
  $('placeChips').innerHTML = PLACES.map(
    (p) => `<button type="button" class="chip ${p === party.place ? 'is-active' : ''}" data-place="${esc(p)}">${esc(p)}</button>`
  ).join('');
  $('tagChips').innerHTML = PARTY_TAGS.map(
    (t) => `<button type="button" class="chip ${party.tags.includes(t) ? 'is-on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`
  ).join('');
  const foods = foodsByExpiry();
  $('partyFoodChips').innerHTML = foods.map((f) => foodChip(f, party.foodIds.includes(f.id))).join('');
  $('partyFoodHint').textContent = foods.length
    ? '選んだ食材は、料理会で使い切ったものとして冷蔵庫から外れます'
    : '冷蔵庫に食材がないので、手ぶらで募集します';
  $('capValue').textContent = party.capacity;
}

function openPartyForm({ title = '', menu = '', foodIds = [] } = {}) {
  party.place = PLACES[0];
  party.capacity = 6;
  party.tags = ['やさしい日本語'];
  party.foodIds = foodIds.filter((id) => state.foods.some((f) => f.id === id));
  $('partyTitle').value = title;
  $('partyMenu').value = menu;
  $('partyDate').value = addDays(3);
  $('partyTime').value = '18:30';
  $('partyError').hidden = true;
  renderPartyChips();
  $('partySheet').hidden = false;
}
function closePartyForm() {
  $('partySheet').hidden = true;
}

$('partyCancel').addEventListener('click', closePartyForm);
$('partySheet').addEventListener('click', (e) => {
  if (e.target === $('partySheet')) closePartyForm();
});
$('placeChips').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-place]');
  if (!chip) return;
  party.place = chip.dataset.place;
  renderPartyChips();
});
$('tagChips').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-tag]');
  if (!chip) return;
  const t = chip.dataset.tag;
  party.tags = party.tags.includes(t) ? party.tags.filter((x) => x !== t) : [...party.tags, t];
  renderPartyChips();
});
$('partyFoodChips').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-food]');
  if (!chip) return;
  const id = chip.dataset.food;
  party.foodIds = party.foodIds.includes(id) ? party.foodIds.filter((x) => x !== id) : [...party.foodIds, id];
  renderPartyChips();
});
$('capMinus').addEventListener('click', () => {
  party.capacity = Math.max(2, party.capacity - 1);
  $('capValue').textContent = party.capacity;
});
$('capPlus').addEventListener('click', () => {
  party.capacity = Math.min(30, party.capacity + 1);
  $('capValue').textContent = party.capacity;
});

$('partyForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('partyTitle').value.trim();
  const menu = $('partyMenu').value.trim();
  const date = $('partyDate').value;
  const time = $('partyTime').value || '18:30';
  const showError = (text) => {
    $('partyError').textContent = text;
    $('partyError').hidden = false;
  };
  if (!title) return showError('タイトルを入れてください');
  if (!isValidDate(date) || daysUntil(date) < 0) return showError('今日以降の日付を選んでください');

  const ev = {
    id: newId(), title, menu: menu || '未定', date, time,
    place: party.place, capacity: party.capacity, tags: [...party.tags],
    host: ME, mine: true, joined: true,
    participants: [ME], bring: [],
  };
  state.events.push(ev);
  const n = bringFoods(ev, party.foodIds);
  commit();
  closePartyForm();
  showTab('party');
  toast(n ? `募集しました。${n}品を料理会で使い切ります` : '料理会を募集しました');

  // デモ用:少したつと留学生が参加してくれる演出(本番では他の人の操作で増える)
  setTimeout(() => {
    const target = state.events.find((x) => x.id === ev.id);
    if (!target || target.participants.length >= target.capacity) return;
    target.participants.push({ name: 'Mai', flag: '🇻🇳', country: 'ベトナム' });
    target.bring.push({ who: 'Mai', item: 'パクチー' });
    commit();
    toast('🇻🇳 Maiさん(ベトナム)が参加しました');
  }, 4000);
});

// =========================================================
//  ホーム画面のアイコン(この端末だけの設定)
// =========================================================
const APP_ICONS = [
  { key: 'original', label: 'オリジナル' },
  { key: 'fridge', label: '冷蔵庫くん' },
  { key: 'onigiri', label: 'おにぎり' },
  { key: 'carrot', label: 'にんじん' },
  { key: 'bowls', label: 'ふたりのお茶碗' },
];
const ICON_KEY = 'nokori-app-icon';

function currentIcon() {
  try {
    const saved = localStorage.getItem(ICON_KEY);
    if (APP_ICONS.some((i) => i.key === saved)) return saved;
  } catch (e) {
    /* 保存できない環境では最初のアイコン */
  }
  return APP_ICONS[0].key;
}

function applyIcon(key) {
  const href = `icons/icon-${key}-180.png`;
  $('touchIcon').setAttribute('href', href);
  $('favIcon').setAttribute('href', href);
  $('iconPicker').innerHTML = APP_ICONS.map(
    (i) => `<button type="button" class="icon-choice ${i.key === key ? 'is-on' : ''}" role="radio" aria-checked="${i.key === key}" data-icon="${i.key}">
      <img src="icons/icon-${i.key}-180.png" alt="">
      <span>${i.label}</span>
    </button>`
  ).join('');
}

$('iconPicker').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-icon]');
  if (!btn) return;
  try {
    localStorage.setItem(ICON_KEY, btn.dataset.icon);
  } catch (err) {
    /* 保存できなくても、今開いている間は反映する */
  }
  applyIcon(btn.dataset.icon);
  toast('アイコンを変えました');
});

// ---------- 相手のプロフィールを閉じる ----------
$('partnerClose').addEventListener('click', () => ($('partnerSheet').hidden = true));
$('partnerSheet').addEventListener('click', (e) => {
  if (e.target === $('partnerSheet')) $('partnerSheet').hidden = true;
});

// ---------- 起動 ----------
applyIcon(currentIcon());
$('today').textContent = (() => {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WEEK[d.getDay()]})`;
})();
renderAll();
showTab('fridge');
