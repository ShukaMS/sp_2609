// =========================================================
//  Supabase の接続設定
//  空のままだと「デモモード」(ダミーの相手)で動きます。
//  Supabase の Project Settings → API から、2つの値をコピーして貼り付けてください。
//
//  ・supabaseUrl     … Project URL(https://xxxx.supabase.co)
//  ・supabaseAnonKey … anon(public)キー。公開しても大丈夫なキーです。
//    ※ service_role / secret キーは絶対に貼らないでください(全データを操作できてしまいます)
// =========================================================
window.NOKORI_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
