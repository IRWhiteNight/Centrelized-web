import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/* Cinematic entrance: counts 0-100, then wipes upward to reveal the page. */
export default function PsbLoader() {
    const [n, setN] = useState(0), [done, setDone] = useState(false);
    useEffect(() => {
        document.body.style.overflow = done ? '' : 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [done]);
    useEffect(() => {
        const t0 = performance.now();
        let raf;
        const step = (t) => {
            const p = Math.min(1, (t - t0) / 2000);
            setN(Math.round(100 * (1 - (1 - p) ** 3)));
            if (p < 1) raf = requestAnimationFrame(step); else setTimeout(() => setDone(true), 250);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, []);
    return (
        <AnimatePresence>
            {!done && (
                <motion.div className="p-loader" exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }} aria-hidden="true">
                    <small>{String(n).padStart(3, '0')}%</small>
                    <h2>Perlis <span className="p-hl">Airspace</span> Sandbox</h2>
                    <div className="p-loader-bar"><i style={{ transform: `scaleX(${n / 100})` }} /></div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
