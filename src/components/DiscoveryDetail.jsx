function DiscoveryDetail({
    discovery,
    places,
    edges,
    onClose,
    onDelete,
    onEdit,
}) {
    if (!discovery) return null;

    const connectedPlace = discovery.connected_place_id
        ? places.find(
            (place) =>
                place.id === discovery.connected_place_id
        )
        : null;

    const connectedEdge = discovery.connected_edge_id
        ? edges.find(
            (edge) =>
                edge.id === discovery.connected_edge_id
        )
        : null;

    const edgeFromPlace = connectedEdge
        ? places.find(
            (place) => place.id === connectedEdge.from
        )
        : null;

    const edgeToPlace = connectedEdge
        ? places.find(
            (place) => place.id === connectedEdge.to
        )
        : null;

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

    const placeDistance = connectedPlace
        ? calculateDistanceMeters(
            discovery.longitude,
            discovery.latitude,
            connectedPlace.longitude,
            connectedPlace.latitude
        )
        : null;

    const edgeDistance =
        connectedEdge && edgeFromPlace && edgeToPlace
            ? calculateDistanceMeters(
                discovery.longitude,
                discovery.latitude,
                (
                    edgeFromPlace.longitude +
                    edgeToPlace.longitude
                ) / 2,
                (
                    edgeFromPlace.latitude +
                    edgeToPlace.latitude
                ) / 2
            )
            : null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.25)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                zIndex: 10000,
            }}
            onClick={onClose}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    padding: "20px",
                    paddingBottom:
                        "calc(20px + env(safe-area-inset-bottom))",
                    background: "#ffffff",
                    borderRadius: "20px 20px 0 0",
                    boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
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
                            🌱 この場所で見つかったこと
                        </div>

                        <p
                            style={{
                                margin: "12px 0 0",
                                fontSize: "18px",
                                lineHeight: 1.6,
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {discovery.message}
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexShrink: 0,
                        }}
                    >
                        <button
                            type="button"
                            onClick={onEdit}
                            aria-label="編集"
                            style={{
                                width: "36px",
                                height: "36px",
                                border: "none",
                                borderRadius: "50%",
                                background: "#f2f2f2",
                                fontSize: "18px",
                                cursor: "pointer",
                            }}
                        >
                            ✏️
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            aria-label="削除"
                            style={{
                                width: "36px",
                                height: "36px",
                                border: "none",
                                borderRadius: "50%",
                                background: "#f2f2f2",
                                fontSize: "18px",
                                cursor: "pointer",
                            }}
                        >
                            🗑
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="閉じる"
                            style={{
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
                </div>
                {discovery.image_url && (
                    <div
                        style={{
                            width: "100%",
                            marginTop: "16px",
                            overflow: "hidden",
                            borderRadius: "14px",
                            background: "#eeeeee",
                        }}
                    >
                        <img
                            src={discovery.image_url}
                            alt="発見の写真"
                            style={{
                                display: "block",
                                width: "100%",
                                height: "240px",
                                objectFit: "cover",
                                objectPosition: "center center",
                            }}
                        />
                    </div>
                )}

                {connectedPlace && (
                    <div
                        style={{
                            marginTop: "16px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            background: "#f4fbf4",
                            color: "#357a38",
                            fontSize: "14px",
                        }}
                    >
                        📍 {connectedPlace.name}まで約{placeDistance}m
                    </div>
                )}

                {connectedEdge && (
                    <div
                        style={{
                            marginTop: "16px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            background: "#f4fbf4",
                            color: "#357a38",
                            fontSize: "14px",
                        }}
                    >
                        ─ {edgeFromPlace?.name} → {edgeToPlace?.name}
                        まで約{edgeDistance}m
                    </div>
                )}

                {discovery.created_at && (
                    <div
                        style={{
                            marginTop: "18px",
                            color: "#777",
                            fontSize: "13px",
                        }}
                    >
                        {new Date(
                            discovery.created_at
                        ).toLocaleString("ja-JP")}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DiscoveryDetail;