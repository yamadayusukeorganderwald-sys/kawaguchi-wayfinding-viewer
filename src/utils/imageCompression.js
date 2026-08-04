const MAX_IMAGE_LENGTH = 1000;
const JPEG_QUALITY = 0.7;

export async function compressImage(file) {
    if (!file) {
        throw new Error("圧縮する画像がありません");
    }

    if (!file.type.startsWith("image/")) {
        throw new Error("画像ファイルではありません");
    }

    const objectUrl = URL.createObjectURL(file);

    try {
        const image = await loadImage(objectUrl);

        const { width, height } = calculateSize(
            image.naturalWidth,
            image.naturalHeight
        );

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("画像処理を開始できませんでした");
        }

        // 透過画像をJPEGにしたとき、背景が黒くならないよう白で塗る
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);

        context.drawImage(image, 0, 0, width, height);

        const blob = await canvasToBlob(
            canvas,
            "image/jpeg",
            JPEG_QUALITY
        );

        const originalName =
            file.name.replace(/\.[^/.]+$/, "") || "image";

        return new File(
            [blob],
            `${originalName}.jpg`,
            {
                type: "image/jpeg",
                lastModified: Date.now(),
            }
        );
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () =>
            reject(new Error("画像を読み込めませんでした"));

        image.src = src;
    });
}

function calculateSize(originalWidth, originalHeight) {
    const longestSide = Math.max(originalWidth, originalHeight);

    // 1000px以下の画像は拡大しない
    if (longestSide <= MAX_IMAGE_LENGTH) {
        return {
            width: originalWidth,
            height: originalHeight,
        };
    }

    const scale = MAX_IMAGE_LENGTH / longestSide;

    return {
        width: Math.round(originalWidth * scale),
        height: Math.round(originalHeight * scale),
    };
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("画像の圧縮に失敗しました"));
                    return;
                }

                resolve(blob);
            },
            type,
            quality
        );
    });
}