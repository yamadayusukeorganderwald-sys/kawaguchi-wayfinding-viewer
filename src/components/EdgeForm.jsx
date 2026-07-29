import { useState } from "react";

function EdgeForm({
    places,
    editingEdge,
    onSave,
    onUpdate,
    onClose,
}) {
    const [from, setFrom] = useState(editingEdge?.from ?? "");
    const [to, setTo] = useState(editingEdge?.to ?? "");
    const [distance, setDistance] = useState(editingEdge?.distance ?? "");
    const [walkingTime, setWalkingTime] = useState(editingEdge?.walkingTime ?? "");
    const [bidirectional, setBidirectional] = useState(
        editingEdge?.bidirectional ?? true
    );

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
                        bidirectional,
                    };

                    if (editingEdge) {
                        onUpdate(edgeData);
                    } else {
                        onSave(edgeData);
                        onClose();
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