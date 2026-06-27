'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

interface LogItem {
  id: number;
  created_at: string;
  text: string;
  body: string;
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);

  // 📝 執筆フォーム用の状態
  const [inputTitle, setInputTitle] = useState('');
  const [inputBody, setInputBody] = useState(''); // 本文（長文）
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      if (user) { fetchLogs(); }
    }
    checkUser();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error('データ取得エラー:', error); }
    else if (data) { setLogs(data); }
    setLoading(false);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert('ログイン失敗: ' + error.message); }
    else if (data.user) { setUser(data.user); fetchLogs(); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLogs([]);
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim() && !inputBody.trim()) return;

    const { data, error } = await supabase
      .from('logs')
      .insert([{ text: inputTitle, body: inputBody }])
      .select();

    if (error) { alert('保存エラー: ' + error.message); }
    else if (data) {
      setLogs([data[0], ...logs]);
      setInputTitle('');
      setInputBody('');
    }
  };

  const handleDeleteLog = async (id: number) => {
    const { error } = await supabase.from('logs').delete().eq('id', id);
    if (error) { alert('削除エラー: ' + error.message); }
    else { setLogs(logs.filter(log => log.id !== id)); }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center font-mono text-sm animate-pulse">セキュリティ認証チェック中...</div>;
  }

  // 🛑 ログイン画面
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md p-6 bg-slate-800/40 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">🔒 Cloud Studio Note</h1>
            <p className="text-slate-400 text-xs mt-1.5">プライベート執筆環境を開くには認証が必要です</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">メールアドレス</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">パスワード</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" required />
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition text-sm">ログインして入場</button>
          </form>
        </div>
      </div>
    );
  }

  // 🟢 メイン画面（執筆スタジオ）
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center">
      <header className="w-full max-w-2xl flex justify-between items-center my-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">🖋️ Creative Studio</h1>
          <p className="text-slate-500 text-[11px] font-mono mt-0.5">Secure Cloud Editor</p>
        </div>
        <button onClick={handleLogout} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition">ログアウト</button>
      </header>

      <main className="w-full max-w-2xl space-y-6">
        {/* 執筆フォーム */}
        <form onSubmit={handleAddLog} className="p-5 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">タイトル・章題</label>
            <input type="text" value={inputTitle} onChange={(e) => setInputTitle(e.target.value)} placeholder="タイトルや章題を入力..." className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">本文（プロット・小説・メモ）</label>
            <textarea value={inputBody} onChange={(e) => setInputBody(e.target.value)} placeholder="ここに本文を自由に詳しく記述できます..." rows={14} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed resize-y font-serif" />
          </div>

          <div className="flex justify-between items-center pt-1">
            {/* 🔢 リアルタイム文字数カウント */}
            <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
              現在の本文: <strong className="text-emerald-400">{inputBody.length}</strong> 文字
            </span>
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition text-sm">クラウドへ保存</button>
          </div>
        </form>

        {/* ストック一覧 */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">ストックされた原稿・メモ ({logs.length}件)</h2>
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm animate-pulse">クラウドと同期中...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">原稿はまだありません。</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-5 bg-slate-800/60 border border-slate-800 rounded-2xl shadow-md space-y-3">
                  <h3 className="text-base font-bold text-slate-100 break-all">{log.text || '（無題）'}</h3>
                  {log.body && <p className="text-sm text-slate-300 mt-2 break-all whitespace-pre-wrap leading-relaxed border-t border-slate-800 pt-2 font-serif">{log.body}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[10px] text-slate-500">
                    <span className="font-mono">💾 {new Date(log.created_at).toLocaleString()} | {log.body?.length || 0}文字</span>
                    <button onClick={() => handleDeleteLog(log.id)} className="font-bold text-red-400/60 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10 transition text-xs">削除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}