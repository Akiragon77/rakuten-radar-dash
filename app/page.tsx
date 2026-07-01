'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabaseの接続情報
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// クライアントの初期化（RLSを無視してINSERTのみ行うため、anon keyを使用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ログイン状態を保持する
  },
});

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [inputTitle, setInputTitle] = useState('');
  const [inputBody, setInputBody] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true); // 認証ロード中フラグ

  // 1. 初回ログインチェック
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    }
    getUser();
  }, []);

  // 2. 定期自動保存の仕組み（10分ごとに保存）
  useEffect(() => {
    // ユーザーがいない、またはタイトルも本文も空の場合は何もしない
    if (!user || (!inputTitle && !inputBody)) return;

    // 10分おきに保存するタイマーを設定
    const interval = setInterval(async () => {
      console.log('定期自動保存を実行中...');
      
      // データベースの 'logs' テーブルにデータを挿入
      const { error } = await supabase
        .from('logs')
        .insert([
          { 
            text: inputTitle, // タイトルを保存
            body: inputBody   // 本文を保存
          }
        ]);
      
      if (error) {
        console.error('保存エラー:', error.message);
      } else {
        console.log('保存成功:', new Date().toLocaleTimeString());
        setLastSaved(new Date().toLocaleTimeString()); // 画面に保存時間を表示
      }
    }, 600000); // 10分 = 600000ミリ秒

    // クリーンアップ関数（コンポーネントがアンmountされたり、依存配列が変わったらタイマーを解除）
    return () => clearInterval(interval);
  }, [user, inputTitle, inputBody]); // 依存配列にuser, inputTitle, inputBodyを含める

  // 認証チェック中の表示
  if (authLoading) {
    return <div className="min-h-screen bg-black text-gray-400 flex items-center justify-center">認証確認中...</div>;
  }

  // ログインしていない場合の表示
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-gray-200 p-6 flex flex-col items-center justify-center">
        <div className="text-center border border-gray-700 p-10 rounded-lg bg-gray-900">
          <h1 className="text-2xl font-bold mb-4">Cloud Live Note</h1>
          <p className="text-gray-400">このノートを使用するには、Supabase Authでログインしてください。</p>
          <p className="text-xs text-gray-600 mt-2">※事前にAuthの設定が必要です。</p>
        </div>
      </div>
    );
  }

  // 🟢 メインの執筆画面（ダークモード）
  return (
    // 全体の背景: 黒 (bg-black), テキスト: 白に近いグレー (text-gray-100)
    <div className="min-h-screen bg-black text-gray-100 p-4 md:p-12 font-serif selection:bg-gray-700">
      <div className="max-w-4xl mx-auto relative">
        
        {/* ヘッダー（ログインユーザー名とログアウトボタン） */}
        <header className="flex justify-between items-center mb-10 pb-4 border-b border-gray-800 text-sm text-gray-400">
          <span>User: {user.email}</span>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="hover:text-white"
          >
            ログアウト
          </button>
        </header>

        {/* ① タイトル入力欄（広い領域） */}
        <input
          type="text"
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          placeholder="タイトルを入力..."
          // 文字サイズ大 (text-3xl), 太字 (font-bold), 背景透明 (bg-transparent), 枠線なし, 白文字 (text-white)
          className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-6 text-white placeholder:text-gray-600"
        />
        
        {/* ② 本文入力欄（広い領域・改行エンター可） */}
        <textarea
          value={inputBody}
          onChange={(e) => setInputBody(e.target.value)}
          placeholder="ここに本文を記述します。10分ごとに自動保存されます..."
          // 高さ画面の70% (h-[70vh]), 文字サイズ中 (text-lg), 背景透明, 枠線なし, 行間 (leading-relaxed), グレー文字 (text-gray-300)
          className="w-full h-[70vh] bg-transparent border-none outline-none text-lg leading-relaxed resize-none text-gray-300 placeholder:text-gray-600"
        />

        {/* ③ 自動保存の状態表示（画面右下に固定） */}
        <div className="fixed bottom-6 right-6 text-xs text-gray-600 font-mono">
          {lastSaved ? `最終自動保存: ${lastSaved}` : '10分ごとに自動保存待機中...'}
        </div>
      </div>
    </div>
  );
}