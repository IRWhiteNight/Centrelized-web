import { Fragment, useEffect, useRef } from 'react';
import '../../../css/PSB-css/psb-visionmission.css';

const visionItems = [
    {
        number: '01',
        title: 'Regional AAM Hub',
        description:
            'Position Malaysia as a leading Advanced Air Mobility hub in Southeast Asia.',
    },
    {
        number: '02',
        title: 'Sustainable Cities',
        description:
            'Support carbon neutrality through smarter, cleaner and connected urban environments.',
    },
    {
        number: '03',
        title: 'Accessible Air Travel',
        description:
            'Make safe, autonomous and environmentally responsible air mobility accessible to everyone.',
    },
];

const missionItems = [
    {
        number: '01',
        title: 'Accelerate Commercialisation',
        description:
            'Move eVTOL technology closer to safe, practical commercial operations.',
    },
    {
        number: '02',
        title: 'Validate Regulations',
        description:
            'Use controlled sandbox trials to generate operational data and inform Malaysia’s regulatory framework.',
    },
    {
        number: '03',
        title: 'Establish Operational Safety',
        description:
            'Validate the safe operation of autonomous and remotely piloted aircraft before wider deployment.',
    },
    {
        number: '04',
        title: 'Transform Mobility',
        description:
            'Explore more efficient transportation for passengers, cargo and emergency services.',
    },
];

/* Splits text into words. Each word rises out of a mask, one after another.
   delay = when the first word starts (ms), step = gap between words (ms).
   accentFrom = index of the first word that gets the accent colour. */
function Words({ text, delay = 0, step = 45, accentFrom = Infinity }) {
    const words = text.split(' ');

    return (
        <span
            className="vm-words"
            style={{ '--d': `${delay}ms`, '--step': `${step}ms` }}
        >
            {/* real text for screen readers, split words are hidden from them */}
            <span className="vm-sr">{text}</span>

            <span aria-hidden="true">
                {words.map((word, i) => (
                    <Fragment key={i}>
                        <span className={`vm-w ${i >= accentFrom ? 'is-accent' : ''}`}>
                            <span style={{ '--i': i }}>{word}</span>
                        </span>{' '}
                    </Fragment>
                ))}
            </span>
        </span>
    );
}

function Group({ kind, label, title, items, delay, cardBase }) {
    return (
        <div
            className={`vm-group vm-group--${kind}`}
            style={{ '--cols': items.length }}
        >
            <div className="vm-group-head">
                <span className="vm-label">
                    <Words text={label} delay={delay} />
                </span>
                <h3>
                    <Words text={title} delay={delay + 120} />
                </h3>
            </div>

            <div className="vm-cards">
                {items.map((item, i) => {
                    const cardDelay = cardBase + i * 160;
                    const titleDelay = cardDelay + 250;
                    const descDelay =
                        titleDelay + item.title.split(' ').length * 45 + 120;

                    return (
                        <article
                            className="vm-card"
                            key={item.number}
                            style={{ '--cd': `${cardDelay}ms` }}
                        >
                            <div className="vm-card-top">
                                <span className="vm-num">{item.number}</span>
                                <span className="vm-arrow" aria-hidden="true">↗</span>
                            </div>

                            <div className="vm-card-text">
                                <h4>
                                    <Words text={item.title} delay={titleDelay} />
                                </h4>
                                <p>
                                    <Words
                                        text={item.description}
                                        delay={descDelay}
                                        step={28}
                                    />
                                </p>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default function VisionMission() {
    const ref = useRef(null);

    // Start the word animation once when the section comes into view
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (!('IntersectionObserver' in window)) {
            el.classList.add('is-in', 'is-inview');
            return;
        }

        const io = new IntersectionObserver(
            ([entry]) => {
                el.classList.toggle('is-inview', entry.isIntersecting);
                if (entry.isIntersecting) el.classList.add('is-in');
            },
            { threshold: 0.3 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <section
            id="vision-mission"
            className="vm"
            ref={ref}
            aria-label="Our vision and mission"
        >
            {/* Left: navy headline panel */}
            <div className="vm-intro">
                <span className="vm-orbit" aria-hidden="true" />

                <p className="vm-eyebrow">
                    <Words text="Our purpose" delay={100} />
                </p>

                <h2>
                    <Words
                        text="A Different Way to See the Sky"
                        delay={250}
                        step={80}
                        accentFrom={4}
                    />
                </h2>

                <p className="vm-intro-text">
                    <Words
                        text="Building the foundations for a future where air mobility connects people, communities and opportunities."
                        delay={900}
                        step={30}
                    />
                </p>
            </div>

            {/* Right: vision + mission cards */}
            <div className="vm-content">
                <Group
                    kind="vision"
                    label="01 / OUR VISION"
                    title="What we aspire to."
                    items={visionItems}
                    delay={500}
                    cardBase={600}
                />
                <Group
                    kind="mission"
                    label="02 / OUR MISSION"
                    title="How we make it happen."
                    items={missionItems}
                    delay={900}
                    cardBase={1000}
                />
            </div>
        </section>
    );
}
