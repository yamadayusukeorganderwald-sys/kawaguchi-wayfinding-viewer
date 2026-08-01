import { useState } from "react";

import {
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

function MobileBottomBar({
  place,
  selectedEdge,
  setShowPlaceForm,
  setEditingPlace,
  onDeletePlace,
  onEditEdge,
  onDeleteEdge,
  showDetails,
  setShowDetails,
}) {
  if (!place && !selectedEdge) {
    return null;
  }

  const handleEdit = () => {
    if (selectedEdge) {
      onEditEdge(selectedEdge);
      return;
    }

    setEditingPlace(place);
    setShowPlaceForm(true);
  };

  const handleDelete = () => {
    if (selectedEdge) {
      onDeleteEdge(selectedEdge);
      return;
    }

    onDeletePlace(place);
  };

  const displayName = selectedEdge
    ? "Edge"
    : place?.name ?? "地点未選択";

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
        bottom: 0,
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
          川口駅 Wayfinding Viewer        β
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
      </div>

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
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",

          maxHeight: showDetails ? "55dvh" : "0",
          opacity: showDetails ? 1 : 0,

          marginTop: showDetails ? "8px" : "0",
          paddingTop: showDetails ? "8px" : "0",

          borderTop: showDetails
            ? "1px solid #ddd"
            : "1px solid transparent",

          overflowY: showDetails ? "auto" : "hidden",
          overflowX: "hidden",

          transition:
            "max-height 0.3s ease, opacity 0.2s ease, margin-top 0.3s ease, padding-top 0.3s ease",
        }}
      >
        {selectedEdge ? (
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