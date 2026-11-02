import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import '../../css/splash.css';
import psb from '../images/PSB.png';

const MIN_MS = 2400;   // minimum time on screen = grayscale-to-color duration
const HOLD_MS = 300;   // short pause on the full-color logo before leaving
const EXIT_MS = 1000;  // time for the splash to slide down

export default function Splash() {
    // No storage flag, so it plays on every full page load (including hard reload)
    const [done, setDone] = useState(false);

    const rootRef = useRef(null);
    const logoRef = useRef(null);

    // Lock page scroll while the splash is up
    useLayoutEffect(() => {
        if (done) return;
        document.documentElement.classList.add('splash-active');
        return () => document.documentElement.classList.remove('splash-active');
    }, [done]);

    useEffect(() => {
        if (done) return;
        let cancelled = false;

        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const pageLoaded = new Promise((r) => {
            if (document.readyState === 'complete') r();
            else window.addEventListener('load', r, { once: true });
        });

        (async () => {
            await Promise.all([
                pageLoaded,
                wait(MIN_MS),
                document.fonts?.ready,
                logoRef.current?.decode?.().catch(() => {}),
            ]);
            if (cancelled) return;

            const root = rootRef.current;
            root.classList.add('is-leaving'); // fades out the loading bar

            await wait(HOLD_MS);
            if (cancelled) return;

            const reduce = window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            ).matches;

            // Slide the whole splash down; the top corners round as it goes
            const exit = root.animate(
                reduce
                    ? [{ opacity: 1 }, { opacity: 0 }]
                    : [
                          { transform: 'translateY(0)', borderRadius: '0px 0px 0 0' },
                          { transform: 'translateY(100%)', borderRadius: '48px 48px 0 0' },
                      ],
                {
                    duration: reduce ? 400 : EXIT_MS,
                    easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
                    fill: 'forwards',
                }
            );

            await exit.finished;
            if (!cancelled) setDone(true); // removes it from the DOM
        })();

        return () => {
            cancelled = true;
        };
    }, [done]);

    if (done) return null;

    return (
        <div
            ref={rootRef}
            className="splash"
            role="status"
            aria-label="Loading"
            style={{ '--load': `${MIN_MS}ms` }}
        >
            <div className="splash-center">
                <img ref={logoRef} className="splash-logo" src={psb} alt="" />
                <div className="splash-bar" aria-hidden="true">
                    <span />
                </div>
            </div>
        </div>
    );
}
