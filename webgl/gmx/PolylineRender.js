import gmxWebGL from '../gmxWebGL.js';
import v1 from './shaders/ringFill/vert.glsl';
import f1 from './shaders/ringFill/frag.glsl';
import v2 from './shaders/ringStroke/vert.glsl';
import f2 from './shaders/ringStroke/frag.glsl';
import appendLineData from './appendLineData.js';

// import utilsGL from "../UtilsGL.js";
// import * as mercator from "../src/mercator.js";
// import { Entity } from "../src/entity/Entity.js";

const POLYVERTICES_BUFFER = 0;
const POLYINDEXES_BUFFER = 1;
const POLYCOLORS_BUFFER = 2;
const LINEVERTICES_BUFFER = 3;
const LINEINDEXES_BUFFER = 4;
const LINEORDERS_BUFFER = 5;
const LINECOLORS_BUFFER = 6;
const LINETHICKNESS_BUFFER = 7;
const LINESTROKES_BUFFER = 8;
const LINESTROKECOLORS_BUFFER = 9;
const POLYPICKINGCOLORS_BUFFER = 10;
const LINEPICKINGCOLORS_BUFFER = 11;
let tempArr = new Float32Array(2);

var PolylineRender = function (params) {

	params = params || {};

	this._handler = null;
	this._framebuffer = null;
	this._width = params.width || 256;
	this._height = params.height || 256;

	// this._textureAtlas = null;

	this._vesselTypeImage = {};

	this._ready = false;
	
};

