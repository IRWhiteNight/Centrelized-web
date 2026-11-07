<?php

/*
|--------------------------------------------------------------------------
| COE-UAS website routes   (save as routes/COEUASweb.php)
|--------------------------------------------------------------------------
| Built from "COEUAS Site Map and Use Case".
|
| Load it from routes/web.php:
|     require __DIR__ . '/COEUASweb.php';
| (remove the default '/' welcome route there), or in Laravel 11+ from
| bootstrap/app.php:
|     ->withRouting(web: __DIR__.'/../routes/web.php',
|         then: fn () => Route::middleware('web')->group(base_path('routes/COEUASweb.php')))
|
| Built pages live in resources/js/Pages/COE-UAS/.
| To replace a placeholder: change  stub(...)  to  page('YourPage')  on that route.
*/

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/** A page that exists: renders resources/js/Pages/COE-UAS/{$component}.jsx */
function page(string $component, array $props = []): Closure
{
    return fn (Request $r) => Inertia::render("COE-UAS/$component", $props + [
        'params' => $r->route() ? $r->route()->parameters() : [],
    ]);
}

/** A page not built yet: shows Placeholder.jsx with its title and sibling links */
function stub(string $title, string $group, array $siblings = []): Closure
{
    return fn (Request $r) => Inertia::render('COE-UAS/Placeholder', [
        'title' => $title,
        'group' => $group,
        'params' => $r->route() ? $r->route()->parameters() : [],
        'siblings' => $siblings,
    ]);
}

$sib = fn (array $pairs) => array_map(fn ($t, $h) => ['title' => $t, 'href' => $h], array_keys($pairs), $pairs);

/* ------------------------------ HOME ------------------------------ */
// Later: pass the admin-managed content, e.g. page('Home', ['content' => HomeContent::get()])
Route::get('/', page('Home'))->name('home');

/* ------------------------------ ABOUT ----------------------------- */
Route::prefix('about')->name('about.')->group(function () use ($sib) {
    $g = 'About';
    $s = $sib([
        'About COE-UAS' => '/about', 'History & Milestones' => '/about/history',
        'Organisation & Leadership' => '/about/organisation', 'Strategy & Development' => '/about/strategy',
        'Awards & Recognition' => '/about/awards',
    ]);
    Route::get('/', stub('About COE-UAS', $g, $s))->name('index');                 // background, vision, mission, direction
    Route::get('history', stub('History & Milestones', $g, $s))->name('history');   // 2013 to 2026 timeline
    Route::get('organisation', stub('Organisation & Leadership', $g, $s))->name('organisation');
    Route::get('strategy', stub('Strategy & Development', $g, $s))->name('strategy');
    Route::get('awards', stub('Awards & Recognition', $g, $s))->name('awards');
});

/* ------------------------------ PEOPLE ---------------------------- */
Route::prefix('people')->name('people.')->group(function () use ($sib) {
    $g = 'People';
    $s = $sib(['Member Directory' => '/people', 'Postdoctoral Researchers' => '/people/postdoctoral', 'Postgraduate Students' => '/people/postgraduates']);
    Route::get('/', stub('Member Directory', $g, $s))->name('index');               // filter: ?category=leadership|research-fellows|...
    Route::get('postdoctoral', stub('Postdoctoral Researchers', $g, $s))->name('postdoctoral');
    Route::get('postgraduates', stub('Postgraduate Students', $g, $s))->name('postgraduates');

    // Individual member profile: overview + 12 tabs
    Route::prefix('member/{memberId}')->name('member.')->group(function () {
        $g = 'Member Profile';
        Route::get('/', stub('Member Overview', $g))->name('overview');
        Route::get('postgraduate-students', stub('Postgraduate Students', $g))->name('postgraduates');
        Route::get('research-grants', stub('Research Grants', $g))->name('grants');
        Route::get('awards', stub('Awards', $g))->name('awards');
        Route::get('journal-articles', stub('Journal Articles', $g))->name('journals');
        Route::get('conference-papers', stub('Conference Proceedings & Papers', $g))->name('conferences');
        Route::get('citations', stub('Citations & Research Impact', $g))->name('citations');
        Route::get('books-publications', stub('Books & Other Publications', $g))->name('books');
        Route::get('postdoctoral-research', stub('Postdoctoral Research', $g))->name('postdoctoral');
        Route::get('memberships', stub('Membership & Professional Roles', $g))->name('memberships');
        Route::get('innovation', stub('Innovation', $g))->name('innovation');
        Route::get('joint-projects', stub('Joint Research Projects', $g))->name('joint');
        Route::get('networking', stub('Networking & Linkages', $g))->name('networking');
    });
});

