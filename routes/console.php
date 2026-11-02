<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


use App\Http\Controllers\NewsController;
Route::get('/news', [NewsController::class, 'index']);

// 2) routes/console.php  (Laravel 11+)  -- refresh every hour
use Illuminate\Support\Facades\Schedule;
Schedule::command('news:fetch')->hourly();
