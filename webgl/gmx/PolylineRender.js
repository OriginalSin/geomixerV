import gmxWebGL from '../gmxWebGL.js';
import v1 from './shaders/ringFill/vert.glsl';
import f1 from './shaders/ringFill/frag.glsl';
import v2 from './shaders/ringStroke/vert.glsl';
import f2 from './shaders/ringStroke/frag.glsl';
import appendLineData from './appendLineData.js';

import { Vec2 } from "../src/math/Vec2.js";
// import * as mercator from "../src/mercator.js";
import { Entity } from "../src/entity/Entity.js";

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

			// this._textureAtlas = new gmxWebGL.TextureAtlas(1024, 1024);
			// this._textureAtlas.assignHandler(this._handler);

			this._ready = true;
			this._handler.deactivateFaceCulling();
			this._handler.deactivateDepthTest();

			// this._framebuffer = new gmxWebGL.Framebuffer(this._handler, {
				// width: this._width,
				// height: this._height,
				// useDepth: false,
				// filter: "LINEAR"
			// });

			// this._framebuffer.init();

			this._handler.addProgram(new gmxWebGL.Program("billboard1", {
				uniforms: {
                    'viewport': "vec2",
                    'thicknessOutline': "float",
                    'alpha': "float",
                    'extentParamsHigh': "vec4",
                    'extentParamsLow': "vec4"
				},
				attributes: {
                    'prevHigh': "vec2",
                    'currentHigh': "vec2",
                    'nextHigh': "vec2",

                    'prevLow': "vec2",
                    'currentLow': "vec2",
                    'nextLow': "vec2",

                    'order': "float",
                    'color': "vec4",
                    'thickness': "float"
				},
				vertexShader: v2,
				fragmentShader: f2
			}));
			
        // this._buffersUpdateCallbacks[LINEVERTICES_BUFFER] = this.createLineVerticesBuffer;
        // this._buffersUpdateCallbacks[LINEINDEXES_BUFFER] = this.createLineIndexesBuffer;
        // this._buffersUpdateCallbacks[LINEORDERS_BUFFER] = this.createLineOrdersBuffer;
        // this._buffersUpdateCallbacks[LINECOLORS_BUFFER] = this.createLineColorsBuffer;
        // this._buffersUpdateCallbacks[LINETHICKNESS_BUFFER] = this.createLineThicknessBuffer;
        // this._buffersUpdateCallbacks[LINESTROKES_BUFFER] = this.createLineStrokesBuffer;
        // this._buffersUpdateCallbacks[LINESTROKECOLORS_BUFFER] = this.createLineStrokeColorsBuffer;
        // this._buffersUpdateCallbacks[POLYPICKINGCOLORS_BUFFER] = this.createPolyPickingColorsBuffer;
        // this._buffersUpdateCallbacks[LINEPICKINGCOLORS_BUFFER] = this.createLinePickingColorsBuffer;
			
		}
	},
	
    applyTexture(texture, pickingMask) {
        // if (this.segment.initialized) {
            this.texture = texture;
            this._updateTexture = null;
            this.pickingMask = pickingMask || null;
            this._updatePickingMask = null;
            this.isReady = true;
            this.pickingReady = true;
            this.textureExists = true;
            this.isLoading = false;
            // this.appliedNodeId = this.segment.node.nodeId;
            this.texOffset = [0.0, 0.0, 1.0, 1.0];
        // }
    },

	render: function (outData, tileData, layer) {
		// this.initialize();
			this._createBuffers(tileData, layer.options.layerID);
            let h = this._handler,
                gl = h.gl;
// console.log('render', this._geometries.length, tileData.tile);
            // gl.disable(gl.CULL_FACE);
            // gl.disable(gl.DEPTH_TEST);
		// this._framebuffer.activate();

		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);

		// gl.enable(gl.BLEND);
		// gl.blendEquation(gl.FUNC_ADD);
		// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// gl.clearColor(0.0, 0.0, 0.0, 0.0);
		// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // let hLine = h.programs.vectorTileLineRasterization,
                // hPoly = h.programs.vectorTilePolygonRasterization;

            let _w = this._width,
                _h = this._height,
                width = _w,
                height = _h,
                _w2 = width << 1,
                _h2 = height << 1;

            // var prevLayerId = -1;

            let extentParamsHigh = new Float32Array(4);
            let extentParamsLow = new Float32Array(4);


            let deltaTime = 0,
                startTime = window.performance.now();

            // while (this._queue.length && deltaTime < MAX_FRAME_TIME) {
