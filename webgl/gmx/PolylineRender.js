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

	this._vesselTypeImage = {};
	this._ready = false;
};

PolylineRender.prototype = {
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
			this._confFill = {
				uniforms: {
					'extentParams': { type: 'vec4', itemSize: 4, bufName: 'extent' }
				},
				attributes: {
					'a_vertex': { type: 'vec2', itemSize: 2, bufItemSize1: 3, bufName: 'verts' },
					'a_color': { type: 'vec4', itemSize: 4, shift: 32, bufItemSize1: 3, bufName: 'verts' },
				},
				vertexShader: v1,
				fragmentShader: f1
			};
			const pFill = new gmxWebGL.Program("billboard", this._confFill);
			this._handler.addProgram(pFill);
			this._confFillBuf = {
				...this.setConfBufs(pFill),
				prog: pFill,
				indexes: {
					data: [],
					itemSize: 1,
					size: 1,
					itemType: gl.UNSIGNED_INT
				}
			};
			// this._confFillBuf.prog = pFill;

			const p = new gmxWebGL.Program("billboard1", this._conf);
			this._handler.addProgram(p);
			this._confBuf = this.setConfBufs(p);

// console.log('dddddd', this._confBuf);
			this._confBuf = {
				...this._confBuf,
				prog: p,
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
						// 'color': { type: "vec4" }, 
					// }
				// },
				// outPickingColors: {
					// data: [],
					// itemSize: 4,
					// size: 0,
					// itemType: gl.FLOAT,
					// items: {
						// 'color': { type: "vec4" }, 
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

    setConfBufs(p) {
		return Object.keys(p._attributes).reduce((a, c) => {
			let it = p._attributes[c];
			let k = it.bufName;
			a[k] = a[k] || {...it, data: [], items: {}};
			a[k].items[c] = {itemSize: it.itemSize};
			return a;
		}, {});
		// Object.keys(res).forEach(k => {
			// let it = res[k];
			// let keys = Object.keys(it.items);
			// if (keys.length) {
				// it.itemSize = keys.reduce((a, k) => {
					// let c = it.items[k];
					// a += c.itemSize;
					// return a
				// }, 0);
			// }
		// });
		// return res;
	},

    bindBuffer(bufHash, sh) {
		const h = this._handler, gl = h.gl;
		const sha = sh.attributes;
		gl.bindBuffer(gl.ARRAY_BUFFER, bufHash.buf);
		Object.keys(bufHash.items).forEach(a => {
			let ah = sh._attributes[a];
			gl.vertexAttribPointer(sha[a], bufHash.itemSize, gl.FLOAT, false, bufHash.size || 0, ah.shift || 0);
		});
	},

    setBuffers(buffers) {
		const h = this._handler, gl = h.gl;
		const prog = buffers.prog;
		Object.keys(buffers).forEach(k => {
			if (k === 'prog') return;
			const bufHash = buffers[k];
			let arr, itemSize;
			const data = bufHash.data;
			if (bufHash.itemType === gl.UNSIGNED_INT) {
				arr = bufHash.data instanceof Uint32Array ? bufHash.data : new Uint32Array(bufHash.data);
				bufHash.buf = h.createElementArrayBuffer(arr, bufHash.itemSize, bufHash.data.length / bufHash.size);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufHash.buf);
			} else if (bufHash.itemType === gl.FLOAT) {
				arr = bufHash.data instanceof Float32Array ? bufHash.data : new Float32Array(bufHash.data);
				itemSize = arr.BYTES_PER_ELEMENT * ( bufHash.bufItemSize || bufHash.itemSize);
				bufHash.buf = h.createArrayBuffer(arr, itemSize, arr.length / itemSize);
				if (bufHash.items) this.bindBuffer(bufHash, prog);
			}
		});
    },

	getExtent: function (tileData) {
		const topLeft = tileData.topLeft;
		const tilePoint = topLeft.tilePoint;
		const b = topLeft.bounds;
		const min = b.min;
		const width1 = b.max.x - min.x;
		const height1 = b.max.y - min.y;
		// min.x *= 1000;
		// min.y *= 1000;
		// width1 *= 1000;
		// height1 *= 1000;

		const extentParamsHigh = new Float32Array(4);
		const extentParamsLow = new Float32Array(4);
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

	drawFill: function (tileData) {
		const h = this._handler,
			gl = h.gl;

		h.programs.billboard.activate();
		const sh = h.programs.billboard._program;
		const sha = sh.attributes, shu = sh.uniforms;

		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);

		gl.enable(gl.BLEND);
		gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		const topLeft = tileData.topLeft;
		const m = topLeft.bounds.min;
		const scale = 2.0 / topLeft.tileSize;
		gl.uniform4fv(shu.extentParams, new Float32Array([m.x, m.y, scale, scale]));
	
		const bufs = this._confFillBuf;
		const vertArray = new Float32Array(bufs.verts.data);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
		const dim = vertArray.BYTES_PER_ELEMENT || 4;
		gl.vertexAttribPointer(sha.a_vertex, 2, gl.FLOAT, false, dim * 6, 0);
		gl.enableVertexAttribArray(sha.a_vertex);
		gl.vertexAttribPointer(sha.a_color, 4, gl.FLOAT, false, dim * 6, dim * 2);	// -- offset for color buffer
		gl.enableVertexAttribArray(sha.a_color);

		const indexesArray = new Uint32Array(bufs.indexes.data);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexesArray, gl.STATIC_DRAW);
		gl.drawElements(gl.TRIANGLES, indexesArray.length, gl.UNSIGNED_INT, 0);

// console.log('numItems:', this._confFillBuf);
	},

	drawStroke: function (tileData) {
		let h = this._handler,
			pg = h.programs.billboard1,
			sh = pg._program,
			sha = sh.attributes,
			shu = sh.uniforms,
			gl = h.gl;

		pg.activate();
		gl.uniform2fv(shu.viewport, [this._width, this._height]);
		let {extentParamsHigh, extentParamsLow} = this.getExtent(tileData);

		gl.uniform4fv(shu.extentParamsHigh, extentParamsHigh);
		gl.uniform4fv(shu.extentParamsLow, extentParamsLow);

		this.setBuffers(this._confBuf);

		this._drawElements(4, 0.54);	// Antialias pass
		this._drawElements(2, 1.0);		// Aliased pass
		this._drawElements(4, 0.54);	// Antialias pass
		this._drawElements(2, 1.0);		// Aliased pass

		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
	},

	render: function (outData, tileData, layer) {
		this._createBuffers(tileData, layer.options.layerID);
		let f = this._framebuffer.activate();

		this.drawFill(tileData);
		this.drawStroke(tileData);


		f.deactivate();
		f.readAllPixels(outData);
// let flag;
// outData.forEach((v, i) => {
    // if (!flag && v > 0) flag = true, console.log('ff', i, v);
// });
		return outData;
	},
	_createBuffers: function (tileData, layerName) {
		const bufs = this._confBuf;
		Object.keys(bufs).forEach(k => {
			bufs[k].data = [];
		});
		const fillBufs = this._confFillBuf;
		Object.keys(fillBufs).forEach(k => {
			fillBufs[k].data = [];
		});
		let hoverItems = [];
		tileData.geoItems.forEach(item => {
// if (item.id !== 971) return;
			if (item.id === tileData.lastHoverId) hoverItems.push(item);
			else setItem(item, bufs, fillBufs, false);
		});
		hoverItems.forEach(item => {
			setItem(item, bufs, fillBufs, true);
		});
/*
		Object.keys(bufs).forEach(k => {
			if (
				k === 'outStrokeColors' ||
				k === 'outPickingColors' ||
				k === 'outOrders' ||
				k === 'outStrokes' ||
				k === 'outThickness' ||
				k === 'outColors' ||
				k === 'outVerticesLow' ||
				k === 'outVerticesHigh'
			) {
			let dataf = bufs[k].dataf;
			let tmp = new Float32Array(dataf.farr.buffer, 0, dataf.find);
			bufs[k].data = tmp;
			}
		});
*/
		bufs.outIndexes.numItems = bufs.outIndexes.data.length;
	}
};

