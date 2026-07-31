export const getClosestPointOnSegment = (
    point,
    segmentStart,
    segmentEnd
) => {
    const abX = segmentEnd.x - segmentStart.x;
    const abY = segmentEnd.y - segmentStart.y;

    const apX = point.x - segmentStart.x;
    const apY = point.y - segmentStart.y;

    const abLengthSquared =
        abX * abX +
        abY * abY;

    if (abLengthSquared === 0) {
        return {
            x: segmentStart.x,
            y: segmentStart.y,
            t: 0,
        };
    }

    const dot =
        apX * abX +
        apY * abY;

    const rawT = dot / abLengthSquared;

    const t = Math.max(
        0,
        Math.min(1, rawT)
    );

    return {
        x: segmentStart.x + abX * t,
        y: segmentStart.y + abY * t,
        t,
    };
};