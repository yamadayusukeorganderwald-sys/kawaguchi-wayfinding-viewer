
import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

const places = [
  {
    id: "entrance",
    name: "駅入口",
    type: "route",
    latitude: 35.802099863062594,
    longitude: 139.71802508125836,
    height: 300,
    description: "JR川口駅 東口",
    image: "/images/entrance.jpg",
    observation: "駅を出ると視界は開けるが、進行方向を示す情報が少ない。",
    problem: "初めて来た人は樹モール方面への進路が分かりにくい。",
    proposal: "目的地方向を示す案内サインを駅出口付近に追加する。"
  },

  {
    id: "bridge",
    name: "歩道橋",
    type: "route",
    latitude: 35.802360459808824,
    longitude: 139.7185476298926,
    height: 300,
    description: "駅前歩道橋",
    image: "/images/bridge.jpg",
    observation: "歩道橋上から周辺のランドマークを見渡せる。",
    problem: "降り口が複数あり迷いやすい。",
    proposal: "降り口ごとの目的地表示を強化する。"
  },

  {
    id: "shopping",
    name: "商店街",
    type: "route",
    longitude: 139.72025146723684,
    latitude: 35.8029789998629,
    height: 300,
    description: "樹モール商店街",
    image: "/images/shopping.jpg",
    observation: "アーケード入口は見つけやすい。",
    problem: "駅から連続した案内がない。",
    proposal: "駅出口から商店街まで誘導サインを設置する。"
  },

  {
    id: "street-entrance",
    name: "街への入口",
    type: "observation",
    longitude: 139.71918124386173,
    latitude: 35.80271048406026,
    height: 300,
    description: "樹モールへ向かう横断歩道",
    image: "/images/street-entrance.jpg",
    observation: "駅を出て街へ向かう際、最も「街に入る」という印象を受ける地点。",
    problem: "街への入口として印象的だが、樹モールへ続く場所であることを示す情報は少ない。",
    proposal: "商店街名やエリアマップを設置し、街への入口として認識しやすくする。"
  },

  {
    id: "sushiro-entrance",
    name: "スシロー前",
    type: "observation",
    longitude: 139.7197308441633,
    latitude: 35.80337721479965,
    height: 300,
    description: "樹モール商店街 スシロー前",
    image: "/images/sushiro-entrance.jpg",
    observation: "ららテラス裏から樹モール商店街をつなぐ動線、スシローやカラオケ店などがある",
    problem: "そこそこ広い道だが、動線として繋がる道がなく、車通りもなく人気が少ない道。",
    proposal: "車が通らないことを活かし、樹モール商店街のように歩行者の道として整備すればにぎわいそう。"
  },

  {
    id: "kawaguchi-shinkin-mae",
    name: "川口信用金庫前",
    type: "observation",
    longitude: 139.71907161752023,
    latitude: 35.80320109643959,
    height: 300,
    description: "川口信用金庫前",
    image: "/images/kawaguchi-shinkin-mae.jpg",
    observation: "川口信用金庫の前には、多くの歩行者が通る動線がある。",
    problem: "周囲の建物が高いため、視界が遮られやすく、情報が得にくい。",
    proposal: "情報を視覚的に伝えるための案内サインを設置する。"
  },

  {
    id: "casty-mae",
    name: "キャスティ前",
    type: "observation",
    longitude: 139.71876445714705,
    latitude: 35.80237024519396,
    height: 300,
    description: "キャスティ前",
    image: "/images/casty-mae.jpg",
    observation: "キャスティの前には、多くの歩行者が通る動線がある。",
    problem: "周囲の建物が高いため、視界が遮られやすく、情報が得にくい。",
    proposal: "情報を視覚的に伝えるための案内サインを設置する。"
  }
];

const routes = [
  {
    id: "main-route",
    positions: [
      [139.71802508125836, 35.802099863062594],
      [139.7185476298926, 35.802360459808824],
      [139.71918124386173, 35.80271048406026],
      [139.72025146723684, 35.8029789998629],
    ],
  },
];

