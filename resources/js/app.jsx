
import '../css/app.css';
import '../css/theme.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './Contexts/ThemeContext';

// PUBLIC WEBSITE LAYOUTS
import MainLayout from './Layouts/MainLayout';
import COEUASWebsiteLayout from './Layouts/COEUAsWebsiteLayout';

// ADMIN LAYOUTS
import AdminLayout from './Layouts/AdminLayout';
import PSBLayout from './Layouts/PSBLayout';
import COEUASLayout from './Layouts/COEUASLayout';

/* ==========================================================
   PAGE REGISTRY
========================================================== */

const pages = import.meta.glob('./Pages/**/*.jsx', {
    eager: true,
});

/* ==========================================================
   PAGES WITHOUT LAYOUT
========================================================== */

const NO_LAYOUT = [
    /login/i,
    /forgot-password/i,
    /reset-password/i,
    /session-expired/i,
    /errors?\//i,
    /vertiport/i,
];

/* ==========================================================
   NORMALISE PAGE NAME
========================================================== */

const normalisePageName = (name) =>
    name.replace(/\\/g, '/').replace(/\.jsx$/i, '').toLowerCase();

/* ==========================================================
   WEBSITE DETECTION
========================================================== */

// COE-UAS PUBLIC WEBSITE
const isCOEUASWebsite = (name) =>
    /^(coe-uas|coeuas)\//i.test(name);

// ADMIN WEBSITES
const isAdminPage = (name) =>
    /^admin(?:-|\/)/i.test(name);

// PSB ADMIN
const isPSBAdmin = (name) =>
    /^admin-psb\//i.test(name);

// COE-UAS ADMIN
const isCOEUASAdmin = (name) =>
    /^admin-coeuas\//i.test(name);

/* ==========================================================
   LAYOUT SELECTION
========================================================== */

function pickLayout(name) {
    const pageName = normalisePageName(name);

    // 1. Pages without layout
    if (NO_LAYOUT.some((pattern) => pattern.test(pageName))) {
        return (content) => content;
    }

    // 2. COE-UAS PUBLIC WEBSITE
    if (isCOEUASWebsite(pageName)) {
        return (content) => (
            <COEUASWebsiteLayout>
                {content}
            </COEUASWebsiteLayout>
        );
    }

    // 3. PSB ADMIN WEBSITE
    if (isPSBAdmin(pageName)) {
        return (content) => (
            <PSBLayout>
                {content}
            </PSBLayout>
        );
    }

    // 4. COE-UAS ADMIN WEBSITE
    if (isCOEUASAdmin(pageName)) {
        return (content) => (
            <COEUASLayout>
                {content}
            </COEUASLayout>
        );
    }

    // 5. SUPER ADMIN WEBSITE
    if (isAdminPage(pageName)) {
        return (content) => (
            <AdminLayout>
                {content}
            </AdminLayout>
        );
    }

    // 6. PSB PUBLIC WEBSITE (DEFAULT)
    return (content) => (
        <MainLayout>
            {content}
        </MainLayout>
    );
}

/* ==========================================================
   INERTIA APPLICATION
========================================================== */

createInertiaApp({
    title: (title) =>
        title
            ? `${title} | Perlis Airspace Sandbox`
            : 'Perlis Airspace Sandbox',

    resolve: (name) => {
        const pagePath = `./Pages/${name}.jsx`;
        const page = pages[pagePath];

        if (!page) {
            console.error('Page not found:', name);
            console.error('Expected file:', pagePath);
            console.error('Available pages:', Object.keys(pages));
            throw new Error(`Page not found: ${name}`);
        }

        if (import.meta.env.DEV) {
            console.info('[Inertia Page]', name);
            console.info('[Selected Layout]', page.default.layout ? 'Custom Page Layout' : 'Automatic Layout');
        }

        page.default.layout =
            page.default.layout ?? pickLayout(name);

        return page;
    },

    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider>
                <App {...props} />
            </ThemeProvider>
        );
    },
});
