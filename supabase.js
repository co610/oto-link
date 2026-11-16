if (!window.supabase) {
    throw new Error("Supabaseライブラリが読み込まれていません。");
}

if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    throw new Error("Supabaseの設定が不足しています。");
}

window.OTO_SUPABASE = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);

console.log("Supabase接続クライアントの初期化完了");