const PLACE_TYPE_LABELS = {
    station: "駅",
    shop: "店舗",
    entrance: "入口",
    landmark: "ランドマーク",
    plaza: "広場",
    crossing: "横断地点",
};

function Sidebar({
    place,
    setPlace,
    routeAnchor,
    setRouteAnchor,
    showRoute,
    setShowRoute,
    places,
    setShowPlaceForm,
    setEditingPlace,
    onDeletePlace,

    selectedEdge,
    setSelectedEdge,
    onEditEdge,
    onDeleteEdge,
}) {
    return (
        <div
            style={{
                width: "280px",
                height: "100vh",
                padding: "20px",
                boxSizing: "border-box",
                backgroundColor: "#f4f4f4",
                overflowY: "auto",
                scrollbarGutter: "stable",
                flexShrink: 0,
            }}
        >
            <h1
                style={{
                    fontSize: "28px",
                    marginBottom: "16px",
                }}
            >
                川口駅
                <br />
                Wayfinding Viewer
            </h1>

            <p
                style={{
                    fontSize: "13px",
                    lineHeight: "1.5",
                    marginBottom: "20px",
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
                                setPlace(item);
                                setSelectedEdge(null);
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

            {selectedEdge ? (

                <>
                    <h2
                        style={{
                            fontSize: "18px",
                            margin: "14px 0 6px",
                        }}
                    >
                        Edge
                    </h2>

                    <div
                        style={{
                            fontSize: "11px",
                            color: "#666",
                            marginBottom: "12px",
                        }}
                    >
                        歩行経路
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "16px",
                        }}
                    >
                        <button onClick={() => onEditEdge(selectedEdge)}>
                            編集
                        </button>

                        <button onClick={() => onDeleteEdge(selectedEdge)}>
                            削除
                        </button>
                    </div>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            始点
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {places.find(
                                (item) => item.id === selectedEdge.from
                            )?.name}
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            終点
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {places.find(
                                (item) => item.id === selectedEdge.to
                            )?.name}
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            距離
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {selectedEdge.distance} m
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            徒歩時間
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {selectedEdge.walkingTime} 秒
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            移動方法
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {selectedEdge.movement_type}
                        </p>
                    </section>

                    <section style={{ marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "12px", margin: "0 0 4px" }}>
                            道路空間との関係
                        </h3>

                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {selectedEdge.road_context}
                        </p>
                    </section>
                </>

            ) : (

                <>

                    <h2
                        style={{
                            fontSize: "18px",
                            margin: "14px 0 6px",
                        }}
                    >
                        {place.name}
                    </h2>

                    <div
                        style={{
                            fontSize: "11px",
                            color: "#666",
                            marginBottom: "6px",
                        }}
                    >
                        {place.type === "route" && "目的地点"}
                        {place.type === "junction" && "ルート設定用ポイント"}
                        {place.type === "observation" && "観察地点"}
                    </div>

                    {place.place_type?.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                                marginBottom: "12px",
                            }}
                        >
                            {place.place_type.map((type) => (
                                <span
                                    key={type}
                                    style={{
                                        padding: "3px 7px",
                                        border: "1px solid #bbb",
                                        borderRadius: "999px",
                                        background: "#fff",
                                        fontSize: "11px",
                                    }}
                                >
                                    {PLACE_TYPE_LABELS[type] ?? type}
                                </span>
                            ))}
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "16px",
                        }}
                    >
                        <button
                            onClick={() => {
                                setEditingPlace(place);
                                setShowPlaceForm(true);
                            }}
                        >
                            編集
                        </button>

                        <button
                            onClick={() => onDeletePlace(place)}
                        >
                            削除
                        </button>
                    </div>

                    <div>
                        {place.image && (
                            <img
                                src={place.image}
                                alt={place.name}
                                style={{
                                    width: "100%",
                                    height: "140px",
                                    marginTop: "6px",
                                    marginBottom: "6px",
                                    borderRadius: "8px",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        )}
                        <section
                            style={{
                                marginBottom: "3px",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "12px",
                                    margin: "0 0 3px",
                                }}
                            >
                                観察
                            </h3>

                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "10px",
                                }}
                            >
                                {place.observation}
                            </p>
                        </section>

                        <section
                            style={{
                                marginBottom: "3px",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "12px",
                                    margin: "0 0 3px",
                                }}
                            >
                                課題
                            </h3>

                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "10px",
                                }}
                            >
                                {place.problem}
                            </p>
                        </section>

                        <section
                            style={{
                                marginBottom: "3px",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "12px",
                                    margin: "0 0 3px",
                                }}
                            >
                                改善案
                            </h3>

                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "10px",
                                }}
                            >
                                {place.proposal}
                            </p>
                        </section>
                    </div>
                </>

            )
            }
        </div >
    );
}

export default Sidebar;