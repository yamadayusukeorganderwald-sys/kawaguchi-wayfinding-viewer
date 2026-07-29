import { useState } from "react";

function EdgeList({
    edges,
    places,
    setShowEdgeForm,
    setEditingEdge,
    onOpenEdgeForm,
    onDeleteEdge,
}) {
    const [isOpen, setIsOpen] = useState(false);

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
                top: "16px",
                right: "16px",
                width: "200px",
                maxHeight: "70vh",
                overflowY: "auto",
                padding: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "8px",
                zIndex: 10,
            }}
        >
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