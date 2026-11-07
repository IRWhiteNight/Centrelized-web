
import { useEffect, useRef } from 'react';
import '../../../css/PSB-css/psb-purposesection.css';
// Place this section inside your Home component.

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

function PurposeSection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        section
            .querySelectorAll('.purpose-reveal')
            .forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, []);


return (
        <section
            className="purpose-section"
            ref={sectionRef}
            aria-label="Our vision and mission"
        >
            <div className="purpose-container">

                <header className="purpose-intro purpose-reveal">
                    <span className="purpose-eyebrow">OUR PURPOSE</span>

                    <h2>
                        Shaping the future
                        <br />
                        <span>of air mobility.</span>
                    </h2>

                    <p>
                        Creating the conditions for safe, sustainable and
                        connected air mobility in Malaysia and beyond.
                    </p>
                </header>

                <div className="purpose-columns">

                    {/* VISION */}
                    <div className="purpose-group">
                        <div className="purpose-heading purpose-reveal">
                            <span className="purpose-label">OUR VISION</span>
                            <h3>A clearer direction.</h3>
                            <p className="purpose-group-intro">
                                The future we are working towards.
                            </p>
                        </div>

                        <div className="purpose-list">
                            {visionItems.map((item, index) => (
                                <article
                                    className="purpose-item purpose-reveal"
                                    key={item.number}
                                    style={{ '--item-index': index }}
                                >
                                    <span className="purpose-number">
                                        {item.number}
                                    </span>

                                    <div className="purpose-item-content">
                                        <h4>{item.title}</h4>
                                        <p>{item.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* MISSION */}
                    <div className="purpose-group">
                        <div className="purpose-heading purpose-reveal">
                            <span className="purpose-label">OUR MISSION</span>
                            <h3>Turning vision into action.</h3>
                            <p className="purpose-group-intro">
                                The work that moves us forward.
                            </p>
                        </div>

                        <div className="purpose-list">
                            {missionItems.map((item, index) => (
                                <article
                                    className="purpose-item purpose-reveal"
                                    key={item.number}
                                    style={{ '--item-index': index }}
                                >
                                    <span className="purpose-number">
                                        {item.number}
                                    </span>

                                    <div className="purpose-item-content">
                                        <h4>{item.title}</h4>
                                        <p>{item.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                </div>

                <footer className="purpose-footer purpose-reveal">
                    <p>
                        Progress begins with a clear purpose.
                    </p>
                    <span className="purpose-footer-mark">
                        PERLIS AIRSPACE SANDBOX
                    </span>
                </footer>

            </div>
        </section>
    );

}

export default PurposeSection;
