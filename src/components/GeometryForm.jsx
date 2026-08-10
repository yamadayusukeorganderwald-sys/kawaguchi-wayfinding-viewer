import { useEffect, useState } from "react";

function GeometryForm({
    onSave,
    onClose,
    editingGeometry,
    defaultGeometryKind,
    defaultObjectMethod,
    defaultPrimitiveType,
    defaultDrawingMethod,
    drawingGeometryState,
}) {
    const [name, setName] = useState("");
    const [geometryType, setGeometryType] = useState("building");
    const [baseHeight, setBaseHeight] = useState(0);
    const [extrudedHeight, setExtrudedHeight] = useState(10);
    const [description, setDescription] = useState("");
    const [geometryKind, setGeometryKind] = useState(
        defaultGeometryKind ?? "area"
    );

    useEffect(() => {
        if (!editingGeometry) {
            setGeometryKind(
                defaultGeometryKind ?? "area"
            );

            if (
                defaultPrimitiveType === "cylinder" &&
                drawingGeometryState?.height != null
            ) {
                setExtrudedHeight(
                    drawingGeometryState.height
                );
            }

            return;
        }

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
    }, [
        editingGeometry,
        defaultGeometryKind,
        defaultPrimitiveType,
        drawingGeometryState,
    ]);

    const fieldStyle = {
        marginBottom: 18,
    };

    const labelStyle = {
        display: "block",
        marginBottom: 6,
        fontSize: "13px",
        fontWeight: 600,
        color: "#444",
    };

    const inputStyle = {
        width: "100%",
        padding: "10px 12px",
        fontSize: "16px",
        boxSizing: "border-box",
        border: "1px solid #ccc",
        borderRadius: "8px",
    };

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
                    width: "min(360px, calc(100vw - 24px))",
                    boxSizing: "border-box",
                    padding: "24px",
                    borderRadius: "12px",
                    maxHeight: "80dvh",
                    overflowY: "auto",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
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
                        {editingGeometry ? "形状編集" : "形状登録"}
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
                            onClick={() =>
                                onSave({
                                    id: editingGeometry?.id ?? null,
                                    geometryKind,
                                    name,
                                    geometryType,
                                    base_height: baseHeight,
                                    extruded_height: extrudedHeight,
                                    description,
                                    objectMethod: defaultObjectMethod,
                                    primitiveType: defaultPrimitiveType,
                                    drawingMethod: defaultDrawingMethod,
                                    primitiveData:
                                        defaultPrimitiveType === "cylinder"
                                            ? {
                                                center:
                                                    drawingGeometryState?.center ??
                                                    null,

                                                radius:
                                                    drawingGeometryState?.radius ??
                                                    0,
                                            }
                                            : {},
                                })
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
                            保存
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
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

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>
                        保存種類
                    </label>

                    <select
                        value={geometryKind}
                        onChange={(e) =>
                            setGeometryKind(e.target.value)
                        }
                        style={{
                            width: "100%",
                            fontSize: "16px",
                            boxSizing: "border-box",
                        }}
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
                    {defaultGeometryKind === "object" &&
                        !editingGeometry &&
                        defaultObjectMethod === "primitive" && (
                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: "#555",
                                }}
                            >
                                Object作成方法: プリミティブ
                                {defaultPrimitiveType === "box" && "（箱）"}
                                {defaultPrimitiveType === "extruded_polygon" && "（多角柱）"}
                                {defaultPrimitiveType === "cylinder" && "（円柱）"}
                            </div>
                        )}
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>
                        名前
                    </label>

                    <input
                        placeholder="例：キュポ・ラ広場"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>
                        種類
                    </label>

                    <select
                        value={geometryType}
                        onChange={(e) =>
                            setGeometryType(e.target.value)
                        }
                        style={inputStyle}
                    >
                        <option value="building">建物</option>
                        <option value="plaza">広場</option>
                        <option value="deck">デッキ</option>
                        <option value="roof">屋上</option>
                        <option value="passage">通路</option>
                        <option value="restricted">立入禁止</option>
                    </select>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>
                        基準高さ
                    </label>

                    <input
                        type="number"
                        value={baseHeight}
                        onChange={(e) =>
                            setBaseHeight(Number(e.target.value))
                        }
                        style={inputStyle}
                    />

                    <div
                        style={{
                            marginTop: 5,
                            fontSize: "12px",
                            color: "#777",
                        }}
                    >
                        地面から形状を開始する高さ（m）
                    </div>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>
                        高さ
                    </label>

                    <input
                        type="number"
                        value={extrudedHeight}
                        onChange={(e) =>
                            setExtrudedHeight(Number(e.target.value))
                        }
                        style={inputStyle}
                    />

                    <div
                        style={{
                            marginTop: 5,
                            fontSize: "12px",
                            color: "#777",
                        }}
                    >
                        形状そのものの高さ（m）
                    </div>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>
                        説明
                    </label>

                    <textarea
                        placeholder="この場所・形状についてのメモ"
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                        style={{
                            ...inputStyle,
                            minHeight: "80px",
                            resize: "vertical",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default GeometryForm;