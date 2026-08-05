import { useState } from "react";
import { InteractionMode } from "../constants/interactionMode";

function EdgeList({
    edges,
    places,
    setShowEdgeForm,
    setEditingEdge,
    onOpenEdgeForm,
    onDeleteEdge,
    setShowPlaceForm,
    setEditingPlace,
    onOpenPlaceForm,
    isMobile,

    place,
    routeAnchor,
    setRouteAnchor,
    showRoute,
    setShowRoute,

    selectedEdge,
    interactionMode,
    onStartEdgeSplit,
    onCancelEdgeSplit,
    onStartGeometryDrawing,
    onStartGeometryEditing,
    onOpenGeometryForm,
}) {
    const [isOpen, setIsOpen] = useState(false);

    const isSplittingEdge =
        interactionMode === InteractionMode.EDGE_SPLIT_SELECTING ||
        interactionMode === InteractionMode.EDGE_SPLIT_PLACING ||
        interactionMode === InteractionMode.EDGE_SPLIT_CONFIRMING;

    const getPlaceName = (placeId) => {
        const targetPlace = places.find(
            (place) => place.id === placeId
        );

        return targetPlace?.name ?? placeId;
    };

    return (
        <div
            style={{
                position: "absolute",
                top: isMobile ? "12px" : "16px",
                right: isMobile ? "12px" : "16px",
                width: isMobile ? "45%" : "200px",
                maxHeight: "70vh",
                overflowY: "auto",
                padding: isMobile ? "10px" : "16px",
                backgroundColor: "rgba(255,255,255,.95)",
                borderRadius: "8px",
                zIndex: 20,
            }}
        >
            <button
                onClick={onOpenPlaceForm}
                style={{
                    marginBottom: "8px",
                    width: "100%",
                    padding: "8px",
                    cursor: "pointer",
                }}
            >
                ＋ 地点追加
            </button>
            <button
                onClick={onOpenEdgeForm}
                style={{
                    marginBottom: "8px",
                    width: "100%",
                    padding: "8px",
                    cursor: "pointer",
                }}
            >
                ＋ Edge追加
            </button>
            <button
                onClick={
                    interactionMode === InteractionMode.GEOMETRY_DRAWING
                        ? onStartGeometryEditing
                        : interactionMode === InteractionMode.GEOMETRY_EDITING
                            ? onOpenGeometryForm
                            : onStartGeometryDrawing
                }
                style={{
                    marginBottom: "8px",
                    width: "100%",
                    padding: "8px",
                    cursor: "pointer",
                    background:
                        interactionMode === InteractionMode.GEOMETRY_DRAWING
                            ? "#fff3cd"
                            : interactionMode === InteractionMode.GEOMETRY_EDITING
                                ? "#d9f7df"
                                : "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                }}
            >
                {interactionMode === InteractionMode.GEOMETRY_DRAWING
                    ? "✏ 形状修正"
                    : interactionMode === InteractionMode.GEOMETRY_EDITING
                        ? "✓ 形状保存"
                        : "▱ 形状追加"}
            </button>
            <button
                onClick={
                    isSplittingEdge
                        ? onCancelEdgeSplit
                        : onStartEdgeSplit
                }
                disabled={!selectedEdge && !isSplittingEdge}
                style={{
                    marginBottom: "8px",
                    width: "100%",
                    padding: "8px",
                    cursor:
                        selectedEdge || isSplittingEdge
                            ? "pointer"
                            : "not-allowed",
                    opacity:
                        selectedEdge || isSplittingEdge
                            ? 1
                            : 0.45,
                    background:
                        isSplittingEdge
                            ? "#ffe0b2"
                            : "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                }}
            >
                {isSplittingEdge
                    ? "✕ Edge分割をキャンセル"
                    : "✂ Edge分割"}
            </button>

            <button
                onClick={() => {
                    setRouteAnchor(place);
                    setShowRoute(true);
                }}
                style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    background: "#fff",
                    cursor: "pointer",
                }}
            >
                📍 起点に設定
            </button>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    marginBottom: "5px",
                }}
            >
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            fontSize: "10px",
                            marginBottom: "1px",
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                width: "40px",
                                color: "#888",
                                fontWeight: "600",
                            }}
                        >
                            FROM
                        </span>

                        {routeAnchor ? routeAnchor.name : "未設定"}
                    </div>

                    <div
                        style={{
                            fontSize: "10px",
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                width: "40px",
                                color: "#888",
                                fontWeight: "600",
                            }}
                        >
                            TO
                        </span>

                        {place.name}
                    </div>
                </div>

                <div
                    onClick={() => setShowRoute(!showRoute)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "130px",
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        background: "#fff",
                        cursor: "pointer",
                        userSelect: "none",
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: "12px",
                        }}
                    >
                        ルート表示
                    </span>

                    <div
                        style={{
                            width: "38px",
                            height: "22px",
                            borderRadius: "13px",
                            background: showRoute ? "#2196F3" : "#bbb",
                            position: "relative",
                            transition: "0.2s",
                        }}
                    >
                        <div
                            style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                background: "#fff",
                                position: "absolute",
                                top: "2px",
                                left: showRoute ? "18px" : "2px",
                                transition: "0.2s",
                                boxShadow: "0 1px 4px rgba(0,0,0,.3)",
                            }}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={() => setIsOpen((current) => !current)}
                style={{
                    width: "100%",
                    marginBottom: "5px",
                    padding: "8px",
                    cursor: "pointer",
                }}
            >
                {isOpen ? "▲ Edge一覧を閉じる" : "▼ Edge一覧を表示"}
            </button>



            {isOpen && (
                <>
                    {edges.length === 0 ? (
                        <p>Edgeがありません</p>
                    ) : (
                        edges.map((edge) => (
                            <div
                                key={edge.id}
                                style={{
                                    marginBottom: "12px",
                                    paddingBottom: "12px",
                                    borderBottom: "1px solid #ccc",
                                }}
                            >
                                <div>
                                    <strong>
                                        {getPlaceName(edge.from)}
                                    </strong>
                                    {" → "}
                                    <strong>
                                        {getPlaceName(edge.to)}
                                    </strong>
                                </div>

                                <div
                                    style={{
                                        marginTop: "4px",
                                        fontSize: "13px",
                                        color: "#555",
                                    }}
                                >
                                    距離：{edge.distance}m
                                    <br />
                                    徒歩時間：{edge.walkingTime}秒
                                    <br />
                                    双方向：
                                    {edge.bidirectional ? "はい" : "いいえ"}
                                </div>

                                <button
                                    onClick={() => {
                                        setEditingEdge(edge);
                                        onOpenEdgeForm();
                                    }}
                                >
                                    ✏ 編集
                                </button>

                                <button
                                    onClick={() => onDeleteEdge(edge)}
                                >
                                    🗑 削除
                                </button>
                            </div>
                        ))
                    )}
                </>
            )}
        </div>
    );
}

export default EdgeList;