// import PolylineRender from './gmx/PolylineRenderEarcut.js'
import PolylineRender from './gmx/PolylineRender.js'
// import PolylineRender from './gmx/PolygonsRender.js'
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
		var tileRender = new PolylineRender();
		tileRender.initialize();

		if (tileRender.isReady()) {
			// gmxLayer.setZIndexOffset(100000);
			// map.addLayer(gmxLayer);
			var _data = new Uint8Array(4 * 256 * 256);

			gmxLayer._webGLRenderer = function (info) {
		console.time("tile");
				var tile = info.tile,
					context = info.ctx;
				if (context) {
					tileRender.render(_data, info, gmxLayer);
					var imageData = context.createImageData(tile.width, tile.height);
					imageData.data.set(_data);
					context.putImageData(imageData, 0, 0);
				}
		console.timeEnd("tile");
			};
		}
		// tileRender.appendStyles_old(gmxLayer.getStyles(), gmxLayer);
	});
	
});
