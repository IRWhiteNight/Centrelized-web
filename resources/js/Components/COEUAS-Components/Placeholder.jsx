import { Head, Link } from "@inertiajs/react";

/* Temporary page for every route that is not built yet.
   Replace a route's component in routes/COEUASweb.php when its real page exists. */
export default function Placeholder({ title, group, params = {}, siblings = [] }) {
  const s = {
    wrap: { minHeight: "100vh", background: "#000", color: "#f5f5f7", padding: "120px 8vw", fontFamily: "'SF Pro Display',-apple-system,Inter,sans-serif" },
    tag: { color: "#2997ff", fontSize: 14 },
    h1: { fontSize: "clamp(36px,6vw,80px)", letterSpacing: "-.045em", margin: "10px 0 14px" },
    p: { color: "#9aa4b8", maxWidth: 560, lineHeight: 1.5 },
    a: { color: "#2997ff", marginRight: 22, display: "inline-block", marginTop: 18 },
  };
  return (
    <main style={s.wrap}>
      <Head title={`${title} | COE-UAS`} />
      <div style={s.tag}>{group}</div>
      <h1 style={s.h1}>{title}</h1>
      <p style={s.p}>This page is not built yet.{Object.keys(params).length ? <> Parameters: <code>{JSON.stringify(params)}</code></> : null}</p>
      <div>
        <Link style={s.a} href="/">Back to Home</Link>
        {siblings.map((p) => <Link key={p.href} style={s.a} href={p.href}>{p.title}</Link>)}
      </div>
    </main>
  );
}
