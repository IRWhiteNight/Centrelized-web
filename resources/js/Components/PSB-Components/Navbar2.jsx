import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import '../../../css/PSB-css/psb-navbar2.css';
import sandbox from '../../images/PSB.png'
import uas from '../../images/uas.png';
import vertiport from '../../images/vertiport.png';

const partners = [
    {
        name: 'COE-UAS',
        desc: 'Unmanned Aerial Systems',
        logo: uas,
        href: 'https://example.com/coe-uas', // TODO: real URL
    },
    {
        name: 'Vertiport Malaysia',
        desc: 'Vertiport network',
        logo: vertiport,
        href: 'https://example.com/vertiport', // TODO: real URL
    },
];

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'The Vision', href: '/about' },
    { label: 'Beyond Flight', href: '/innovation' },
    { label: 'What We Offer', href: '/services' },
    { label: 'Newsroom', href: '/media' },
    { label: 'Help Centre', href: '/faq' },
    { label: 'Work With Us', href: '/contact' },

    // Links to other websites (the main site acts as a portal).
    // TODO: replace the placeholder URL and label with the real sub website.
    // Add more entries the same way, each with `external: true`.
];

// Extra attributes for links that leave this website: open in a new tab, safely
const externalProps = (link) =>
    link.external
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {};

