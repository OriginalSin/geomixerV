const appendLineData = (attr) => {
        let {
			pathArr,
			style,
			isClosed,
			color,
			pickingColor,
			thickness,
			strokeColor,
			strokeSize,
		} = attr;
		
		// pathArr = pathArr.slice(0);
		let outIndexes = attr.bufs.outIndexes.data;

        let index = outIndexes.length > 0 ? outIndexes[outIndexes.length - 5] + 9 : 0;
		outIndexes.push(index, index);

        for (let j = 0; j < pathArr.length; j++) {
            let path = pathArr[j].slice(0);
            let plen = path.length;
            if (plen === 0) continue;

            var startIndex = index;
            var last;
            if (isClosed) {
                last = path[plen - 1];
            } else {
                let p0 = path[0], p1 = path[1];
                if (!p1) p1 = p0;
                last = [p0[0] + p0[0] - p1[0], p0[1] + p0[1] - p1[1]];
            }
			doubleToTwoFloatArrays(last, attr);

            for (let i = 0; i < plen; i++) {
                let cur = path[i];
				doubleToTwoFloatArrays(cur, attr);
                outIndexes.push(index++, index++, index++, index++);
            }

            var first;
            if (isClosed) {
                first = path[0];
                outIndexes.push(startIndex, startIndex + 1, startIndex + 1, startIndex + 1);
            } else {
                let p0 = path[plen - 1],
                    p1 = path[plen - 2];

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

function setXY(dataf, x, y) {
	let beg = dataf.find;
	dataf.find += 8;
	if (dataf.farr.length < dataf.find) {
		let result = new Float32Array(beg + 5000);
		result.set(dataf.farr);
		dataf.farr = result;
	// console.log('result', result.length);
	}	
	dataf.farr[beg] = dataf.farr[beg + 2] = dataf.farr[beg + 4] = dataf.farr[beg + 6] = x;
	beg++;
	dataf.farr[beg] = dataf.farr[beg + 2] = dataf.farr[beg + 4] = dataf.farr[beg + 6] = y;
}

function setColor(dataf, c) {
	let beg = dataf.find;
	dataf.find += 16;
	if (dataf.farr.length < dataf.find) {
		let result = new Float32Array(beg + 5000);
		result.set(dataf.farr);
		dataf.farr = result;
	// console.log('result', result.length);
	}	
	dataf.farr[beg] = dataf.farr[beg + 4] = dataf.farr[beg + 8] = dataf.farr[beg + 12] = c[0];
	beg++;
	dataf.farr[beg] = dataf.farr[beg + 4] = dataf.farr[beg + 8] = dataf.farr[beg + 12] = c[1];
	beg++;
	dataf.farr[beg] = dataf.farr[beg + 4] = dataf.farr[beg + 8] = dataf.farr[beg + 12] = c[2];
	beg++;
	dataf.farr[beg] = dataf.farr[beg + 4] = dataf.farr[beg + 8] = dataf.farr[beg + 12] = c[3];
}

function setWidth(dataf, t) {
	let beg = dataf.find;
	dataf.find += 4;
	if (dataf.farr.length < dataf.find) {
		let result = new Float32Array(beg + 5000);
		result.set(dataf.farr);
		dataf.farr = result;
	// console.log('result', result.length);
	}	
	dataf.farr[beg] = dataf.farr[beg + 1] = dataf.farr[beg + 2] = dataf.farr[beg + 3] = t;
}

function setOrder(dataf) {
	let beg = dataf.find;
	dataf.find += 4;
	if (dataf.farr.length < dataf.find) {
		let result = new Float32Array(beg + 5000);
		result.set(dataf.farr);
		dataf.farr = result;
	// console.log('result', result.length);
	}	
	dataf.farr[beg] = 1; dataf.farr[beg + 1] = -1; dataf.farr[beg + 2] = -2; dataf.farr[beg + 3] = -2;
	// bufs.outOrders.data.push(1, -1, 2, -2);
}
function doubleToTwoFloatArrays(v, attr, thickness) {
    let x = v[0], y = v[1],
    // let x = v[0] * 1000, y = v[1] * 1000,
		// dbx = x,
		// dby = y,
		dbx = Math.floor(x / 65536.0) * 65536.0,
		dby = Math.floor(y / 65536.0) * 65536.0,
		hx = Math.fround(dbx), hy = Math.fround(dby),
		lx = Math.fround(x - dbx), ly = Math.fround(y - dby);
		// hx = Math.fround(x), hy = Math.fround(y),
		// lx = Math.fround(x - hx), ly = Math.fround(y - hy);

	let bufs = attr.bufs;
	// let dataf = bufs.outVerticesHigh.dataf;

	let style = attr.style,
		t = style.lineWidth,
		// color = style.lineColor,
		// c = [color.x, color.y, color.z, color.w],
		c = style.lineColor || [0, 0, 1, 1],
		s = style.strokeWidth || t,
		// strokeColor = style.strokeColor,
		// sc = [strokeColor.x, strokeColor.y, strokeColor.z, strokeColor.w],
		sc = style.strokeColor || c,
		p = style.pickingColor;

// setXY(bufs.outVerticesHigh.dataf, hx, hy);
// setXY(bufs.outVerticesLow.dataf, lx, ly);
// setOrder(bufs.outOrders.dataf);
// setWidth(bufs.outThickness.dataf, t);
// setColor(bufs.outColors.dataf, c);
// if (bufs.outStrokes) setWidth(bufs.outStrokes.dataf, s);
// if (bufs.outStrokeColors) setColor(bufs.outStrokeColors.dataf, sc); 
// if (p && bufs.outPickingColors) setColor(bufs.outPickingColors.dataf, p); 

	bufs.outVerticesHigh.data.push(hx,hy, hx,hy, hx,hy, hx,hy);
	bufs.outVerticesLow.data.push(lx,ly, lx,ly, lx,ly, lx,ly);
	bufs.outOrders.data.push(1, -1, 2, -2);
	bufs.outThickness.data.push(t, t, t, t);
	bufs.outColors.data.push(c[0], c[1], c[2], c[3] || 1, c[0], c[1], c[2], c[3] || 1, c[0], c[1], c[2], c[3] || 1, c[0], c[1], c[2], c[3] || 1);
	if (bufs.outStrokes) bufs.outStrokes.data.push(s, s, s, s);
	if (bufs.outStrokeColors) bufs.outStrokeColors.data.push(sc[0], sc[1], sc[2], sc[3], sc[0], sc[1], sc[2], sc[3], sc[0], sc[1], sc[2], sc[3], sc[0], sc[1], sc[2], sc[3]);
	if (p && bufs.outPickingColors) bufs.outPickingColors.data.push(p[0], p[1], p[2], p[3], p[0], p[1], p[2], p[3], p[0], p[1], p[2], p[3], p[0], p[1], p[2], p[3]);

// console.log('doubleToTwoFloatArrays', v);
}

export default appendLineData;
