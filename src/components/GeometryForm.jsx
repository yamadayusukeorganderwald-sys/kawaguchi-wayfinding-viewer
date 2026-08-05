import { useEffect, useState } from "react";

function GeometryForm({
    onSave,
    onClose,
    editingGeometry,
}) {
    const [name, setName] = useState("");
    const [geometryType, setGeometryType] = useState("building");
    const [baseHeight, setBaseHeight] = useState(0);
    const [extrudedHeight, setExtrudedHeight] = useState(10);
    const [description, setDescription] = useState("");
    const [geometryKind, setGeometryKind] = useState("area");

    useEffect(() => {
        if (!editingGeometry) return;

        setName(editingGeometry.name ?? "");

        setGeometryType(
            editingGeometry.object_type ??
            editingGeometry.area_type ??
            editingGeometry.space_type ??
            "building"
        );

        setBaseHeight(
            editingGeometry.base_height ?? 0
        );

        setExtrudedHeight(
            editingGeometry.height ??
            editingGeometry.extruded_height ??
            10
        );

        setDescription(
            editingGeometry.description ?? ""
        );

        if (editingGeometry.object_type) {
            setGeometryKind("object");
        } else if (editingGeometry.area_type) {
            setGeometryKind("area");
        } else if (editingGeometry.space_type) {
            setGeometryKind("space");
        }
    }, [editingGeometry]);

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
                <h3>
                    {editingGeometry ? "形状編集" : "形状登録"}
                </h3>

                <div style={{ marginBottom: 12 }}>
                    <label>保存種類</label>

                    <select
                        value={geometryKind}
                        onChange={(e) =>
                            setGeometryKind(e.target.value)
                        }
                        style={{ width: "100%" }}
                    >
                        <option value="area">
                            Area（歩行空間）
                        </option>

                        <option value="object">
                            Object（建物・障害物）
                        </option>

                        <option value="space">
                            Space（建物内部）
                        </option>
                    </select>
                </div>

                <input
                    placeholder="名前"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: "100%", marginBottom: 12 }}
                />

                <select
                    value={geometryType}
                    onChange={(e) =>
                        setGeometryType(e.target.value)
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
                            id: editingGeometry?.id ?? null,
                            geometryKind,
                            name,
                            geometryType,
                            base_height: baseHeight,
                            extruded_height: extrudedHeight,
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

export default GeometryForm;