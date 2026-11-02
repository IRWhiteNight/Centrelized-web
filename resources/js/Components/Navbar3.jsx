import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import '../../css/navbar3.css';
import vertiport from '../images/vertiport.png';
import uas from '../images/uas.png';
import psb from '../images/PSB.png';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'The Vision', href: '/about' },
    { label: 'Beyond Flight', href: '/innovation' },
    { label: 'What We Offer', href: '/services' },
    { label: 'Newsroom', href: '/media' },
    { label: 'Help Centre', href: '/faq' },
    { label: 'Work With Us', href: '/contact' },
];

const partners = [
    {
        name: 'Unmanned Aerial System',
        logo: uas,
        href: 'https://example.com/uas', // TODO: real URL
    },
    {
        name: 'Vertiport Malaysia',
        logo: vertiport,
        href: 'https://example.com/vertiport', // TODO: real URL
    },
];

export default function Navbar3() {
    const [open, setOpen] = useState(false);
    const headerRef = useRef(null);
    const megaRef = useRef(null);
    const burgerRef = useRef(null);

    const close = useCallback(() => setOpen(false), []);

    // Scroll state is written straight to data-attributes, so scrolling
    // never triggers a React re-render.
    useEffect(() => {
        const el = headerRef.current;
        let lastY = window.scrollY;
        let ticking = false;

        const set = (key, value) => {
            if (el.dataset[key] !== value) el.dataset[key] = value;
        };

        const update = () => {
            const y = window.scrollY;
            set('scrolled', y > 12 ? 'true' : 'false');
            if (Math.abs(y - lastY) > 6) {
                set('hidden', y > lastY && y > 120 ? 'true' : 'false');
                lastY = y;
            }
            ticking = false;
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Open state: make the closed panel unfocusable, lock page scroll, Escape closes
    useEffect(() => {
        if (megaRef.current) megaRef.current.inert = !open;
        document.documentElement.classList.toggle('nav3-lock', open);

        if (!open) return;

        const onKey = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                burgerRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    // Never leave the page scroll locked if the navbar unmounts
    useEffect(
        () => () => document.documentElement.classList.remove('nav3-lock'),
        []
    );

    return (
        <>
            <div
                className={`nav3-overlay ${open ? 'is-open' : ''}`}
                onClick={close}
                aria-hidden="true"
            />
            <div
                id="navbar3"
                ref={headerRef}
                className={open ? 'is-open' : ''}
            >
                <nav className="navbar3-design" aria-label="Main navigation">
                    {/* Left: partner websites */}
                    <div className="website-left-link">
                        {partners.map((p) => (
                            <a
                                key={p.name}
                                href={p.href}
                                className="partner-link"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${p.name} (opens another website)`}
                            >
                                <img src={p.logo} alt="" />
                            </a>
                        ))}
                    </div>

                    {/* Center: brand */}
                    <Link href="/" className="center-logo" onClick={close}>
                        <img src={psb} alt="Perlis Airspace Sandbox" />
                    </Link>

                    {/* Right: menu button */}
                    <div className="right-burger-icon">
                        <button
                            ref={burgerRef}
                            type="button"
                            className="burger"
                            aria-label={open ? 'Close menu' : 'Open menu'}
                            aria-expanded={open}
                            aria-controls="navbar3-mega"
                            onClick={() => setOpen((o) => !o)}
                        >
                            <span className="burger-label" aria-hidden="true">
                                <span>Menu</span>
                                <span>Close</span>
                            </span>
                            <span className="burger-lines" aria-hidden="true">
                                <span />
                                <span />
                            </span>
                        </button>
                    </div>
                </nav>

                {/* Large dropdown */}
                <div id="navbar3-mega" className="mega" ref={megaRef}>
                    <div className="mega-inner">
                        <nav className="mega-main" aria-label="Site pages">
                            <p className="mega-eyebrow reveal" style={{ '--i': 0 }}>
                                Navigation
                            </p>
                            <ul className="mega-links">
                                {navLinks.map((link, i) => (
                                    <li key={link.label} style={{ '--i': i }}>
                                        <Link href={link.href} onClick={close}>
                                            <span className="mega-num">0{i + 1}</span>
                                            <span className="mega-mask">
                                                <span className="mega-label">{link.label}</span>
                                            </span>
                                            <span className="mega-arrow" aria-hidden="true">↗</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <aside className="mega-side">
                            <p className="mega-eyebrow reveal" style={{ '--i': 1 }}>
                                Our partners
                            </p>

                            {partners.map((p, i) => (
                                <a
                                    key={p.name}
                                    href={p.href}
                                    className="partner-card reveal"
                                    style={{ '--i': i + 2 }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img src={p.logo} alt="" />
                                    <span className="partner-card-text">
                                        <strong>{p.name}</strong>
                                        <small>Visit website ↗</small>
                                    </span>
                                    <span className="sr-only"> (opens another website)</span>
                                </a>
                            ))}

                            <Link
                                href="/contact"
                                className="mega-cta reveal"
                                style={{ '--i': partners.length + 2 }}
                                onClick={close}
                            >
                                <span>Get in touch</span>
                                <span aria-hidden="true">→</span>
                            </Link>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}