function App() {
  const [place, setPlace] = useState(places[0]);
  const [showRoute, setShowRoute] = useState(false);
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const entitiesRef = useRef([]);
  const routeEntitiesRef = useRef([]);

  useEffect(() => {
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      animation: false,
      timeline: false,
    });

    viewerRef.current = viewer;

    const handler = new Cesium.ScreenSpaceEventHandler(
      viewer.scene.canvas
    );

    handler.setInputAction((click) => {
      // クリックした場所にマーカーがあるか確認
      const picked = viewer.scene.pick(click.position);

      // マーカーをクリックした場合
      if (picked && picked.id && picked.id.place) {
        setPlace(picked.id.place);
        return;
      }

      // 地図上のクリック位置を3D座標として取得
      let cartesian = viewer.scene.pickPosition(click.position);

      // 取得できなかった場合の予備処理
      if (!cartesian) {
        cartesian = viewer.camera.pickEllipsoid(
          click.position,
          viewer.scene.globe.ellipsoid
        );
      }

      if (!cartesian) return;

      // 3D座標を緯度・経度に変換
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);
      const height = cartographic.height;

      console.clear();

      console.log({
        longitude,
        latitude,
      });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    places.forEach((item) => {
      const isRoute = item.type === "route";
      const entity = viewer.entities.add({
        name: item.name,

        position: Cesium.Cartesian3.fromDegrees(
          item.longitude,
          item.latitude
        ),

        point: {
          pixelSize: isRoute ? 12 : 10,
          color: isRoute
            ? Cesium.Color.RED
            : Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
        },

        label: {
          text: item.name,
          font: "16px sans-serif",
          pixelOffset: new Cesium.Cartesian2(0, -35),
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        },

      });

      entity.place = item;

      entitiesRef.current.push(entity);

    });

    routes.forEach((route) => {
      const routeEntity = viewer.entities.add({
        show: false,

        polyline: {
          positions: route.positions.map(([lon, lat]) =>
            Cesium.Cartesian3.fromDegrees(lon, lat, 5)
          ),
          material: Cesium.Color.DODGERBLUE.withAlpha(0.8),
          width: 8,
          clampToGround: true,
        },
      });

      routeEntitiesRef.current.push(routeEntity);
    });

    const resizeTimer = setTimeout(() => {
      if (!viewer.isDestroyed()) {
        viewer.resize();
      }
    }, 0);

    return () => {
      clearTimeout(resizeTimer);

      handler.destroy();
      viewer.destroy();

      viewerRef.current = null;
      entitiesRef.current = [];
      routeEntitiesRef.current = [];
    };

  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer || viewer.isDestroyed()) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        place.longitude,
        place.latitude,
        place.height
      ),
      duration: 2,
    });

    entitiesRef.current.forEach((entity) => {
      const isSelected = entity.place.id === place.id;

      const isRoute = entity.place.type === "route";

      entity.point.pixelSize = isSelected
        ? (isRoute ? 15 : 11)
        : (isRoute ? 12 : 8);

      entity.point.color = isSelected
        ? Cesium.Color.LIME
        : (isRoute ? Cesium.Color.RED : Cesium.Color.GRAY);
    });

  }, [place]);

  useEffect(() => {
    routeEntitiesRef.current.forEach((entity) => {
      entity.show = showRoute;
    });
  }, [showRoute]);

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
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

        <div
          onClick={() => setShowRoute(!showRoute)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "140px",      // 好みで160～200pxくらい
            marginLeft: "auto",
            marginBottom: "20px",
            padding: "8px 12px",
            paddingLeft: "15px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "#fff",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "400",
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

        <p
          style={{
            margin: "0 0 4px",
          }}
        >
          {place.description}
        </p>
        <div>
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

      <div
        ref={cesiumContainer}
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          position: "relative",
        }}
      />
    </div>
  );
}

export default App;