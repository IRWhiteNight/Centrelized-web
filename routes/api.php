<?php
// 1) routes/api.php
use App\Http\Controllers\NewsController;
Route::get('/news', [NewsController::class, 'index']);

// 2) routes/console.php  (Laravel 11+)  -- refresh every hour
use Illuminate\Support\Facades\Schedule;
Schedule::command('news:fetch')->hourly();

// Laravel 10 or older: put this inside schedule() in app/Console/Kernel.php instead
//   $schedule->command('news:fetch')->hourly();
