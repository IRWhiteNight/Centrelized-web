<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NewsController;

Route::get('/', fn () => Inertia::render('PSB/Home'))->name('home');
Route::get('/about/company', fn () => Inertia::render('PSB/About/Company'))->name('about.company');
Route::get('/api/news', [NewsController::class, 'index']);

Route::get('/about', fn () => Inertia::render('PSB/About'))->name('about');
Route::get('/innovation', fn () => Inertia::render('PSB/Innovation'))->name('innovation');
Route::get('/opportunities', fn () => Inertia::render('PSB/Opportunities'))->name('opportunities');
Route::get('/services', fn () => Inertia::render('PSB/Services'))->name('services');
Route::get('/siteinfo', fn () => Inertia::render('PSB/SiteInfo'))->name('siteinfo');
Route::get('/media', fn () => Inertia::render('PSB/MediaCentre'))->name('media');
Route::get('/contact', fn () => Inertia::render('PSB/Contact'))->name('contact');
Route::get('/FAQ', fn () => Inertia::render('PSB/FAQ'))->name('FAQ');
Route::get('/apply', fn () => Inertia::render('PSB/Apply'))->name('apply');



Route::get('/coeuas/home', fn () => Inertia::render('COE-UAS/Home'))->name('home');

Route::get('/coeuas/about', fn () => Inertia::render('COE-UAS/About'))->name('about');
Route::get('/coeuas/people', fn () => Inertia::render('COE-UAS/People'))->name('people');
Route::get('/coeuas/research', fn () => Inertia::render('COE-UAS/Research'))->name('research');

Route::get('/coeuas/publications', fn () => Inertia::render('COE-UAS/Publications'))->name('publications');
Route::get('/coeuas/facilities', fn () => Inertia::render('COE-UAS/Facilities'))->name('facilities');
Route::get('/coeuas/engagement', fn () => Inertia::render('COE-UAS/Engagement'))->name('engagement');
Route::get('/coeuas/collaborate', fn () => Inertia::render('COE-UAS/Collaborate'))->name('collaborate');
Route::get('/coeuas/contact', fn () => Inertia::render('COE-UAS/Contact'))->name('contact');





Route::get('/admin/login', function () {
    return Inertia::render('admin-auth/AdminLogin');
})->name('admin.login');





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



// ADMIN PSB DASHBOARD
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

Route::get('/admin/psb/services/{section?}', fn ($section = 'ways') =>
    Inertia::render('admin-PSB/AdminPSBServices', ['section' => $section])
)->where('section', 'ways|testing-areas|programmes|how-to-participate|benefits');

Route::get('/admin/psb/media-centre/{section?}', fn ($section = 'news') =>
    Inertia::render('admin-PSB/AdminPSBMediaCentre', ['section' => $section])
)->where('section', 'news|press-releases|events|gallery|articles');

Route::get('/admin/psb/site-information/{section?}', fn ($section = 'location') =>
    Inertia::render('admin-PSB/AdminPSBSiteInformation', ['section' => $section])
)->where('section', 'location|facilities|airspace|weather|downloads');

Route::get('/admin/psb/faq/{section?}', function ($section = 'categories') {
    return Inertia::render('admin-PSB/AdminPSBFAQ', [
        'section' => $section,
    ]);
})->where('section', 'categories|questions');

Route::get('/admin/psb/contact/{section?}', fn ($section = 'persons') =>
    Inertia::render('admin-PSB/ContactandEnquaries', ['section' => $section])
)->where('section', 'persons|details|enquiries|applications|subscribers');

Route::prefix('admin/psb/applications')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin-PSB/AdminApplication');
    });
});

Route::prefix('admin/psb/subscribers')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin-PSB/AdminSubscribers');
    });
});

Route::prefix('admin/psb/media-library')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin-PSB/AdminMediaLibrary');
    });
});

Route::get('/admin/psb/settings/{section?}', fn ($section = 'navigation') =>
    Inertia::render('admin-PSB/AdminNavigationandSettings', ['section' => $section])
)->where('section', 'navigation|footer|airspace|branding');


Route::get('/admin/psb/account/{section?}', fn ($section = 'account') =>
    Inertia::render('admin-PSB/AdminAccount', ['section' => $section])
)->where('section', 'account|activity');
// Add your POST login route when your authentication controller is ready.




// ADMIN COE-UAS DASHBOARD
Route::prefix('admin/coeuas')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin-COEUAS/AdminCOEUASDashboard');
    });
});


// /admin/coeuas/home  ->  first section
Route::redirect('/admin/coeuas/home', '/admin/coeuas/home/banner');

Route::get('/admin/coeuas/home/{section}', fn ($section) =>
    Inertia::render('admin-COEUAS/AdminCOEUASHome', ['section' => $section])   // folder is admin-COEUAS, not admin-PSB
)->where('section', 'banner|research-focus|featured|highlights|news');         // 'banner' was missing before

Route::get('/admin/coeuas/about/{section}', fn ($section) =>
    Inertia::render('admin-COEUAS/AdminCOEUASAbout', ['section' => $section])   // folder is admin-COEUAS, not admin-PSB
)->where('section', 'overview|history|organisation|strategy|awards');         // 'banner' was missing before


Route::get('/admin/coeuas/people/{section}', fn ($section) =>
    Inertia::render('admin-COEUAS/AdminCOEUASPeople', ['section' => $section])   // folder is admin-COEUAS, not admin-PSB
)->where('section', 'members|profiles|postdoctoral|postgraduate');

Route::get('/admin/coeuas/research/{section}', fn ($section) =>
    Inertia::render('admin-COEUAS/AdminCOEUASInnovation', ['section' => $section])   // folder is admin-COEUAS, not admin-PSB
)->where('section', 'groups|projects|grants|innovation|opportunities|featured-programmes');

Route::get('/admin/coeuas/publications/{section?}', fn ($section = 'publications') =>
    Inertia::render('admin-COEUAS/AdminCOEUASPublication', ['section' => $section])
)->where('section', 'publications|authors|import|citations|highlights');

Route::get('/admin/coeuas/facilities/{section?}', fn ($section = 'equipment') =>
    Inertia::render('admin-COEUAS/AdminCOEUASFacilitiesandServices', ['section' => $section])
)->where('section', 'equipment|services|solutions|training');

Route::get('/admin/coeuas/engagement/{section?}', fn ($section = 'linkages') =>
    Inertia::render('admin-COEUAS/AdminCOEUASEngagement', ['section' => $section])
)->where('section', 'linkages|affiliations|news|gallery|documents');

Route::get('/admin/coeuas/contact/{section?}', fn ($section = 'details') =>
    Inertia::render('admin-COEUAS/AdminCOEUASContactandEnquaries', ['section' => $section])
)->where('section', 'details|enquiries');

// COE-UAS DASHBOARD
Route::get('/admin/coeuas/taxonomy', fn () =>
    Inertia::render('admin-COEUAS/AdminCOEUASArchiveTaxonomy')
);

Route::get('/admin/coeuas/media', fn () =>
    Inertia::render('admin-COEUAS/AdminCOEUASMedia')
);

Route::get('/admin/coeuas/settings/{section?}', fn ($section = 'menus') =>
    Inertia::render('admin-COEUAS/AdminCOEUASNavigationandSettings', ['section' => $section])
)->where('section', 'menus|site|featured-items');

Route::get('/admin/coeuas/account', fn () =>
    Inertia::render('admin-COEUAS/AdminCOEUASAccount')
);

Route::get('/admin/coeuas/activity', fn () =>
    Inertia::render('admin-COEUAS/AdminCOEUASLog')
);



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
