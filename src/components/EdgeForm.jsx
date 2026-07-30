import { useEffect, useState } from "react";

function EdgeForm({
    places,
    editingEdge,
    initialEdge,
    onSave,
    onUpdate,
    onClose,
}) {
    const [from, setFrom] = useState(
        editingEdge?.from ?? initialEdge?.from ?? ""
    );

    const [to, setTo] = useState(
        editingEdge?.to ?? initialEdge?.to ?? ""
    );
    const [distance, setDistance] = useState(editingEdge?.distance ?? "");
    const [walkingTime, setWalkingTime] = useState(editingEdge?.walkingTime ?? "");

    const [movementType, setMovementType] = useState(
        editingEdge?.movement_type ?? "level"
    );

    const [roadContext, setRoadContext] = useState(
        editingEdge?.road_context ?? "unknown"
    );

    const isRoadContextFixed = [
        "stairs",
        "escalator",
        "elevator",
    ].includes(movementType);

    const [bidirectional, setBidirectional] = useState(
        editingEdge?.bidirectional ?? true
    );

    useEffect(() => {
        if (!from || !to) return;

        const fromPlace = places.find((p) => p.id === from);
        const toPlace = places.find((p) => p.id === to);

        if (!fromPlace || !toPlace) return;

        const R = 6371000;

        const lat1 = (fromPlace.latitude * Math.PI) / 180;
        const lat2 = (toPlace.latitude * Math.PI) / 180;

        const dLat =
            ((toPlace.latitude - fromPlace.latitude) * Math.PI) / 180;

        const dLon =
            ((toPlace.longitude - fromPlace.longitude) * Math.PI) / 180;

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLon / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distanceMeters = R * c;

        setDistance(Math.round(distanceMeters));

        const speed = 1.2; // m/s

        setWalkingTime(Math.ceil(distanceMeters / speed));
    }, [from, to, places]);

    useEffect(() => {
        if (isRoadContextFixed) {
            setRoadContext("pedestrian_only");
        }
    }, [isRoadContextFixed]);

    return (
        <div
            style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "white",
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                zIndex: 1000,
                width: "320px",
            }}
        >
            <h2>
                {editingEdge ? "Edge編集" : "Edge追加"}
            </h2>

            <div style={{ marginBottom: "12px" }}>
                <label>From</label>

                <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={{
                        display: "block",
                        width: "100%",
                        padding: "6px",
                        backgroundColor: "white",
                        color: "black",
                    }}
                >
                    <option value="">選択してください</option>

                    {places.map((place) => (
                        <option
                            key={place.id}
                            value={place.id}
                            style={{
                                backgroundColor: "white",
                                color: "black",
                            }}
                        >
                            {place.name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>To</label>

                <select
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    style={{
                        display: "block",
                        width: "100%",
                        padding: "6px",
                        backgroundColor: "white",
                        color: "black",
                    }}
                >
                    <option value="">選択してください</option>

                    {places.map((place) => (
                        <option
                            key={place.id}
                            value={place.id}
                            style={{
                                backgroundColor: "white",
                                color: "black",
                            }}
                        >
                            {place.name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>距離（m）</label>

                <input
                    type="number"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    style={{
                        display: "block",
                        width: "100%",
                        padding: "6px",
                        boxSizing: "border-box",
                    }}
                />
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>徒歩時間（秒）</label>

                <input
                    type="number"
                    value={walkingTime}
                    onChange={(e) => setWalkingTime(e.target.value)}
                    style={{
                        display: "block",
                        width: "100%",
                        padding: "6px",
                        boxSizing: "border-box",
                    }}
                />
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>移動方法</label>

                <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    style={{
                        display: "block",
                        width: "100%",
                        padding: "6px",
                        backgroundColor: "white",
                        color: "black",
                    }}
                >
                    <option value="level">平面</option>
                    <option value="stairs">階段</option>
                    <option value="ramp">スロープ</option>
                    <option value="escalator">エスカレーター</option>
                    <option value="elevator">エレベーター</option>
                </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>道路空間との関係</label>

                <select
                    value={roadContext}
                    onChange={(e) => setRoadContext(e.target.value)}
                    disabled={isRoadContextFixed}
                    style={{
                        display: "block",
                        width: "100%",
                        padding: "6px",
                        backgroundColor: "white",
                        color: "black",
                    }}
                >
                    <option value="unknown">未確認</option>
                    <option value="pedestrian_only">歩行者専用空間</option>
                    <option value="sidewalk_separated">車道と明確に分離された歩道</option>
                    <option value="sidewalk_unseparated">白線・舗装差などで弱く分離</option>
                    <option value="shared_street">歩行者・自転車・車両の共用空間</option>
                    <option value="roadway">車道上・路肩を通行</option>
                    <option value="crossing">車道横断区間</option>
                </select>
                {isRoadContextFixed && (
                    <div
                        style={{
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "#666",
                        }}
                    >
                        自動設定されています
                    </div>
                )}
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>
                    <input
                        type="checkbox"
                        checked={bidirectional}
                        onChange={(e) => setBidirectional(e.target.checked)}
                    />
                    双方向
                </label>
            </div>

            <button
                onClick={() => {
                    const edgeData = {
                        id: editingEdge?.id ?? crypto.randomUUID(),
                        from,
                        to,
                        distance: Number(distance),
                        walkingTime: Number(walkingTime),
                        movement_type: movementType,
                        road_context: roadContext,
                        bidirectional,
                    };

                    if (editingEdge) {
                        onUpdate(edgeData);
                    } else {
                        onSave(edgeData);
                    }
                }}
                style={{
                    marginRight: "8px",
                }}
            >
                保存
            </button>

            <button onClick={onClose}>
                閉じる
            </button>
        </div>
    );
}

export default EdgeForm;