let material = {
	segment: {
		tileZoom: 5
	}
};
let pickingEnabled = true;
                // let material = this._queue.shift();
                // if (material.isLoading && material.segment.node.getState() === RENDERING) {
                    // let pickingEnabled = material.layer._pickingEnabled;
		var topLeft = tileData.topLeft;
		var tilePoint = topLeft.tilePoint;
		var b = topLeft.bounds;
		let min = b.min;
		let width1 = b.max.x - b.min.x;
		let height1 = b.max.y - b.min.y;


                    if (tilePoint.z > 2) {
                    // if (material.segment.tileZoom < 4) {
                        width = _w2;
                        height = _h2;
						// let size = 20037508.34 / Math.pow(2, tilePoint.z);
						// min.x = -20037508.34 + tilePoint.x * size;
						// min.y = 20037508.34 - tilePoint.y * size - size;
						// width1 *= 2;
						// height1 *= 2;
                    } else {
                        width = _w;
                        height = _h;
                    }
			this._framebuffer = new gmxWebGL.Framebuffer(this._handler, {
				// width: width,
				// height: height,
				width: this._width,
				height: this._height,
				useDepth: false,
				filter: "LINEAR"
			});

			this._framebuffer.init();

            let f = this._framebuffer.activate();

                    // let texture = material._updateTexture || h.createEmptyTexture_l(width, height);
                    // let pickingMask = pickingEnabled ? material._updatePickingMask || h.createEmptyTexture_n(width, height) : null;

                    // this.applyTexture(texture, pickingMask);

                    // f.setSize(width, height);

                    // f.bindOutputTexture(texture);

                    gl.clearColor(0.0, 0.0, 0.0, 0.0);
                    gl.clear(gl.COLOR_BUFFER_BIT);

                    // let extent = material.segment.getExtentMerc();
let extent = 
{
    "southWest": {
        "lon": 0,
        "lat": -44927335.4208431,
        "height": 0
    },
    "northEast": {
        "lon": 20037508.34,
        "lat": -24461471.63645808,
        "height": 0
    }
};
		// var extentParams = new Float32Array([Math.fround(Math.floor(b.min.x / 65536.0) * 65536.0), Math.fround(Math.floor(b.min.y / 65536.0) * 65536.0), 2.0 / width1, 2.0 / height1]);
		// var extentParams = new Float32Array([b.min.x, b.min.y, 2.0 / width1, 2.0 / height1]);
		// var extentParams = new Float32Array([b.min.x, b.min.y, 2.0 / width1, 2.0 / height1]);
// gl.uniform4fv(shu.extentParams, new Float32Array([b.min.x, b.min.y, 2.0 / (b.max.x - b.min.x), 2.0 / (b.max.y - b.min.y)]));
		var extentParams = new Float32Array([min.x, min.y, 2.0 / width1, 2.0 / height1]);
extentParamsHigh[0] = extentParams[0];
extentParamsLow[0] = extentParams[1];

extentParamsHigh[1] = extentParams[0];
extentParamsLow[1] = extentParams[1];

extentParamsHigh[2] = extentParams[2];
extentParamsHigh[3] = extentParams[3];
		var mInPixel = layer._gmx.mInPixel;
		if (tileData.topLeft.tilePoint.z < 13) {
                    doubleToTwoFloats2(min.x, tempArr);
                    extentParamsHigh[0] = tempArr[0];
                    extentParamsLow[0] = tempArr[1];

                    doubleToTwoFloats2(min.y, tempArr);
                    extentParamsHigh[1] = tempArr[0];
                    extentParamsLow[1] = tempArr[1];

                    extentParamsHigh[2] = 2.0 / width1;
                    extentParamsHigh[3] = 2.0 / height1;
		}
