import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Circle,
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../../css/PSB-css/psb-airspace-explorer.css";

/**
 * Lightweight Leaflet version of AirspaceExplorer.
 * Uses standard 2D tiles instead of WebGL, so WebGL2 is not required.
 * The location is an approximate village reference. Demo zones/routes are
 * illustrative only and must not be treated as approved operational data.
 */

const SITE = { lat: 6.50743, lng: 100.17922 };
const ROUTE = [
    [SITE.lat, SITE.lng],
    [SITE.lat + 0.009, SITE.lng + 0.012],
    [SITE.lat + 0.004, SITE.lng + 0.025],
    [SITE.lat + 0.017, SITE.lng + 0.034],
];

const DRONE_ICON = L.divIcon({
    className: "ae-leaflet-drone-icon",
    html: '<span class="ae-drone-marker"><span>✦</span></span>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
});

const SITE_ICON = L.divIcon({
    className: "ae-leaflet-site-icon",
    html: '<span class="ae-site-marker"><span class="ae-site-marker__pulse"></span><span class="ae-site-marker__dot"></span></span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

function MapController({ focusMode, resetToken, onCoordsChange }) {
    const map = useMap();

    useEffect(() => {
        // Invalidate once after the layout has settled; avoids a blank/partial map
        // when the map is inside a grid or animated section.
        const id = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
        const updateCoords = () => {
            const center = map.getCenter();
            onCoordsChange([center.lat, center.lng]);
        };
        map.on("moveend", updateCoords);
        return () => {
            cancelAnimationFrame(id);
            map.off("moveend", updateCoords);
        };
    }, [map, onCoordsChange]);

    useEffect(() => {
        map.setView(
            [SITE.lat, SITE.lng],
            focusMode ? 13 : 11.5,
            { animate: true, duration: 0.35 }
        );
    }, [map, focusMode]);

    useEffect(() => {
        if (resetToken > 0) {
            map.flyTo([SITE.lat, SITE.lng], focusMode ? 13 : 11.5, {
                animate: true,
                duration: 0.7,
            });
        }
    }, [map, resetToken, focusMode]);

    return null;
}

function FlightSimulation({ running, onFinish, onMarkerReady, resetToken }) {
    const map = useMap();
    const markerRef = useRef(null);
    const frameRef = useRef(0);

    useEffect(() => {
        const marker = markerRef.current;
        if (marker) onMarkerReady(marker);
    }, [onMarkerReady]);

    useEffect(() => {
        cancelAnimationFrame(frameRef.current);

        if (!running) {
            markerRef.current?.setLatLng(ROUTE[0]);
            return undefined;
        }

        map.flyTo([SITE.lat + 0.008, SITE.lng + 0.016], 13, {
            animate: true,
            duration: 0.6,
        });

        const duration = 10000;
        let start = 0;

        const animate = (now) => {
            if (!start) start = now;
            const progress = Math.min((now - start) / duration, 1);
            const scaled = progress * (ROUTE.length - 1);
            const segment = Math.min(Math.floor(scaled), ROUTE.length - 2);
            const t = progress >= 1 ? 1 : scaled - segment;
            const a = ROUTE[segment];
            const b = ROUTE[segment + 1];
            const lat = a[0] + (b[0] - a[0]) * t;
            const lng = a[1] + (b[1] - a[1]) * t;

            markerRef.current?.setLatLng([lat, lng]);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                onFinish();
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [running, map, onFinish, resetToken]);

    return <Marker ref={markerRef} position={ROUTE[0]} icon={DRONE_ICON} zIndexOffset={1000} />;
}

export default function AirspaceExplorer() {
    const [focusMode, setFocusMode] = useState(false);
    const [showZones, setShowZones] = useState(true);
    const [showRoute, setShowRoute] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [resetToken, setResetToken] = useState(0);
    const [coords, setCoords] = useState([SITE.lat, SITE.lng]);
    const mapRef = useRef(null);

    const routeLine = useMemo(() => ROUTE, []);
    const onMarkerReady = useCallback((marker) => {
        // Keep a handle if additional external controls are needed later.
        mapRef.current = marker;
    }, []);
    const finishSimulation = useCallback(() => setIsSimulating(false), []);

    const resetView = () => {
        setIsSimulating(false);
        setResetToken((n) => n + 1);
        setCoords([SITE.lat, SITE.lng]);
    };

    const toggleSimulation = () => {
        if (isSimulating) {
            setIsSimulating(false);
            return;
        }
        setShowRoute(true);
        setIsSimulating(true);
    };

    return (
        <section className="airspace-explorer" aria-label="Interactive airspace location map">
            <div className="ae-heading">
                <div>
                    <span className="ae-eyebrow"><i /> LOCATION INTELLIGENCE / 02</span>
                    <h2>Explore the <span>Airspace.</span></h2>
                    <p>Explore the Perlis landscape and discover the sandbox area from a new perspective.</p>
                </div>
                <div className="ae-live-tag"><span /> INTERACTIVE MAP</div>
            </div>

            <div className="ae-console">
                <aside className="ae-sidebar">
                    <div className="ae-side-top">
                        <span className="ae-index">PAS / GEO-01</span>
                        <span className="ae-status"><i /> MAP ONLINE</span>
                    </div>

                    <div className="ae-location-copy">
                        <span className="ae-label">SELECTED AREA</span>
                        <h3>Sungai Batu<br />Pahat</h3>
                        <p>Perlis, Malaysia</p>
                        <div className="ae-coord-block">
                            <span>REFERENCE COORDINATES</span>
                            <strong>{SITE.lat.toFixed(5)}° N</strong>
                            <strong>{SITE.lng.toFixed(5)}° E</strong>
                            <small>Approximate village reference — verify the actual site coordinates.</small>
                        </div>
                    </div>

                    <div className="ae-control-group">
                        <span className="ae-label">MAP DETAIL</span>
                        <div className="ae-segmented">
                            <button className={!focusMode ? "active" : ""} onClick={() => setFocusMode(false)}>OVERVIEW</button>
                            <button className={focusMode ? "active" : ""} onClick={() => setFocusMode(true)}>CLOSE VIEW</button>
                        </div>
                    </div>

                    <div className="ae-control-group">
                        <span className="ae-label">VISUAL LAYERS</span>
                        <button className={`ae-layer-toggle ${showZones ? "enabled" : ""}`} onClick={() => setShowZones((v) => !v)}>
                            <span className="ae-layer-symbol ae-symbol-zone">◎</span>
                            <span><strong>Demonstration zone</strong><small>Illustrative boundary</small></span>
                            <i className="ae-toggle-dot" />
                        </button>
                        <button className={`ae-layer-toggle ${showRoute ? "enabled" : ""}`} onClick={() => setShowRoute((v) => !v)}>
                            <span className="ae-layer-symbol ae-symbol-route">⌁</span>
                            <span><strong>Flight path</strong><small>Sample route only</small></span>
                            <i className="ae-toggle-dot" />
                        </button>
                    </div>

                    <div className="ae-action-row">
                        <button className="ae-primary-action" onClick={toggleSimulation}>
                            <span>{isSimulating ? "■" : "▶"}</span>
                            {isSimulating ? "STOP SIMULATION" : "SIMULATE FLIGHT"}
                        </button>
                        <button className="ae-reset-action" onClick={resetView} aria-label="Reset map view" title="Reset map view">↺</button>
                    </div>
                    <p className="ae-disclaimer">DEMO MODE · Zones and routes are illustrative, not approved operational data.</p>
                </aside>

                <div className="ae-map-wrap">
                    <div className="ae-map-topbar">
                        <span><i /> GEO-SPATIAL VIEWER</span>
                        <span className="ae-map-mode">{focusMode ? "CLOSE VIEW" : "OVERVIEW"}</span>
                    </div>

                    <MapContainer
                        center={[SITE.lat, SITE.lng]}
                        zoom={11.5}
                        minZoom={5}
                        maxZoom={18}
                        scrollWheelZoom
                        zoomControl={false}
                        preferCanvas
                        fadeAnimation={false}
                        markerZoomAnimation={false}
                        className="ae-map-canvas"
                    >
                        <TileLayer
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                            keepBuffer={2}
                            updateWhenIdle
                            updateWhenZooming={false}
                            crossOrigin
                        />
                        <MapController
                            focusMode={focusMode}
                            resetToken={resetToken}
                            onCoordsChange={setCoords}
                        />

                        <Marker position={[SITE.lat, SITE.lng]} icon={SITE_ICON}>
                            <Popup>
                                <div className="ae-popup">
                                    <strong>SUNGAI BATU PAHAT</strong>
                                    <span>Approximate area marker</span>
                                </div>
                            </Popup>
                        </Marker>

                        {showZones && (
                            <Circle
                                center={[SITE.lat, SITE.lng]}
                                radius={1200}
                                pathOptions={{
                                    color: "#2DBAFC",
                                    weight: 2,
                                    dashArray: "6 7",
                                    fillColor: "#2DBAFC",
                                    fillOpacity: 0.12,
                                }}
                            />
                        )}

                        {showRoute && (
                            <>
                                <Polyline positions={routeLine} pathOptions={{ color: "#2DBAFC", weight: 8, opacity: 0.18 }} />
                                <Polyline positions={routeLine} pathOptions={{ color: "#70e3ff", weight: 3, opacity: 0.95, dashArray: "8 8" }} />
                            </>
                        )}

                        <FlightSimulation
                            running={isSimulating}
                            onFinish={finishSimulation}
                            onMarkerReady={onMarkerReady}
                            resetToken={resetToken}
                        />
                    </MapContainer>

                    <div className="ae-map-crosshair" aria-hidden="true"><span /><i /></div>
                    <div className="ae-map-coordinate">
                        <span>MAP CENTRE</span>
                        <strong>{Number(coords[0]).toFixed(4)}° N / {Number(coords[1]).toFixed(4)}° E</strong>
                    </div>
                    <div className="ae-map-legend">
                        <span><i className="legend-zone" /> DEMO ZONE</span>
                        <span><i className="legend-route" /> SAMPLE ROUTE</span>
                    </div>
                </div>
            </div>

            <div className="ae-footerline">
                <span>BASEMAP: OPENSTREETMAP</span>
                <span>POWERED BY LEAFLET</span>
                <span>NOT FOR NAVIGATION</span>
            </div>
        </section>
    );
}
