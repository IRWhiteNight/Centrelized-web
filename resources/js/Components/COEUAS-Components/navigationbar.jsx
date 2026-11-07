
import { useEffect, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    MAIN_NAV,
    CONTACT_LINK,
    COLLABORATE_LINK,
    BASE,
} from "./siteMapCOEUAS";

import "../../../css/COE-UAS-css/navigationbar.css";

/* =========================================================
   ICONS
========================================================= */

const Arrow = ({ diagonal = false }) => (
    <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={
            diagonal
                ? "cn-arrow cn-arrow--diagonal"
                : "cn-arrow"
        }
    >
        <path
            d={
                diagonal
                    ? "M4 12 12 4M5 4h7v7"
                    : "M3 8h10M9 4l4 4-4 4"
            }
        />
    </svg>
);

/* =========================================================
   BRAND MARK
========================================================= */

function BrandMark() {
    return (
        <span className="cn-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40">
                <path d="M12 12 28 28M28 12 12 28" />

                <circle cx="20" cy="20" r="4" />

                {[
                    [8, 8],
                    [32, 8],
                    [8, 32],
                    [32, 32],
                ].map(([x, y], i) => (
                    <ellipse
                        key={i}
                        cx={x}
                        cy={y}
                        rx="5"
                        ry="1.7"
                    />
                ))}
            </svg>
        </span>
    );
}

/* =========================================================
   NAVIGATION BAR
========================================================= */

