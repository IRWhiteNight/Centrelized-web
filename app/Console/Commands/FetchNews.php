<?php
// Save as: app/Console/Commands/FetchNews.php
namespace App\Console\Commands;

use App\Services\NewsAggregator;
use Illuminate\Console\Command;

class FetchNews extends Command
{
    protected $signature   = 'news:fetch';
    protected $description = 'Collect sandbox news, images and videos from external sources';

    public function handle(NewsAggregator $aggregator): int
    {
        $this->info('Fetching... ' . $aggregator->fetchAll() . ' items saved or updated.');
        return self::SUCCESS;
    }
}
