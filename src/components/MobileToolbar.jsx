import {
  FiPlus,
  FiScissors,
  FiMapPin,
  FiX,
  FiCrosshair,
} from "react-icons/fi";

function MobileToolbar({
  canSplitEdge,
  isSplittingEdge,
  hasRouteAnchor,
  showRoute,

  onAdd,
  onSplitEdge,
  onCancelSplit,
  onSetRouteAnchor,
  onClearRoute,
  onResetCamera,
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

  const disabledButtonStyle = {
    ...toolButtonStyle,
    color: "#aaa",
    cursor: "default",
  };

  const handleRouteButton = () => {
    if (showRoute || hasRouteAnchor) {
      onClearRoute();
      return;
    }

    onSetRouteAnchor();
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
        disabled={!canSplitEdge && !isSplittingEdge}
        onClick={
          isSplittingEdge
            ? onCancelSplit
            : onSplitEdge
        }
        style={
          canSplitEdge || isSplittingEdge
            ? toolButtonStyle
            : disabledButtonStyle
        }
      >
        {isSplittingEdge ? (
          <FiX size={18} />
        ) : (
          <FiScissors size={18} />
        )}

        {isSplittingEdge ? "分割取消" : "分割"}
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