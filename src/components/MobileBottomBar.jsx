import { useState } from "react";
import EntityPanel from "./EntityPanel";

import {
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

function MobileBottomBar({
  place,
  selectedEdge,
  selectedEntity,

  onEditEntity,
  onDeleteEntity,
  setShowPlaceForm,
  setEditingPlace,
  onDeletePlace,
  onEditEdge,
  onDeleteEdge,
  showDetails,
  setShowDetails,
  isCurrentPositionSelected,
  currentPosition,
  clickedPosition,
}) {

  if (
    !place &&
    !selectedEdge &&
    !selectedEntity &&
    !isCurrentPositionSelected &&
    !clickedPosition
  ) {
    return null;
  }

  const selectedPlace =
    selectedEntity?.type === "place"
      ? selectedEntity.data
      : null;

  const selectedObject =
    selectedEntity?.type === "object"
      ? selectedEntity.data
      : null;

  const selectedArea =
    selectedEntity?.type === "area"
      ? selectedEntity.data
      : null;

  const handleEdit = () => {
    if (
      selectedObject ||
      selectedArea ||
      selectedPlace
    ) {
      onEditEntity(selectedEntity);
      return;
    }

    if (selectedEdge) {
      onEditEdge(selectedEdge);
      return;
    }

    setEditingPlace(place);
    setShowPlaceForm(true);
  };

  const handleDelete = () => {
    if (
      selectedObject ||
      selectedArea ||
      selectedPlace
    ) {
      onDeleteEntity(selectedEntity);
      return;
    }

    if (selectedEdge) {
      onDeleteEdge(selectedEdge);
      return;
    }

    onDeletePlace(place);
  };

  const isUnregisteredPosition =
    Boolean(clickedPosition) &&
    !isCurrentPositionSelected &&
    !selectedEdge;

  const displayName = isCurrentPositionSelected
    ? "現在地"
    : selectedObject
      ? selectedObject.name || "名称未設定Object"
      : selectedArea
        ? selectedArea.name || "名称未設定Area"
        : selectedPlace
          ? selectedPlace.name || "名称未設定地点"
          : selectedEdge
            ? selectedEdge.road_name?.trim() || "名無しの道"
            : isUnregisteredPosition
              ? "未登録地点"
              : place?.name ?? "地点未選択";

  const displayDescription = isCurrentPositionSelected
    ? "今いるところ"
    : isUnregisteredPosition
      ? "地図上で選択した位置"
      : null;

  const detailsOpen =
    isCurrentPositionSelected ||
    isUnregisteredPosition ||
    showDetails;

  const actionButtonStyle = {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 0",
    fontSize: "13px",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "52px",
        minHeight: "58px",
        padding: "8px 10px",
        boxSizing: "border-box",
        backgroundColor: "#fff",
        borderTop: "1px solid #ddd",
        boxShadow: "0 -2px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "6px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "2px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#666",
            fontWeight: 600,
          }}
        >
          Wayfinding Viewer        β
        </div>

        <strong
          style={{
            fontSize: "18px",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {displayName}
        </strong>
        {displayDescription && (
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginTop: "2px",
            }}
          >
            {displayDescription}
          </div>
        )}
      </div>
      {!isCurrentPositionSelected && !isUnregisteredPosition && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <button
            type="button"
            onClick={handleEdit}
            style={actionButtonStyle}
          >
            <FiEdit2 size={14} />
            編集
          </button>

          <button
            type="button"
            onClick={handleDelete}
            style={{
              ...actionButtonStyle,
              color: "#c62828",
            }}
          >
            <FiTrash2 size={14} />
            削除
          </button>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            style={actionButtonStyle}
          >
            {showDetails ? (
              <>
                <FiChevronUp size={16} />
                閉じる
              </>
            ) : (
              <>
                <FiChevronDown size={16} />
                詳細
              </>
            )}
          </button>
        </div>
      )}


      <div
        style={{
          width: "100%",
          boxSizing: "border-box",

          maxHeight: detailsOpen ? "55dvh" : "0",
          opacity: detailsOpen ? 1 : 0,

          marginTop: detailsOpen ? "8px" : "0",
          paddingTop: detailsOpen ? "8px" : "0",

          borderTop: detailsOpen
            ? "1px solid #ddd"
            : "1px solid transparent",

          overflowY: detailsOpen ? "auto" : "hidden",
          overflowX: "hidden",

          transition:
            "max-height 0.3s ease, opacity 0.2s ease, margin-top 0.3s ease, padding-top 0.3s ease",
        }}
      >
        {isCurrentPositionSelected ? (
          <div style={{ fontSize: "13px", lineHeight: 1.7 }}>
            <div>
              <strong>緯度：</strong>
              {currentPosition?.latitude?.toFixed(6) ?? "取得中"}
            </div>

            <div>
              <strong>経度：</strong>
              {currentPosition?.longitude?.toFixed(6) ?? "取得中"}
            </div>

            <div>
              <strong>GPS精度：</strong>
              {currentPosition?.accuracy != null
                ? `約${Math.round(currentPosition.accuracy)}m`
                : "取得中"}
            </div>

            <div>
              <strong>状態：</strong>
              GPSから受信中
            </div>
          </div>
        ) : isUnregisteredPosition ? (
          <div style={{ fontSize: "13px", lineHeight: 1.7 }}>
            <div>
              <strong>緯度：</strong>
              {clickedPosition?.latitude?.toFixed(6) ?? "未取得"}
            </div>

            <div>
              <strong>経度：</strong>
              {clickedPosition?.longitude?.toFixed(6) ?? "未取得"}
            </div>

            <div>
              <strong>状態：</strong>
              未登録
            </div>
          </div>
        ) : selectedObject || selectedArea || selectedPlace ? (
          <EntityPanel
            selectedEntity={selectedEntity}
            onEditEntity={onEditEntity}
            onDeleteEntity={onDeleteEntity}
            compact
            showActions={false}
          />
        ) : selectedEdge ? (
          <div style={{ fontSize: "13px", lineHeight: 1.6 }}>
            <div>
              <strong>距離：</strong>
              {selectedEdge.distance} m
            </div>

            <div>
              <strong>徒歩時間：</strong>
              {selectedEdge.walkingTime} 秒
            </div>

            <div>
              <strong>移動方法：</strong>
              {selectedEdge.movement_type || "未設定"}
            </div>

            <div>
              <strong>道路空間との関係：</strong>
              {selectedEdge.road_context || "未設定"}
            </div>
          </div>
        ) : (
          <div>
            {place.image && (
              <img
                src={place.image}
                alt={place.name}
                style={{
                  width: "100%",
                  maxHeight: "180px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  display: "block",
                }}
              />
            )}

            <section style={{ marginBottom: "12px" }}>
              <strong style={{ fontSize: "13px" }}>観察</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                {place.observation || "未記入"}
              </p>
            </section>

            <section style={{ marginBottom: "12px" }}>
              <strong style={{ fontSize: "13px" }}>課題</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                {place.problem || "未記入"}
              </p>
            </section>

            <section>
              <strong style={{ fontSize: "13px" }}>改善案</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                {place.proposal || "未記入"}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileBottomBar;