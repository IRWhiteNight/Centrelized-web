import { useEffect, useMemo, useState } from 'react';
import '../../css/newsfeed.css';

function Thumb({ src, source }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="news-thumb news-thumb--empty" aria-hidden="true">
                <span>{(source || 'PSB').slice(0, 2).toUpperCase()}</span>
            </div>
        );
    }

    return (
        <div className="news-thumb">
            <img
                src={src}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setFailed(true)}
            />
        </div>
    );
}

export default function NewsFeed() {
    const [items, setItems] = useState(null);

    useEffect(() => {
        fetch('/api/news')
            .then((r) => r.json())
            .then(setItems)
            .catch(() => setItems([]));
    }, []);

    const byYear = useMemo(() => {
        const groups = {};
        (items ?? []).forEach((n) => {
            const y = new Date(n.date).getFullYear();
            (groups[y] ||= []).push(n);
        });
        return Object.entries(groups).sort((a, b) => b[0] - a[0]);
    }, [items]);

    if (items === null) return <p>Loading news…</p>;
    if (items.length === 0) return <p>No articles found.</p>;

    return (
        <div className="news">
            {byYear.map(([year, list]) => (
                <section key={year} className="news-year">
                    <h3>{year}</h3>

                    <ul className="news-grid">
                        {list.map((n) => (
                            <li key={n.url}>
                                <a
                                    className="news-card"
                                    href={n.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Thumb src={n.image} source={n.source} />
                                    <div className="news-body">
                                        <span className="news-source">{n.source}</span>
                                        <span className="news-title">{n.title}</span>
                                        <time dateTime={n.date}>
                                            {new Date(n.date).toLocaleDateString('en-GB', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </time>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
