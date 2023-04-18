const appendLineData = (attr) => {
        let {
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
		} = attr;
        var index = 0;
outIndexes = attr.bufs.outIndexes.data;
        if (outIndexes.length > 0) {
            index = outIndexes[outIndexes.length - 5] + 9;
            outIndexes.push(index, index);
        } else {
            outIndexes.push(0, 0);
        }

        for (var j = 0; j < pathArr.length; j++) {
            var path = pathArr[j];

            if (path.length === 0) continue;

            var startIndex = index;
            var last;
            if (isClosed) {
                last = path[path.length - 1];
            } else {
                let p0 = path[0], p1 = path[1];
                if (!p1) p1 = p0;
                last = [p0[0] + p0[0] - p1[0], p0[1] + p0[1] - p1[1]];
            }
			doubleToTwoFloatArrays(last, attr);

            for (var i = 0; i < path.length; i++) {
                var cur = path[i];

				doubleToTwoFloatArrays(cur, attr);

                outIndexes.push(index++, index++, index++, index++);
            }

            var first;
            if (isClosed) {
                first = path[0];
                outIndexes.push(startIndex, startIndex + 1, startIndex + 1, startIndex + 1);
            } else {
                let p0 = path[path.length - 1],
                    p1 = path[path.length - 2];

                if (!p1) p1 = p0;

                first = [p0[0] + p0[0] - p1[0], p0[1] + p0[1] - p1[1]];
                outIndexes.push(index - 1, index - 1, index - 1, index - 1);
            }

			doubleToTwoFloatArrays(first, attr);
 
            if (j < pathArr.length - 1) {
                index += 8;
                outIndexes.push(index, index);
            }
        }
    };

function doubleToTwoFloatArrays(v, attr) {
    let x = v[0], y = v[1],
    // let x = v[0] * 1000, y = v[1] * 1000,
		// dbx = x,
		// dby = y,
		dbx = Math.floor(x / 65536.0) * 65536.0,
		dby = Math.floor(y / 65536.0) * 65536.0,
		hx = Math.fround(dbx), hy = Math.fround(dby),
		lx = Math.fround(x - dbx), ly = Math.fround(y - dby);

	attr.bufs.outVerticesHigh.data.push(hx,hy, hx,hy, hx,hy, hx,hy);
	// attr.outVerticesHigh.push(hx,hy, hx,hy, hx,hy, hx,hy);

	attr.bufs.outVerticesLow.data.push(lx,ly, lx,ly, lx,ly, lx,ly);
	
	let t = attr.thickness,
		color = attr.color,
		c = [color.x, color.y, color.z, color.w],
		s = attr.strokeSize,
		strokeColor = attr.strokeColor,
		sc = [strokeColor.x, strokeColor.y, strokeColor.z, strokeColor.w],
		pickingColor = attr.pickingColor,
		p = [pickingColor.x, pickingColor.y, pickingColor.z, 1.0];

	attr.bufs.outOrders.data.push(1, -1, 2, -2);
	attr.bufs.outThickness.data.push(t, t, t, t);
	attr.bufs.outColors.data.push(c[0], c[1], c[2], c[3], c[0], c[1], c[2], c[3], c[0], c[1], c[2], c[3], c[0], c[1], c[2], c[3]);
	attr.bufs.outStrokes.data.push(s, s, s, s);
	attr.bufs.outStrokeColors.data.push(sc[0], sc[1], sc[2], sc[3], sc[0], sc[1], sc[2], sc[3], sc[0], sc[1], sc[2], sc[3], sc[0], sc[1], sc[2], sc[3]);
	attr.bufs.outPickingColors.data.push(p[0], p[1], p[2], p[3], p[0], p[1], p[2], p[3], p[0], p[1], p[2], p[3], p[0], p[1], p[2], p[3]);

// console.log('doubleToTwoFloatArrays', v);
}

export default appendLineData;
