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

    const [roadName, setRoadName] = useState(
        editingEdge?.road_name ?? ""
    );

    const isRoadContextFixed = [
        "stairs",
        "escalator",
        "elevator",
    ].includes(movementType);

    const [bidirectional, setBidirectional] = useState(
        editingEdge?.bidirectional ?? true
    );

    const [isSaving, setIsSaving] = useState(false);

    const fieldStyle = {
        display: "block",
        width: "100%",
        padding: "10px",
        boxSizing: "border-box",
        backgroundColor: "white",
        color: "black",
        fontSize: "16px",
    };

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

    const handleSave = async () => {
        if (isSaving) return;

        if (!from || !to) {
            alert("FromとToを選択してください");
            return;
        }

        if (from === to) {
            alert("同じ地点同士は接続できません");
            return;
        }

        setIsSaving(true);

        try {
            const edgeData = {
                id: editingEdge?.id ?? crypto.randomUUID(),
                from,
                to,
                distance: Number(distance),
                walkingTime: Number(walkingTime),
                movement_type: movementType,
                road_context: roadContext,
                road_name: roadName.trim(),
                bidirectional,
            };

            if (editingEdge) {
                await onUpdate(edgeData);
            } else {
                await onSave(edgeData);
            }
        } catch (error) {
            console.error("Edgeの保存に失敗:", error);
            alert("Edgeを保存できませんでした");
        } finally {
            setIsSaving(false);
        }
    };

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
                width: "min(320px, calc(100vw - 24px))",
                boxSizing: "border-box",
                maxHeight: "80dvh",
                overflowY: "auto",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: "18px",
                    }}
                >
                    {editingEdge ? "Edge編集" : "Edge追加"}
                </h2>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "6px",
                            background: isSaving ? "#90caf9" : "#2196f3",
                            color: "#fff",
                            cursor: isSaving ? "not-allowed" : "pointer",
                            opacity: isSaving ? 0.8 : 1,
                        }}
                    >
                        {isSaving ? "保存中..." : "保存"}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "22px",
                            cursor: "pointer",
                            lineHeight: 1,
                            padding: "2px 4px",
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>道名</label>

                <input
                    type="text"
                    value={roadName}
                    onChange={(e) => setRoadName(e.target.value)}
                    placeholder="例：中央通り(空欄でも可)"
                    style={fieldStyle}
                />
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>From</label>

                <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={fieldStyle}
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
                    style={fieldStyle}
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
                    style={fieldStyle}
                />
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>徒歩時間（秒）</label>

                <input
                    type="number"
                    value={walkingTime}
                    onChange={(e) => setWalkingTime(e.target.value)}
                    style={fieldStyle}
                />
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label>移動方法</label>

                <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    style={fieldStyle}
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
                        ...fieldStyle,
                        opacity: isRoadContextFixed ? 0.65 : 1,
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
        </div>
    );
}

export default EdgeForm;