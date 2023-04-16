import { Vec2 } from "../src/math/Vec2.js";

const appendLineData = (
        pathArr,
        isClosed,
        color,
        pickingColor,
        thickness,
        strokeColor,
        strokeSize,
        outVerticesHigh,
        outVerticesLow,
        outOrders,
        outIndexes,
        outColors,
        outPickingColors,
        outThickness,
        outStrokeColors,
        outStrokes,
        outVerticesHigh2,
        outVerticesLow2
    ) => {
        var index = 0;

let tempHigh = new Vec2(),
    tempLow = new Vec2(),
    tempHighLow = new Vec2();

        if (outIndexes.length > 0) {
            index = outIndexes[outIndexes.length - 5] + 9;
            outIndexes.push(index, index);
        } else {
            outIndexes.push(0, 0);
        }

        var t = thickness,
            c = [color.x, color.y, color.z, color.w],
            s = strokeSize,
            sc = [strokeColor.x, strokeColor.y, strokeColor.z, strokeColor.w],
            p = [pickingColor.x, pickingColor.y, pickingColor.z, 1.0];

        for (var j = 0; j < pathArr.length; j++) {
            var path = pathArr[j];

            if (path.length === 0) {
                continue;
            }

            var startIndex = index;
            var last;
            if (isClosed) {
                last = path[path.length - 1];
            } else {
                let p0 = path[0],
                    p1 = path[1];

                if (!p1) {
                    p1 = p0;
                }

                last = [p0[0] + p0[0] - p1[0], p0[1] + p0[1] - p1[1]];
            }

            doubleToTwoFloats(last, tempHigh, tempLow);

            outVerticesHigh.push(
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y
            );
            outVerticesLow.push(
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y
            );

            outVerticesHigh2.push(
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y
            );
            outVerticesLow2.push(
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y
            );

            outOrders.push(1, -1, 2, -2);

            outThickness.push(t, t, t, t);
            outStrokes.push(s, s, s, s);
            outColors.push(
                c[0],
                c[1],
                c[2],
                c[3],
                c[0],
                c[1],
                c[2],
                c[3],
                c[0],
                c[1],
                c[2],
                c[3],
                c[0],
                c[1],
                c[2],
                c[3]
            );
            outStrokeColors.push(
                sc[0],
                sc[1],
                sc[2],
                sc[3],
                sc[0],
                sc[1],
                sc[2],
                sc[3],
                sc[0],
                sc[1],
                sc[2],
                sc[3],
                sc[0],
                sc[1],
                sc[2],
                sc[3]
            );
            outPickingColors.push(
                p[0],
                p[1],
                p[2],
                p[3],
                p[0],
                p[1],
                p[2],
                p[3],
                p[0],
                p[1],
                p[2],
                p[3],
                p[0],
                p[1],
                p[2],
                p[3]
            );

            for (var i = 0; i < path.length; i++) {
                var cur = path[i];

                doubleToTwoFloats(cur, tempHigh, tempLow);

                outVerticesHigh.push(
                    tempHigh.x,
                    tempHigh.y,
                    tempHigh.x,
                    tempHigh.y,
                    tempHigh.x,
                    tempHigh.y,
                    tempHigh.x,
                    tempHigh.y
                );
                outVerticesLow.push(
                    tempLow.x,
                    tempLow.y,
                    tempLow.x,
                    tempLow.y,
                    tempLow.x,
                    tempLow.y,
                    tempLow.x,
                    tempLow.y
                );

                outVerticesHigh2.push(
                    tempHigh.x,
                    tempHigh.y,
                    tempHigh.x,
                    tempHigh.y,
                    tempHigh.x,
                    tempHigh.y,
                    tempHigh.x,
                    tempHigh.y
                );
                outVerticesLow2.push(
                    tempLow.x,
                    tempLow.y,
                    tempLow.x,
                    tempLow.y,
                    tempLow.x,
                    tempLow.y,
                    tempLow.x,
                    tempLow.y
                );

                outOrders.push(1, -1, 2, -2);
                outThickness.push(t, t, t, t);
                outStrokes.push(s, s, s, s);
                outColors.push(
                    c[0],
                    c[1],
                    c[2],
                    c[3],
                    c[0],
                    c[1],
                    c[2],
                    c[3],
                    c[0],
                    c[1],
                    c[2],
                    c[3],
                    c[0],
                    c[1],
                    c[2],
                    c[3]
                );
                outStrokeColors.push(
                    sc[0],
                    sc[1],
                    sc[2],
                    sc[3],
                    sc[0],
                    sc[1],
                    sc[2],
                    sc[3],
                    sc[0],
                    sc[1],
                    sc[2],
                    sc[3],
                    sc[0],
                    sc[1],
                    sc[2],
                    sc[3]
                );
                outPickingColors.push(
                    p[0],
                    p[1],
                    p[2],
                    p[3],
                    p[0],
                    p[1],
                    p[2],
                    p[3],
                    p[0],
                    p[1],
                    p[2],
                    p[3],
                    p[0],
                    p[1],
                    p[2],
                    p[3]
                );
                outIndexes.push(index++, index++, index++, index++);
            }

            var first;
            if (isClosed) {
                first = path[0];
                outIndexes.push(startIndex, startIndex + 1, startIndex + 1, startIndex + 1);
            } else {
                let p0 = path[path.length - 1],
                    p1 = path[path.length - 2];

                if (!p1) {
                    p1 = p0;
                }

                first = [p0[0] + p0[0] - p1[0], p0[1] + p0[1] - p1[1]];
                outIndexes.push(index - 1, index - 1, index - 1, index - 1);
            }

            doubleToTwoFloats(first, tempHigh, tempLow);

            outVerticesHigh.push(
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y
            );
            outVerticesLow.push(
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y
            );

            outVerticesHigh2.push(
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y,
                tempHigh.x,
                tempHigh.y
            );
            outVerticesLow2.push(
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y,
                tempLow.x,
                tempLow.y
            );

            outOrders.push(1, -1, 2, -2);
            outThickness.push(t, t, t, t);
            outStrokes.push(s, s, s, s);
            outColors.push(
                c[0],
                c[1],
                c[2],
                c[3],
                c[0],
                c[1],
                c[2],
                c[3],
                c[0],
                c[1],
                c[2],
                c[3],
                c[0],
                c[1],
                c[2],
                c[3]
            );
            outStrokeColors.push(
                sc[0],
                sc[1],
                sc[2],
                sc[3],
                sc[0],
                sc[1],
                sc[2],
                sc[3],
                sc[0],
                sc[1],
                sc[2],
                sc[3],
                sc[0],
                sc[1],
                sc[2],
                sc[3]
            );
            outPickingColors.push(
                p[0],
                p[1],
                p[2],
                p[3],
                p[0],
                p[1],
                p[2],
                p[3],
                p[0],
                p[1],
                p[2],
                p[3],
                p[0],
                p[1],
                p[2],
                p[3]
            );

            if (j < pathArr.length - 1) {
                index += 8;
                outIndexes.push(index, index);
            }
        }
    };
function doubleToTwoFloats(v, high, low) {
    let x = v[0],
        y = v[1];

    if (x >= 0.0) {
        let doubleHigh = Math.floor(x / 65536.0) * 65536.0;
        high.x = Math.fround(doubleHigh);
        low.x = Math.fround(x - doubleHigh);
    } else {
        let doubleHigh = Math.floor(-x / 65536.0) * 65536.0;
        high.x = Math.fround(-doubleHigh);
        low.x = Math.fround(x + doubleHigh);
        // let doubleHigh = Math.floor(-x / 65536.0) * 65536.0;
        // high.x = Math.fround(doubleHigh);
        // low.x = Math.fround(x - doubleHigh);
    }

    if (y >= 0.0) {
        let doubleHigh = Math.floor(y / 65536.0) * 65536.0;
        high.y = Math.fround(doubleHigh);
        low.y = Math.fround(y - doubleHigh);
    } else {
        let doubleHigh = Math.floor(-y / 65536.0) * 65536.0;
        high.y = Math.fround(-doubleHigh);
        low.y = Math.fround(y + doubleHigh);
    }
}

export default appendLineData;
