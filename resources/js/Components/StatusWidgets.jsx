import { useEffect, useRef, useState } from 'react';
import '../../css/widgets.css';

// Kangar, Perlis
const LAT = 6.4449;
const LON = 100.2048;
const TZ = 'Asia/Kuala_Lumpur';

const API =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${LAT}&longitude=${LON}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,' +
    'weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m' +
    `&wind_speed_unit=kmh&timezone=${encodeURIComponent(TZ)}`;

const COMPASS = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];
const toCompass = (deg) => COMPASS[Math.round(deg / 22.5) % 16];

function describe(code) {
    if (code === 0) return 'Clear sky';
    if (code <= 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code <= 48) return 'Fog';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 82) return 'Showers';
    return 'Thunderstorm';
}

// Rough guide only, not an official flight limit
function advisory(speed, gust) {
    const worst = Math.max(speed, gust);
    if (worst < 20) return { text: 'Favourable', level: 'ok' };
    if (worst < 35) return { text: 'Caution', level: 'warn' };
    return { text: 'Not advised', level: 'bad' };
}

function useWeather() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const ctrl = new AbortController();

        const load = async () => {
            try {
                const res = await fetch(API, { signal: ctrl.signal });
                if (!res.ok) throw new Error(res.status);
                setData((await res.json()).current);
                setError(false);
            } catch (e) {
                if (e.name !== 'AbortError') setError(true);
            }
        };

        load();
        const id = setInterval(load, 10 * 60 * 1000);
        return () => {
            ctrl.abort();
            clearInterval(id);
        };
    }, []);

    return { data, error };
}

// Numbers count up to their value (only once the section is visible)
function useCount(target, ms = 1400) {
    const [value, setValue] = useState(0);
    const last = useRef(0);

    useEffect(() => {
        if (target == null) return;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            last.current = target;
            setValue(target);
            return;
        }

        const from = last.current;
        const start = performance.now();
        let raf;

        const step = (t) => {
            const p = Math.min((t - start) / ms, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            last.current = from + (target - from) * eased;
            setValue(last.current);
            if (p < 1) raf = requestAnimationFrame(step);
        };

        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target, ms]);

    return value;
}

const timeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
const dateFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
});
const utcFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false,
});

// A new digit rises into place (remounts when the value changes)
function Digit({ v }) {
    return (
        <span className="dg">
            <span key={v}>{v}</span>
        </span>
    );
}

function Label({ index, name, live, off }) {
    return (
        <div className="w-label">
            <span className="w-index">{index}</span>
            <span className="w-name">{name}</span>
            {live && <span className={`w-live ${off ? 'is-off' : ''}`}>{off ? 'offline' : 'live'}</span>}
        </div>
    );
}

function Weather({ data, error, inView }) {
    const temp = useCount(inView && data ? data.temperature_2m : null);

    return (
        <div className="w-item">
            <Label index="01" name="Weather · Perlis" live off={error} />
            <div className="w-big">
                {data ? Math.round(temp) : '--'}
                <span className="w-unit">°C</span>
            </div>
            <div className="w-line">
                {data ? describe(data.weather_code) : error ? 'Data unavailable' : 'Loading'}
            </div>
            <div className="w-meta">
                {data
                    ? `Feels ${Math.round(data.apparent_temperature)}° / Humidity ${data.relative_humidity_2m}%`
                    : '\u00A0'}
            </div>
        </div>
    );
}

function Clock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const [h, m, s] = timeFmt.format(now).split(':');

    return (
        <div className="w-item">
            <Label index="02" name="Local time · MYT" />
            <div className="w-big w-clock">
                <Digit v={h[0]} /><Digit v={h[1]} />
                <span className="colon">:</span>
                <Digit v={m[0]} /><Digit v={m[1]} />
                <span className="w-sec">
                    <Digit v={s[0]} /><Digit v={s[1]} />
                </span>
            </div>
            <div className="w-line">{dateFmt.format(now)}</div>
            <div className="w-meta">UTC {utcFmt.format(now)}Z</div>
        </div>
    );
}

function Wind({ data, error, inView }) {
    const speed = useCount(inView && data ? data.wind_speed_10m : null);
    const dir = data ? data.wind_direction_10m : 0;
    const adv = data ? advisory(data.wind_speed_10m, data.wind_gusts_10m) : null;

    return (
        <div className="w-item">
            <Label index="03" name="Wind status" live off={error} />
            <div className="w-split">
                <div>
                    <div className="w-big">
                        {data ? Math.round(speed) : '--'}
                        <span className="w-unit">km/h</span>
                    </div>
                    <div className="w-line">
                        {data ? `From ${toCompass(dir)} / Gust ${Math.round(data.wind_gusts_10m)}` : 'Loading'}
                    </div>
                    <div className={`w-meta w-adv ${adv ? `is-${adv.level}` : ''}`}>
                        {adv ? adv.text : '\u00A0'}
                    </div>
                </div>

                <svg className="w-dial" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="44" className="d-ring" />
                    <path d="M50 2 V10 M98 50 H90 M50 98 V90 M2 50 H10" className="d-tick" />
                    {/* needle points where the wind is blowing TO */}
                    <g
                        className="d-needle"
                        style={{ transform: `rotate(${inView ? (dir + 180) % 360 : 0}deg)` }}
                    >
                        <path d="M50 58 V12" />
                        <circle cx="50" cy="12" r="3" />
                    </g>
                    <circle cx="50" cy="50" r="2" className="d-hub" />
                </svg>
            </div>
        </div>
    );
}

function Locator() {
    return (
        <div className="w-item">
            <Label index="04" name="Airspace locator" />
            <div className="w-split">
                <div>
                    <div className="w-big">
                        {LAT.toFixed(2)}
                        <span className="w-unit">°N</span>
                    </div>
                    <div className="w-line">{LON.toFixed(2)}°E / Kangar, Perlis</div>
                    <div className="w-meta">Perlis Airspace Sandbox</div>
                </div>

                <svg className="w-dial" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="44" className="d-ring" />
                    <circle cx="50" cy="50" r="28" className="d-ring" />
                    <circle cx="50" cy="50" r="12" className="d-ring" />
                    <circle cx="50" cy="50" r="20" className="d-zone" />
                    <g className="d-sweep">
                        <path d="M50 50 L50 6 A44 44 0 0 1 81 19 Z" />
                        <path d="M50 50 V6" className="d-sweep-line" />
                    </g>
                    <circle cx="50" cy="50" r="2.5" className="d-hub" />
                    <circle cx="50" cy="50" r="2.5" className="d-ping" />
                </svg>
            </div>
        </div>
    );
}

export default function StatusWidgets() {
    const { data, error } = useWeather(); // one request feeds weather and wind
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    // Play the entrance when the section is actually on screen
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    io.disconnect();
                }
            },
            { threshold: 0.35 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <section
            ref={ref}
            className={`widget ${inView ? 'is-in' : ''}`}
            aria-label="Live status"
        >
            <div className="widget-row">
                <Weather data={data} error={error} inView={inView} />
                <Clock />
                <Wind data={data} error={error} inView={inView} />
                <Locator />
            </div>
        </section>
    );
}
