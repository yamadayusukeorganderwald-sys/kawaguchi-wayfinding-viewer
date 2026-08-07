function GeometryCreateMenu({
  visible,
  selectedGeometryKind,
  selectedObjectMethod,
  selectedPrimitiveType,
  primitiveDefinitions,
  onSelectGeometryKind,
  onSelectObjectMethod,
  onSelectPrimitiveType,
  onClose,
}) {
  if (!visible) {
    return null;
  }

  const isObjectStep = selectedGeometryKind === "object";
  const isPrimitiveStep =
    selectedGeometryKind === "object" &&
    selectedObjectMethod === "primitive";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9998,
      }}
    >
      <div
        style={{
          width: "min(520px, 90vw)",
          background: "#fff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                marginBottom: "4px",
              }}
            >
              形状追加
            </div>
            <div style={{ color: "#666", fontSize: "14px" }}>
              追加するGeometryの種類を選択してください。
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Step 1：追加するGeometryの種類
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => onSelectGeometryKind("area")}
              style={buttonStyle("#f0f7ff")}
            >
              Area
            </button>
            <button
              type="button"
              onClick={() => onSelectGeometryKind("object")}
              style={buttonStyle("#f9f5ff")}
            >
              Object
            </button>
            <button
              type="button"
              onClick={() => onSelectGeometryKind("space")}
              style={buttonStyle("#f6fff2")}
            >
              Space
            </button>
          </div>
        </div>

        {isObjectStep && (
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Step 2：Objectの作り方
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => onSelectObjectMethod("primitive")}
                style={buttonStyle("#f4f9ff")}
              >
                プリミティブ
              </button>
              <button
                type="button"
                disabled
                style={disabledButtonStyle}
              >
                登録済みアセット
                <div style={{ fontSize: "12px", color: "#888" }}>
                  準備中
                </div>
              </button>
              <button
                type="button"
                disabled
                style={disabledButtonStyle}
              >
                外部モデル
                <div style={{ fontSize: "12px", color: "#888" }}>
                  準備中
                </div>
              </button>
            </div>
          </div>
        )}

        {isPrimitiveStep && (
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Step 3：プリミティブ種類
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {Object.entries(primitiveDefinitions).map(
                ([primitiveType, definition]) => {
                  const isSelected =
                    selectedPrimitiveType === primitiveType;
                  return (
                    <button
                      key={primitiveType}
                      type="button"
                      onClick={() =>
                        definition.enabled &&
                        onSelectPrimitiveType(primitiveType)
                      }
                      disabled={!definition.enabled}
                      style={
                        definition.enabled
                          ? buttonStyle(
                              isSelected
                                ? "#d5eefc"
                                : "#f4f9ff"
                            )
                          : disabledButtonStyle
                      }
                    >
                      {definition.label}
                      {!definition.enabled && (
                        <div
                          style={{ fontSize: "12px", color: "#888" }}
                        >
                          準備中
                        </div>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = (background) => ({
  width: "100%",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #d9d9d9",
  background,
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: 700,
  color: "#222",
  textAlign: "center",
});

const disabledButtonStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  background: "#f7f7f7",
  color: "#999",
  textAlign: "center",
  cursor: "not-allowed",
};

export default GeometryCreateMenu;