PolylineRender.prototype = {
	// clearTextureAtlas: function() {
		// if (this._textureAtlas) {
			// this._textureAtlas.clear();
		// }
	// },
	isReady: function() {
		return this._ready;
	},

	initialize: function () {
		this._handler = new gmxWebGL.Handler(null, {
			width: this._width,
			height: this._height,
			context: {
				alpha: true,
				depth: true
			}
		});
		this._handler.initialize();

		if (this._handler.gl) {
			let gl = this._handler.gl;

			this._ready = true;
			this._framebuffer = new gmxWebGL.Framebuffer(this._handler, {
				width: this._width,
				height: this._height,
				useDepth: false,
				filter: "LINEAR"
			});

			this._framebuffer.init();
			this._conf = {
				uniforms: {
                    'viewport': "vec2",
                    'thicknessOutline': "float",
                    'alpha': "float",
                    'extentParamsHigh': "vec4",
                    'extentParamsLow': "vec4"
				},
				attributes: {
                    'prevHigh': {type: "vec2", itemSize: 2, bufName: 'outVerticesHigh'},
                    'currentHigh': {type: "vec2", itemSize: 2, shift: 32, bufName: 'outVerticesHigh'},
                    'nextHigh': {type: "vec2", itemSize: 2, shift: 64, bufName: 'outVerticesHigh'},

                    'prevLow':  {type: "vec2", itemSize: 2, shift: 0, bufName: 'outVerticesLow'},
                    'currentLow':  {type: "vec2", itemSize: 2, shift: 32, bufName: 'outVerticesLow'},
                    'nextLow':  {type: "vec2", itemSize: 2, shift: 64, bufName: 'outVerticesLow'},

                    'order': {type: "float", itemSize: 1, bufName: 'outOrders'},
                    'color': {type: "vec4", itemSize: 4, bufName: 'outColors'},
                    'thickness': {type: "float", itemSize: 1, bufName: 'outThickness'}
				},
				vertexShader: v2,
				fragmentShader: f2
			};

			const p = new gmxWebGL.Program("billboard1", this._conf);
			this._handler.addProgram(p);

			this._confBuf = Object.keys(p._attributes).reduce((a, c) => {
				let it = p._attributes[c];
				let k = it.bufName;
				a[k] = a[k] || {...it, data: [], items: {}};
				a[k].items[c] = true;
				return a;
			}, {});
// console.log('dddddd', this._confBuf);
			this._confBuf = {
				...this._confBuf,
				outStrokes: {
					data: [],
					itemSize: 1,
					size: 0,
					itemType: gl.FLOAT,
					items: {
						'thickness': { type: "float" }, 
					}
				},
				// outStrokeColors: {
					// data: [],
					// itemSize: 4,
					// size: 0,
					// itemType: gl.FLOAT,
					// items: {
						'color': { type: "vec4" }, 
					// }
				// },
				// outPickingColors: {
					// data: [],
					// itemSize: 4,
					// size: 0,
					// itemType: gl.FLOAT,
					// items: {
						'color': { type: "vec4" }, 
					// }
				// },
				outIndexes: {
					data: [],
					itemSize: 1,
					size: 1,
					itemType: gl.UNSIGNED_INT
				}
			}

		}
	},

    bindBuffer(name) {
		const h = this._handler,
			gl = h.gl;
		const sh = h.programs.billboard1._program;
		const sha = sh.attributes,
			shu = sh.uniforms;
		const bufHash = this._confBuf[name];
		if (bufHash) {
			gl.bindBuffer(gl.ARRAY_BUFFER, bufHash.buf);
			Object.keys(bufHash.items).forEach(a => {
				let ah = sh._attributes[a];
				gl.vertexAttribPointer(sha[a], bufHash.itemSize, gl.FLOAT, false, bufHash.size || 0, ah.shift || 0);
			});
		} else {
			console.warn('Не найден буфер: ', name);
		}
	},

    setBuffers(sha) {
		const h = this._handler,
			gl = h.gl;
		const sh = h.programs.billboard1._program;
		const buffers = this._confBuf;
		// const buffers = _confBuf.buffers;
// console.log('buffers', sh, buffers);
		Object.keys(buffers).forEach(k => {
			const bufHash = buffers[k];
			let arr, itemSize;
			// if (
				// k === 'outIndexes' ||
				// k === 'outThickness' ||
				// k === 'outStrokes' ||
				// k === 'outStrokeColors' ||
				// k === 'outColors' ||
				// k === 'outPickingColors' ||
				// k === 'outOrders' ||
				// k === 'outVerticesHigh' ||
				// k === 'outVerticesLow'
			// ) {
				// bufHash.data = _confBuf[k].data;
			// }
			const data = bufHash.data;
			if (bufHash.itemType === gl.UNSIGNED_INT) {
				arr = new Uint32Array(bufHash.data);
				bufHash.buf = h.createElementArrayBuffer(
					arr,
					bufHash.itemSize,
					bufHash.data.length / bufHash.size
				);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufHash.buf);
			} else if (bufHash.itemType === gl.FLOAT) {
				arr = new Float32Array(bufHash.data);
				itemSize = arr.BYTES_PER_ELEMENT * bufHash.itemSize;
				bufHash.buf = h.createArrayBuffer(
					arr, itemSize,
					arr.length / itemSize
				);
				if (bufHash.items) {
					this.bindBuffer(k);
				}
			}
		});
    },

	getExtent: function (tileData) {
		var topLeft = tileData.topLeft;
		var tilePoint = topLeft.tilePoint;
		var b = topLeft.bounds;
		let min = b.min;
		let width1 = b.max.x - min.x;
		let height1 = b.max.y - min.y;
		// min.x *= 1000;
		// min.y *= 1000;
		// width1 *= 1000;
		// height1 *= 1000;

		let extentParamsHigh = new Float32Array(4);
		let extentParamsLow = new Float32Array(4);
		doubleToTwoFloats2(min.x, tempArr);
		extentParamsHigh[0] = tempArr[0];
		extentParamsLow[0] = tempArr[1];

		doubleToTwoFloats2(min.y, tempArr);
		extentParamsHigh[1] = tempArr[0];
		extentParamsLow[1] = tempArr[1];

		extentParamsHigh[2] = 2.0 / width1;
		extentParamsHigh[3] = 2.0 / height1;
		return {
			extentParamsHigh,
			extentParamsLow
		};
	},
	_drawElements: function (thickness, alpha) {
		const h = this._handler;
		const gl = h.gl;
		const sh = h.programs.billboard1._program;
		const sha = sh.attributes,
			shu = sh.uniforms;
		// const buffers = this._confBuf.buffers;
		gl.uniform1f(shu.thicknessOutline, thickness);
		gl.uniform1f(shu.alpha, alpha);
		gl.drawElements(gl.TRIANGLE_STRIP, this._confBuf.outIndexes.numItems, gl.UNSIGNED_INT, 0);
	},

	render: function (outData, tileData, layer) {
		// this.initialize();
		this._createBuffers(tileData, layer.options.layerID);
		let h = this._handler,
			gl = h.gl;
		let f = this._framebuffer.activate();

		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		h.programs.billboard1.activate();
		var sh = h.programs.billboard1._program;
		var sha = sh.attributes,
			shu = sh.uniforms;
		gl.uniform2fv(shu.viewport, [this._width, this._height]);
		let {extentParamsHigh, extentParamsLow} = this.getExtent(tileData);

		gl.uniform4fv(shu.extentParamsHigh, extentParamsHigh);
		gl.uniform4fv(shu.extentParamsLow, extentParamsLow);

		this.setBuffers(sha);
		// const _confBuf = this._confBuf;
		const buffers = this._confBuf;

		let pickingEnabled = true;

		this._drawElements(4, 0.54);	// Antialias pass
		this._drawElements(2, 1.0);		// Aliased pass
		// this._drawElements(4, 0.54);	// Antialias pass
		// this._drawElements(2, 1.0);		// Aliased pass

		if (pickingEnabled) {
			// gl.bindBuffer(gl.ARRAY_BUFFER, buffers.outPickingColors.buf);
			// gl.vertexAttribPointer(sha.color, buffers.outPickingColors.itemSize, gl.FLOAT, false, 0, 0);
			// this._drawElements(16, 1.0);		// Aliased pass
	   }
			// gl.bindBuffer(gl.ARRAY_BUFFER, buffers.outStrokes.buf);
			// gl.vertexAttribPointer(sha.color, buffers.outStrokes.itemSize, gl.FLOAT, false, 0, 0);
			// this._drawElements(16, 0.5);		// Aliased pass

		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);

		f.deactivate();

		f.readAllPixels(outData);
