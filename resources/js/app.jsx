
import '../css/app.css';
import '../css/theme.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './Contexts/ThemeContext';

import MainLayout from './Layouts/MainLayout';
import AdminLayout from './Layouts/AdminLayout';
import PSBLayout from './Layouts/PSBLayout';
import COEUASLayout from './Layouts/COEUASLayout';

/* -------------------------------------------------- */
/* PAGE REGISTRY                                      */
/* -------------------------------------------------- */

const pages = import.meta.glob('./Pages/**/*.jsx', {
    eager: true,
});

/* -------------------------------------------------- */
/* PAGE ALIASES                                       */
/* -------------------------------------------------- */

const PAGE_ALIASES = {
    'admin/coeuas/Dashboard':
        './Pages/Admin-COEUAS/AdminCOEUASDashboard.jsx',
};

/* -------------------------------------------------- */
/* PAGES WITHOUT LAYOUT                               */
/* -------------------------------------------------- */

const NO_LAYOUT = [
    /login/i,
    /forgot-password/i,
    /reset-password/i,
    /session-expired/i,
    /errors?\//i,
    /vertiport/i,
];

/* -------------------------------------------------- */
/* ADMIN PAGE DETECTION                               */
/* -------------------------------------------------- */

const isAdminPage = (name) => {
    const first = name.split('/')[0].toLowerCase();

    return (
        first.startsWith('admin') ||
        first === 'psb' ||
        first === 'coeuas' ||
        first === 'coe-uas'
    );
};

/* -------------------------------------------------- */
/* LAYOUT SELECTION                                   */
/* -------------------------------------------------- */

function pickLayout(name) {
    if (!isAdminPage(name)) {
        return (content) => (
            <MainLayout>{content}</MainLayout>
        );
    }

    if (NO_LAYOUT.some((pattern) => pattern.test(name))) {
        return (content) => content;
    }

    const key = name.toLowerCase();

    if (/(^|[\/-])psb(\/|-|$)/.test(key)) {
        return (content) => (
            <PSBLayout>{content}</PSBLayout>
        );
    }

    if (/(^|[\/-])coe-?uas(\/|-|$)/.test(key)) {
        return (content) => (
            <COEUASLayout>{content}</COEUASLayout>
        );
    }

    return (content) => (
        <AdminLayout>{content}</AdminLayout>
    );
}

/* -------------------------------------------------- */
/* INERTIA APPLICATION                                */
/* -------------------------------------------------- */

createInertiaApp({
    title: (title) =>
        title
            ? `${title} | Perlis Airspace Sandbox`
            : 'Perlis Airspace Sandbox',

    resolve: (name) => {
        const pagePath =
            PAGE_ALIASES[name] || `./Pages/${name}.jsx`;

        const page = pages[pagePath];

        if (!page) {
            console.error('Page not found:', name);
            console.error('Expected file:', pagePath);
            console.error(
                'Available pages:',
                Object.keys(pages)
            );

            throw new Error(`Page not found: ${name}`);
        }

        if (import.meta.env.DEV) {
            console.info('[inertia page]', name);
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