/* ------------------------ RESEARCH & INNOVATION ------------------- */
Route::prefix('research')->name('research.')->group(function () use ($sib) {
    $g = 'Research & Innovation';
    $s = $sib([
        'Research Areas & Groups' => '/research', 'Research Projects' => '/research/projects',
        'Research Grants' => '/research/grants', 'Innovation & IP' => '/research/innovation',
        'Research Opportunities' => '/research/opportunities', 'Featured Programmes' => '/research/programmes',
    ]);
    Route::get('/', stub('Research Areas & Groups', $g, $s))->name('index');
    Route::get('groups/{groupId}', stub('Research Group', $g, $s))->name('group');
    Route::get('projects', stub('Research Projects', $g, $s))->name('projects');     // ?status=ongoing|completed|joint|industry
    Route::get('grants', stub('Research Grants', $g, $s))->name('grants');
    Route::get('innovation', stub('Innovation & Intellectual Property', $g, $s))->name('innovation');
    Route::get('opportunities', stub('Research Opportunities', $g, $s))->name('opportunities');
    Route::get('programmes', stub('Featured Programmes', $g, $s))->name('programmes');
    Route::get('programmes/perlis-airspace-sandbox', stub('Perlis Airspace Sandbox', $g, $s))->name('sandbox');
});

/* ---------------------- PUBLICATIONS & IMPACT --------------------- */
Route::prefix('publications')->name('publications.')->group(function () use ($sib) {
    $g = 'Publications & Impact';
    $s = $sib([
        'Journal Articles' => '/publications', 'Conference Papers' => '/publications/conferences',
        'Books & Chapters' => '/publications/books', 'Other Publications' => '/publications/other',
        'Citations & Impact' => '/publications/citations', 'Annual Highlights' => '/publications/highlights',
    ]);
    Route::get('/', stub('Journal Articles', $g, $s))->name('journals');
    Route::get('conferences', stub('Conference Proceedings & Papers', $g, $s))->name('conferences');
    Route::get('books', stub('Books & Book Chapters', $g, $s))->name('books');
    Route::get('other', stub('Other Publications', $g, $s))->name('other');
    Route::get('citations', stub('Citations & Research Impact', $g, $s))->name('citations');
    Route::get('highlights', stub('Annual Research Highlights', $g, $s))->name('highlights');
});

/* ----------------------- FACILITIES & SERVICES -------------------- */
Route::prefix('facilities')->name('facilities.')->group(function () use ($sib) {
    $g = 'Facilities & Services';
    $s = $sib([
        'Facilities & Equipment' => '/facilities', 'Engineering & Technical Services' => '/facilities/services',
        'Industry Solutions' => '/facilities/solutions', 'Training' => '/facilities/training',
    ]);
    Route::get('/', stub('Facilities & Equipment', $g, $s))->name('index');
    Route::get('services', stub('Engineering & Technical Services', $g, $s))->name('services');
    Route::get('solutions', stub('Industry Solutions & Case Studies', $g, $s))->name('solutions');
    Route::get('solutions/{caseId}', stub('Case Study', $g, $s))->name('case');
    Route::get('training', stub('Training & Professional Development', $g, $s))->name('training');
    Route::get('training/calendar', stub('Training Calendar', $g, $s))->name('calendar');
});

/* ----------------------------- ENGAGEMENT ------------------------- */
Route::prefix('engagement')->name('engagement.')->group(function () use ($sib) {
    $g = 'Engagement';
    $s = $sib([
        'Networking & Linkages' => '/engagement', 'Membership & Affiliations' => '/engagement/membership',
        'News & Activities' => '/engagement/news', 'Media Gallery' => '/engagement/media',
        'Collaborate with Us' => '/engagement/collaborate',
    ]);
    Route::get('/', stub('Networking & Linkages', $g, $s))->name('index');
    Route::get('membership', stub('Membership & Affiliations', $g, $s))->name('membership');
    Route::get('news', stub('News & Activities', $g, $s))->name('news');
    Route::get('news/{newsId}', stub('News Article', $g, $s))->name('news.show');
    Route::get('media', stub('Media Gallery', $g, $s))->name('media');
    Route::get('collaborate', stub('Collaborate with Us', $g, $s))->name('collaborate');
});

/* ------------------------------ ARCHIVE --------------------------- */
// Filters via query string: ?year=2013..2026 &member= &group= &category= &status=ongoing|completed|proposed
Route::get('archive', stub('Content Directory (2013 to 2026)', 'Archive'))->name('archive');

/* ------------------------------ CONTACT --------------------------- */
Route::prefix('contact')->name('contact.')->group(function () {
    Route::get('/', stub('Contact', 'Contact'))->name('index');                      // details, location, office information
    Route::get('{type}', stub('Enquiry Form', 'Contact'))
        ->where('type', 'general|research|training')->name('form');
    // Later: Route::post('{type}', [ContactController::class, 'store'])->name('submit');
});