export default function NavigationBar({
    children,
    items = MAIN_NAV,
    contact = CONTACT_LINK,
    quick = COLLABORATE_LINK,
    logo = "COE-UAS",
}) {
    const { url = "" } = usePage();

    const currentPath =
        url.split(/[?#]/)[0].replace(/\/$/, "") || "/";

    const [mega, setMega] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState(null);

    const headerRef = useRef(null);
    const closeTimer = useRef(null);

    /* =====================================================
       ACTIVE ROUTE
    ===================================================== */

    const active = (href) =>
        currentPath === href ||
        currentPath.startsWith(`${href}/`);

    /* =====================================================
       MEGA MENU
    ===================================================== */

    const closeMega = () => {
        clearTimeout(closeTimer.current);
        setMega(null);
    };

    const scheduleClose = () => {
        clearTimeout(closeTimer.current);

        closeTimer.current = setTimeout(() => {
            setMega(null);
        }, 160);
    };

    /* =====================================================
       CLOSE MENU AFTER PAGE NAVIGATION
    ===================================================== */

    useEffect(() => {
        setMega(null);
        setMobileOpen(false);
        setMobileExpanded(null);
    }, [url]);

    /* =====================================================
       OUTSIDE CLICK + ESCAPE
    ===================================================== */

    useEffect(() => {
        const onOutside = (e) => {
            if (
                headerRef.current &&
                !headerRef.current.contains(e.target)
            ) {
                closeMega();
            }
        };

        const onKey = (e) => {
            if (e.key === "Escape") {
                closeMega();
                setMobileOpen(false);
            }
        };

        document.addEventListener("pointerdown", onOutside);
        window.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener(
                "pointerdown",
                onOutside
            );

            window.removeEventListener("keydown", onKey);

            clearTimeout(closeTimer.current);
        };
    }, []);

    /* =====================================================
       MOBILE SCROLL LOCK
    ===================================================== */

    useEffect(() => {
        document.documentElement.classList.toggle(
            "cn-lock-scroll",
            mobileOpen
        );

        return () => {
            document.documentElement.classList.remove(
                "cn-lock-scroll"
            );
        };
    }, [mobileOpen]);

    /* =====================================================
       SCROLL-AWARE HEADER
    ===================================================== */

    useEffect(() => {
        const el = headerRef.current;

        if (!el) return;

        let previous = window.scrollY;
        let ticking = false;

        const update = () => {
            const y = window.scrollY;

            el.dataset.scrolled = y > 12 ? "true" : "false";

            if (
                Math.abs(y - previous) > 7 &&
                y > 140 &&
                y > previous &&
                !mega &&
                !mobileOpen
            ) {
                el.dataset.hidden = "true";
            } else if (
                y < previous ||
                y < 80 ||
                mega ||
                mobileOpen
            ) {
                el.dataset.hidden = "false";
            }

            previous = y;
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        };

        window.addEventListener("scroll", onScroll, {
            passive: true,
        });

        update();

        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    }, [mega, mobileOpen]);

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            <header
                id="coe-nav"
                ref={headerRef}
                data-scrolled="false"
                data-hidden="false"
                data-mega={mega ? "true" : "false"}
                data-drawer={mobileOpen ? "true" : "false"}
            >

                {/* TOP INFORMATION BAR */}

                <div className="cn-topline">
                    <span>
                        <i />
                        UNMANNED AERIAL SYSTEMS ·
                        UNIVERSITI MALAYSIA PERLIS
                    </span>

                    <span className="cn-topline-right">
                        RESEARCH <b>·</b>
                        INNOVATION <b>·</b>
                        IMPACT
                    </span>
                </div>

                {/* MAIN NAVIGATION */}

                <div className="cn-bar">

                    {/* BRAND */}

                    <div className="cn-brand-area">
                        <Link
                            href={BASE}
                            className="cn-brand"
                            aria-label={`${logo} home`}
                            onClick={closeMega}
                        >
                            <BrandMark />

                            <span>
                                {logo}
                                <small>
                                    CENTRE OF EXCELLENCE
                                </small>
                            </span>
                        </Link>

                        <button
                            className={`cn-brand-switch ${
                                mega === "ecosystem"
                                    ? "is-open"
                                    : ""
                            }`}
                            aria-label="Explore related programmes"
                            aria-expanded={
                                mega === "ecosystem"
                            }
                            onClick={() =>
                                setMega(
                                    mega === "ecosystem"
                                        ? null
                                        : "ecosystem"
                                )
                            }
                        >
                            <span>⌄</span>
                        </button>
                    </div>

                    {/* DESKTOP NAVIGATION */}

                    <nav
                        className="cn-desktop-nav"
                        aria-label="Main navigation"
                        onMouseLeave={scheduleClose}
                    >
                        <ul className="cn-nav-list">
                            {items.map((item, i) => (
                                <li
                                    key={item.key}
                                    style={{
                                        "--nav-i": i,
                                    }}
                                >
                                    <Link
                                        href={item.href}
                                        className={`cn-nav-link ${
                                            active(item.href)
                                                ? "is-active"
                                                : ""
                                        }`}
                                        aria-current={
                                            active(item.href)
                                                ? "page"
                                                : undefined
                                        }
                                        onMouseEnter={() => {
                                            clearTimeout(
                                                closeTimer.current
                                            );

                                            setMega(item.key);
                                        }}
                                        onFocus={() => {
                                            clearTimeout(
                                                closeTimer.current
                                            );

                                            setMega(item.key);
                                        }}
                                        onClick={closeMega}
                                    >
                                        {item.label}

                                        <span className="cn-nav-caret">
                                            ⌄
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* RIGHT ACTIONS */}

                    <div className="cn-actions">
                        <Link
                            href={quick.href}
                            className="cn-collab"
                        >
                            <span className="cn-collab-dot" />

                            {quick.label}

                            <Arrow diagonal />
                        </Link>

                        <Link
                            href={contact.href}
                            className="cn-contact"
                        >
                            Contact

                            <span>
                                <Arrow diagonal />
                            </span>
                        </Link>
                    </div>

                    {/* MOBILE MENU BUTTON */}

                    <button
                        className="cn-burger"
                        aria-label={
                            mobileOpen
                                ? "Close navigation"
                                : "Open navigation"
                        }
                        aria-expanded={mobileOpen}
                        onClick={() =>
                            setMobileOpen((v) => !v)
                        }
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>

                {/* =================================================
                    DESKTOP MEGA MENU
                ================================================= */}

                <div
                    className={`cn-mega-wrap ${
                        mega ? "is-open" : ""
                    }`}
                    onMouseEnter={() =>
                        clearTimeout(closeTimer.current)
                    }
                    onMouseLeave={scheduleClose}
                >

                    {/* ECOSYSTEM MENU */}

                    {mega === "ecosystem" ? (
                        <section className="cn-mega cn-ecosystem">

                            <div className="cn-mega-intro">
                                <span className="cn-eyebrow">
                                    COE-UAS ECOSYSTEM
                                </span>

                                <h2>
                                    Explore the
                                    <br />
                                    <em>future of flight.</em>
                                </h2>

                                <p>
                                    Research, test and translate
                                    aerial systems into
                                    real-world capability.
                                </p>
                            </div>

                            <div className="cn-ecosystem-links">

                                <a
                                    href="https://example.com/psb"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span className="cn-mini-mark">
                                        PSB
                                    </span>

                                    <span>
                                        <b>
                                            Perlis Airspace Sandbox
                                        </b>

                                        <small>
                                            Low-altitude testing
                                            ecosystem
                                        </small>
                                    </span>

                                    <Arrow diagonal />
                                </a>

                                <a
                                    href="https://example.com/vertiport"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span className="cn-mini-mark">
                                        VP
                                    </span>

                                    <span>
                                        <b>
                                            Vertiport Malaysia
                                        </b>

                                        <small>
                                            Advanced air mobility
                                            infrastructure
                                        </small>
                                    </span>

                                    <Arrow diagonal />
                                </a>
                            </div>
                        </section>
                    ) : (
                        items
                            .filter((n) => n.key === mega)
                            .map((item) => (
                                <section
                                    className="cn-mega"
                                    key={item.key}
                                >

                                    {/* MEGA MENU INTRO */}

                                    <div className="cn-mega-intro">
                                        <span className="cn-eyebrow">
                                            {item.eyebrow}
                                        </span>

                                        <h2>{item.title}</h2>

                                        <p>
                                            {item.description}
                                        </p>

                                        <Link
                                            href={item.href}
                                            className="cn-explore-link"
                                        >
                                            Explore{" "}
                                            {item.fullLabel ||
                                                item.label}

                                            <Arrow diagonal />
                                        </Link>
                                    </div>

                                    {/* MEGA MENU LINKS */}

                                    <div className="cn-mega-content">

                                        <div className="cn-mega-heading">
                                            <span>
                                                DISCOVER
                                            </span>

                                            <span>
                                                {String(
                                                    item.entries.length
                                                ).padStart(2, "0")}{" "}
                                                PATHWAYS
                                            </span>
                                        </div>

                                        <div className="cn-mega-grid">
                                            {item.entries.map(
                                                (entry, index) => (
                                                    <Link
                                                        href={entry.href}
                                                        className="cn-mega-item"
                                                        key={entry.title}
                                                        onClick={closeMega}
                                                    >
                                                        <span className="cn-item-index">
                                                            {String(
                                                                index + 1
                                                            ).padStart(
                                                                2,
                                                                "0"
                                                            )}
                                                        </span>

                                                        <span className="cn-item-copy">
                                                            <b>
                                                                {
                                                                    entry.title
                                                                }
                                                            </b>

                                                            <small>
                                                                {
                                                                    entry.description
                                                                }
                                                            </small>

                                                            {entry.links?.length >
                                                                0 && (
                                                                <span className="cn-chips">
                                                                    {entry.links.map(
                                                                        (
                                                                            link
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    link.label
                                                                                }
                                                                            >
                                                                                {
                                                                                    link.label
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </span>
                                                            )}
                                                        </span>

                                                        <Arrow diagonal />
                                                    </Link>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </section>
                            ))
                    )}
                </div>
            </header>

            {/* MOBILE BACKDROP */}

            {mobileOpen && (
                <div
                    className="cn-mobile-scrim"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* =================================================
                MOBILE DRAWER
            ================================================= */}

            <aside
                className={`cn-mobile-drawer ${
                    mobileOpen ? "is-open" : ""
                }`}
                aria-hidden={!mobileOpen}
            >

                {/* MOBILE HEADER */}

                <div className="cn-mobile-head">
                    <span>
                        Navigation
                        <small>COE-UAS</small>
                    </span>

                    <button
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close menu"
                    >
                        ×
                    </button>
                </div>

                {/* MOBILE LINKS */}

                <div className="cn-mobile-scroll">

                    <Link
                        href={BASE}
                        className="cn-mobile-home"
                        onClick={() => setMobileOpen(false)}
                    >
                        Home
                        <Arrow diagonal />
                    </Link>

                    {items.map((item, i) => (
                        <section
                            className="cn-mobile-section"
                            key={item.key}
                        >
                            <button
                                className="cn-mobile-trigger"
                                aria-expanded={
                                    mobileExpanded === item.key
                                }
                                onClick={() =>
                                    setMobileExpanded(
                                        mobileExpanded === item.key
                                            ? null
                                            : item.key
                                    )
                                }
                            >
                                <span>
                                    <small>
                                        0{i + 1}
                                    </small>

                                    {item.fullLabel ||
                                        item.label}
                                </span>

                                <b>
                                    {mobileExpanded === item.key
                                        ? "−"
                                        : "+"}
                                </b>
                            </button>

                            {mobileExpanded === item.key && (
                                <div className="cn-mobile-submenu">

                                    <Link
                                        href={item.href}
                                        onClick={() =>
                                            setMobileOpen(false)
                                        }
                                    >
                                        Overview
                                        <Arrow diagonal />
                                    </Link>

                                    {item.entries.map(
                                        (entry) => (
                                            <Link
                                                key={entry.title}
                                                href={entry.href}
                                                onClick={() =>
                                                    setMobileOpen(
                                                        false
                                                    )
                                                }
                                            >
                                                {entry.title}
                                                <Arrow diagonal />
                                            </Link>
                                        )
                                    )}
                                </div>
                            )}
                        </section>
                    ))}
                </div>

                {/* MOBILE FOOTER */}

                <div className="cn-mobile-footer">
                    <Link
                        href={quick.href}
                        onClick={() => setMobileOpen(false)}
                    >
                        {quick.label}
                        <Arrow diagonal />
                    </Link>

                    <Link
                        href={contact.href}
                        onClick={() => setMobileOpen(false)}
                    >
                        {contact.label}
                        <Arrow diagonal />
                    </Link>
                </div>
            </aside>

            {/* PAGE CONTENT */}

            <div className="cn-page-shell">
                {children}
            </div>
        </>
    );
}