/*		
*/
// console.log('gggg', tileData.topLeft.tilePoint, tileData.tile, extentParamsHigh, extentParamsLow, this._lineVerticesHighMerc, this._lineVerticesLowMerc);

                    // doubleToTwoFloats2(b.min.x, tempArr);
                    // extentParamsHigh[0] = tempArr[0];
                    // extentParamsLow[0] = tempArr[1];

                    // doubleToTwoFloats2(b.min.y, tempArr);
                    // extentParamsHigh[1] = tempArr[0];
                    // extentParamsLow[1] = tempArr[1];

                    // extentParamsHigh[2] = 2.0 / width;
                    // extentParamsHigh[3] = 2.0 / height;

                    // doubleToTwoFloats2(extent.southWest.lon, tempArr);
                    // extentParamsHigh[0] = tempArr[0];
                    // extentParamsLow[0] = tempArr[1];

                    // doubleToTwoFloats2(extent.southWest.lat, tempArr);
                    // extentParamsHigh[1] = tempArr[0];
                    // extentParamsLow[1] = tempArr[1];

                    // extentParamsHigh[2] = 2.0 / (extent.northEast.lon - extent.southWest.lon);
                    // extentParamsHigh[3] = 2.0 / (extent.northEast.lat - extent.southWest.lat);

		// h.programs.billboard1.activate();
		// var sh = h.programs.billboard1._program;
		// var sha = sh.attributes,
			// shu = sh.uniforms;

                    // hPoly.activate();
                    // let sh = hPoly._program;
                    // let sha = sh.attributes,
                        // shu = sh.uniforms;

	let geomHandler = this._geometry;
                    // let geomHandler = material.layer._geometryHandler;
// console.log('gggg', geomHandler);
/*
                    //=========================================
                    //Polygon rendering
                    //=========================================
                    gl.uniform4fv(shu.extentParamsHigh, extentParamsHigh);
                    gl.uniform4fv(shu.extentParamsLow, extentParamsLow);

                    gl.bindBuffer(gl.ARRAY_BUFFER, geomHandler._polyVerticesHighBufferMerc);
                    gl.vertexAttribPointer(sha.coordinatesHigh, geomHandler._polyVerticesHighBufferMerc.itemSize, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, geomHandler._polyVerticesLowBufferMerc);
                    gl.vertexAttribPointer(sha.coordinatesLow, geomHandler._polyVerticesLowBufferMerc.itemSize, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, geomHandler._polyColorsBuffer);
                    gl.vertexAttribPointer(sha.colors, geomHandler._polyColorsBuffer.itemSize, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geomHandler._polyIndexesBuffer);

                    gl.drawElements(gl.TRIANGLES, geomHandler._polyIndexesBuffer.numItems, gl.UNSIGNED_INT, 0);

                    //Polygon picking PASS
                    if (pickingEnabled) {
                        f.bindOutputTexture(pickingMask);

                        gl.clearColor(0.0, 0.0, 0.0, 0.0);
                        gl.clear(gl.COLOR_BUFFER_BIT);

                        gl.bindBuffer(gl.ARRAY_BUFFER, geomHandler._polyPickingColorsBuffer);
                        gl.vertexAttribPointer(sha.colors, geomHandler._polyPickingColorsBuffer.itemSize, gl.FLOAT, false, 0, 0);

                        gl.drawElements(gl.TRIANGLES, geomHandler._polyIndexesBuffer.numItems, gl.UNSIGNED_INT, 0);
                    }
*/
                    //=========================================
                    //Strokes and linestrings rendering
                    //=========================================
                    // f.bindOutputTexture(texture);
		h.programs.billboard1.activate();
		var sh = h.programs.billboard1._program;
		var sha = sh.attributes,
			shu = sh.uniforms;

                    // hLine.activate();
                    // sh = hLine._program;
                    // sha = sh.attributes;
                    // shu = sh.uniforms;

		// gl.uniform2fv(shu.viewport, [this._width / mInPixel, this._height / mInPixel]);
                    // gl.uniform2fv(shu.viewport, [width, height]);
                    gl.uniform2fv(shu.viewport, [this._width, this._height]);

                    // gl.uniform4fv(shu.extentParamsHigh, extentParams);
                    // gl.uniform4fv(shu.extentParamsLow, extentParams);
                    gl.uniform4fv(shu.extentParamsHigh, extentParamsHigh);
                    gl.uniform4fv(shu.extentParamsLow, extentParamsLow);

                    //vertex
