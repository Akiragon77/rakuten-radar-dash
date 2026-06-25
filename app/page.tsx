'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// .env.local に書いた鍵を読み込んで、Supabaseと通信するリモコンを作る
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface LogItem {
  id: number;
  created_at: string;
  text: string;
}

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚪 アプリが開いた瞬間に、データベースから過去のデータを全部持ってくる
  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from('logs') // 「logs」というテーブルから
        .select('*')  // 全部（*）の列のデータを
        .order('created_at', { ascending: false }); // 新しい順に並び替えて取得

      if (error) {
        console.error('データ取得エラー:', error);
      } else if (data) {
        setLogs(data);
      }
      setLoading(false);
    }
    fetchLogs();
  }, []);

  // ➕ 「追加」ボタンを押したときの処理（データベースに保存する）
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Supabaseの金庫に新しい文字をカチャッと入れる
    const { data, error } = await supabase
      .from('logs')
      .insert([{ text: inputText }]) // text列に、入力された文字を入れる
      .select(); // 保存したデータをその場で返してもらう

    if (error) {
      console.error('データ追加エラー:', error);
    } else if (data) {
      // 画面の一覧にも一瞬で反映させる
      setLogs([data[0], ...logs]);
      setInputText('');
    }
  };

  // ❌ 「削除」ボタンを押したときの処理（データベースから消す）
  const handleDeleteLog = async (id: number) => {
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', id); // IDが一致するものを狙い撃ちで消す

    if (error) {
      console.error('データ削除エラー:', error);
    } else {
      // 画面からも消す
      setLogs(logs.filter(log => log.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center">
      <header className="w-full max-w-md text-center my-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
          🌐 Cloud Live Database
        </h1>
        <p className="text-slate-400 text-sm mt-2">世界と繋がる、本物のWEBサービスの土台</p>
      </header>

      <main className="w-full max-w-md space-y-6">
        <form onSubmit={handleAddLog} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="クラウドに保存する文字を入力..."
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl shadow-inner text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md active:scale-95 transition"
          >
            送信
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            クラウド金庫のデータ ({logs.length}件)
          </h2>

          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm animate-pulse">
              データベースと通信中...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              クラウド上は空っぽです。データを送信してください。
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-xl shadow-sm transition"
                >
                  <div className="flex-1 pr-4">
                    <p className="text-slate-200 font-medium break-all">{log.text}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      🌐 {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-xs font-bold text-red-400/70 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10 transition"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}