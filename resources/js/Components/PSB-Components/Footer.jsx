import { Link } from '@inertiajs/react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import '../../../css/PSB-css/psb-footer.css';

/* Dark scene = light text. Same language as the Home page:
   near-black + halftone dots, signal yellow, pill buttons with a round arrow chip, hazard tape. */

const CONTACT_HREF = '/#contact'; /* switch to your Contact page route if you prefer */
const exploreLinks = [
    { label: 'Home', href: '/' },
    { label: 'Company', href: '/about/company' },
    { label: 'COEUAS', href: '/coeuas' },
    { label: 'Vertiport Malaysia', href: '/vertiport-malaysia' },
];
const ticker = ['Low Altitude Economy', 'BVLOS Corridors', 'Vertiports', 'UTM', 'Advanced Air Mobility', 'Real-World Validation'];
const WORD = 'PERLIS AIRSPACE'.split('');
const EASE = [0.16, 1, 0.3, 1];

const Arrow = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/* pill link with a round arrow chip, gently pulled toward the cursor */
function Pill({ href, children, ghost }) {
    const rm = useReducedMotion();
    const x = useMotionValue(0), y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 220, damping: 16 }), sy = useSpring(y, { stiffness: 220, damping: 16 });
    return (
        <motion.span className="pas-footer__pillwrap" style={{ x: sx, y: sy }}
            onMouseMove={(e) => {
                if (rm) return;
                const r = e.currentTarget.getBoundingClientRect();
                x.set((e.clientX - r.left - r.width / 2) * 0.2);
                y.set((e.clientY - r.top - r.height / 2) * 0.3);
            }}
            onMouseLeave={() => { x.set(0); y.set(0); }}>
            <Link href={href} className={`pas-pill ${ghost ? 'pas-pill--ghost' : ''}`}>
                <i className="pas-pill__ico"><Arrow /></i><span>{children}</span>
            </Link>
        </motion.span>
    );
}

function Rise({ children, d = 0, className, id }) {
    const rm = useReducedMotion();
    return (
        <motion.section id={id} className={className}
            initial={rm ? false : { opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8% 0px' }} transition={{ duration: 0.9, delay: d, ease: EASE }}>
            {children}
        </motion.section>
    );
}

export default function Footer() {
    const rm = useReducedMotion();
    const up = () => window.scrollTo({ top: 0, behavior: rm ? 'auto' : 'smooth' });

    return (
        <footer className="pas-footer">
            <div className="pas-footer__hazard" aria-hidden="true" />
            <div className="pas-footer__orb pas-footer__orb--a" aria-hidden="true" />
            <div className="pas-footer__orb pas-footer__orb--b" aria-hidden="true" />
            <div className="pas-footer__grain" aria-hidden="true" />

            <div className="pas-footer__marq" aria-hidden="true">
                <div className="pas-footer__marq-track">
                    {[...ticker, ...ticker, ...ticker, ...ticker].map((t, i) => (
                        <span key={i}>{t}<i>✦</i></span>
                    ))}
                </div>
            </div>

            <div className="pas-footer__wrap">
                <div className="pas-footer__main">
                    {/* branding */}
                    <Rise className="pas-footer__intro">
                        <Link href="/" className="pas-footer__brand">
                            <span className="pas-footer__mark">
                                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M3 13.2 21 5l-7.2 16-2.2-6.6L3 13.2Z" />
                                    <path d="m11.6 14.4 4.1-4.1" />
                                </svg>
                            </span>
                            <span className="pas-footer__brandtext">
                                <b>Perlis Airspace</b>
                                <small>Sandbox</small>
                            </span>
                        </Link>

                        <h2 className="pas-footer__lead">Innovating today, <em>connecting tomorrow.</em></h2>

                        <p className="pas-footer__description">
                            Exploring the future of air mobility through innovation, collaboration,
                            and a connected airspace ecosystem.
                        </p>

                        <div className="pas-footer__cta">
                            <Pill href="/#apply">Apply to Participate</Pill>
                        </div>

                        <span className="pas-footer__status">
                            <i className="pas-footer__status-dot" />
                            Building the future of airspace
                        </span>
                    </Rise>

                    {/* navigation */}
                    <Rise className="pas-footer__column" d={0.12}>
                        <p className="pas-footer__eyebrow"><i />Navigate<em>01<s>/02</s></em></p>
                        <h2>Explore</h2>
                        <ul>
                            {exploreLinks.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href}>
                                        <span className="pas-footer__link-label">{item.label}</span>
                                        <span className="pas-footer__link-arrow" aria-hidden="true"><Arrow /></span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Rise>

                    {/* contact */}
                    <Rise className="pas-footer__column" id="contact" d={0.24}>
                        <p className="pas-footer__eyebrow"><i />Contact<em>02<s>/02</s></em></p>
                        <h2>Let&rsquo;s connect</h2>
                        <p className="pas-footer__text">
                            Interested in airspace innovation or collaboration?
                            We welcome you to connect with our team.
                        </p>
                        <Pill href={CONTACT_HREF} ghost>Get in touch</Pill>
                    </Rise>
                </div>

                {/* oversized wordmark, letters rise one by one */}
                <div className="pas-footer__giant" aria-hidden="true">
                    {WORD.map((c, i) => (
                        <span key={i} className="pas-footer__mask">
                            <motion.span initial={rm ? false : { y: '110%' }} whileInView={{ y: 0 }}
                                viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.06, ease: EASE }}>
                                {c === ' ' ? '\u00A0' : c}
                            </motion.span>
                        </span>
                    ))}
                </div>
            </div>

            <div className="pas-footer__hazard" aria-hidden="true" />
            <div className="pas-footer__bottom">
                <p>© {new Date().getFullYear()} Perlis Airspace Sandbox. All rights reserved.</p>
                <p className="pas-footer__tag">Advancing the next frontier of air mobility</p>
                <button type="button" className="pas-footer__top" onClick={up}>
                    Back to top
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                </button>
            </div>
        </footer>
    );
}
