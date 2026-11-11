import { Link } from '@inertiajs/react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { BASE } from '../../data/COEUAS-data/siteMapCOEUAS';
import '../../../css/COE-UAS-css/coeuas-footer.css';

/* Same language as the COE-UAS Home page:
   near-black scene, bright blue accent, royal blue strip, pill buttons with a round arrow chip.
   Edit the constants below to change the content. */

const to = (h = '/') =>
    h === '/' ? BASE : h.startsWith('/') && !h.startsWith(BASE + '/') && h !== BASE ? BASE + h : h;

/* COE-UAS is a centre under UniMAP, so the footer links up to the parent university.
   External links use a plain <a> (not Inertia <Link>) and open in a new tab. */
const UNIMAP = {
    name: 'Universiti Malaysia Perlis',
    short: 'UniMAP',
    href: 'https://www.unimap.edu.my/index.php/ms/',
};

const BRAND = { name: 'COE-UAS', sub: 'Centre of Excellence' };
const CONTACT_HREF = '/#contact'; /* switch to your Contact page route if you prefer */
const exploreLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'People', href: '/people' },
    { label: 'Engagement', href: '/engagement' },
    { label: UNIMAP.short, href: UNIMAP.href, external: true },
];
const ticker = ['Unmanned Aircraft Systems', 'Research', 'Innovation', 'Training', 'Industry Partnerships', 'Real-World Validation'];
const WORD = 'COE-UAS'.split('');
const EASE = [0.16, 1, 0.3, 1];

const Arrow = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/* pill link with a round arrow chip, gently pulled toward the cursor */
function Pill({ href, children, ghost }) {
    const rm = useReducedMotion();
    const x = useMotionValue(0), y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 220, damping: 16 }), sy = useSpring(y, { stiffness: 220, damping: 16 });
    return (
        <motion.span className="cf-pillwrap" style={{ x: sx, y: sy }}
            onMouseMove={(e) => {
                if (rm) return;
                const r = e.currentTarget.getBoundingClientRect();
                x.set((e.clientX - r.left - r.width / 2) * 0.2);
                y.set((e.clientY - r.top - r.height / 2) * 0.3);
            }}
            onMouseLeave={() => { x.set(0); y.set(0); }}>
            <Link href={to(href)} className={`cf-pill${ghost ? ' cf-pill--ghost' : ''}`}>
                <i className="cf-pill__ico"><Arrow /></i><span>{children}</span>
            </Link>
        </motion.span>
    );
}

/* scroll reveal: opacity + rise only, same as the Home page */
function Rise({ children, d = 0, className, id }) {
    const rm = useReducedMotion();
    return (
        <motion.section id={id} className={className}
            initial={rm ? false : { opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-6% 0px' }} transition={{ duration: 0.9, delay: d, ease: EASE }}>
            {children}
        </motion.section>
    );
}

export default function Footer() {
    const rm = useReducedMotion();
    const up = () => window.scrollTo({ top: 0, behavior: rm ? 'auto' : 'smooth' });

    return (
        <footer className="cf">
            {/* dark ticker with blue stars */}
            <div className="cf-ticker" aria-hidden="true">
                <div className="cf-ticker__track">
                    {Array.from({ length: 4 }, (_, g) => ticker.map((t) => <span key={`${g}-${t}`}>{t}<i>✦</i></span>))}
                </div>
            </div>

            <div className="cf-grain" aria-hidden="true" />

            <div className="cf-wrap">
                <div className="cf-main">
                    {/* branding */}
                    <Rise className="cf-intro">
                        <Link href={to('/')} className="cf-brand">
                            <span className="cf-mark">
                                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M3 13.2 21 5l-7.2 16-2.2-6.6L3 13.2Z" />
                                    <path d="m11.6 14.4 4.1-4.1" />
                                </svg>
                            </span>
                            <span className="cf-brandtext">
                                <b>{BRAND.name}</b>
                                <small>{BRAND.sub}</small>
                            </span>
                        </Link>

                        <h2 className="cf-lead">Innovating today, <em>connecting tomorrow.</em></h2>

                        <p className="cf-description">
                            Advancing unmanned aircraft systems through research, innovation,
                            training and industry collaboration.
                        </p>

                        <div className="cf-cta">
                            <Pill href="/engagement">Explore Engagement</Pill>
                        </div>

                        {/* parent university */}
                        <a className="cf-parent" href={UNIMAP.href} target="_blank" rel="noopener noreferrer"
                            aria-label={`${UNIMAP.name} (opens in a new tab)`}>
                            <span className="cf-parent__text">
                                <small>Proudly under</small>
                                <b>{UNIMAP.name} <em>({UNIMAP.short})</em></b>
                            </span>
                            <span className="cf-parent__arrow" aria-hidden="true"><Arrow /></span>
                        </a>

                        <span className="cf-status">
                            <i className="cf-status__dot" />
                            Building the future of UAS
                        </span>
                    </Rise>

                    {/* navigation */}
                    <Rise className="cf-col" d={0.12}>
                        <p className="cf-eyebrow"><i />Navigate<em>01<s>/02</s></em></p>
                        <h2>Explore</h2>
                        <ul>
                            {exploreLinks.map((item) => (
                                <li key={item.href}>
                                    {item.external ? (
                                        <a href={item.href} target="_blank" rel="noopener noreferrer">
                                            <span>{item.label}</span>
                                            <span className="cf-link-arrow" aria-hidden="true"><Arrow /></span>
                                        </a>
                                    ) : (
                                        <Link href={to(item.href)}>
                                            <span>{item.label}</span>
                                            <span className="cf-link-arrow" aria-hidden="true"><Arrow /></span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Rise>

                    {/* contact */}
                    <Rise className="cf-col" id="contact" d={0.24}>
                        <p className="cf-eyebrow"><i />Contact<em>02<s>/02</s></em></p>
                        <h2>Let&rsquo;s connect</h2>
                        <p className="cf-text">
                            Interested in research, training or collaboration?
                            We welcome you to connect with our team.
                        </p>
                        <Pill href={CONTACT_HREF} ghost>Get in touch</Pill>
                    </Rise>
                </div>

                {/* oversized wordmark, letters rise one by one */}
                <div className="cf-giant" aria-hidden="true">
                    {WORD.map((c, i) => (
                        <span key={i} className="cf-mask">
                            <motion.span initial={rm ? false : { y: '110%' }} whileInView={{ y: 0 }}
                                viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.06, ease: EASE }}>
                                {c}
                            </motion.span>
                        </span>
                    ))}
                </div>
            </div>

            {/* royal blue strip, white text */}
            <div className="cf-bottom">
                <p>© {new Date().getFullYear()} COE-UAS. All rights reserved.</p>
                <p className="cf-tag">
                    A centre of{' '}
                    <a className="cf-tag__link" href={UNIMAP.href} target="_blank" rel="noopener noreferrer">{UNIMAP.name}</a>
                </p>
                <button type="button" className="cf-top" onClick={up}>
                    Back to top
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                </button>
            </div>
        </footer>
    );
}
