import '../css/app.css';
import '../css/theme.css';

import { Component } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './Contexts/ThemeContext';

// PUBLIC WEBSITE LAYOUTS
import MainLayout from './Layouts/MainLayout';                       // PSB public site (default)
import COEUASWebsiteLayout from './Layouts/COEUAsWebsiteLayout';     // COE-UAS public site

// ADMIN LAYOUTS
import AdminLayout from './Layouts/AdminLayout';                     // Super admin
import PSBLayout from './Layouts/PSBLayout';                         // PSB admin
import COEUASLayout from './Layouts/COEUASLayout';                   // COE-UAS admin

/* ==========================================================
   WEBSITE MAP (what each Inertia::render() folder means)

   PSB/...               PSB public website        -> MainLayout (default)
   COE-UAS/...           COE-UAS public website    -> COEUASWebsiteLayout
   admin-PSB/...         PSB admin                 -> PSBLayout
   admin-COEUAS/...      COE-UAS admin             -> COEUASLayout
   admin/... SuperAdmin  Super admin               -> AdminLayout
   admin-auth/...        Login pages               -> no layout

   PAGE CSS
   Every page imports its own .css file (e.g. Home -> psb-home.css,
   About -> about.css). Because the page files are loaded lazily, a page's
   CSS is only downloaded when that page is first visited.

   IMPORTANT: browsers never un-load a stylesheet. After you visit Home and
   then About, BOTH stylesheets are active until a full reload. If two files
   use the same class names (.psb, .p-sec, .p-hud ...) they override each
   other, and the result depends on the order you visited the pages.

   To stop that, this file stamps two attributes on <html> on every
   navigation, so each page CSS can be scoped to its own page:

     <html data-site="psb" data-page="psb/about">

   data-site : psb | coeuas | admin-psb | admin-coeuas | super-admin | auth
   data-page : the Inertia page name, lower-case  (psb/home, psb/about,
               coe-uas/about, admin-psb/adminpsbhome ...)

   Example, in about.css:   [data-page="psb/about"] .p-sec { ... }
========================================================== */

/* ==========================================================
   PAGE REGISTRY
   Lazy: each page is its own chunk (its CSS comes with it).
   - public visitors never download admin code or admin CSS
   - one broken admin page cannot break the public website
========================================================== */

const pages = import.meta.glob('./Pages/**/*.jsx');

// lower-case index so a wrong folder/file case (works on Windows, fails on Linux servers) still resolves
const pageIndex = new Map(Object.keys(pages).map((key) => [key.toLowerCase(), key]));

const resolvePagePath = (name) => {
    const clean = String(name)
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '')
        .replace(/\.jsx$/i, '');

    const candidates = [`./Pages/${clean}.jsx`, `./Pages/${clean}/index.jsx`];

    for (const path of candidates) {
        if (pages[path]) return path;
    }

    for (const path of candidates) {
        const match = pageIndex.get(path.toLowerCase());
        if (match) {
            console.warn(
                `[Inertia] Page "${name}" matched "${match}" only by ignoring letter case. ` +
                'Rename the file/folder (or the Inertia::render name) so they match exactly, ' +
                'otherwise it will break on a Linux server.'
            );
            return match;
        }
    }

    return null;
};

/* ==========================================================
   LAYOUT + SITE RULES  (first match wins, top to bottom)
   Names are compared lower-case with forward slashes.
========================================================== */

const withLayout = (Layout) => (page) => <Layout>{page}</Layout>;
const noLayout = (page) => page;

const LAYOUT_RULES = [
    // 1. Pages without any layout
    {
        site: 'auth',
        test: /(^admin-auth\/|login|forgot-?password|reset-?password|session-expired|(^|\/)errors?\/|vertiport)/,
        layout: noLayout,
    },
    // 2. COE-UAS public website
    { site: 'coeuas', test: /^(coe-uas|coeuas)\//, layout: withLayout(COEUASWebsiteLayout) },
    // 3. PSB admin (must stay above the generic admin rule)
    { site: 'admin-psb', test: /^admin-psb\//, layout: withLayout(PSBLayout) },
    // 4. COE-UAS admin (must stay above the generic admin rule)
    { site: 'admin-coeuas', test: /^admin-coeuas\//, layout: withLayout(COEUASLayout) },
    // 5. Super admin: admin/..., SuperAdmin, and any other admin-xxx/ folder
    { site: 'super-admin', test: /^(admin|superadmin)(\/|$)|^admin-[^/]+\//, layout: withLayout(AdminLayout) },
];

// 6. Everything else is the PSB public website
const DEFAULT_RULE = { site: 'psb', layout: withLayout(MainLayout) };

const normalisePageName = (name) =>
    String(name).replace(/\\/g, '/').replace(/\.jsx$/i, '').toLowerCase();

const ruleFor = (name) =>
    LAYOUT_RULES.find((r) => r.test.test(normalisePageName(name))) ?? DEFAULT_RULE;

/* stamp <html data-site data-page> so page CSS can be scoped (see PAGE CSS above) */
const markPage = (name) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.site = ruleFor(name).site;
    root.dataset.page = normalisePageName(name);
};

/* ==========================================================
   ERROR BOUNDARY
   If one page crashes while rendering, show a clear message
   instead of a blank white screen.
========================================================== */

class AppErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('[App crashed]', error, info?.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div
                role="alert"
                style={{
                    minHeight: '100vh', display: 'grid', placeContent: 'center', gap: 16, padding: 24,
                    textAlign: 'center', background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif',
                }}
            >
                <h1 style={{ margin: 0, fontSize: 28 }}>Something went wrong</h1>
                <p style={{ margin: 0, color: 'rgba(255,255,255,.7)' }}>This page could not be displayed.</p>
                {import.meta.env.DEV && (
                    <pre style={{ margin: 0, maxWidth: 720, overflow: 'auto', textAlign: 'left', color: '#FFD60A', fontSize: 13 }}>
                        {String(this.state.error?.stack || this.state.error)}
                    </pre>
                )}
                <div>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        style={{ padding: '12px 28px', border: 0, borderRadius: 999, background: '#FFD60A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Reload page
                    </button>
                </div>
            </div>
        );
    }
}

/* ==========================================================
   INERTIA APPLICATION
========================================================== */

createInertiaApp({
    title: (title) =>
        title ? `${title} | Perlis Airspace Sandbox` : 'Perlis Airspace Sandbox',

    progress: { color: '#FFD60A' },

    resolve: async (name) => {
        const path = resolvePagePath(name);

        if (!path) {
            console.error(`[Inertia] Page not found: "${name}"`);
            console.error(`[Inertia] Expected file: ./Pages/${name}.jsx`);
            if (import.meta.env.DEV) console.error('[Inertia] Available pages:', Object.keys(pages));
            throw new Error(`Page not found: ${name}`);
        }

        // loading the module also loads that page's own .css
        const module = await pages[path]();
        const Page = module.default;

        if (!Page) {
            throw new Error(`Page "${name}" has no default export (${path}).`);
        }

        // a page can still set its own layout (Page.layout = ...); otherwise pick automatically
        Page.layout = Page.layout ?? ruleFor(name).layout;

        // runs right before the page is shown (first visit, links and browser back/forward)
        markPage(name);

        return module;
    },

    setup({ el, App, props }) {
        createRoot(el).render(
            <AppErrorBoundary>
                <ThemeProvider>
                    <App {...props} />
                </ThemeProvider>
            </AppErrorBoundary>
        );
    },
});