// Background layers that give the whole bar its liquid glass look.
// Blur and contrast filter live on separate layers (see navbar.css).
function GlassLayers() {
    return (
        <>
            <span className="glass-layer glass-layer-blur" aria-hidden="true" />
            <span className="glass-layer glass-layer-fx" aria-hidden="true">
                <span className="glass-layer-box">
                    <span className="glass-layer-glow" />
                </span>
            </span>
        </>
    );
}

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [indicator, setIndicator] = useState({
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        visible: false,
        instant: false,
    });
    const instantTimer = useRef(null);

    const [brandOpen, setBrandOpen] = useState(false);
    const brandRef = useRef(null);

    // Hover only opens on devices that really hover (not touch screens)
    const canHover = () => window.matchMedia('(hover: hover)').matches;

    useEffect(() => {
        const onPointerDown = (e) => {
            if (brandRef.current && !brandRef.current.contains(e.target)) {
                setBrandOpen(false);
            }
        };
        const onKey = (e) => {
            if (e.key === 'Escape') setBrandOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    // Move the glass pill to the hovered / focused link (point A -> point B)
    const moveIndicator = (e) => {
        const el = e.currentTarget;
        const next = {
            x: el.offsetLeft,
            y: el.offsetTop,
            w: el.offsetWidth,
            h: el.offsetHeight,
        };

        setIndicator((prev) => {
            if (prev.visible) return { ...prev, ...next, instant: false };

            // coming from hidden: snap into place, then animate on later moves
            clearTimeout(instantTimer.current);
            instantTimer.current = setTimeout(
                () => setIndicator((p) => ({ ...p, instant: false })),
                50
            );
            return { ...next, visible: true, instant: true };
        });
    };

    const hideIndicator = () =>
        setIndicator((prev) => ({ ...prev, visible: false, instant: false }));

    useEffect(() => () => clearTimeout(instantTimer.current), []);

    // Close the mobile menu with Escape, and when the viewport grows past mobile size
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        const mq = window.matchMedia('(min-width: 641px)');
        const onChange = (e) => {
            if (e.matches) setMenuOpen(false);
        };

        window.addEventListener('keydown', onKeyDown);
        mq.addEventListener('change', onChange);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            mq.removeEventListener('change', onChange);
        };
    }, []);

    return (
        <header className="glass-header">
            <nav className="glass-navbar" aria-label="Main navigation">
                <GlassLayers />

                <div
                    className="glass-brand-wrap"
                    ref={brandRef}
                    onMouseEnter={() => canHover() && setBrandOpen(true)}
                    onMouseLeave={() => canHover() && setBrandOpen(false)}
                >
                    <button
                        type="button"
                        className="glass-brand"
                        aria-haspopup="true"
                        aria-expanded={brandOpen}
                        aria-controls="brand-dropdown"
                        aria-label="Perlis Airspace Sandbox partners"
                        onClick={() => setBrandOpen((o) => !o)}
                    >
                        <img src={sandbox} className="logo-nav" alt="Perlis Airspace Sandbox" />
                        <svg
                            className={`brand-chevron ${brandOpen ? 'is-open' : ''}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M6 9l6 6 6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <div
                        id="brand-dropdown"
                        className={`brand-dropdown ${brandOpen ? 'is-open' : ''}`}
                        aria-hidden={!brandOpen}
                    >
                        <div className="brand-dropdown-panel">
                            <GlassLayers />
                            <p className="brand-dropdown-title">Our partners</p>
                            {partners.map((p) => (
                                <a
                                    key={p.name}
                                    href={p.href}
                                    className="brand-partner"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    tabIndex={brandOpen ? 0 : -1}
                                >
                                    <img src={p.logo} alt="" className="brand-partner-logo" />
                                    <span className="brand-partner-text">
                                        <strong>{p.name}</strong>
                                        <small>{p.desc}</small>
                                    </span>
                                    <span aria-hidden="true" className="brand-partner-arrow">↗</span>
                                    <span className="sr-only"> (opens another website)</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    className="glass-nav-links"
                    onMouseLeave={hideIndicator}
                    onBlur={hideIndicator}
                >
                    <span
                        className={`glass-nav-indicator ${indicator.visible ? 'is-visible' : ''} ${indicator.instant ? 'is-instant' : ''}`}
                        style={{
                            '--ind-x': `${indicator.x}px`,
                            '--ind-y': `${indicator.y}px`,
                            '--ind-w': `${indicator.w}px`,
                            '--ind-h': `${indicator.h}px`,
                        }}
                        aria-hidden="true"
                    />

                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="glass-nav-link"
                            onMouseEnter={moveIndicator}
                            onFocus={moveIndicator}
                            {...externalProps(link)}
                        >
                            {link.label}
                            {link.external && (
                                <svg
                                    className="glass-nav-ext"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M7 17L17 7M9 7H17V15"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                            {link.external && (
                                <span className="sr-only"> (opens another website)</span>
                            )}
                        </a>
                    ))}
                </div>

                {/* Liquid glass CTA: wrapper carries the contrast() filter */}
                <span className="glass-cta-fx">
                    <a href="#contact" className="glass-cta">
                        <span className="glass-cta-text">Client Portal</span>

                        <span className="glass-cta-icon" aria-hidden="true">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M5 12H19M12 5L19 12L12 19"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>

                        <span className="glass-cta-glow" aria-hidden="true" />
                    </a>
                </span>

                <button
                    type="button"
                    className={`glass-menu-toggle ${menuOpen ? 'is-open' : ''}`}
                    aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation"
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <span />
                    <span />
                </button>
            </nav>

            <div
                id="mobile-navigation"
                className={`glass-mobile-menu ${menuOpen ? 'is-open' : ''}`}
                aria-hidden={!menuOpen}
            >
                <GlassLayers />

                {navLinks.map((link) => (
                    <a
                        key={link.label}
                        href={link.href}
                        className="glass-mobile-link"
                        tabIndex={menuOpen ? 0 : -1}
                        onClick={() => setMenuOpen(false)}
                        {...externalProps(link)}
                    >
                        {link.label}
                        <span aria-hidden="true">{link.external ? '↗' : '→'}</span>
                        {link.external && (
                            <span className="sr-only"> (opens another website)</span>
                        )}
                    </a>
                ))}

                <a
                    href="#contact"
                    className="glass-mobile-cta"
                    tabIndex={menuOpen ? 0 : -1}
                    onClick={() => setMenuOpen(false)}
                >
                    Get started
                    <span aria-hidden="true">→</span>
                </a>
            </div>
        </header>
    );
}
