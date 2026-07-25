
import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

const places = [
  {
    id: "entrance",
    name: "駅入口",
    latitude: 35.802099863062594,
    longitude: 139.71802508125836,
    height: 300,
    description: "JR川口駅 東口",

    image: "/images/entrance.jpg"
  },

  {
    id: "bridge",
    name: "歩道橋",
    latitude: 35.80243279370009,
    longitude: 139.718627481533,
    height: 300,
    description: "駅前歩道橋",
    image: "/images/bridge.jpg"
  },

  {
    id: "shopping",
    name: "商店街",
    longitude: 139.72025146723684,
    latitude: 35.8029789998629,
    height: 300,
    description: "樹モール商店街",
    image: "/images/shopping.jpg"
  }
];

function App() {
  const [place, setPlace] = useState(places[0]);
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const entitiesRef = useRef([]);

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
      const entity = viewer.entities.add({
        name: item.name,

        position: Cesium.Cartesian3.fromDegrees(
          item.longitude,
          item.latitude
        ),

        point: {
          pixelSize: 12,
          color: Cesium.Color.RED,
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

      entity.point.pixelSize = isSelected ? 15 : 12;

      entity.point.color = isSelected
        ? Cesium.Color.LIME
        : Cesium.Color.RED;
    });

  }, [place]);



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
            marginBottom: "20px",
          }}
        >
          {places.map((item) => (
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

        <h2>{place.name}</h2>
        <p>{place.description}</p>
        <img
          src={place.image}
          alt={place.name}
          style={{
            width: "100%",
            height: "120px",
            marginTop: "12px",
            borderRadius: "8px",
            objectFit: "cover",
            display: "block",
          }}
        />
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