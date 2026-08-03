import { useMemo, useState } from "react";

const calculateDistanceMeters = (
    fromLongitude,
    fromLatitude,
    toLongitude,
    toLatitude
) => {
    const earthRadius = 6371000;

    const toRadians = (degrees) =>
        degrees * Math.PI / 180;

    const latitude1 = toRadians(fromLatitude);
    const latitude2 = toRadians(toLatitude);

    const latitudeDifference = toRadians(
        toLatitude - fromLatitude
    );

    const longitudeDifference = toRadians(
        toLongitude - fromLongitude
    );

    const a =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(latitude1) *
        Math.cos(latitude2) *
        Math.sin(longitudeDifference / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return Math.round(earthRadius * c);
};

function DiscoveryConnectionModal({
    discovery,
    places,
    edges,
    onConfirm,
    onSkip,
    onClose,
}) {
    const [selectedType, setSelectedType] =
        useState("none");

    const [selectedPlaceId, setSelectedPlaceId] =
        useState("");

    const [selectedEdgeId, setSelectedEdgeId] =
        useState("");

    const nearbyPlaces = useMemo(() => {
        if (!discovery) return [];

        return places
            .map((place) => ({
                ...place,
                distance: calculateDistanceMeters(
                    discovery.longitude,
                    discovery.latitude,
                    place.longitude,
                    place.latitude
                ),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
    }, [discovery, places]);

    const nearbyEdges = useMemo(() => {
        if (!discovery) return [];

        return edges
            .map((edge) => {
                const fromPlace = places.find(
                    (place) => place.id === edge.from
                );

                const toPlace = places.find(
                    (place) => place.id === edge.to
                );

                if (!fromPlace || !toPlace) {
                    return null;
                }

                const midpointLongitude =
                    (
                        fromPlace.longitude +
                        toPlace.longitude
                    ) / 2;

                const midpointLatitude =
                    (
                        fromPlace.latitude +
                        toPlace.latitude
                    ) / 2;

                return {
                    ...edge,
                    fromPlace,
                    toPlace,
                    distance: calculateDistanceMeters(
                        discovery.longitude,
                        discovery.latitude,
                        midpointLongitude,
                        midpointLatitude
                    ),
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
    }, [discovery, edges, places]);

    const handleConfirm = () => {
        onConfirm({
            connectedPlaceId:
                selectedType === "place"
                    ? selectedPlaceId
                    : null,

            connectedEdgeId:
                selectedType === "edge"
                    ? selectedEdgeId
                    : null,
        });
    };

    if (!discovery) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 10001,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.35)",
            }}
            onClick={onClose}
        >
            <div
                onClick={(event) =>
                    event.stopPropagation()
                }
                style={{
                    boxSizing: "border-box",
                    width: "100%",
                    maxWidth: "520px",
                    maxHeight: "90dvh",
                    overflowY: "auto",
                    padding: "20px",
                    paddingBottom:
                        "calc(20px + env(safe-area-inset-bottom))",
                    background: "#ffffff",
                    borderRadius: "20px 20px 0 0",
                    boxShadow:
                        "0 -4px 20px rgba(0,0,0,0.2)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "16px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                color: "#4CAF50",
                                fontSize: "13px",
                                fontWeight: "bold",
                            }}
                        >
                            🌱 発見
                        </div>

                        <h2
                            style={{
                                margin: "4px 0 0",
                                fontSize: "20px",
                            }}
                        >
                            近くの場所につなぎますか？
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        style={{
                            flexShrink: 0,
                            width: "36px",
                            height: "36px",
                            border: "none",
                            borderRadius: "50%",
                            background: "#f2f2f2",
                            fontSize: "20px",
                            cursor: "pointer",
                        }}
                    >
                        ×
                    </button>
                </div>

                <section
                    style={{
                        marginTop: "20px",
                    }}
                >
                    <div
                        style={{
                            marginBottom: "10px",
                            fontSize: "14px",
                            fontWeight: "bold",
                        }}
                    >
                        近くの地点
                    </div>

                    {nearbyPlaces.length === 0 && (
                        <div
                            style={{
                                color: "#777",
                                fontSize: "14px",
                            }}
                        >
                            近くの地点がありません
                        </div>
                    )}

                    {nearbyPlaces.map((place) => (
                        <label
                            key={place.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                minHeight: "42px",
                                cursor: "pointer",
                            }}
                        >
                            <input
                                type="radio"
                                name="discoveryConnection"
                                checked={
                                    selectedType ===
                                        "place" &&
                                    selectedPlaceId ===
                                        place.id
                                }
                                onChange={() => {
                                    setSelectedType("place");
                                    setSelectedPlaceId(
                                        place.id
                                    );
                                    setSelectedEdgeId("");
                                }}
                            />

                            <span
                                style={{
                                    flex: 1,
                                }}
                            >
                                📍 {place.name}
                            </span>

                            <span
                                style={{
                                    color: "#777",
                                    fontSize: "13px",
                                }}
                            >
                                {place.distance}m
                            </span>
                        </label>
                    ))}
                </section>

                <section
                    style={{
                        marginTop: "18px",
                    }}
                >
                    <div
                        style={{
                            marginBottom: "10px",
                            fontSize: "14px",
                            fontWeight: "bold",
                        }}
                    >
                        近くの道
                    </div>

                    {nearbyEdges.length === 0 && (
                        <div
                            style={{
                                color: "#777",
                                fontSize: "14px",
                            }}
                        >
                            近くの道がありません
                        </div>
                    )}

                    {nearbyEdges.map((edge) => (
                        <label
                            key={edge.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                minHeight: "42px",
                                cursor: "pointer",
                            }}
                        >
                            <input
                                type="radio"
                                name="discoveryConnection"
                                checked={
                                    selectedType ===
                                        "edge" &&
                                    selectedEdgeId ===
                                        edge.id
                                }
                                onChange={() => {
                                    setSelectedType("edge");
                                    setSelectedEdgeId(
                                        edge.id
                                    );
                                    setSelectedPlaceId("");
                                }}
                            />

                            <span
                                style={{
                                    flex: 1,
                                }}
                            >
                                ─ {edge.fromPlace.name}
                                {" → "}
                                {edge.toPlace.name}
                            </span>

                            <span
                                style={{
                                    color: "#777",
                                    fontSize: "13px",
                                }}
                            >
                                {edge.distance}m
                            </span>
                        </label>
                    ))}
                </section>

                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={selectedType === "none"}
                    style={{
                        width: "100%",
                        height: "50px",
                        marginTop: "20px",
                        border: "none",
                        borderRadius: "25px",
                        background:
                            selectedType === "none"
                                ? "#cccccc"
                                : "#4CAF50",
                        color: "#ffffff",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor:
                            selectedType === "none"
                                ? "default"
                                : "pointer",
                    }}
                >
                    選んだ場所につなぐ
                </button>

                <button
                    type="button"
                    onClick={onSkip}
                    style={{
                        width: "100%",
                        minHeight: "44px",
                        marginTop: "8px",
                        border: "none",
                        background: "transparent",
                        color: "#666666",
                        fontSize: "14px",
                        cursor: "pointer",
                    }}
                >
                    どこにもつながず保存する
                </button>
            </div>
        </div>
    );
}

export default DiscoveryConnectionModal;