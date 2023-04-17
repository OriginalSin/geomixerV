import gmxWebGL from '../gmxWebGL.js';
import v1 from './shaders/ringFill/vert.glsl';
import f1 from './shaders/ringFill/frag.glsl';
import v2 from './shaders/ringStroke/vert.glsl';
import f2 from './shaders/ringStroke/frag.glsl';
import appendLineData from './appendLineData.js';

// import utilsGL from "../UtilsGL.js";
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
			// this._handler.deactivateFaceCulling();
			// this._handler.deactivateDepthTest();

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
			
		}
	},

	getExtent: function (tileData) {
		var topLeft = tileData.topLeft;
		var tilePoint = topLeft.tilePoint;
		var b = topLeft.bounds;
		let min = b.min;
		let width1 = b.max.x - min.x;
		let height1 = b.max.y - min.y;
		min.x *= 1000;
		min.y *= 1000;
		width1 *= 1000;
		height1 *= 1000;

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

	render: function (outData, tileData, layer) {
		// this.initialize();
		this._createBuffers(tileData, layer.options.layerID);
		let h = this._handler,
			gl = h.gl;

		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
let pickingEnabled = true;
			this._framebuffer = new gmxWebGL.Framebuffer(this._handler, {
				width: this._width,
				height: this._height,
				useDepth: false,
				filter: "LINEAR"
			});

			this._framebuffer.init();

            let f = this._framebuffer.activate();
                    gl.clearColor(0.0, 0.0, 0.0, 0.0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
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
                    gl.uniform2fv(shu.viewport, [this._width, this._height]);
					let {extentParamsHigh, extentParamsLow} = this.getExtent(tileData);

                    gl.uniform4fv(shu.extentParamsHigh, extentParamsHigh);
                    gl.uniform4fv(shu.extentParamsLow, extentParamsLow);

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
// console.log('extentParamsHigh', extentParamsHigh);

		f.readAllPixels(outData);
// let flag;
// outData.forEach((v, i) => {
    // if (!flag && v > 0) flag = true, console.log('ff', i, v);
// });
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
// var topLeft = tileData.topLeft;
		// var b = tileData.topLeft.bounds;

		// this._lineVerticesMerc = [];
		// this._lineOrders = [];
		// this._lineIndexes = [];

		for (var i = 0; i < geoItems.length; i++) {
			let item = geoItems[i];
			// if (!b.contains(item.dataOption.bounds.getCenter())) continue;
// item.done = tileData.topLeft.tilePoint;
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
					let pars = {
						pathArr: arr,
						isClosed: true,
						color: geometry._style.lineColor,
						pickingColor,
						thickness: geometry._style.lineWidth,
						strokeColor: geometry._style.strokeColor,
						strokeSize: geometry._style.strokeWidth,
						outVerticesHigh: this._lineVerticesHighMerc,
						outVerticesLow: this._lineVerticesLowMerc,
						outOrders: this._lineOrders,
						outIndexes: this._lineIndexes,
						outColors: this._lineColors,
						outPickingColors: this._linePickingColors,
						outThickness: this._lineThickness,
						outStrokeColors: this._lineStrokeColors,
						outStrokes: this._lineStrokes,
						outVerticesHigh2: geometry._lineVerticesHighMerc,
						outVerticesLow2: geometry._lineVerticesLowMerc
					};
					appendLineData(pars);

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
			});
		}
	},
/*
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
*/

    setBuffers() {
		let h = this._handler,
			gl = h.gl;
console.log('extentParamsHigh', h);

		
        // this._lineVerticesHighBufferMerc = utilsGL.createArrayBuffer(gl, 
            // this._lineVerticesHighMerc,
            // 2,
            // this._lineVerticesHighMerc.length / 2
        // );
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
