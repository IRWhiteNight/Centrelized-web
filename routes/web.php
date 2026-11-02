<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NewsController;

Route::get('/', fn () => Inertia::render('Home'))->name('home');
Route::get('/about/company', fn () => Inertia::render('About/Company'))->name('about.company');
Route::get('/api/news', [NewsController::class, 'index']);

Route::get('/about', fn () => Inertia::render('About'))->name('about');
Route::get('/innovation', fn () => Inertia::render('Innovation'))->name('innovation');
Route::get('/news', fn () => Inertia::render('NewsPage'))->name('news');
Route::get('/opportunities', fn () => Inertia::render('Opportunities'))->name('opportunities');
Route::get('/superadmin', fn () => Inertia::render('SuperAdmin'))->name('superadmin');
Route::get('/super-admin', function () {
    return Inertia::render('admin/SuperAdminDashboard');
})->name('super-admin.dashboard');

Route::get('/admin/super/users', function () {
    return Inertia::render('admin/SuperAdminUser');
})->name('admin.super.users');

Route::get('/admin/super/permission', function () {
    return Inertia::render('admin/SuperAdminRolePermission');
})->name('admin.super.permission');

Route::get('/admin/super/audit-logs', function () {
    return Inertia::render('admin/SuperAdminAuditLogs');
})->name('admin.super.audit-logs');

Route::get('/admin/super/security-events', function () {
    return Inertia::render('admin/SuperAdminSecurityEvents');
})->name('admin.super.security-events');

Route::get('/admin/super/content-trash', function () {
    return Inertia::render('admin/SuperAdminContentTrash');
})->name('admin.super.content-trash');

Route::get('/admin/super/system-settings', function () {
    return Inertia::render('admin/SuperAdminSystemSettings');
})->name('admin.super.system-settings');

Route::get('/admin/super/account', function () {
    return Inertia::render('admin/SuperAdminAccount');
})->name('admin.super.account');



// PSB DASHBOARD
Route::prefix('admin/psb')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin-PSB/AdminPSBDashboard');
    });
});

Route::get('/admin/psb/home/{section?}', fn ($section = 'banner') =>
    Inertia::render('admin-PSB/AdminPSBHome', ['section' => $section])
)->where('section', 'banner|introduction|participants|featured-programmes|news-events|partners-cta');

Route::get('/admin/psb/about/{section?}', fn ($section = 'overview') =>
    Inertia::render('admin-PSB/AdminPSBAbout', ['section' => $section])
)->where('section', 'overview|why-perlis|governance|roadmap|partners');

Route::get('/admin/psb/opportunities/{section?}', fn ($section = 'ways') =>
    Inertia::render('admin-PSB/AdminPSBOpportunities', ['section' => $section])
)->where('section', 'ways|testing-areas|programmes|how-to-participate|benefits');









// COE-UAS DASHBOARD
Route::prefix('admin/coeuas')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin-COEUAS/AdminCOEUASDashboard');
    });
});






Route::get('/api/news-debug', function () {
    $out = [];

    // 1. Can the server reach Google News at all?
    try {
        $res = Http::timeout(10)->get('https://news.google.com/rss/search', [
            'q' => '"Perlis Airspace Sandbox"', 'hl' => 'en-MY', 'gl' => 'MY', 'ceid' => 'MY:en',
        ]);
        $out['rss_status'] = $res->status();
        $out['rss_items']  = substr_count($res->body(), '<item>');
        $out['rss_body']   = substr($res->body(), 0, 200);
    } catch (\Throwable $e) {
        $out['rss_error'] = $e->getMessage();
    }

    // 2. Does the full controller code run without crashing?
    try {
        $c = app(\App\Http\Controllers\NewsController::class);
        $m = new ReflectionMethod($c, 'fetch');
        $m->setAccessible(true);
        $out['fetch_count'] = count($m->invoke($c));
    } catch (\Throwable $e) {
        $out['fetch_error'] = $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine();
    }

    return $out;
});