// this._geometries.forEach(geom => {
	// this.setGeometryVisibility(geom);
// });
this.setBuffers();


					
                    var mb = this._lineVerticesHighBufferMerc;
                    gl.bindBuffer(gl.ARRAY_BUFFER, mb);

                    gl.vertexAttribPointer(sha.prevHigh, mb.itemSize, gl.FLOAT, false, 8, 0);
                    gl.vertexAttribPointer(sha.currentHigh, mb.itemSize, gl.FLOAT, false, 8, 32);
                    gl.vertexAttribPointer(sha.nextHigh, mb.itemSize, gl.FLOAT, false, 8, 64);

                    mb = this._lineVerticesLowBufferMerc;
                    gl.bindBuffer(gl.ARRAY_BUFFER, mb);

                    gl.vertexAttribPointer(sha.prevLow, mb.itemSize, gl.FLOAT, false, 8, 0);
                    gl.vertexAttribPointer(sha.currentLow, mb.itemSize, gl.FLOAT, false, 8, 32);
                    gl.vertexAttribPointer(sha.nextLow, mb.itemSize, gl.FLOAT, false, 8, 64);

                    //order
                    gl.bindBuffer(gl.ARRAY_BUFFER, this._lineOrdersBuffer);
                    gl.vertexAttribPointer(sha.order, this._lineOrdersBuffer.itemSize, gl.FLOAT, false, 4, 0);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._lineIndexesBuffer);

                    //PASS - stroke
                    gl.bindBuffer(gl.ARRAY_BUFFER, this._lineStrokesBuffer);
                    gl.vertexAttribPointer(sha.thickness, this._lineStrokesBuffer.itemSize, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, this._lineStrokeColorsBuffer);
                    gl.vertexAttribPointer(sha.color, this._lineStrokeColorsBuffer.itemSize, gl.FLOAT, false, 0, 0);

                    //Antialias pass
                    // gl.uniform1f(shu.thicknessOutline, 2);
                    gl.uniform1f(shu.thicknessOutline, 4);
                    gl.uniform1f(shu.alpha, 0.54);
                    gl.drawElements(gl.TRIANGLE_STRIP, this._lineIndexesBuffer.numItems, gl.UNSIGNED_INT, 0);
                    //
                    //Aliased pass
                    // gl.uniform1f(shu.thicknessOutline, 1);
                    gl.uniform1f(shu.thicknessOutline, 2);
                    gl.uniform1f(shu.alpha, 1.0);
                    gl.drawElements(gl.TRIANGLE_STRIP, this._lineIndexesBuffer.numItems, gl.UNSIGNED_INT, 0);

                    //PASS - inside line
                    gl.bindBuffer(gl.ARRAY_BUFFER, this._lineThicknessBuffer);
                    gl.vertexAttribPointer(sha.thickness, this._lineThicknessBuffer.itemSize, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, this._lineColorsBuffer);
                    gl.vertexAttribPointer(sha.color, this._lineColorsBuffer.itemSize, gl.FLOAT, false, 0, 0);

                    //Antialias pass
                    // gl.uniform1f(shu.thicknessOutline, 2);
                    gl.uniform1f(shu.thicknessOutline, 4);
                    // gl.uniform1f(shu.alpha, 1.0);
                    gl.uniform1f(shu.alpha, 0.54);
                    gl.drawElements(gl.TRIANGLE_STRIP, this._lineIndexesBuffer.numItems, gl.UNSIGNED_INT, 0);
                    //
                    //Aliased pass
                    // gl.uniform1f(shu.thicknessOutline, 1);
                     gl.uniform1f(shu.thicknessOutline, 2);
					gl.uniform1f(shu.alpha, 1.0);
                    gl.drawElements(gl.TRIANGLE_STRIP, this._lineIndexesBuffer.numItems, gl.UNSIGNED_INT, 0);

                    if (pickingEnabled) {
                        // f.bindOutputTexture(pickingMask);
                        // gl.uniform1f(shu.thicknessOutline, 8);
                        gl.uniform1f(shu.thicknessOutline, 16);
                        gl.bindBuffer(gl.ARRAY_BUFFER, this._linePickingColorsBuffer);
                        gl.vertexAttribPointer(sha.color, this._linePickingColorsBuffer.itemSize, gl.FLOAT, false, 0, 0);
                        gl.drawElements(gl.TRIANGLE_STRIP, this._lineIndexesBuffer.numItems, gl.UNSIGNED_INT, 0);
                    }
                // } else {
                    // material.isLoading = false;
                // }

                // deltaTime = window.performance.now() - startTime;
            // }

            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
