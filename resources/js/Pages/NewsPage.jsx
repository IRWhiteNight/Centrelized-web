// Save as: resources/js/Pages/NewsPage.jsx  (or wherever your other pages live)
// Route it in React, e.g. <Route path="/news" element={<NewsPage />} />
import { useCallback, useEffect, useState } from 'react';
import '../../css/news.css';

const REGIONS = [
  { key: '', label: 'All' },
  { key: 'perlis', label: 'Perlis' },
  { key: 'malaysia', label: 'Malaysia' },
  { key: 'global', label: 'Worldwide' },
];

const TYPES = [
  { key: '', label: 'Everything' },
  { key: 'article', label: 'News' },
  { key: 'video', label: 'Videos' },
];

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function timeAgo(date) {
  if (!date) return '';
  const days = Math.round((new Date(date) - new Date()) / 86400000);
  if (Math.abs(days) < 1) {
    const hours = Math.round((new Date(date) - new Date()) / 3600000);
    return rtf.format(hours, 'hour');
  }
  return Math.abs(days) > 30
    ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : rtf.format(days, 'day');
}

function Thumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="news-thumb news-thumb--empty" aria-hidden="true" />;
  return (
    <img
      className="news-thumb"
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function ArticleCard({ item }) {
  return (
    <article className="news-card">
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-card__link">
        <Thumb src={item.image_url} alt="" />
        <div className="news-card__body">
          <h3>{item.title}</h3>
          {item.description && <p>{item.description}</p>}
          <footer>
            {item.source_name} · {timeAgo(item.published_at)}
          </footer>
        </div>
      </a>
    </article>
  );
}

function VideoCard({ item }) {
  const [playing, setPlaying] = useState(false);
  return (
    <article className="news-card news-card--video">
      <div className="news-video">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${item.video_id}?autoplay=1`}
            title={item.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${item.title}`}>
            <Thumb src={item.image_url} alt="" />
            <span className="news-video__play" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="news-card__body">
        <h3>{item.title}</h3>
        <footer>
          {item.source_name} · {timeAgo(item.published_at)}
        </footer>
      </div>
    </article>
  );
}

function Featured({ items }) {
  if (!items.length) return null;
  const [lead, ...rest] = items;
  return (
    <section className="news-featured" aria-labelledby="featured-title">
      <h2 id="featured-title">Perlis Airspace Sandbox in the news</h2>
      <div className="news-featured__grid">
        <a className="news-lead" href={lead.url} target="_blank" rel="noopener noreferrer">
          <Thumb src={lead.image_url} alt="" />
          <div className="news-lead__text">
            <h3>{lead.title}</h3>
            <span>
              {lead.source_name} · {timeAgo(lead.published_at)}
            </span>
          </div>
        </a>
        <div className="news-featured__side">
          {rest.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">
              <Thumb src={item.image_url} alt="" />
              <div>
                <h3>{item.title}</h3>
                <span>
                  {item.source_name} · {timeAgo(item.published_at)}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function NewsPage() {
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [featured, setFeatured] = useState([]);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (pageToLoad, replace) => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({ page: pageToLoad });
        if (region) params.set('region', region);
        if (type) params.set('type', type);
        if (query) params.set('search', query);

        const res = await fetch(`/api/news?${params}`, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();

        // Accept { items: { data: [...] } }, { items: [...] } or { data: [...] }.
        const paged = data.items ?? data;
        const list = Array.isArray(paged) ? paged : paged.data;
        if (!Array.isArray(list)) {
          console.error('Unexpected /api/news response:', data);
          throw new Error('Unexpected response shape');
        }

        setFeatured(Array.isArray(data.featured) ? data.featured : []);
        setItems((prev) => (replace ? list : [...prev, ...list]));
        setPage(paged.current_page ?? 1);
        setLastPage(paged.last_page ?? 1);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [region, type, query]
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  const submitSearch = (e) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <main className="news-page">
      <header className="news-header">
        <h1>News and media</h1>
        <p>Updates on airspace sandboxes around the world, with the latest from Perlis first.</p>
      </header>

      {!query && !region && !type && <Featured items={featured} />}

      <div className="news-filters">
        <div role="group" aria-label="Region">
          {REGIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              className={region === r.key ? 'is-active' : ''}
              aria-pressed={region === r.key}
              onClick={() => setRegion(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Content type">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={type === t.key ? 'is-active' : ''}
              aria-pressed={type === t.key}
              onClick={() => setType(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <form onSubmit={submitSearch} role="search">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search headlines"
            aria-label="Search headlines"
          />
        </form>
      </div>

      {error && (
        <p className="news-message" role="alert">
          The news could not be loaded.{' '}
          <button type="button" onClick={() => load(1, true)}>Try again</button>
        </p>
      )}

      <div className="news-grid">
        {items.map((item) =>
          item.type === 'video' ? <VideoCard key={item.id} item={item} /> : <ArticleCard key={item.id} item={item} />
        )}
      </div>

      {!loading && !error && items.length === 0 && (
        <p className="news-message">No stories match these filters yet. Try another region or clear the search.</p>
      )}

      {loading && <p className="news-message" aria-live="polite">Loading...</p>}

      {!loading && page < lastPage && (
        <div className="news-more">
          <button type="button" onClick={() => load(page + 1, false)}>Show more</button>
        </div>
      )}
    </main>
  );
}
