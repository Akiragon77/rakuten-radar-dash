'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [inputTitle, setInputTitle] = useState('');
  const [inputBody, setInputBody] = useState('');
  const [status, setStatus] = useState<string>('執筆中...');

  // --- YouTube用の状態 ---
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // YouTube APIのロード
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      const newPlayer = new (window as any).YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: { listType: 'playlist', list: 'PLCuIJGJzHGmU', autoplay: 0 },
        events: {
          onStateChange: (e: any) => setIsPlaying(e.data === 1)
        }
      });
      setPlayer(newPlayer);
    };
  }, []);

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    player?.setVolume(newVol);
  };

  const handleSave = useCallback(async () => {
    if (!inputTitle && !inputBody) return;
    setStatus('保存中...');
    const { error } = await supabase.from('logs').insert([{ text: inputTitle, body: inputBody }]);
    if (!error) setStatus(`最終保存: ${new Date().toLocaleTimeString()}`);
    else setStatus('保存失敗');
  }, [inputTitle, inputBody]);

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

  if (!user) return <div className="p-10 text-gray-500">ログインが必要です。</div>;

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 md:p-12 font-serif">
      <div className="max-w-4xl mx-auto relative">
        {/* YouTubeプレイヤー本体（隠し） */}
        <div id="youtube-player" className="hidden" />

        {/* 操作パネル */}
        <div className="fixed bottom-20 left-6 bg-gray-900 p-4 rounded-lg border border-gray-700 flex flex-col gap-2">
          <button onClick={togglePlay} className="text-xs bg-white text-black px-3 py-1 rounded font-bold">
            {isPlaying ? '一時停止' : '再生'}
          </button>
          <input type="range" min="0" max="100" value={volume} onChange={changeVolume} className="w-20" />
        </div>

        <div className="fixed top-6 right-6 text-sm text-gray-500 font-mono">{inputBody.length} 文字</div>

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
          placeholder="本文を記述..."
          className="w-full h-[70vh] bg-transparent border-none outline-none text-lg leading-relaxed resize-none text-gray-300"
        />

        <div className="fixed bottom-6 right-6 text-xs text-gray-600 font-mono">{status}</div>
      </div>
    </div>
  );
}