/*
*/
            f.deactivate();

		f.readAllPixels(outData);
let flag;
outData.forEach((v, i) => {
    if (!flag && v > 0) flag = true, console.log('ff', i, v);
});
		return outData;

	},
	_createBuffers: function (tileData, layerName) {
		var h = this._handler,
			gl = h.gl;
        this._geometries = [];

        this._updatedGeometryArr = [];
        this._updatedGeometry = {};

        this._removeGeometryExtentArr = [];
        this._removeGeometryExtents = {};

        // Polygon arrays
        this._polyVerticesHighMerc = [];
        this._polyVerticesLowMerc = [];
        this._polyColors = [];
        this._polyPickingColors = [];
        this._polyIndexes = [];

        // Line arrays
        this._lineVerticesHighMerc = [];
        this._lineVerticesLowMerc = [];
        this._lineOrders = [];
        this._lineIndexes = [];
        this._lineColors = [];
        this._linePickingColors = [];
        this._lineThickness = [];
        this._lineStrokes = [];
        this._lineStrokeColors = [];

        // Buffers
        this._polyVerticesHighBufferMerc = null;
        this._polyVerticesLowBufferMerc = null;
        this._polyColorsBuffer = null;
        this._polyPickingColorsBuffer = null;
        this._polyIndexesBuffer = null;

        this._lineVerticesHighBufferMerc = null;
        this._lineVerticesLowBufferMerc = null;
        this._lineColorsBuffer = null;
        this._linePickingColorsBuffer = null;
        this._lineThicknessBuffer = null;
        this._lineStrokesBuffer = null;
        this._lineStrokeColorsBuffer = null;
        this._lineOrdersBuffer = null;
        this._lineIndexesBuffer = null;

		var geoItems = tileData.geoItems,
			length = geoItems.length;

		var	LL = geoItems[0].properties.length - 1;

		// console.time("_createBuffers5");
var topLeft = tileData.topLeft;
var mInPixel = topLeft.mInPixel;
		var b = tileData.topLeft.bounds;

		// var maxX = tileData.topLeft.bounds.max.x,
			// minX = tileData.topLeft.bounds.min.x;
		this._lineVerticesMerc = [];
		this._lineOrders = [];
		this._lineIndexes = [];
// this._geometries = [];
		// this._outs = {};
// this._geometry = geometry;
		for (var i = 0; i < geoItems.length; i++) {
			let item = geoItems[i];
			// if (!b.contains(item.dataOption.bounds.getCenter())) continue;
item.done = tileData.topLeft.tilePoint;
			// let item = geoItems[0];
			let dataOption = item.dataOption;
			let style = dataOption.parsedStyleKeys;
			var prop = item.properties;
			var geo = prop[LL];
			var coords = geo.coordinates;
			if (geo.type === 'POLYGON') {
				coords = [coords];
			} else if (geo.type === 'LINESTRING') {
				coords = [coords];
			}
let pickingColor = {"x":0.7254901960784313,"y":0.7764705882352941,"z":0.33725490196078434};
			coords.forEach(arr => {
// arr = [[[-1005751.3027598116,5143106.250307894],[-2105545.0669084,5250192.061702786],[-1045611.0274723344,5316025.269506689]]];
// arr = [[[-8915895.65,0],[-8609866.87,-4148390.4],[0,-4909483.59],[0,0],[-8915895.65,0]]];
// let arr = coords;
					let geometry = {
						_polyVerticesHighMerc: [],
						_polyVerticesLowMerc: [],
						_lineVerticesHighMerc: [],
						_lineVerticesLowMerc: [],
						_visibility: true,
						_style: {
							strokeWidth: 0,
							lineWidth: 3,
							lineColor: {"x":0.19,"y":0.62,"z":0.85,"w":1},
							strokeColor: {"x":1,"y":1,"z":1,"w":0.95}
						},
						_lineVerticesHandlerIndex: this._lineVerticesHighMerc.length,
						_lineOrdersHandlerIndex: this._lineOrders.length,
						_lineIndexesHandlerIndex: this._lineIndexes.length,
						_lineColorsHandlerIndex: this._lineColors.length,
						_lineThicknessHandlerIndex: this._lineThickness.length
					};	
                    // Creates polygon stroke data
					appendLineData(
                        arr,
                        // [arr1],
                        false,
                        geometry._style.lineColor,
                        pickingColor,
                        geometry._style.lineWidth,
                        geometry._style.strokeColor,
                        geometry._style.strokeWidth,
                        this._lineVerticesHighMerc,
                        this._lineVerticesLowMerc,
                        this._lineOrders,
                        this._lineIndexes,
                        this._lineColors,
                        this._linePickingColors,
                        this._lineThickness,
                        this._lineStrokeColors,
                        this._lineStrokes,
                        geometry._lineVerticesHighMerc,
                        geometry._lineVerticesLowMerc
                    );
					

                    geometry._lineVerticesLength =
                        this._lineVerticesHighMerc.length - geometry._lineVerticesHandlerIndex;
                    geometry._lineOrdersLength =
                        this._lineOrders.length - geometry._lineOrdersHandlerIndex;
                    geometry._lineIndexesLength =
                        this._lineIndexes.length - geometry._lineIndexesHandlerIndex;
                    geometry._lineColorsLength =
                        this._lineColors.length - geometry._lineColorsHandlerIndex;
                    geometry._lineThicknessLength =
                        this._lineThickness.length - geometry._lineThicknessHandlerIndex;
					this._geometries.push(geometry);
			// Refresh visibility
			});
// this._lineVerticesHighMerc = geometry._lineVerticesHighMerc;
// this._lineVerticesLowMerc = geometry._lineVerticesLowMerc;
// break;
		}
let tp = tileData.topLeft.tilePoint;
// if (tp.x === 0 && tp.y === 0  && tp.z === 1) {
		var b = tileData.topLeft.bounds;

		let width1 = b.max.x - b.min.x;
		let height1 = b.max.y - b.min.y;
		var extentParams = new Float32Array([b.min.x, b.min.y, 2.0 / width1, 2.0 / height1]);
		// var extentParams = new Float32Array([b.min.x, b.min.y, 2.0 / width1, 2.0 / height1]);

// console.log('kkkkkkk', tp, extentParams);
// console.log('kkkkkkk', tp, extentParams, tileData, this._lineVerticesHighMerc, this._lineVerticesLowMerc);
// }

// console.log('geometry', tileData);

		/*

		// this._lineVerticesBufferMerc = h.createArrayBuffer(new Float32Array(this._lineVerticesMerc), 2, this._lineVerticesMerc.length / 2);
		// this._lineIndexesBuffer = h.createElementArrayBuffer(new Uint32Array(this._lineIndexes), 1, this._lineIndexes.length);
		// this._lineOrdersBuffer = h.createArrayBuffer(new Float32Array(this._lineOrders), 1, this._lineOrders.length / 2);

		// console.timeEnd("_createBuffers5");
		*/
	},

    setGeometryVisibility(geometry) {
		var h = this._handler,
			gl = h.gl;
        var v = geometry._visibility ? 1.0 : 0.0;

        var a = this._polyVerticesHighMerc,
            b = this._polyVerticesLowMerc;

        var l = geometry._polyVerticesLength;
        var ind = geometry._polyVerticesHandlerIndex;
        for (var i = 0; i < l; i++) {
            a[ind + i] = geometry._polyVerticesHighMerc[i] * v;
            b[ind + i] = geometry._polyVerticesLowMerc[i] * v;
        }

        a = this._lineVerticesHighMerc;
        b = this._lineVerticesLowMerc;
        l = geometry._lineVerticesLength;
        ind = geometry._lineVerticesHandlerIndex;
        for (i = 0; i < l; i++) {
            a[ind + i] = geometry._lineVerticesHighMerc[i] * v;
            b[ind + i] = geometry._lineVerticesLowMerc[i] * v;
        }

        // this._changedBuffers[POLYVERTICES_BUFFER] = true;
        // this._changedBuffers[LINEVERTICES_BUFFER] = true;

        // !this._updatedGeometry[geometry._id] && this._updatedGeometryArr.push(geometry);
        // this._updatedGeometry[geometry._id] = true;
	},

    setBuffers() {
            let h = this._handler,
                gl = h.gl;

        h.gl.deleteBuffer(this._lineVerticesHighBufferMerc);
        this._lineVerticesHighBufferMerc = h.createArrayBuffer(
            new Float32Array(this._lineVerticesHighMerc),
            2,
            this._lineVerticesHighMerc.length / 2
        );

        h.gl.deleteBuffer(this._lineVerticesLowBufferMerc);
        this._lineVerticesLowBufferMerc = h.createArrayBuffer(
            new Float32Array(this._lineVerticesLowMerc),
            2,
            this._lineVerticesLowMerc.length / 2
        );
        h.gl.deleteBuffer(this._lineIndexesBuffer);
        this._lineIndexesBuffer = h.createElementArrayBuffer(
            new Uint32Array(this._lineIndexes),
            1,
            this._lineIndexes.length
        );
        h.gl.deleteBuffer(this._lineOrdersBuffer);
        this._lineOrdersBuffer = h.createArrayBuffer(
            new Float32Array(this._lineOrders),
            1,
            this._lineOrders.length / 2
        );
        h.gl.deleteBuffer(this._lineColorsBuffer);
        this._lineColorsBuffer = h.createArrayBuffer(
            new Float32Array(this._lineColors),
            4,
            this._lineColors.length / 4
        );
        h.gl.deleteBuffer(this._linePickingColorsBuffer);
        this._linePickingColorsBuffer = h.createArrayBuffer(
            new Float32Array(this._linePickingColors),
            4,
            this._linePickingColors.length / 4
        );
        h.gl.deleteBuffer(this._lineThicknessBuffer);
        this._lineThicknessBuffer = h.createArrayBuffer(
            new Float32Array(this._lineThickness),
            1,
            this._lineThickness.length
        );
        h.gl.deleteBuffer(this._lineStrokesBuffer);
        this._lineStrokesBuffer = h.createArrayBuffer(
            new Float32Array(this._lineStrokes),
            1,
            this._lineStrokes.length
        );
        h.gl.deleteBuffer(this._lineStrokeColorsBuffer);
        this._lineStrokeColorsBuffer = h.createArrayBuffer(
            new Float32Array(this._lineStrokeColors),
            4,
            this._lineStrokeColors.length / 4
        );

    }

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
