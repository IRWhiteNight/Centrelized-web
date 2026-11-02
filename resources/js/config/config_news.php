<?php
// Save as: config/news.php
return [
    'gnews_key'   => env('GNEWS_API_KEY'),     // https://gnews.io  (free tier available)
    'youtube_key' => env('YOUTUBE_API_KEY'),   // Google Cloud Console > YouTube Data API v3

    // One search per region. Edit these to widen or narrow what the site collects.
    'queries' => [
        'perlis'   => '"Perlis Airspace Sandbox" OR "UniMAP" drone OR "Perlis" vertiport OR "Perlis" drone',
        'malaysia' => 'Malaysia drone OR "advanced air mobility" Malaysia OR "urban air mobility" Malaysia',
        'global'   => '"airspace sandbox" OR "drone sandbox" OR "BVLOS" sandbox OR "UTM" sandbox OR "low altitude economy"',
    ],

    // Any item containing one of these words is tagged "perlis" and highlighted.
    'perlis_keywords' => ['perlis', 'unimap', 'coe-uas', 'vertiport malaysia', 'sungai batu pahat'],
];
