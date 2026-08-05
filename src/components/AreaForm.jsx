import { useState } from "react";

function AreaForm({
    onSave,
    onClose,
}) {
    const [name, setName] = useState("");
    const [areaType, setAreaType] = useState("building");
    const [baseHeight, setBaseHeight] = useState(0);
    const [extrudedHeight, setExtrudedHeight] = useState(10);
    const [description, setDescription] = useState("");

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    background: "#fff",
                    width: 360,
                    padding: 20,
                    borderRadius: 12,
                }}
            >
                <h3>Area登録</h3>

                <input
                    placeholder="名前"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: "100%", marginBottom: 12 }}
                />

                <select
                    value={areaType}
                    onChange={(e) =>
                        setAreaType(e.target.value)
                    }
                    style={{ width: "100%", marginBottom: 12 }}
                >
                    <option value="building">建物</option>
                    <option value="plaza">広場</option>
                    <option value="deck">デッキ</option>
                    <option value="roof">屋上</option>
                    <option value="passage">通路</option>
                    <option value="restricted">立入禁止</option>
                </select>

                <input
                    type="number"
                    placeholder="基準高さ"
                    value={baseHeight}
                    onChange={(e) =>
                        setBaseHeight(Number(e.target.value))
                    }
                    style={{ width: "100%", marginBottom: 12 }}
                />

                <input
                    type="number"
                    placeholder="高さ"
                    value={extrudedHeight}
                    onChange={(e) =>
                        setExtrudedHeight(Number(e.target.value))
                    }
                    style={{ width: "100%", marginBottom: 12 }}
                />

                <textarea
                    placeholder="説明"
                    value={description}
                    onChange={(e) =>
                        setDescription(e.target.value)
                    }
                    style={{ width: "100%", marginBottom: 12 }}
                />

                <button
                    onClick={() =>
                        onSave({
                            name,
                            area_type: areaType,
                            base_height: baseHeight,
                            extruded_height:
                                extrudedHeight,
                            description,
                        })
                    }
                >
                    保存
                </button>

                <button
                    onClick={onClose}
                    style={{ marginLeft: 8 }}
                >
                    キャンセル
                </button>
            </div>
        </div>
    );
}

export default AreaForm;