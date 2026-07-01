'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [inputTitle, setInputTitle] = useState('');
  const [inputBody, setInputBody] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // 定期自動保存の仕組み（10分ごとに保存）
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      if (!inputTitle && !inputBody) return;

      const { error } = await supabase
        .from('logs')
        .insert([{ text: inputTitle, body: inputBody }]);
      
      if (!error) {
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 600000); // 10分 = 600000ミリ秒

    return () => clearInterval(interval);
  }, [user, inputTitle, inputBody]);

  if (!user) return <div className="p-10 text-slate-400">ログインが必要です。</div>;

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-slate-800 p-4 md:p-12 font-serif">
      <div className="max-w-4xl mx-auto">
        <input
          type="text"
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          placeholder="タイトルを入力..."
          className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-6 text-slate-900"
        />
        
        <textarea
          value={inputBody}
          onChange={(e) => setInputBody(e.target.value)}
          placeholder="ここに本文を入力..."
          className="w-full h-[70vh] bg-transparent border-none outline-none text-lg leading-relaxed resize-none text-slate-700"
        />

        <div className="fixed bottom-6 right-6 text-xs text-slate-400">
          {lastSaved ? `最終自動保存: ${lastSaved}` : '10分ごとに自動保存中...'}
        </div>
      </div>
    </div>
  );
}