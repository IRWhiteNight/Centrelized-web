<?php
// Save as: app/Services/NewsAggregator.php
namespace App\Services;

use App\Models\NewsItem;
use Carbon\Carbon;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NewsAggregator
{
    /** Fetch every source. Returns number of items saved or updated. */
    public function fetchAll(): int
    {
        $saved = 0;

        foreach (config('news.queries') as $region => $query) {
            // Worldwide web news (GDELT) - the biggest source
            $saved += $this->store($this->safely(fn () => $this->gdelt($region)), $region, 'article');
            sleep(5); // GDELT asks for one request every 5 seconds

            // GNews (articles with images)
            $saved += $this->store($this->safely(fn () => $this->gnews($query)), $region, 'article');

            // Google News, one request per country edition
            foreach (config('news.google_editions') as $edition) {
                $saved += $this->store($this->safely(fn () => $this->googleNewsRss($query, $edition)), $region, 'article');
            }

            // YouTube
            $saved += $this->store($this->safely(fn () => $this->youtube($query)), $region, 'video');
        }

        foreach (config('news.language_queries') as $lq) {
            $saved += $this->store($this->safely(fn () => $this->googleNewsRss($lq['q'], $lq)), $lq['region'], 'article');
        }

        foreach (config('news.rss_feeds') as $feedUrl) {
            $saved += $this->store($this->safely(fn () => $this->rssFeed($feedUrl, true)), 'global', 'article');
        }

        $saved += $this->store($this->safely(fn () => $this->mastodon()), 'global', 'social');
        $saved += $this->store($this->safely(fn () => $this->reddit()), 'global', 'social');

        $this->fillMissingImages();

        return $saved;
    }

    private function http(): PendingRequest
    {
        return Http::timeout(15)->withUserAgent(config('news.user_agent'));
    }

    private function safely(callable $fn): array
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            Log::warning('News source failed: ' . $e->getMessage());
            return [];
        }
    }

    /* ---------------------------------------------------------------- sources */

    private function gdelt(string $region): array
    {
        $query = config("news.gdelt.$region");
        if (! $query) return [];

        $res = $this->http()->get('https://api.gdeltproject.org/api/v2/doc/doc', [
            'query' => $query, 'mode' => 'artlist', 'format' => 'json', 'maxrecords' => 75,
            'sort' => 'datedesc', 'timespan' => config('news.gdelt_timespan'),
        ])->throw()->json();

        return collect($res['articles'] ?? [])->map(fn ($a) => [
            'title'        => $a['title'],
            'url'          => $a['url'],
            'image_url'    => $a['socialimage'] ?? null,
            'source_name'  => $a['domain'] ?? null,
            'published_at' => $this->parseDate($a['seendate'] ?? null, 'Ymd\THis\Z'),
        ])->all();
    }

    private function gnews(string $query): array
    {
        $key = config('news.gnews_key');
        if (! $key) return [];

        $res = $this->http()->get('https://gnews.io/api/v4/search', [
            'q' => $query, 'lang' => 'en', 'max' => 10, 'sortby' => 'publishedAt', 'apikey' => $key,
        ])->throw()->json();

        return collect($res['articles'] ?? [])->map(fn ($a) => [
            'title'        => $a['title'],
            'description'  => $a['description'] ?? null,
            'url'          => $a['url'],
            'image_url'    => $a['image'] ?? null,
            'source_name'  => $a['source']['name'] ?? null,
            'published_at' => $this->parseDate($a['publishedAt'] ?? null),
        ])->all();
    }

    private function googleNewsRss(string $query, array $edition): array
    {
        $xml = $this->http()->get('https://news.google.com/rss/search', [
            'q' => $query, 'hl' => $edition['hl'], 'gl' => $edition['gl'], 'ceid' => $edition['ceid'],
        ])->throw()->body();

        return $this->parseRss($xml, false);
    }

    private function rssFeed(string $url, bool $filter): array
    {
        return $this->parseRss($this->http()->get($url)->throw()->body(), $filter);
    }

    /** Reads RSS 2.0 and Atom. $filter keeps only items that mention sandbox/drone-airspace keywords. */
    private function parseRss(string $xml, bool $filter): array
    {
        $feed = @simplexml_load_string($xml);
        if (! $feed) return [];

        $out = [];
        $entries = $feed->channel->item ?? $feed->entry ?? [];

        foreach ($entries as $i) {
            $link = (string) ($i->link['href'] ?? $i->link);
            $title = trim((string) $i->title);
            $desc = trim(strip_tags((string) ($i->description ?? $i->summary ?? '')));
            if (! $link || ! $title) continue;
            if ($filter && ! $this->isRelevant($title . ' ' . $desc)) continue;

            $image = null;
            $media = $i->children('http://search.yahoo.com/mrss/');
            if (isset($media->content)) $image = (string) $media->content->attributes()['url'];
            elseif (isset($media->thumbnail)) $image = (string) $media->thumbnail->attributes()['url'];
            elseif (isset($i->enclosure) && str_starts_with((string) $i->enclosure['type'], 'image')) $image = (string) $i->enclosure['url'];

            $out[] = [
                'title'        => $title,
                'description'  => $desc ?: null,
                'url'          => $link,
                'image_url'    => $image ?: null,
                'source_name'  => (string) ($i->source ?? parse_url($link, PHP_URL_HOST)),
                'published_at' => $this->parseDate((string) ($i->pubDate ?? $i->published ?? $i->updated ?? '')),
            ];
        }

        return array_slice($out, 0, 30);
    }

    private function youtube(string $query): array
    {
        $key = config('news.youtube_key');
        if (! $key) return [];

        $res = $this->http()->get('https://www.googleapis.com/youtube/v3/search', [
            'part' => 'snippet', 'type' => 'video', 'order' => 'date',
            'maxResults' => 15, 'q' => $query, 'key' => $key,
        ])->throw()->json();

        return collect($res['items'] ?? [])->map(fn ($v) => [
            'title'        => html_entity_decode($v['snippet']['title']),
            'description'  => $v['snippet']['description'] ?? null,
            'url'          => 'https://www.youtube.com/watch?v=' . $v['id']['videoId'],
            'video_id'     => $v['id']['videoId'],
            'image_url'    => $v['snippet']['thumbnails']['high']['url'] ?? null,
            'source_name'  => 'YouTube · ' . ($v['snippet']['channelTitle'] ?? ''),
            'published_at' => $this->parseDate($v['snippet']['publishedAt'] ?? null),
        ])->all();
    }

    private function mastodon(): array
    {
        $out = [];
        $base = rtrim(config('news.mastodon_instance'), '/');

        foreach (config('news.mastodon_tags') as $tag) {
            $posts = $this->http()->get("$base/api/v1/timelines/tag/$tag", ['limit' => 40])->throw()->json();

            foreach ($posts as $p) {
                $text = trim(html_entity_decode(strip_tags($p['content'] ?? '')));
                if (! $this->isRelevant($text)) continue;

                $out[] = [
                    'title'        => Str::limit($text, 140),
                    'description'  => Str::limit($text, 400),
                    'url'          => $p['url'],
                    'image_url'    => $p['media_attachments'][0]['preview_url'] ?? null,
                    'source_name'  => 'Mastodon · @' . ($p['account']['acct'] ?? ''),
                    'published_at' => $this->parseDate($p['created_at'] ?? null),
                ];
            }
        }

        return $out;
    }

    private function reddit(): array
    {
        $res = $this->http()->get('https://www.reddit.com/search.json', [
            'q' => config('news.reddit_query'), 'sort' => 'new', 'limit' => 25, 't' => 'year',
        ])->throw()->json();

        return collect($res['data']['children'] ?? [])->map(function ($c) {
            $d = $c['data'];
            $img = $d['preview']['images'][0]['source']['url'] ?? null;
            return [
                'title'        => $d['title'],
                'description'  => Str::limit($d['selftext'] ?? '', 400) ?: null,
                'url'          => 'https://www.reddit.com' . $d['permalink'],
                'image_url'    => $img ? html_entity_decode($img) : null,
                'source_name'  => 'Reddit · ' . ($d['subreddit_name_prefixed'] ?? ''),
                'published_at' => isset($d['created_utc']) ? Carbon::createFromTimestamp($d['created_utc']) : now(),
            ];
        })->all();
    }

    /* ---------------------------------------------------------------- storing */

    private function store(array $items, string $searchRegion, string $type): int
    {
        $count = 0;

        foreach ($items as $item) {
            if (empty($item['url']) || empty($item['title'])) continue;

            $hash = sha1($item['url']);
            $title = Str::limit(trim($item['title']), 250, '');

            // The same story often appears in several countries' feeds under different links.
            $exists = NewsItem::where('url_hash', $hash)->exists();
            if (! $exists && NewsItem::where('title', $title)->exists()) continue;

            $text = $title . ' ' . ($item['description'] ?? '');
            $isPerlis = $this->mentionsPerlis($text);
            $region = $isPerlis ? 'perlis' : ($searchRegion === 'perlis' ? 'malaysia' : $searchRegion);

            NewsItem::updateOrCreate(
                ['url_hash' => $hash],
                [
                    'type'         => $type,
                    'title'        => $title,
                    'description'  => isset($item['description']) ? Str::limit(strip_tags($item['description']), 400) : null,
                    'url'          => $item['url'],
                    'image_url'    => $item['image_url'] ?? null,
                    'video_id'     => $item['video_id'] ?? null,
                    'source_name'  => $item['source_name'] ?? null,
                    'region'       => $region,
                    'is_featured'  => $isPerlis,
                    'published_at' => $item['published_at'] ?? now(),
                ]
            );
            $count++;
        }

        return $count;
    }

    /* ----------------------------------------------------------------- images */

    /**
     * For articles with no image, read the page's own preview image (og:image).
     * Only the image link is saved; the picture stays on the publisher's server.
     */
    private function fillMissingImages(int $limit = 40): void
    {
        $items = NewsItem::where('type', 'article')
            ->whereNull('image_url')
            ->where('url', 'not like', '%news.google.com%')
            ->where('created_at', '>=', now()->subDay())
            ->limit($limit)
            ->get();

        foreach ($items as $item) {
            try {
                $res = Http::timeout(6)->withUserAgent(config('news.user_agent'))->get($item->url);
                if (! $res->ok()) continue;

                $html = substr($res->body(), 0, 200000);
                $found = preg_match('/<meta[^>]+(?:property|name)=["\']og:image["\'][^>]+content=["\']([^"\']+)/i', $html, $m)
                    || preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']og:image/i', $html, $m);

                if ($found) {
                    $img = html_entity_decode($m[1]);
                    if (str_starts_with($img, '//')) $img = 'https:' . $img;
                    if (str_starts_with($img, 'http')) $item->update(['image_url' => $img]);
                }
            } catch (\Throwable $e) {
                // skip: some sites block or time out
            }
        }
    }

    /* ---------------------------------------------------------------- helpers */

    private function parseDate(?string $value, ?string $format = null): Carbon
    {
        try {
            if (! $value) return now();
            return $format ? Carbon::createFromFormat($format, $value, 'UTC') : Carbon::parse($value);
        } catch (\Throwable $e) {
            return now();
        }
    }

    private function mentionsPerlis(string $text): bool
    {
        $text = Str::lower($text);
        foreach (config('news.perlis_keywords') as $word) {
            if (str_contains($text, $word)) return true;
        }
        return false;
    }

    private function isRelevant(string $text): bool
    {
        $text = Str::lower($text);
        foreach (config('news.relevance_keywords') as $word) {
            if (str_contains($text, $word)) return true;
        }
        return false;
    }
}
