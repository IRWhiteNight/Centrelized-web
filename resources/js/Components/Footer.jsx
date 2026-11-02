import { Link } from '@inertiajs/react';
import '../../css/footer.css';

const exploreLinks = [
    { label: 'Home', href: '/' },
    { label: 'Company', href: '/about/company' },
    { label: 'COEUAS', href: '/coeuas' },
    { label: 'Vertiport Malaysia', href: '/vertiport-malaysia' },
];

export default function Footer() {
    return (
        <footer className="pas-footer">
            <div className="pas-footer__main">
                {/* Company branding */}
                <section className="pas-footer__intro">
                    <Link href="/" className="pas-brand pas-footer__brand">
                        <span className="pas-brand__mark">
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M3 13.2 21 5l-7.2 16-2.2-6.6L3 13.2Z" />
                                <path d="m11.6 14.4 4.1-4.1" />
                            </svg>
                        </span>

                        <span className="pas-brand__text">
                            <span className="pas-brand__name">
                                PERLIS AIRSPACE
                            </span>
                            <span className="pas-brand__subtitle">
                                SANDBOX
                            </span>
                        </span>
                    </Link>

                    <p className="pas-footer__description">
                        Exploring the future of air mobility through
                        innovation, collaboration, and a connected
                        airspace ecosystem.
                    </p>

                    <span className="pas-footer__status">
                        <span className="pas-footer__status-dot" />
                        BUILDING THE FUTURE OF AIRSPACE
                    </span>
                </section>

                {/* Navigation links */}
                <section className="pas-footer__column">
                    <h2>Explore</h2>

                    <ul>
                        {exploreLinks.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Contact */}
                <section className="pas-footer__column" id="contact">
                    <h2>Let's connect</h2>

                    <p>
                        Interested in airspace innovation or collaboration?
                        We welcome you to connect with our team.
                    </p>

                    <Link
                        href="/#contact"
                        className="pas-footer__contact-link"
                    >
                        Get in touch <span>↗</span>
                    </Link>
                </section>
            </div>

            {/* Copyright */}
            <div className="pas-footer__bottom">
                <div className="pas-footer__bottom-inner">
                    <p>
                        © {new Date().getFullYear()} Perlis Airspace Sandbox.
                        All rights reserved.
                    </p>

                    <p>
                        ADVANCING THE NEXT FRONTIER OF AIR MOBILITY
                    </p>
                </div>
            </div>
        </footer>
    );
}
