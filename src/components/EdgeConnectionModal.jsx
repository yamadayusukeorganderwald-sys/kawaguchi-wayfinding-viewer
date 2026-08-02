import { useState } from "react";

function EdgeConnectionModal({
    newPlace,
    places,
    onConfirm,
    onSkip,
}) {
    const [selectedPlaceIds, setSelectedPlaceIds] =
        useState([]);

    const togglePlace = (placeId) => {
        setSelectedPlaceIds((current) => {
            if (current.includes(placeId)) {
                return current.filter((id) => id !== placeId);
            }

            return [...current, placeId];
        });
    };

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
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return Math.round(earthRadius * c);
    };

    const candidatePlaces = places
        .filter((place) => place.id !== newPlace.id)
        .map((place) => ({
            ...place,
            distance: calculateDistanceMeters(
                newPlace.longitude,
                newPlace.latitude,
                place.longitude,
                place.latitude
            ),
        }))
        .sort((a, b) => a.distance - b.distance);

    if (!newPlace) return null;

    return (
        <div
            onClick={onSkip}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.35)",
            }}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                style={{
                    width: "min(360px, calc(100vw - 24px))",
                    maxHeight: "80vh",
                    overflowY: "auto",
                    padding: "24px",
                    boxSizing: "border-box",
                    borderRadius: "12px",
                    background: "#fff",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "18px",
                        }}
                    >
                        接続先を選択
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={onSkip}
                            style={{
                                padding: "6px 12px",
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                                background: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            スキップ
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onConfirm(selectedPlaceIds)
                            }
                            style={{
                                padding: "6px 12px",
                                border: "none",
                                borderRadius: "6px",
                                background: "#2196f3",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            エッジ登録
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        marginBottom: "16px",
                        fontSize: "12px",
                        color: "#666",
                    }}
                >
                    「{newPlace.name}」と接続する地点を選んでください
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginBottom: "20px",
                    }}
                >
                    {candidatePlaces.map((place) => (
                        <label
                            key={place.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedPlaceIds.includes(place.id)}
                                onChange={() => togglePlace(place.id)}
                            />

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    width: "100%",
                                }}
                            >
                                <span>{place.name}</span>

                                <span
                                    style={{
                                        fontSize: "12px",
                                        color: "#666",
                                    }}
                                >
                                    {place.distance}m
                                </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EdgeConnectionModal;