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
                            onClick={() => setPlace(item)}
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
                この地点を起点に設定
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
                onClick={() => {
                    setEditingPlace(null);
                    setShowPlaceForm(true);
                }}
                style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                    marginBottom: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                }}
            >
                ＋ 地点追加
            </button>

            <p
                style={{
                    margin: "0 0 4px",
                }}
            >
                {place.description}
            </p>

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
        </div>
    );
}

export default Sidebar;