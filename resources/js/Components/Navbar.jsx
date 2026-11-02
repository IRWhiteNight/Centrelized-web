import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import '../../css/navbar.css';
import { useTheme } from '../Contexts/ThemeContext';
import logo2 from '../images/PSB.png';
import vertiport from '../images/vertiport.png';
import uas from '../images/uas.png';

const navItems = [
    { label: 'Home', href: '/' },
    { label: 'The Vision', href: '/about' },
    { label: 'Beyond Flight', href: '/innovation' },
    { label: 'What We Offer', href: '/services' },
    { label: 'Newsroom', href: '/media' },
    { label: 'Help Centre', href: '/faq' },
    { label: 'Work With Us', href: '/contact' },
];

/* Shown in the dropdown under the logo.
   TODO: replace each href with the real website address. */
const platforms = [
    {
        name: 'COE-UAS',
        desc: 'Centre of Excellence for Unmanned Aircraft Systems.',
        href: 'https://example.com/coe-uas',
        logo: uas,
    },
    {
        name: 'Vertiport Malaysia',
        desc: 'Vertiport infrastructure for advanced air mobility.',
        href: 'https://example.com/vertiport-malaysia',
        logo: vertiport,
    },
];

function ThemeIcon({ theme }) {
    return theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
        </svg>
    );
}

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const { url } = usePage();

    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [partnersOpen, setPartnersOpen] = useState(false);

    const brandRef = useRef(null);
    const openedByHover = useRef(false);
    const leaveTimer = useRef(0);

    const path = url.split('?')[0].split('#')[0];
    const isActiveHref = (href) =>
        href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);

    /* ---------- Frosted glass after a little scrolling ---------- */
    useEffect(() => {
        const update = () => setScrolled(window.scrollY > 16);
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);

    /* ---------- Logo dropdown ---------- */
    // Mouse: opens on hover. Touch / keyboard: opens on click or Enter.
    const onBrandEnter = (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(leaveTimer.current);
        openedByHover.current = true;
        setPartnersOpen(true);
    };

    const onBrandLeave = (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(leaveTimer.current);
        leaveTimer.current = setTimeout(() => {
            openedByHover.current = false;
            setPartnersOpen(false);
        }, 140);
    };

    const onBrandClick = () => {
        // A click while hover already opened it should not close it again.
        if (openedByHover.current) return;
        setPartnersOpen((open) => !open);
    };

    useEffect(() => {
        if (!partnersOpen) return undefined;

        const onPointerDown = (e) => {
            if (brandRef.current && !brandRef.current.contains(e.target)) {
                openedByHover.current = false;
                setPartnersOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [partnersOpen]);

    useEffect(() => () => clearTimeout(leaveTimer.current), []);

    /* ---------- Mobile menu + Escape ---------- */
    useEffect(() => {
        setMenuOpen(false);
        setPartnersOpen(false);
    }, [url]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setMenuOpen(false);
                setPartnersOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    const closeMenu = () => setMenuOpen(false);
    const toggleMenu = () => {
        setPartnersOpen(false);
        setMenuOpen((open) => !open);
    };
    const themeLabel = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;

    return (
        <header
            id="navbar"
            data-theme={theme}
            className={`${scrolled ? 'is-scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}
        >
            <nav className="navbar_inner" aria-label="Main navigation">
                {/* Logo: hover or click to see the partner sites */}
                <div
                    ref={brandRef}
                    className={`navbar_brand ${partnersOpen ? 'is-open' : ''}`}
                    onPointerEnter={onBrandEnter}
                    onPointerLeave={onBrandLeave}
                >
                    <button
                        type="button"
                        className="brand_btn"
                        onClick={onBrandClick}
                        aria-expanded={partnersOpen}
                        aria-controls="partner-menu"
                        aria-label="Perlis Airspace Sandbox, show partner sites"
                    >
                        <img src={logo2} className="logo-img" alt="" />
                        <svg className="brand_chevron" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M2.5 4.5 6 8l3.5-3.5" />
                        </svg>
                    </button>

                    <div id="partner-menu" className="partner_menu">
                        {platforms.map((p) => (
                            <a
                                key={p.name}
                                href={p.href}
                                className="partner_item"
                                target="_blank"
                                rel="noopener noreferrer"
                                tabIndex={partnersOpen ? 0 : -1}
                                aria-label={`${p.name}, ${p.desc} (opens in a new tab)`}
                            >
                                <span className="partner_logo">
                                    <img src={p.logo} alt="" />
                                </span>
                                <span className="partner_text">
                                    <span className="partner_name">{p.name}</span>
                                    <span className="partner_desc">{p.desc}</span>
                                </span>
                                <span className="partner_go" aria-hidden="true">↗</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Desktop links */}
                <div className="navbar_links">
                    {navItems.map((item) => {
                        const active = isActiveHref(item.href);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`navbar_link ${active ? 'active' : ''}`}
                                aria-current={active ? 'page' : undefined}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Desktop actions */}
                <div className="navbar_actions">
                    <Link href="/apply" className="navbar_link">
                        Collaboration
                    </Link>

                    <Link href="/client-portal" className="navbar_cta">
                        Client Portal
                    </Link>

                    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
                        <ThemeIcon theme={theme} />
                    </button>
                </div>

                {/* Mobile button */}
                <button
                    type="button"
                    className={`navbar_toggle ${menuOpen ? 'is-open' : ''}`}
                    onClick={toggleMenu}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                >
                    <span />
                    <span />
                </button>
            </nav>

            {/* Mobile menu */}
            <div className={`navbar_mobile ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
                <div className="mobile_links">
                    {navItems.map((item, i) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`mobile_link ${isActiveHref(item.href) ? 'is-current' : ''}`}
                            style={{ '--i': i }}
                            onClick={closeMenu}
                            tabIndex={menuOpen ? 0 : -1}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="mobile_secondary" style={{ '--i': navItems.length }}>
                    <Link href="/apply" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>
                        Apply for Participant
                    </Link>
                    <Link href="/apply" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>
                        Collaboration
                    </Link>
                </div>

                <div className="mobile_foot" style={{ '--i': navItems.length + 1 }}>
                    <Link href="/client-portal" className="navbar_cta" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>
                        Client Portal
                    </Link>
                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={themeLabel}
                        tabIndex={menuOpen ? 0 : -1}
                    >
                        <ThemeIcon theme={theme} />
                    </button>
                </div>
            </div>
        </header>
    );
}
