import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }
});

// 楽天市場・楽天関連の公式RSS一覧
const FEEDS = [
  { name: '楽天公式ニュース', url: 'https://corp.rakuten.co.jp/news/rss.xml' },
  { name: '楽天市場 トレンド情報', url: 'https://event.rakuten.co.jp/rss/trend.xml' }
];

export async function GET() {
  try {
    const allArticles = [];

    for (const feed of FEEDS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const feedData = await parser.parseURL(feed.url);
        clearTimeout(timeoutId);

        const items = feedData.items.slice(0, 8).map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          source: feed.name,
        }));
        allArticles.push(...items);
      } catch (feedError) {
        console.error(`${feed.name}の取得に失敗しました:`, feedError);
        continue;
      }
    }

    // 新しい順に並び替え
    allArticles.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(allArticles);
  } catch (error) {
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}