function setItem(item, bufs, fillBufs, isHover) {
	let dataOption = item.dataOption;
	let stItem = isHover ? dataOption.parsedStyleHover : dataOption.parsedStyleKeys;
	let style = {
		lineWidth: stItem.lineWidth + (isHover ? 8 : 0),
		lineColor: stItem.webgl.strokeStyle || [0,0,1, 1],
		strokeColor: stItem.webgl.strokeColor || [0,0,1, 0.95]
	};	
	let fillStyle = stItem.webgl.fillStyle || [0,0,1, 1];
	
	let prop = item.properties;
	let geo = prop[prop.length - 1];
	let coords = geo.coordinates;
	if (geo.type === 'POLYGON') {
		coords = [coords];
	} else if (geo.type === 'LINESTRING') {
		coords = [coords];
	}
	let hiddenLines = dataOption.hiddenLines;
	let verts = [];
	let vertsIndexes = [];
	
	let len = fillBufs.verts.data.length / 6;
	coords.forEach((arr, i) => {
		let data = gmxWebGL.earcut.flatten(arr.map(it => it.map(p => [p[0], p[1], fillStyle[0], fillStyle[1], fillStyle[2], fillStyle[3] || 0.5])));
		let dataIndexes = gmxWebGL.earcut(data.vertices, data.holes, 6);
		verts = verts.concat(data.vertices);
		dataIndexes.forEach(n => { vertsIndexes.push(n + len); });

		let arr1 = hiddenLines ? getSegmentsArr(hiddenLines[i], arr) : [arr];
		arr1.forEach(pathArr => {
			appendLineData({ isClosed: false, bufs, pathArr, style });
		});
	});
	fillBufs.verts.data = fillBufs.verts.data.concat(verts);
	fillBufs.indexes.data = fillBufs.indexes.data.concat(vertsIndexes);
};

function getSegmentsArr(hidden, pathArr) {
	let paths = [];
	pathArr.forEach((arr, i) => {
		let p1 = [];
		let b = 0;
		let hj = hidden[i].slice(0);
		hj.forEach(n => {
			if (n - b > 1) p1.push(arr.slice(b, n));
			b = n;
		});
		let len = arr.length;
		if (len - b > 1) p1.push(arr.slice(b, len));
		if (p1.length) paths.push(p1);
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
