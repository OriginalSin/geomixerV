import PolylineRender from './gmx/PolylineRenderEarcut.js'
// import PolylineRender from './gmx/PolylineRender.js'
// import PolygonsRender from './gmx/PolygonsRender.js'
// import './viewer.css';
// console.log('gmxWebGL', PolylineRender, gmxWebGL);

// let gmxMap = L.gmxMapProps || L.gmx.gmxMap;
L.Map.addInitHook(function() {
	let map = this;
	map.on('layeradd', ev => {
		let gmxLayer = ev.layer;
		if (!gmxLayer._gmx || !gmxLayer._gmx.webGL) return;
		let gmx = gmxLayer._gmx;
			console.log('layeradd', gmx);
		let tileRender;
		if (gmx.GeometryType === 'polygon') {
			tileRender = new PolylineRender(gmx);
		} else if (gmx.GeometryType === 'linestring') {
			tileRender = new PolylineRender(gmx);
		}
		if (tileRender) {
			// tileRender.initialize();
			console.log('tileRender', tileRender);

			// if (tileRender.isReady()) {
				// gmxLayer.setZIndexOffset(100000);
				// map.addLayer(gmxLayer);
				const _data = new Uint8Array(4 * 256 * 256);

				gmxLayer._webGLRenderer = function (info) {
					var tile = info.tile,
						context = info.ctx;
					if (context) {
						let tt = tileRender.render(_data, info, gmxLayer);
let iBitmap = tt.transferToImageBitmap();
console.log('gggg', tt);
	// tile.getContext('bitmaprenderer').transferFromImageBitmap(tt.transferToImageBitmap());
let ctx = tile.getContext('2d');
ctx.drawImage(iBitmap, 0, 0, 256, 256);
// createImageBitmap(tt, 0, 0, 256, 256).then(im => {
	// tile.getContext('bitmaprenderer').transferFromImageBitmap(im);
						// tile.getContext('2d').putImageData(im, 0, 0, 256, 256);
// });
/*
	_data.forEach((v, i) => {
		if (v > 0) console.log('ff', i, v);
	});

						var imageData = context.createImageData(tile.width, tile.height);
						imageData.data.set(_data);
						// tile.getContext('bitmaprenderer').transferFromImageBitmap(_data);
						context.putImageData(imageData, 0, 0);
						*/
					}
				};
			// }
			tileRender.appendStyles_old(gmxLayer.getStyles(), gmxLayer);
		}
	});
});
