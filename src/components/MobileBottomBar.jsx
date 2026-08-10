import {
  useEffect,
  useRef,
  useState,
} from "react";

import EntityPanel from "./EntityPanel";
import NearbyDiscoveryPopover from "./NearbyDiscoveryPopover";
import { buildEntityViewModel } from "../utils/buildEntityViewModel";

import {
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

function MobileBottomBar({
  place,
  places,
  selectedEntity,

  onEditEntity,
  onDeleteEntity,
  onSelectDiscovery,

  discoveries,

  showDetails,
  setShowDetails,
  isCurrentPositionSelected,
  currentPosition,
  clickedPosition,
}) {

  if (
    !place &&
    !selectedEntity &&
    !isCurrentPositionSelected &&
    !clickedPosition
  ) {
    return null;
  }

  const viewModel = buildEntityViewModel(
    selectedEntity,
    {
      places,
      discoveries,
    }
  );

  const [showDiscoveries, setShowDiscoveries] =
    useState(false);

  const discoveryButtonRef = useRef(null);

  const [discoveryAnchorRect, setDiscoveryAnchorRect] =
    useState(null);

  const nearbyDiscoveries =
    viewModel?.nearbyDiscoveries ?? [];

  const hasNearbyDiscoveries =
    nearbyDiscoveries.length > 0;

  useEffect(() => {
    setShowDiscoveries(false);
    setDiscoveryAnchorRect(null);
  }, [
    selectedEntity?.type,
    selectedEntity?.data?.id,
  ]);

  const handleEdit = () => {
    if (selectedEntity) {
      onEditEntity(selectedEntity);
      return;
    }
  };

  const handleDelete = () => {
    if (selectedEntity) {
      onDeleteEntity(selectedEntity);
      return;
    }
  };

  const isUnregisteredPosition =
    Boolean(clickedPosition) &&
    !isCurrentPositionSelected &&
    !selectedEntity;

  const displayName = isCurrentPositionSelected
    ? "現在地"
    : isUnregisteredPosition
      ? "未登録地点"
      : viewModel?.title ?? "地点未選択";

  const displayDescription = isCurrentPositionSelected
    ? "今いるところ"
    : isUnregisteredPosition
      ? "地図上で選択した位置"
      : null;

  const detailsOpen =
    isCurrentPositionSelected ||
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
      {showDiscoveries &&
        hasNearbyDiscoveries && (
          <NearbyDiscoveryPopover
            discoveries={nearbyDiscoveries}
            anchorRect={discoveryAnchorRect}
            onClose={() => {
              setShowDiscoveries(false);
              setDiscoveryAnchorRect(null);
            }}
            onSelectDiscovery={(discovery) => {
              setShowDiscoveries(false);
              setDiscoveryAnchorRect(null);
              onSelectDiscovery?.(discovery);
            }}
            compact
          />
        )}
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
      {!isCurrentPositionSelected && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {!isUnregisteredPosition && (
            <>
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
            </>
          )}

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

          {!isUnregisteredPosition &&
            hasNearbyDiscoveries && (
              <button
                ref={discoveryButtonRef}
                type="button"
                onClick={() => {
                  const nextOpen = !showDiscoveries;

                  if (
                    nextOpen &&
                    discoveryButtonRef.current
                  ) {
                    setDiscoveryAnchorRect(
                      discoveryButtonRef.current.getBoundingClientRect()
                    );
                  }

                  setShowDiscoveries(nextOpen);
                }}
                style={{
                  ...actionButtonStyle,
                  padding: "5px 9px",
                  borderRadius: "8px",
                  background: "#4fbd45",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                <img
                  src="/icons/discovery_message_sprout_icon.svg"
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: "17px",
                    height: "17px",
                    display: "block",
                  }}
                />

                発見({nearbyDiscoveries.length})
              </button>
            )}
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
        ) : selectedEntity ? (
          <EntityPanel
            selectedEntity={selectedEntity}
            onEditEntity={onEditEntity}
            onDeleteEntity={onDeleteEntity}
            context={{
              places,
              discoveries,
            }}
            compact
            showActions={false}
          />
        ) : (
          <div>地点未選択</div>
        )}
      </div>
    </div>
  );
}

export default MobileBottomBar;