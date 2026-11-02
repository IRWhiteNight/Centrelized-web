import { useEffect, useState } from 'react';
import '../../css/home-navigation.css';
const sections = [
    { id: 'home-hero', number: '00', label: 'Home' },
    { id: 'about', number: '01', label: 'About' },
    { id: 'location', number: '02', label: 'Location' },
    { id: 'purpose', number: '03', label: 'Purpose' },
    { id: 'facts', number: '04', label: 'Facts' },
    { id: 'features', number: '05', label: 'Capabilities' },
    { id: 'journey', number: '06', label: 'Milestones' },
    { id: 'partners', number: '07', label: 'Partners' },
    { id: 'join', number: '08', label: 'Join us' },
    { id: 'news', number: '09', label: 'Media centre' },
    { id: 'closing', number: '10', label: 'Stay updated' },
];

export default function HomeSectionNav() {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState('home-hero');

    useEffect(() => {
        const targets = sections
            .map(({ id }) => document.getElementById(id))
            .filter(Boolean);

        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (visible) setActive(visible.target.id);
            },
            {
                rootMargin: '-18% 0px -62% 0px',
                threshold: [0, 0.1, 0.25, 0.5],
            }
        );

        targets.forEach((target) => observer.observe(target));
        return () => observer.disconnect();
    }, []);

    const goToSection = (event, id) => {
        event.preventDefault();
        const target = document.getElementById(id);
        if (!target) return;

        setOpen(false);
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'start',
        });

        // Keep the URL useful for direct links without causing a second jump.
        window.history.replaceState(null, '', `#${id}`);
    };

    return (
        <nav className={`home-section-nav ${open ? 'is-open' : ''}`} aria-label="Homepage sections">
            <button
                className="home-nav-toggle"
                type="button"
                aria-expanded={open}
                aria-controls="home-nav-links"
                onClick={() => setOpen((value) => !value)}
            >
                <span className="home-nav-toggle-mark" aria-hidden="true">
                    <i />
                    <i />
                </span>
                <span className="home-nav-toggle-copy">
                    <small>EXPLORE</small>
                    <strong>{sections.find((section) => section.id === active)?.label || 'Navigate'}</strong>
                </span>
                <span className="home-nav-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
            </button>

            <div className="home-nav-links" id="home-nav-links">
                <div className="home-nav-heading">
                    <span>PAGE INDEX</span>
                    <span>01 — 10</span>
                </div>
                {sections.map((section) => (
                    <a
                        key={section.id}
                        href={`#${section.id}`}
                        className={`home-nav-link ${active === section.id ? 'is-active' : ''}`}
                        aria-current={active === section.id ? 'location' : undefined}
                        onClick={(event) => goToSection(event, section.id)}
                    >
                        <span className="home-nav-number">{section.number}</span>
                        <span className="home-nav-label">{section.label}</span>
                        <span className="home-nav-arrow" aria-hidden="true">↗</span>
                    </a>
                ))}
                <div className="home-nav-footer">
                    <span className="home-nav-live-dot" />
                    PERLIS AIRSPACE SANDBOX
                </div>
            </div>
        </nav>
    );
}