// let flag;
// outData.forEach((v, i) => {
    // if (!flag && v > 0) flag = true, console.log('ff', i, v);
// });
		return outData;
	},
	_createBuffers: function (tileData, layerName) {
		// const h = this._handler,
			// gl = h.gl;
		const _confBuf = this._confBuf;
		Object.keys(_confBuf).forEach(k => {
			_confBuf[k].data = [];
		});
		var geoItems = tileData.geoItems,
			length = geoItems.length;

		const LL = geoItems[0].properties.length - 1;
console.log('tileData', tileData.lastHoverId);

		for (var i = 0; i < geoItems.length; i++) {
			let item = geoItems[i];
			// if (!b.contains(item.dataOption.bounds.getCenter())) continue;
// item.done = tileData.topLeft.tilePoint;
			let dataOption = item.dataOption;

			let hiddenLines = dataOption.hiddenLines;
			let stItem = dataOption[tileData.lastHoverId ? 'parsedStyleHover' : 'parsedStyleKeys'];
			// let stItem = dataOption.parsedStyleKeys;
console.log('tttt', tileData.lastHoverId, stItem);
			
			var prop = item.properties;
			var geo = prop[LL];
			var coords = geo.coordinates;
			if (geo.type === 'POLYGON') {
				coords = [coords];
			} else if (geo.type === 'LINESTRING') {
				coords = [coords];
			}
			coords.forEach((arr, i) => {
				let arr1 = hiddenLines ? getSegmentsArr(hiddenLines[i], arr) : [arr];

				arr1.forEach(pathArr => {

					let style = {
							// strokeWidth: 0,
							lineWidth: stItem.lineWidth,
							lineColor: stItem.webgl.strokeStyle || [0,0,1, 1],
							pickingColor: stItem.webgl.pickingColor || [1,0,1, 0.95],
							strokeColor: stItem.webgl.strokeColor || [0,0,1, 0.95]
							// {"x":0.7,"y":0.5,"z":0.19,"w":0.95}
					};	
					appendLineData({
						isClosed: false,
						bufs: this._confBuf,
						pathArr,
						style
					});
				});
			});
		}
		this._confBuf.outIndexes.numItems = this._confBuf.outIndexes.data.length;
		// buffers.outIndexes.numItems = buffers.outIndexes.data.length;
	}

};

function getSegmentsArr(hidden, pathArr) {
	let paths = [];
	pathArr.forEach((arr, i) => {
		let p1 = [];
		let b = 0;
		let hj = hidden[i].slice(0);
		hj.forEach(n => {
			if (n - b > 1) {
				p1.push(arr.slice(b, n));
			}
			b = n;
		});
		let len = arr.length;
		if (len - b > 1) {
			p1.push(arr.slice(b, len));
		}
		if (p1.length) {
			paths.push(p1);
		}
	});
	return paths;
};
function doubleToTwoFloats2(value, highLowArr) {
    if (value >= 0.0) {
        let doubleHigh = Math.floor(value / 65536.0) * 65536.0;
        highLowArr[0] = Math.fround(doubleHigh);
        highLowArr[1] = Math.fround(value - doubleHigh);
    } else {
        let doubleHigh = Math.floor(-value / 65536.0) * 65536.0;
        highLowArr[0] = Math.fround(-doubleHigh);
        highLowArr[1] = Math.fround(value + doubleHigh);
    }
    return highLowArr;
}


export default PolylineRender;
