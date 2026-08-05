import {
  FiPlus,
  FiScissors,
  FiMapPin,
  FiX,
  FiCrosshair,
  FiEdit3,
  FiCheck,
} from "react-icons/fi";

import { InteractionMode } from "../constants/interactionMode";

function MobileToolbar({
  canSplitEdge,
  isSplittingEdge,
  hasRouteAnchor,
  showRoute,
  interactionMode,

  onAdd,
  onSplitEdge,
  onCancelSplit,
  onSetRouteAnchor,
  onClearRoute,
  onResetCamera,
  onStartGeometryDrawing,
  onStartGeometryEditing,
  onOpenGeometryForm,
}) {
  const toolButtonStyle = {
    flex: 1,
    minWidth: 0,
    height: "52px",
    border: "none",
    borderLeft: "1px solid #ddd",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    fontSize: "10px",
    color: "#222",
    cursor: "pointer",
  };

  const handleRouteButton = () => {
    if (showRoute || hasRouteAnchor) {
      onClearRoute();
      return;
    }

    onSetRouteAnchor();
  };

  const handleGeometryButton = () => {
    if (
      interactionMode ===
      InteractionMode.GEOMETRY_DRAWING
    ) {
      onStartGeometryEditing();
      return;
    }

    if (
      interactionMode ===
      InteractionMode.GEOMETRY_EDITING
    ) {
      onOpenGeometryForm();
      return;
    }

    onStartGeometryDrawing();
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "52px",
        display: "flex",
        background: "#fff",
        borderTop: "1px solid #ddd",
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.12)",
        zIndex: 30,
      }}
    >
      <button
        type="button"
        onClick={onAdd}
        style={{
          ...toolButtonStyle,
          borderLeft: "none",
        }}
      >
        <FiPlus size={19} />
        追加
      </button>

      <button
        type="button"
        onClick={
          isSplittingEdge
            ? onCancelSplit
            : canSplitEdge
              ? onSplitEdge
              : handleGeometryButton
        }
        style={toolButtonStyle}
      >
        {isSplittingEdge ? (
          <FiX size={18} />
        ) : canSplitEdge ? (
          <FiScissors size={18} />
        ) : interactionMode ===
          InteractionMode.GEOMETRY_DRAWING ? (
          <FiEdit3 size={18} />
        ) : interactionMode ===
          InteractionMode.GEOMETRY_EDITING ? (
          <FiCheck size={18} />
        ) : (
          <FiPlus size={18} />
        )}

        {isSplittingEdge
          ? "分割取消"
          : canSplitEdge
            ? "分割"
            : interactionMode ===
              InteractionMode.GEOMETRY_DRAWING
              ? "形状修正"
              : interactionMode ===
                InteractionMode.GEOMETRY_EDITING
                ? "形状保存"
                : "形状追加"}
      </button>

      <button
        type="button"
        onClick={handleRouteButton}
        style={toolButtonStyle}
      >
        {showRoute || hasRouteAnchor ? (
          <FiX size={18} />
        ) : (
          <FiMapPin size={18} />
        )}

        {showRoute || hasRouteAnchor
          ? "ルート解除"
          : "起点に設定"}
      </button>

      <button
        type="button"
        onClick={onResetCamera}
        style={toolButtonStyle}
      >
        <FiCrosshair size={19} />
        カメラ
      </button>
    </div>
  );
}

export default MobileToolbar;