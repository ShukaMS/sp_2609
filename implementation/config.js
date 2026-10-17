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
  supabaseUrl: 'https://zaqznjqqrrewwiinpejr.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphcXpuanFxcnJld3dpaW5wZWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMzIxNTEsImV4cCI6MjEwNzgwODE1MX0.ZA6JenJdSij8K99hW_Eiyl6gG_p-AuCzawPY-yjASVQ',
};
