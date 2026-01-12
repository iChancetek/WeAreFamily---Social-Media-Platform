'use server';

export type TrendSource = 'tiktok' | 'youtube' | 'news' | 'twitter';

export type TrendItem = {
    id: string;
    title: string;
    source: TrendSource;
    description?: string;
    url?: string;
    thumbnail?: string;
    metric?: number; // views, tweets, engagement count
    timestamp: Date;
};

export type AITrendAnalysis = {
    summary: string;          // What is trending (20 words max)
    origin: string;           // Where it started
    traction: string;         // Why it's gaining momentum
    crossPlatform: {
        tiktok?: string;
        youtube?: string;
        twitter?: string;
        news?: string;
    };
    whyItMatters: string;     // Cultural/economic/tech impact
    lifecycle: 'emerging' | 'peaking' | 'sustaining' | 'declining';
};

export type EnhancedTrend = TrendItem & {
    aiAnalysis?: AITrendAnalysis;
};

// YouTube Trending
export async function getYouTubeTrends(): Promise<TrendItem[]> {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            console.warn('YouTube API key not configured');
            return [];
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=10&key=${apiKey}`,
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );

        if (!response.ok) {
            console.error('YouTube API error:', response.statusText);
            return [];
        }

        const data = await response.json();

        return data.items?.map((item: any) => ({
            id: `youtube-${item.id}`,
            title: item.snippet.title,
            source: 'youtube' as TrendSource,
            description: item.snippet.description.substring(0, 200),
            url: `https://www.youtube.com/watch?v=${item.id}`,
            thumbnail: item.snippet.thumbnails?.medium?.url,
            metric: parseInt(item.statistics.viewCount),
            timestamp: new Date(item.snippet.publishedAt)
        })) || [];
    } catch (error) {
        console.error('YouTube trends fetch error:', error);
        return [];
    }
}

// Twitter Trending (using free tier v2 API)
export async function getTwitterTrends(): Promise<TrendItem[]> {
    try {
        const bearerToken = process.env.TWITTER_BEARER_TOKEN;
        if (!bearerToken) {
            console.warn('Twitter API token not configured');
            return [];
        }

        // Twitter API v2 - Get trending topics (WOEID 1 = Worldwide)
        const response = await fetch(
            'https://api.twitter.com/1.1/trends/place.json?id=1',
            {
                headers: {
                    'Authorization': `Bearer ${bearerToken}`
                },
                next: { revalidate: 1800 } // Cache for 30 minutes
            }
        );

        if (!response.ok) {
            console.error('Twitter API error:', response.statusText);
            return [];
        }

        const data = await response.json();
        const trends = data[0]?.trends || [];

        return trends.slice(0, 10).map((trend: any, index: number) => ({
            id: `twitter-${index}`,
            title: trend.name,
            source: 'twitter' as TrendSource,
            description: `${trend.tweet_volume ? `${trend.tweet_volume.toLocaleString()} tweets` : 'Trending'}`,
            url: trend.url || `https://twitter.com/search?q=${encodeURIComponent(trend.name)}`,
            metric: trend.tweet_volume || 0,
            timestamp: new Date()
        }));
    } catch (error) {
        console.error('Twitter trends fetch error:', error);
        return [];
    }
}

// TikTok Trends (aggregated from public sources)
export async function getTikTokTrends(): Promise<TrendItem[]> {
    try {
        // Note: TikTok doesn't have a free public API
        // This is a placeholder for trend aggregation from public sources
        // You could integrate with third-party services or RSS feeds

        // For now, return mock data structure
        // In production, integrate with trend aggregator APIs or scrape public trend pages
        return [];
    } catch (error) {
        console.error('TikTok trends fetch error:', error);
        return [];
    }
}

// News Trends (reuse existing news feed infrastructure)
export async function getNewsTrends(): Promise<TrendItem[]> {
    try {
        const { getNews } = await import('./news');
        const newsItems = await getNews('general');

        return newsItems.slice(0, 5).map((item, index) => ({
            id: `news-${index}`,
            title: item.title,
            source: 'news' as TrendSource,
            description: item.description,
            url: item.link,
            thumbnail: item.thumbnail,
            metric: 0, // News doesn't have engagement metrics readily available
            timestamp: new Date(item.pubDate)
        }));
    } catch (error) {
        console.error('News trends fetch error:', error);
        return [];
    }
}

// Aggregate all trends
export async function aggregateTrends(): Promise<TrendItem[]> {
    try {
        const [youtube, twitter, tiktok, news] = await Promise.all([
            getYouTubeTrends(),
            getTwitterTrends(),
            getTikTokTrends(),
            getNewsTrends()
        ]);

        const allTrends = [...youtube, ...twitter, ...tiktok, ...news];

        // Sort by metric (engagement) descending
        return allTrends.sort((a, b) => (b.metric || 0) - (a.metric || 0));
    } catch (error) {
        console.error('Trend aggregation error:', error);
        return [];
    }
}
