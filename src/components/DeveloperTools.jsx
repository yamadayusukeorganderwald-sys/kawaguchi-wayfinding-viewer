import { useState } from "react";
import { supabase } from "../lib/supabase";
import { compressImage } from "../utils/imageCompression";
import { createImageFileName } from "../utils/imageFileName";

const BUCKET_NAME = "place-images";

function extractStorageFileName(imageUrl) {
    if (!imageUrl) return null;

    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const markerIndex = imageUrl.indexOf(marker);

    if (markerIndex === -1) return null;

    const fileNameWithQuery = imageUrl.slice(
        markerIndex + marker.length
    );

    return decodeURIComponent(
        fileNameWithQuery.split("?")[0]
    );
}

function DeveloperTools() {
    const [unusedFiles, setUnusedFiles] = useState([]);
    const [isChecking, setIsChecking] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [migrationTargets, setMigrationTargets] = useState([]);
    const [isCheckingMigration, setIsCheckingMigration] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationMessage, setMigrationMessage] = useState("");
    const [migrationLogs, setMigrationLogs] = useState([]);

    // 本番環境では管理画面を表示しない
    if (!import.meta.env.DEV) {
        return null;
    }

    const findUnusedFiles = async () => {
        if (isChecking || isDeleting) return;

        setIsChecking(true);
        setMessage("");

        try {
            const { data: places, error: placesError } =
                await supabase
                    .from("places")
                    .select("image")
                    .not("image", "is", null)
                    .neq("image", "");

            if (placesError) {
                throw placesError;
            }

            const usedFileNames = new Set(
                (places ?? [])
                    .map((place) =>
                        extractStorageFileName(place.image)
                    )
                    .filter(Boolean)
            );

            const { data: storageFiles, error: storageError } =
                await supabase.storage
                    .from(BUCKET_NAME)
                    .list("", {
                        limit: 1000,
                        sortBy: {
                            column: "created_at",
                            order: "asc",
                        },
                    });

            if (storageError) {
                throw storageError;
            }

            const unused = (storageFiles ?? []).filter(
                (file) =>
                    file.name &&
                    !usedFileNames.has(file.name)
            );

            setUnusedFiles(unused);
            setMessage(
                `Storage全${storageFiles?.length ?? 0}件のうち、未使用画像は${unused.length}件です`
            );
        } catch (error) {
            console.error("未使用画像の確認に失敗:", error);
            setMessage(
                `確認に失敗しました：${error.message}`
            );
        } finally {
            setIsChecking(false);
        }
    };

    const deleteUnusedFiles = async () => {
        if (isDeleting || unusedFiles.length === 0) return;

        const confirmed = window.confirm(
            `未使用画像${unusedFiles.length}件を削除します。\nこの操作は元に戻せません。続けますか？`
        );

        if (!confirmed) return;

        setIsDeleting(true);
        setMessage("");

        try {
            const fileNames = unusedFiles.map(
                (file) => file.name
            );

            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove(fileNames);

            if (error) {
                throw error;
            }

            setUnusedFiles([]);
            setMessage(
                `${fileNames.length}件の未使用画像を削除しました`
            );
        } catch (error) {
            console.error("未使用画像の削除に失敗:", error);
            setMessage(
                `削除に失敗しました：${error.message}`
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const findPlaceImageMigrationTargets = async () => {
        if (isCheckingMigration || isMigrating) return;

        setIsCheckingMigration(true);
        setMigrationMessage("");
        setMigrationLogs([]);

        try {
            const { data: places, error } = await supabase
                .from("places")
                .select("id, name, image")
                .not("image", "is", null)
                .neq("image", "");

            if (error) {
                throw error;
            }

            const targets = (places ?? [])
                .map((place) => {
                    const currentFileName =
                        extractStorageFileName(place.image);

                    const expectedFileName =
                        createImageFileName("place", place.id);

                    return {
                        ...place,
                        currentFileName,
                        expectedFileName,
                    };
                })
                .filter((place) => place.currentFileName);

            setMigrationTargets(targets);
            setMigrationMessage(
                `${targets.length}件のPlace画像を再圧縮・命名統一できます`
            );
        } catch (error) {
            console.error("移行対象の確認に失敗:", error);

            setMigrationMessage(
                `確認に失敗しました：${error.message}`
            );
        } finally {
            setIsCheckingMigration(false);
        }
    };

    const migratePlaceImages = async () => {
        if (isMigrating || migrationTargets.length === 0) return;

        const confirmed = window.confirm(
            `${migrationTargets.length}件のPlace画像を再圧縮し、` +
            `命名規則を統一します。\n` +
            `処理完了後、旧ファイルは削除されます。\n\n` +
            `続けますか？`
        );

        if (!confirmed) return;

        setIsMigrating(true);
        setMigrationMessage("");
        setMigrationLogs([]);

        let successCount = 0;
        let failureCount = 0;

        try {
            for (const place of migrationTargets) {
                try {
                    setMigrationLogs((current) => [
                        ...current,
                        `処理中：${place.name}`,
                    ]);

                    // 1. Storageから既存画像を取得
                    const { data: downloadedBlob, error: downloadError } =
                        await supabase.storage
                            .from(BUCKET_NAME)
                            .download(place.currentFileName);

                    if (downloadError) {
                        throw downloadError;
                    }

                    // 2. BlobをFileへ変換
                    const sourceFile = new File(
                        [downloadedBlob],
                        place.currentFileName,
                        {
                            type:
                                downloadedBlob.type ||
                                "image/jpeg",
                        }
                    );

                    // 3. 長辺1000px・JPEG品質0.7へ圧縮
                    const compressedImage =
                        await compressImage(sourceFile);

                    // 4. 新しい命名規則でアップロード
                    const { error: uploadError } =
                        await supabase.storage
                            .from(BUCKET_NAME)
                            .upload(
                                place.expectedFileName,
                                compressedImage,
                                {
                                    upsert: false,
                                    contentType: "image/jpeg",
                                    cacheControl: "3600",
                                }
                            );

                    if (uploadError) {
                        throw uploadError;
                    }

                    // 5. 新しい公開URLを取得
                    const { data: publicUrlData } =
                        supabase.storage
                            .from(BUCKET_NAME)
                            .getPublicUrl(
                                place.expectedFileName
                            );

                    const newImageUrl =
                        publicUrlData.publicUrl;

                    // 6. DBの画像URLを更新
                    const { error: updateError } =
                        await supabase
                            .from("places")
                            .update({
                                image: newImageUrl,
                            })
                            .eq("id", place.id);

                    if (updateError) {
                        // DB更新失敗時、新しく作った画像を削除
                        await supabase.storage
                            .from(BUCKET_NAME)
                            .remove([
                                place.expectedFileName,
                            ]);

                        throw updateError;
                    }

                    // 7. 名前が変わった場合だけ旧画像を削除
                    if (
                        place.currentFileName !==
                        place.expectedFileName
                    ) {
                        const {
                            data: removedFiles,
                            error,
                        } = await supabase.storage
                            .from(BUCKET_NAME)
                            .remove(fileNames);

                        if (error) {
                            throw error;
                        }

                        if (!removedFiles || removedFiles.length !== fileNames.length) {
                            throw new Error(
                                `削除要求${fileNames.length}件に対し、実際の削除は${removedFiles?.length ?? 0}件でした`
                            );
                        }

                        if (removeError) {
                            throw new Error(
                                `旧画像を削除できませんでした：${removeError.message}`
                            );
                        }

                        if (!removedFiles || removedFiles.length === 0) {
                            throw new Error(
                                `旧画像の削除結果が0件でした：${place.currentFileName}`
                            );
                        }
                    }

                    successCount += 1;

                    setMigrationLogs((current) => [
                        ...current,
                        `✓ ${place.name}：` +
                        `${Math.round(sourceFile.size / 1024)}KB → ` +
                        `${Math.round(compressedImage.size / 1024)}KB`,
                    ]);
                } catch (error) {
                    failureCount += 1;

                    console.error(
                        `画像移行失敗：${place.name}`,
                        error
                    );

                    setMigrationLogs((current) => [
                        ...current,
                        `✕ ${place.name}：${error.message}`,
                    ]);
                }
            }

            setMigrationMessage(
                `移行完了：成功${successCount}件、失敗${failureCount}件`
            );

            // 再実行前にもう一度確認させる
            setMigrationTargets([]);
        } finally {
            setIsMigrating(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                aria-label="開発ツールを開く"
                style={{
                    position: "fixed",
                    right: "16px",
                    top: "16px",
                    left: "auto",
                    bottom: "auto",
                    zIndex: 20000,
                    width: "24px",
                    height: "24px",
                    padding: 0,
                    border: "2px solid #ff9800",
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                    fontSize: "12px",
                    cursor: "pointer",
                }}
            >
                ⚙️
            </button>
        );
    }

    return (
        <div
            style={{
                position: "fixed",
                right: "16px",
                top: "16px",
                left: "auto",
                bottom: "auto",
                zIndex: 20000,
                width: "min(360px, calc(100vw - 32px))",
                maxHeight: "60vh",
                overflowY: "auto",
                boxSizing: "border-box",
                padding: "14px",
                border: "2px solid #ff9800",
                borderRadius: "10px",
                background: "#ffffff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                }}
            >
                <div
                    style={{
                        fontWeight: "bold",
                    }}
                >
                    🛠 開発ツール
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isChecking || isDeleting}
                    aria-label="開発ツールを閉じる"
                    style={{
                        border: "none",
                        background: "transparent",
                        fontSize: "22px",
                        cursor:
                            isChecking || isDeleting
                                ? "not-allowed"
                                : "pointer",
                    }}
                >
                    ×
                </button>
            </div>

            <div
                style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                    fontWeight: "bold",
                }}
            >
                🧹 Place画像掃除
            </div>

            <button
                type="button"
                onClick={findUnusedFiles}
                disabled={isChecking || isDeleting}
                style={{
                    marginRight: "8px",
                    padding: "8px 12px",
                }}
            >
                {isChecking
                    ? "確認中..."
                    : "未使用画像を確認"}
            </button>

            <button
                type="button"
                onClick={deleteUnusedFiles}
                disabled={
                    isDeleting ||
                    isChecking ||
                    unusedFiles.length === 0
                }
                style={{
                    padding: "8px 12px",
                }}
            >
                {isDeleting
                    ? "削除中..."
                    : `${unusedFiles.length}件を削除`}
            </button>

            {message && (
                <p
                    style={{
                        margin: "10px 0 0",
                        fontSize: "13px",
                    }}
                >
                    {message}
                </p>
            )}

            {unusedFiles.length > 0 && (
                <details style={{ marginTop: "10px" }}>
                    <summary>
                        削除対象ファイルを表示
                    </summary>

                    <div
                        style={{
                            marginTop: "8px",
                            fontSize: "11px",
                            wordBreak: "break-all",
                        }}
                    >
                        {unusedFiles.map((file) => (
                            <div
                                key={file.name}
                                style={{
                                    padding: "4px 0",
                                    borderBottom:
                                        "1px solid #eeeeee",
                                }}
                            >
                                {file.name}
                            </div>
                        ))}
                    </div>
                </details>
            )}
            <hr
                style={{
                    margin: "16px 0",
                    border: 0,
                    borderTop: "1px solid #dddddd",
                }}
            />

            <div
                style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                    fontWeight: "bold",
                }}
            >
                📦 Place画像最適化
            </div>

            <button
                type="button"
                onClick={findPlaceImageMigrationTargets}
                disabled={
                    isCheckingMigration ||
                    isMigrating ||
                    isChecking ||
                    isDeleting
                }
                style={{
                    marginRight: "8px",
                    padding: "8px 12px",
                }}
            >
                {isCheckingMigration
                    ? "確認中..."
                    : "対象画像を確認"}
            </button>

            <button
                type="button"
                onClick={migratePlaceImages}
                disabled={
                    isMigrating ||
                    isCheckingMigration ||
                    migrationTargets.length === 0
                }
                style={{
                    padding: "8px 12px",
                }}
            >
                {isMigrating
                    ? "移行中..."
                    : `${migrationTargets.length}件を移行`}
            </button>

            {migrationMessage && (
                <p
                    style={{
                        margin: "10px 0 0",
                        fontSize: "13px",
                    }}
                >
                    {migrationMessage}
                </p>
            )}

            {migrationTargets.length > 0 && (
                <details style={{ marginTop: "10px" }}>
                    <summary>移行対象を表示</summary>

                    <div
                        style={{
                            marginTop: "8px",
                            fontSize: "11px",
                            wordBreak: "break-all",
                        }}
                    >
                        {migrationTargets.map((place) => (
                            <div
                                key={place.id}
                                style={{
                                    padding: "6px 0",
                                    borderBottom:
                                        "1px solid #eeeeee",
                                }}
                            >
                                <strong>{place.name}</strong>
                                <div>
                                    {place.currentFileName}
                                </div>
                                <div>↓</div>
                                <div>
                                    {place.expectedFileName}
                                </div>
                            </div>
                        ))}
                    </div>
                </details>
            )}

            {migrationLogs.length > 0 && (
                <details
                    open={isMigrating}
                    style={{ marginTop: "10px" }}
                >
                    <summary>処理ログ</summary>

                    <div
                        style={{
                            marginTop: "8px",
                            fontSize: "11px",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {migrationLogs.map((log, index) => (
                            <div key={`${index}-${log}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}

export default DeveloperTools;