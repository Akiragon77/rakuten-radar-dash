'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [inputTitle, setInputTitle] = useState('');
  const [inputBody, setInputBody] = useState('');
  const [status, setStatus] = useState<string>('執筆中...');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // ⑤ 手動保存関数
  const handleSave = useCallback(async () => {
    if (!inputTitle && !inputBody) return;
    setStatus('保存中...');
    const { error } = await supabase.from('logs').insert([{ text: inputTitle, body: inputBody }]);
    if (!error) {
      setStatus(`最終保存: ${new Date().toLocaleTimeString()}`);
    } else {
      setStatus('保存失敗');
    }
  }, [inputTitle, inputBody]);

  // ⑤ ショートカットキー (Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // 10分ごとの定期自動保存
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(handleSave, 600000);
    return () => clearInterval(interval);
  }, [user, handleSave]);

  if (!user) return <div className="p-10 text-gray-500">ログインが必要です。</div>;

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 md:p-12 font-serif">
      <div className="max-w-4xl mx-auto relative">
        {/* ③ リアルタイム文字数カウンター */}
        <div className="fixed top-6 right-6 text-sm text-gray-500 font-mono">
          {inputBody.length} 文字
        </div>

        <input
          type="text"
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          placeholder="タイトル..."
          className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-6 text-white"
        />
        
        <textarea
          value={inputBody}
          onChange={(e) => setInputBody(e.target.value)}
          placeholder="本文を記述 (Ctrl + S で手動保存)..."
          className="w-full h-[70vh] bg-transparent border-none outline-none text-lg leading-relaxed resize-none text-gray-300"
        />

        {/* 状態表示エリア */}
        <div className="fixed bottom-6 right-6 text-xs text-gray-600 font-mono">
          {status}
        </div>
      </div>
    </div>
  );
}