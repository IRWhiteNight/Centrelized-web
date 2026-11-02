<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class NewsController extends Controller
{
    private const CACHE_KEY = 'psb-news-v3'; // new key so old cached data is ignored
    private const FIRST_YEAR = 2023;
    private const TOPIC = '/perlis|sandbox|vertiport|unimap|coe-uas|hazry/i';

    public function index()
    {
        $items = Cache::get(self::CACHE_KEY);

        if ($items === null) {
            try {
                $items = $this->fetch();
            } catch (\Throwable $e) {
                report($e);
                $items = [];
            }

            if ($items) {
                Cache::put(self::CACHE_KEY, $items, now()->addHours(6));
            }
        }

        return response()->json($items);
    }

    private static function norm(string $title): string
    {
        return mb_strtolower(preg_replace('/\W+/u', '', $title));
    }

    private function fetch(): array
    {
        $out = [];

        // 1. Google News RSS: widest coverage and the longest history, no images
        foreach ($this->fetchRss() as $row) {
            $out[self::norm($row['title'])] ??= $row;
        }

        // 2. GNews API: adds images and the real article link
        foreach ($this->fetchGnews() as $row) {
            $key = self::norm($row['title']);

            if (isset($out[$key])) {
                // Same article found by both: keep RSS data, add the image
                // and swap the Google redirect for the real link
                $out[$key]['image'] ??= $row['image'];
                $out[$key]['url'] = $row['url'];
            } else {
                $out[$key] = $row;
            }
        }

        $out = array_values($out);
        usort($out, fn ($a, $b) => strcmp($b['date'], $a['date']));

        return array_slice($out, 0, 80);
    }

    /* ---------- Google News RSS ---------- */

    private function rssQueries(): array
    {
        $queries = [
            '"Perlis Airspace Sandbox"',
            '"Air Space Sandbox" Perlis',
            '"Airspace Sandbox" Perlis dron',
            '"Sungai Batu Pahat" dron',
            '"Vertiport Malaysia"',
            '"COE-UAS" UniMAP',
            '"Hazry Desa" sandbox',
        ];

        $core = '("Perlis Airspace Sandbox" OR "Air Space Sandbox" OR "Airspace Sandbox") Perlis';
        for ($y = self::FIRST_YEAR; $y <= now()->year; $y++) {
            $queries[] = "$core after:$y-01-01 before:" . ($y + 1) . '-01-01';
        }

        return $queries;
    }

    private function fetchRss(): array
    {
        $queries = $this->rssQueries();

        $responses = Http::pool(function (Pool $pool) use ($queries) {
            foreach ($queries as $i => $q) {
                $pool->as("q$i")->timeout(10)->get('https://news.google.com/rss/search', [
                    'q' => $q, 'hl' => 'en-MY', 'gl' => 'MY', 'ceid' => 'MY:en',
                ]);
            }
        });

        libxml_use_internal_errors(true);
        $rows = [];

        foreach ($responses as $res) {
            if (! $res instanceof Response || ! $res->ok()) continue;

            $xml = simplexml_load_string($res->body());
            if (! $xml) continue;

            foreach ($xml->channel->item ?? [] as $item) {
                $source = (string) $item->source;
                $title  = html_entity_decode((string) $item->title);

                if ($source !== '' && str_ends_with($title, " - $source")) {
                    $title = substr($title, 0, -strlen(" - $source"));
                }

                if (! preg_match(self::TOPIC, $title)) continue;

                $rows[] = [
                    'title'  => $title,
                    'url'    => (string) $item->link,
                    'source' => $source,
                    'date'   => date('c', strtotime((string) $item->pubDate)),
                    'image'  => null,
                ];
            }
        }

        return $rows;
    }

    /* ---------- GNews API (images) ---------- */

    private function fetchGnews(): array
    {
        $key = config('gnews.key');
        if (! $key) return [];

        $queries = [
            '"Perlis Airspace Sandbox"',
            '("Air Space Sandbox" OR "Airspace Sandbox") AND Perlis',
            '"Vertiport Malaysia"',
        ];

        $rows = [];

        foreach ($queries as $i => $q) {
            if ($i > 0) usleep(1_100_000); // free plan: 1 request per second

            try {
                $res = Http::timeout(10)->get('https://gnews.io/api/v4/search', [
                    'apikey' => $key,
                    'q'      => $q,
                    'max'    => 10,
                    'sortby' => 'publishedAt',
                ]);

                if (! $res->ok()) continue;

                foreach ($res->json('articles') ?? [] as $a) {
                    $title = $a['title'] ?? '';
                    if ($title === '' || ! preg_match(self::TOPIC, $title)) continue;

                    $image = $a['image'] ?? null;

                    $rows[] = [
                        'title'  => $title,
                        'url'    => $a['url'],
                        'source' => $a['source']['name'] ?? '',
                        'date'   => date('c', strtotime($a['publishedAt'] ?? 'now')),
                        'image'  => is_string($image) && str_starts_with($image, 'https://') ? $image : null,
                    ];
                }
            } catch (\Throwable $e) {
                report($e); // one failed query shouldn't break the rest
            }
        }

        return $rows;
    }
}
