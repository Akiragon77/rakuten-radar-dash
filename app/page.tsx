'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// .env.local に書いた鍵を読み込んで、Supabaseと通信するリモコンを作る
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';


const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ログイン状態をブラウザに記憶する
    autoRefreshToken: true, // 鍵を自動で更新する
  }
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
  const [user, setUser] = useState<any>(null); // 👤 ログイン中のユーザー情報を入れる箱

  const [inputTitle, setInputTitle] = useState('');
  const [inputBody, setInputBody] = useState('');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // 🚪 アプリが開いた瞬間に、すでにログインしているかチェックする
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);

      if (user) {
        fetchLogs(); // ログインしていればデータを持ってくる
      }
    }
    checkUser();
  }, []);

  // 🚪 データベースから過去のデータを全部持ってくる関数
  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('データ取得エラー:', error);
    } else if (data) {
      setLogs(data);
    }
    setLoading(false);
  }

  // 🔐 ログインボタンを押したときの処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('ログイン失敗: ' + error.message);
    } else if (data.user) {
      setUser(data.user);
      fetchLogs(); // ログイン成功したらデータを読み込む
    }
  };

  // 🔓 ログアウトボタンを押したときの処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLogs([]);
  };

  // ➕ 「送信」ボタンを押したときの処理
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;

    const { data, error } = await supabase
      .from('logs')
      .insert([{ text: inputTitle, body: inputBody }])
      .select();

    if (error) {
      alert('追加エラー（権限がありません）: ' + error.message);
    } else if (data) {
      setLogs([data[0], ...logs]);
      setInputTitle('');
      setInputBody('');
    }
  };

  // ❌ 「削除」ボタンを押したときの処理
  const handleDeleteLog = async (id: number) => {
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', id);

    if (error) {
      alert('削除エラー（権限がありません）: ' + error.message);
    } else {
      setLogs(logs.filter(log => log.id !== id));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center font-mono text-sm animate-pulse">
        セキュリティ認証チェック中...
      </div>
    );
  }

  // 🛑 【ログインしていない場合】ログイン画面を表示する
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md p-6 bg-slate-800/40 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
              🔒 Cloud Live Note
            </h1>
            <p className="text-slate-400 text-xs mt-1.5">このノートを開くには認証が必要です</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition text-sm active:scale-95"
            >
              ログインして入場
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 🟢 【ログインしている場合】いつものメイン画面を表示する
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center">
      <header className="w-full max-w-xl flex justify-between items-center my-6 border-b border-slate-800 pb-4">
        <div className="text-left">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
            🌐 Cloud Live Note
          </h1>
          <p className="text-slate-500 text-[11px] font-mono mt-0.5">User: {user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition"
        >
          ログアウト
        </button>
      </header>

      <main className="w-full max-w-xl space-y-6">
        {/* 入力フォーム */}
        <form onSubmit={handleAddLog} className="p-5 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">タイトル</label>
            <input
              type="text"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              placeholder="ノートのタイトルを入力..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">本文（長文）</label>
            <textarea
              value={inputBody}
              onChange={(e) => setInputBody(e.target.value)}
              placeholder="ここに詳しい内容やメモを自由に記述..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm leading-relaxed resize-y"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md active:scale-95 transition text-sm"
            >
              クラウドへ保存
            </button>
          </div>
        </form>

        {/* ログ一覧エリア */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            ストックされたノート ({logs.length}件)
          </h2>

          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm animate-pulse">
              データベースと通信中...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              クラウド上は空っぽです。最初のノートを保存してください。
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl shadow-md transition space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-base font-bold text-slate-100 break-all">{log.text || '（無題）'}</h3>
                    {log.body && (
                      <p className="text-sm text-slate-300 mt-2 break-all whitespace-pre-wrap leading-relaxed border-t border-slate-800 pt-2">
                        {log.body}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[10px] text-slate-500">
                    <span className="font-mono">🌐 {new Date(log.created_at).toLocaleString()}</span>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="font-bold text-red-400/60 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10 transition text-xs"
                    >
                      削除
                    </button>
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