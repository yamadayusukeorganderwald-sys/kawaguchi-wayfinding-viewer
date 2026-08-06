import EntityPanel from "./EntityPanel";

function Sidebar({
    place,
    places,
    onSelectPlace,
    onEditEntity,
    onDeleteEntity,
    selectedEntity,
    onSelectDiscovery,

    discoveries,

    isCurrentPositionSelected,
    currentPosition,
    clickedPosition,

    isMobile,
}) {
    return (
        <div
            style={{
                width: "100%",
                height: isMobile ? "40%" : "100dvh",
                padding: isMobile ? "12px" : "20px",
                boxSizing: "border-box",
                backgroundColor: "#f4f4f4",
                overflowY: "auto",
                scrollbarGutter: "stable",
                flexShrink: 0,
            }}
        >
            <h1
                style={{
                    fontSize: isMobile ? "18px" : "28px",
                    marginBottom: "16px",
                }}
            >
                川口駅
                <br />
                Wayfinding Viewer
            </h1>
            {!isMobile && (
                <>
                    <p
                        style={{
                            fontSize: "13px",
                            lineHeight: "1.5",
                            marginBottom: "12px",
                        }}
                    >
                        現地調査をもとに<br />
                        歩行動線を可視化する試作です。
                    </p>

                    <div
                        style={{
                            display: "flex",
                            gap: "6px",
                            marginBottom: "5px",
                        }}
                    >
                        {places
                            .filter((item) => item.type === "route")
                            .map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onSelectPlace(item);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "6px 4px",
                                        fontSize: "13px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        backgroundColor: item.id === place.id ? "#222" : "#fff",
                                        color: item.id === place.id ? "#fff" : "#222",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {item.name}
                                </button>
                            ))}
                    </div>
                </>
            )}
            {isCurrentPositionSelected ? (
                <>
                    <h2
                        style={{
                            fontSize: "18px",
                            margin: "14px 0 6px",
                        }}
                    >
                        現在地
                    </h2>

                    <div
                        style={{
                            fontSize: "11px",
                            color: "#666",
                            marginBottom: "12px",
                        }}
                    >
                        今いるところ
                    </div>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            緯度
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {currentPosition?.latitude?.toFixed(6)}
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            経度
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {currentPosition?.longitude?.toFixed(6)}
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            GPS精度
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {currentPosition?.accuracy != null
                                ? `約${Math.round(
                                    currentPosition.accuracy
                                )}m`
                                : "取得中"}
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            状態
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            GPSから受信中
                        </p>
                    </section>

                </>
            ) : (
                selectedEntity?.type === "place" ||
                selectedEntity?.type === "edge" ||
                selectedEntity?.type === "object" ||
                selectedEntity?.type === "area"
            ) ? (
                <EntityPanel
                    selectedEntity={selectedEntity}
                    onEditEntity={onEditEntity}
                    onDeleteEntity={onDeleteEntity}
                    onSelectDiscovery={onSelectDiscovery}
                    context={{
                        places,
                        discoveries,
                    }}
                />
            ) : clickedPosition ? (
                <>
                    <h2
                        style={{
                            fontSize: "18px",
                            margin: "14px 0 6px",
                        }}
                    >
                        未登録地点
                    </h2>

                    <div
                        style={{
                            fontSize: "11px",
                            color: "#666",
                            marginBottom: "12px",
                        }}
                    >
                        地図上で選択した位置
                    </div>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            緯度
                        </h3>
                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {clickedPosition.latitude?.toFixed(6)}
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            経度
                        </h3>
                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {clickedPosition.longitude?.toFixed(6)}
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            状態
                        </h3>
                        <p style={{ margin: 0, fontSize: "12px" }}>
                            未登録
                        </p>
                    </section>
                </>
            ) : (
                <div>地点未選択</div>
            )
            }
        </div >
    );
}

export default Sidebar;