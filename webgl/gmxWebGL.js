// var gmxWebGL = (function (exports) {
    'use strict';

    /**
     * @module og/ImageCanvas
     */
    /**
     * Usefull class for working with JS canvas object.
     * @class
     * @param {number} [width] - Canvas width. Default 256.
     * @param {number} [height] - Canvas height. Default 256.
     */

    class ImageCanvas {
      constructor(width, height) {
        /**
         * Canvas object.
         * @protected
         * @type {Object}
         */
        this._canvas = document.createElement("canvas");
        this._canvas.width = width || 256;
        this._canvas.height = height || 256;
        /**
         * Canvas context.
         * @protected
         * @type {Object}
         */

        this._context = this._canvas.getContext('2d');
      }
      /**
       * Returns canvas object.
       * @public
       * @returns {Object}
       */


      getCanvas() {
        return this._canvas;
      }
      /**
       * Returns canvas context pointer.
       * @public
       * @returns {Object}
       */


      getContext() {
        return this._context;
      }
      /**
       * Fills canvas RGBA with zeroes.
       * @public
       */


      fillEmpty() {
        var imgd = this._context.getImageData(0, 0, this._canvas.width, this._canvas.height);

        var pixels = imgd.data;

        for (var i = 0, n = pixels.length; i < n; i += 4) {
          pixels[i] = pixels[i + 1] = pixels[i + 2] = pixels[i + 3] = 0;
        }

        this._context.putImageData(imgd, 0, 0);
      }
      /**
       * Gets canvas pixels RGBA data.
       * @public
       * @returns {Array.<number>}
       */


      getData() {
        var imgd = this._context.getImageData(0, 0, this._canvas.width, this._canvas.height);

        return imgd.data;
      }
      /**
       * Fill the canvas by color.
       * @public
       * @param {string} color - CSS string color.
       */


      fillColor(color) {
        this._context.fillStyle = color;

        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
      }

      /**
       * Sets RGBA pixel data.
       * @public
       * @param {Array.<number>} data - Array RGBA data.
       */
      setData(data) {
        var imageData = this._context.createImageData(this._canvas.width, this._canvas.height);

        imageData.data.set(data);

        this._context.putImageData(imageData, 0, 0);
      }
      /**
       * Resize canvas.
       * @public
       * @param {number} width - Width.
       * @param {number} height - Height.
       */


      resize(width, height) {
        this._canvas.width = width;
        this._canvas.height = height;
        this._context = this._canvas.getContext('2d');
      }
      /**
       * Draw an image on the canvas.
       * @public
       * @param {Image} img - Draw image.
       * @param {number} [x] - Left top image corner X coordinate on the canvas.
       * @param {number} [y] - Left top image corner Y coordinate on the canvas.
       * @param {number} [width] - Image width slice. Image width is default.
       * @param {number} [height] - Image height slice. Image height is default.
       */


      drawImage(img, x, y, width, height) {
        this._context = this._canvas.getContext('2d');

        this._context.drawImage(img, x || 0, y || 0, width || img.width, height || img.height);
      }
      /**
       * Converts canvas to JS image object.
       * @public
       * @returns {Image}
       */


      getImage() {
        var img = new Image();
        img.width = this.getWidth();
        img.height = this.getHeight();
        img.src = this._canvas.toDataURL("image/png");
        return img;
      }
      /**
       * Get measured text width.
       * @public
       * @param {string} text - Measured text.
       * @returns {number}
       */


      getTextWidth(text) {
        var metrics = this._context.measureText(text);

        return Math.round(metrics.width);
      }
      /**
       * Draw a text on the canvas.
       * @public
       * @param {string} text - Text.
       * @param {number} [x] - Canvas X - coordinate. 0 - default.
       * @param {number} [y] - Canvas Y - coordinate. 0 - default.
       * @param {string} [font] - Font style. 'normal 14px Verdana' - is default.
       * @param {string} [color] - Css font color.
       */


      drawText(text, x, y, font, color) {
        this._context.fillStyle = color || 'black';
        this._context.font = font || 'normal 14px Verdana';

        this._context.fillText(text, x || 0, y || 14);
      }
      /**
       * Gets canvas width.
       * @public
       * @returns {number}
       */


      getWidth() {
        return this._canvas.width;
      }
      /**
       * Gets canvas height.
       * @public
       * @returns {number}
       */


      getHeight() {
        return this._canvas.height;
      }
      /**
       * Load image to canvas.
       * @public
       * @param {string} url - Image url.
       * @pararm {imageCallback} [callback] - Image onload callback.
       */


      load(url, callback) {
        var img = new Image();
        var that = this;

        img.onload = function () {
          that.resize(img.width, img.height);

          that._context.drawImage(img, 0, 0, img.width, img.height);

          callback && callback(img);
        };

        img.src = url;
      }
      /**
       * Open canvas image in the new window.
       * @public
       */


      openImage() {
        var img = this.getImage();
        var dataUrl = img.src;
        var windowContent = '<!DOCTYPE html>';
        windowContent += '<html>';
        windowContent += '<head><title>Print</title></head>';
        windowContent += '<body>';
        windowContent += '<img src="' + dataUrl + '">';
        windowContent += '</body>';
        windowContent += '</html>';
        var printWin = window.open('', '', 'width=' + img.width + 'px ,height=' + img.height + 'px');
        printWin.document.open();
        printWin.document.write(windowContent);
        printWin.document.close();
        printWin.focus();
      }

      destroy() {
        this._canvas.width = 1;
        this._canvas.height = 1;
        this._canvas = null;
        this._context = null;
      }

    }

    /**
     * @module og/webgl/Framebuffer
     */
    /**
     * Class represents framebuffer.
     * @class
     * @param {og.webgl.Handler} handler - WebGL handler.
     * @param {Object} [options] - Framebuffer options:
     * @param {number} [options.width] - Framebuffer width. Default is handler canvas width.
     * @param {number} [options.height] - Framebuffer height. Default is handler canvas height.
     * @param {number} [options.size] - Color attachment size.
     * @param {String} [options.internalFormat="RGBA"] - Specifies the color components in the texture.
     * @param {String} [options.format="RGBA"] - Specifies the format of the texel data.
     * @param {String} [options.type="UNSIGNED_BYTE"] - Specifies the data type of the texel data.
     * @param {String} [options.depthComponent="DEPTH_COMPONENT16"] - Specifies depth buffer size.
     * @param {Boolean} [options.useDepth] - Using depth buffer during the rendering.
     */

    const Framebuffer = function (handler, options) {
      options = options || {};
      /**
       * WebGL handler.
       * @public
       * @type {og.webgl.Handler}
       */

      this.handler = handler;
      /**
       * Framebuffer object.
       * @private
       * @type {Object}
       */

      this._fbo = null;
      this._isBare = options.isBare || false;
      /**
       * Renderbuffer object.
       * @private
       * @type {Object}
       */

      this._depthRenderbuffer = null;
      this._filter = options.filter || "NEAREST";
      this._internalFormat = options.internalFormat || "RGBA";
      this._format = options.format || "RGBA";
      this._type = options.type || "UNSIGNED_BYTE";
      /**
       * Framebuffer width.
       * @private
       * @type {number}
       */

      this._width = options.width || handler.canvas.width;
      /**
       * Framebuffer width.
       * @private
       * @type {number}
       */

      this._height = options.height || handler.canvas.height;
      this._depthComponent = options.depthComponent != undefined ? options.depthComponent : "DEPTH_COMPONENT16";
      this._useDepth = options.useDepth != undefined ? options.useDepth : true;
      /**
       * Framebuffer activity. 
       * @private
       * @type {boolean}
       */

      this._active = false;
      this._size = options.size || 1;
      /**
       * Framebuffer texture.
       * @public
       * @type {number}
       */

      this.textures = options.textures || new Array(this._size);
    };

    Framebuffer.prototype.destroy = function () {
      var gl = this.handler.gl;

      for (var i = 0; i < this.textures.length; i++) {
        gl.deleteTexture(this.textures[i]);
      }

      this.textures = new Array(this._size);
      gl.deleteFramebuffer(this._fbo);
      gl.deleteRenderbuffer(this._depthRenderbuffer);
      this._depthRenderbuffer = null;
      this._fbo = null;
      this._active = false;
    };
    /**
     * Framebuffer initialization.
     * @private
     */


    Framebuffer.prototype.init = function () {
      var gl = this.handler.gl;
      this._fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);

      if (!this._isBare) {
        if (this.textures.length === 0) {
          this.bindOutputTexture(this.handler.createEmptyTexture2DExt(this._width, this._height, this._filter, this._internalFormat, this._format, this._type));
          gl.drawBuffers && gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        } else {
          let colorAttachments = [];

          for (var i = 0; i < this.textures.length; i++) {
            this.bindOutputTexture(this.textures[i] || this.handler.createEmptyTexture2DExt(this._width, this._height, this._filter, this._internalFormat, this._format, this._type), i);
            colorAttachments.push(gl.COLOR_ATTACHMENT0 + i);
          }

          gl.drawBuffers && gl.drawBuffers(colorAttachments);
        }
      }

      if (this._useDepth) {
        this._depthRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthRenderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl[this._depthComponent], this._width, this._height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._depthRenderbuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return this;
    };
    /**
     * Bind buffer texture.
     * @public
     * @param{Object} texture - Output texture.
     * @param {Number} [attachmentIndex=0] - color attachment index.
     */


    Framebuffer.prototype.bindOutputTexture = function (texture, attachmentIndex = 0) {
      var gl = this.handler.gl;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + attachmentIndex, gl.TEXTURE_2D, texture, 0);
      gl.bindTexture(gl.TEXTURE_2D, null);
      this.textures[attachmentIndex] = texture;
    };
    /**
     * Sets framebuffer viewport size.
     * @public
     * @param {number} width - Framebuffer width.
     * @param {number} height - Framebuffer height.
     */


    Framebuffer.prototype.setSize = function (width, height, forceDestroy) {
      this._width = width;
      this._height = height;

      if (this._active) {
        this.handler.gl.viewport(0, 0, this._width, this._height);
      }

      if (this._useDepth || forceDestroy) {
        this.destroy();
        this.init();
      }
    };
    /**
     * Returns framebuffer completed.
     * @public
     * @returns {boolean} -
     */


    Framebuffer.prototype.isComplete = function () {
      var gl = this.handler.gl;
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) return true;
      return false;
    };
    /**
     * Gets pixel RBGA color from framebuffer by coordinates.
     * @public
     * @param {Uint8Array} res - Normalized x - coordinate.
     * @param {number} nx - Normalized x - coordinate.
     * @param {number} ny - Normalized y - coordinate.
     * @param {number} [w=1] - Normalized width.
     * @param {number} [h=1] - Normalized height.
     * @param {Number} [attachmentIndex=0] - color attachment index.
     */


    Framebuffer.prototype.readPixels = function (res, nx, ny, index = 0, w = 1, h = 1) {
      var gl = this.handler.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
      gl.readBuffer && gl.readBuffer(gl.COLOR_ATTACHMENT0 + index || 0);
      gl.readPixels(nx * this._width, ny * this._height, w, h, gl.RGBA, gl[this._type], res);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    /**
     * Reads all pixels(RGBA colors) from framebuffer.
     * @public
     * @param {Uint8Array} res - Result array.
     * @param {Number} [attachmentIndex=0] - color attachment index.
     */


    Framebuffer.prototype.readAllPixels = function (res, attachmentIndex = 0) {
      var gl = this.handler.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
      gl.readBuffer && gl.readBuffer(gl.COLOR_ATTACHMENT0 + attachmentIndex);
      gl.readPixels(0, 0, this._width, this._height, gl.RGBA, gl[this._type], res);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    /**
     * Activate framebuffer frame to draw.
     * @public
     * @returns {og.webgl.Framebuffer} Returns Current framebuffer.
     */


    Framebuffer.prototype.activate = function () {
      var gl = this.handler.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
      gl.viewport(0, 0, this._width, this._height);
      this._active = true;
      var c = this.handler.framebufferStack.current().data;
      c && (c._active = false);
      this.handler.framebufferStack.push(this);
      return this;
    };
    /**
     * Deactivate framebuffer frame.
     * @public
     */


    Framebuffer.prototype.deactivate = function () {
      var h = this.handler,
          gl = h.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this._active = false;
      var f = this.handler.framebufferStack.popPrev();

      if (f) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, f._fbo);
        gl.viewport(0, 0, f._width, f._height);
      } else {
        gl.viewport(0, 0, h.canvas.width, h.canvas.height);
      }
    };
    /**
     * Gets JavaScript image object that framebuffer has drawn.
     * @public
     * @returns {Object} -
     */


    Framebuffer.prototype.getImage = function () {
      var data = new Uint8Array(4 * this._width * this._height);
      this.readAllPixels(data);
      var imageCanvas = new ImageCanvas(this._width, this._height);
      imageCanvas.setData(data);
      return imageCanvas.getImage();
    };
    /**
     * Open dialog window with framebuffer image.
     * @public
     */


    Framebuffer.prototype.openImage = function () {
      var img = this.getImage();
      var dataUrl = img.src;
      var windowContent = '<!DOCTYPE html>';
      windowContent += '<html>';
      windowContent += '<head><title>Print</title></head>';
      windowContent += '<body>';
      windowContent += '<img src="' + dataUrl + '">';
      windowContent += '</body>';
      windowContent += '</html>';
      var printWin = window.open('', '', 'width=' + img.width + 'px ,height=' + img.height + 'px');
      printWin.document.open();
      printWin.document.write(windowContent);
      printWin.document.close();
      printWin.focus();
    };

    /**
     * @module og/ajax
     */
    /**
     * Ajax parameters.
     * @namespace og.ajax
     */

    const ajax = {
      /**
       * Ajax ready state result.
       * @enum
       */
      ReadyState: {
        Uninitialized: 0,
        Loading: 1,
        Loaded: 2,
        Interactive: 3,
        Complete: 4
      },

      /**
       * Ajax status code.
       * @enum
       */
      Status: {
        OK: 200,
        Created: 201,
        Accepted: 202,
        NoContent: 204,
        BadRequest: 400,
        Forbidden: 403,
        NotFound: 404,
        Gone: 410,
        ServerError: 500
      },

      /**
       * Ajax query method.
       * @enum
       */
      Method: {
        Get: "GET",
        Post: "POST"
      },

      /**
       * Ajax query type is asynchronous.
       * @type {boolean}
       */
      Asynchronous: true,

      /**
       * Ajax query type is synchronous.
       * @type {boolean}
       */
      Synchronous: false
    };
    /**
     * Xhr object that returned by ajax query.
     * @class
     * @param {Object} xhr - Current ActiveXObject object.
     */

    const Xhr = function (xhr) {
      /**
       * ActiveXObject object.
       * @private
       * @type {Object}
       */
      var _xhr = xhr;
      /**
       * Aborts current ajax.
       * @public
       */

      this.abort = function () {
        _xhr.aborted = true;

        _xhr.abort();
      };
    };

    const defaultParams = {
      type: ajax.Method.Get,
      async: ajax.Asynchronous,
      data: null,
      sender: null,
      responseType: "text"
    };

    function createXMLHttp() {
      var xhr = null;

      if (typeof XMLHttpRequest !== undefined) {
        xhr = new XMLHttpRequest();
        return xhr;
      } else if (window.ActiveXObject) {
        var ieXMLHttpVersions = ['MSXML2.XMLHttp.5.0', 'MSXML2.XMLHttp.4.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp', 'Microsoft.XMLHttp'];

        for (var i = 0; i < ieXMLHttpVersions.length; i++) {
          try {
            xhr = new ActiveXObject(ieXMLHttpVersions[i]);
            return xhr;
          } catch (e) {
            console.log('error: og.ajax.createXMLHttp creation filed.');
          }
        }
      }
    }
    /**
     * Send an ajax request.
     * @function
     * @param {string} url - Url path.
     * @param {Object} [params] - Ajax parameters:
     * @param {ajax.Method|string} [params.type] - 'POST' or 'GET' ajax method. 'GET' is default.
     * @param {boolean} [params.async] - Asynchronous ajax flag. True is default.
     * @param {Object} [params.data] - Qery data.
     * @param {Object} [params.sender] - Sender object, that success callback binded with. ActiveXObject is default.
     * @param {string} [params.responseType] - Responce data type. Culd be 'text', 'json', 'jsonp', 'html'. 'text' is default.
     * @param {ajax.Xhr~successCallback} [params.success] - The callback that handles the success response.
     * @param {ajax.Xhr~errorCallback} [params.error] - The callback that handles the failed response.
     * @param {ajax.Xhr~abortCallback} [params.abort] - The callback that handles aborted requests.
     * @returns {ajax.Xhr} - Returns object that could be aborted.
     */

    ajax.request = function (url, params) {
      params = params || {};
      var p = {},
          i;

      for (i in defaultParams) {
        p[i] = defaultParams[i];
      }

      for (i in params) {
        p[i] = params[i];
      }

      p.data = params.data;
      var xhr = createXMLHttp();
      var customXhr = new Xhr(xhr);
      var body = null,
          d;

      if (p.type === ajax.Method.Post) {
        if (p.data) {
          body = "";

          for (let key in p.data) {
            d = p.data[key];
            body += key + "=" + encodeURIComponent(d instanceof Object ? JSON.stringify(d) : d) + "&";
          }

          body = body.slice(0, -1);
        }

        xhr.open(p.type, url, p.async);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      } else if (p.data) {
        var tail = "?";

        for (let key in p.data) {
          d = p.data[key];
          tail += key + "=" + encodeURIComponent(d instanceof Object ? JSON.stringify(d) : d) + "&";
        }

        tail = tail.slice(0, -1);
        xhr.open(p.type, url + tail, p.async);
      } else {
        xhr.open(p.type, url, p.async);
      }

      if (p.async) xhr.responseType = p.responseType;
      xhr.overrideMimeType("text/plain");

      xhr.onreadystatechange = function () {
        if (xhr.readyState === ajax.ReadyState.Complete) {
          if (xhr.status === ajax.Status.OK) {
            if (params.success)
              /**
               * Success callback.
               * @callback ajax.Xhr~successCallback
               * @param {Object} Response data
               */
              params.success.call(params.sender || customXhr, xhr.response);
          } else if (xhr.aborted) {
            /**
             * Abort callback.
             * @callback ajax.Xhr~abortCallback
             * @param {Object} Response data
             * @param {Object} Status object
             */
            params.abort && params.abort.call(params.sender || customXhr, xhr.response, xhr.status);
          } else {
            /**
             * Error callback.
             * @callback ajax.Xhr~errorCallback
             * @param {Object} Response data
             * @param {Object} Status object
             */
            params.error && params.error.call(params.sender || customXhr, xhr.response, xhr.status);
          }

          delete xhr['onreadystatechange'];
          xhr.onreadystatechange = null;
          xhr = null;
        }
      };

      xhr.send(body);
      return customXhr;
    };

    /**
     * @module og/math
     */
    /** @const */

    const RADIANS = Math.PI / 180.0;
    /** @const */

    const RADIANS_HALF = 0.5 * RADIANS;
    /**
     * Equation function.
     * @callback equationCallback
     * @param {number} x - Equation variable.
     */

    /**
     * @module og/LonLat
     */
    const HALF_PI = Math.PI * 0.5;
    const INV_PI_BY_180 = 180.0 / Math.PI;
    const INV_PI_BY_360 = INV_PI_BY_180 * 2.0;
    const PI_BY_360 = Math.PI / 360.0;
    const INV_PI_BY_180_HALF_PI = INV_PI_BY_180 * HALF_PI;
    /**
     * Represents a geographical point with a certain latitude, longitude and height.
     * @class
     * @param {number} [lon] - Longitude.
     * @param {number} [lat] - Latitude.
     * @param {number} [height] - Height over the surface.
     */

    const LonLat = function (lon, lat, height) {
      /**
       * Longitude.
       * @public
       * @type {number}
       */
      this.lon = lon || 0;
      /**
       * Latitude.
       * @public
       * @type {number}
       */

      this.lat = lat || 0;
      /**
       * Height.
       * @public
       * @type {number}
       */

      this.height = height || 0;
    };

    LonLat.prototype.isZero = function () {
      return this.lon === 0.0 && this.lat === 0.0 && this.height === 0.0;
    };
    /**
     * Creates coordinates array.
     * @static
     * @param{Array.<Array<number,number,number>>} arr - Coordinates array data.
     * @return{Array.<og.LonLat>} the same coordinates array but each element is LonLat instance.
     */


    LonLat.join = function (arr) {
      var res = [];

      for (var i = 0; i < arr.length; i++) {
        var ai = arr[i];
        res[i] = new LonLat(ai[0], ai[1], ai[2]);
      }

      return res;
    };
    /**
     * Creates an object by coordinate array.
     * @static
     * @param {Array.<number,number,number>} arr - Coordiante array, where first is longitude, second is latitude and third is a height.
     * @returns {og.LonLat} -
     */


    LonLat.createFromArray = function (arr) {
      return new LonLat(arr[0], arr[1], arr[2]);
    };
    /**
     * Converts degrees to mercator coordinates.
     * @static
     * @param {number} lon - Degrees longitude.
     * @param {number} lat - Degrees latitude.
     * @param {number} [height] - Height.
     * @returns {og.LonLat} -
     */


    LonLat.forwardMercator = function (lon, lat, height) {
      return new LonLat(lon * POLE_BY_180, Math.log(Math.tan((90.0 + lat) * PI_BY_360)) * POLE_BY_PI, height);
    };
    /**
     * Converts mercator to degrees coordinates.
     * @static
     * @param {number} x - Mercator longitude.
     * @param {number} y - Mercator latitude.
     * @param {number} [height] - Height.
     * @returns {og.LonLat} -
     */


    LonLat.inverseMercator = function (x, y, height) {
      return new LonLat(x * INV_POLE_BY_180, INV_PI_BY_360 * Math.atan(Math.exp(y * PI_BY_POLE)) - INV_PI_BY_180_HALF_PI, height);
    };
    /**
     * Sets coordinates.
     * @public
     * @param {number} [lon] - Longitude.
     * @param {number} [lat] - Latitude.
     * @param {number} [height] - Height.
     * @returns {og.LonLat} -
     */


    LonLat.prototype.set = function (lon, lat, height) {
      this.lon = lon || 0;
      this.lat = lat || 0;
      this.height = height || 0;
      return this;
    };
    /**
     * Copy coordinates.
     * @public
     * @param {og.LonLat} [lonLat] - Coordinates to copy.
     * @returns {og.LonLat} -
     */


    LonLat.prototype.copy = function (lonLat) {
      this.lon = lonLat.lon;
      this.lat = lonLat.lat;
      this.height = lonLat.height;
      return this;
    };
    /**
     * Clone the coordiante.
     * @public
     * @returns {og.LonLat} -
     */


    LonLat.prototype.clone = function () {
      return new LonLat(this.lon, this.lat, this.height);
    };
    /**
     * Converts to mercator coordinates.
     * @public
     * @returns {og.LonLat} -
     */


    LonLat.prototype.forwardMercator = function () {
      return LonLat.forwardMercator(this.lon, this.lat, this.height);
    };

    LonLat.prototype.forwardMercatorEPS01 = function () {
      var lat = this.lat;

      if (lat > 89.9) {
        lat = 89.9;
      } else if (lat < -89.9) {
        lat = -89.9;
      }

      return new LonLat(this.lon * POLE_BY_180, Math.log(Math.tan((90.0 + lat) * PI_BY_360)) * POLE_BY_PI);
    };
    /**
     * Converts from mercator coordinates.
     * @public
     * @returns {og.LonLat} -
     */


    LonLat.prototype.inverseMercator = function () {
      return LonLat.inverseMercator(this.lon, this.lat, this.height);
    };
    /**
     * Compares coordinates.
     * @public
     * @param {og.LonLat} b - Coordinate to compare with.
     * @returns {boolean} -
     */


    LonLat.prototype.equal = function (b) {
      if (b.height) {
        return this.lon === b.lon && this.lat === b.lat && this.height === b.height;
      } else {
        return this.lon === b.lon && this.lat === b.lat;
      }
    };

    /**
     * @module og/mercator
     */
    /**
     * Mercator size.
     * @const
     * @type {number}
     */

    const POLE = 20037508.34;
    const PI_BY_POLE = Math.PI / POLE;
    const POLE_BY_PI = POLE / Math.PI;
    const POLE_BY_180 = POLE / 180.0;
    const INV_POLE_BY_180 = 180.0 / POLE;

    /**
     * @module og/math/Vec4
     */
    /**
     * Class represents a 4d vector.
     * @class
     * @param {number} [x] - First value.
     * @param {number} [y] - Second value.
     * @param {number} [z] - Third value.
     * @param {number} [w] - Fourth value.
     */

    const Vec4 = function (x, y, z, w) {
      /**
       * @public
       * @type {number}
       */
      this.x = x || 0.0;
      /**
       * @public
       * @type {number}
       */

      this.y = y || 0.0;
      /**
       * @public
       * @type {number}
       */

      this.z = z || 0.0;
      /**
       * @public
       * @type {number}
       */

      this.w = w || 0.0;
    };
    /**
     * Identity vector [0,0,0,1].
     * @const
     * @type {og.math.Vec4}
     */


    Vec4.identity = new Vec4(0, 0, 0, 1);
    /**
     * Creates 4d vector from array.
     * @function
     * @param {Array.<number,number,number,number>}
     * @returns {og.math.Vec4}
     */

    Vec4.fromVec = function (arr) {
      return new Vec4(arr[0], arr[1], arr[2], arr[3]);
    };
    /**
     * Converts to 3d vector, without fourth value.
     * @public
     * @returns {og.Vec3}
     */


    Vec4.prototype.toVec3 = function () {
      return new Vec3(this.x, this.y, this.z);
    };
    /**
     * Returns clone vector.
     * @public
     * @returns {og.math.Vec4}
     */


    Vec4.prototype.clone = function (v) {
      return new Vec4(this.x, this.y, this.z, this.w);
    };
    /**
     * Compares with vector. Returns true if it equals another.
     * @public
     * @param {og.math.Vec4} p - Vector to compare.
     * @returns {boolean}
     */


    Vec4.prototype.equal = function (v) {
      return this.x === v.x && this.y === v.y && this.z === v.z && this.w === v.w;
    };
    /**
     * Copy input vector's values.
     * @param {og.math.Vec4} v - Vector to copy.
     * @returns {og.math.Vec4}
     */


    Vec4.prototype.copy = function (v) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      this.w = v.w;
      return this;
    };
    /**
     * Converts vector to a number array.
     * @public
     * @returns {Array.<number,number,number,number>}
     * @deprecated
     */


    Vec4.prototype.toVec = function () {
      return [this.x, this.y, this.z, this.w];
    };
    /**
     * Converts vector to a number array.
     * @public
     * @returns {Array.<number,number,number,number>}
     */


    Vec4.prototype.toArray = function () {
      return [this.x, this.y, this.z, this.w];
    };
    /**
     * Sets vector's values.
     * @public
     * @param {number} x - Value X.
     * @param {number} y - Value Y.
     * @param {number} z - Value Z.
     * @param {number} w - Value W.
     * @returns {og.math.Vec4}
     */


    Vec4.prototype.set = function (x, y, z, w) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      return this;
    };
    /**
     * Adds vector to the current.
     * @public
     * @param {og.math.Vec4}
     * @returns {og.math.Vec4}
     */


    Vec4.prototype.addA = function (v) {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      this.w += v.w;
      return this;
    };
    /**
     * Subtract vector from the current.
     * @public
     * @param {og.math.Vec4} v - Subtract vector.
     * @returns {og.math.Vec4}
     */


    Vec4.prototype.subA = function (v) {
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      this.w -= v.w;
      return this;
    };
    /**
     * Scale current vector.
     * @public
     * @param {number} scale - Scale value.
     * @returns {og.math.Vec4}
     */


    Vec4.prototype.scale = function (scale) {
      this.x *= scale;
      this.y *= scale;
      this.z *= scale;
      this.w *= scale;
      return this;
    };
    /**
     * Makes vector affinity. Thereby fourh component becomes to 1.0.
     * @public
     * @returns {og.math.Vec4}
     */


    Vec4.prototype.affinity = function () {
      var iw = 1 / this.w;
      this.x *= iw;
      this.y *= iw;
      this.z *= iw;
      this.w = 1.0;
      return this;
    };
    /**
     * Scale current vector to another instance.
     * @public
     * @param {number} scale - Scale value.
     * @returns {og.Vec3}
     */


    Vec4.prototype.scaleTo = function (scale) {
      return new Vec4(this.x * scale, this.y * scale, this.z * scale, this.w * scale);
    };
    /**
     * Vector's edge function that returns vector where each component is 0.0 if it's smaller then edge and otherwise 1.0.
     * @public
     * @returns {og.math.Vec4}
     */


    Vec4.prototype.getStep = function (edge) {
      return new Vec4(this.x < edge ? 0.0 : 1.0, this.y < edge ? 0.0 : 1.0, this.z < edge ? 0.0 : 1.0, this.w < edge ? 0.0 : 1.0);
    };
    /**
     * The vector fract function returns the vector of fractional parts of each value, i.e. x minus floor(x).
     * @public
     * @returns {og.math.Vec4}
     */


    Vec4.prototype.getFrac = function (v) {
      return new Vec4(og.math.frac(v.x), og.math.frac(v.y), og.math.frac(v.z), og.math.frac(v.w));
    };
    /**
     * Gets vectors dot production.
     * @public
     * @param {og.math.Vec4} v - Another vector.
     * @returns {number} - Dot product.
     */


    Vec4.prototype.dot = function (v) {
      return v.x * this.x + v.y * this.y + v.z * this.z + v.w * this.w;
    };

    /**
     * @module og/math/Mat3
     */
    /**
     * Class represents a 3x3 matrix.
     * @class
     */

    const Mat3 = function () {
      /**
       * A 3x3 matrix, indexable as a column-major order array.
       * @public
       * @type {Array.<number>}
       */
      this._m = new Array(9);
    };
    /**
     * Sets column-major order array matrix.
     * @public
     * @param {Array.<number>} m - Matrix array.
     * @returns {og.Mat3}
     */

    Mat3.prototype.set = function (m) {
      this._m[0] = m[0];
      this._m[1] = m[1];
      this._m[2] = m[2];
      this._m[3] = m[3];
      this._m[4] = m[4];
      this._m[5] = m[5];
      this._m[6] = m[6];
      this._m[7] = m[7];
      this._m[8] = m[8];
      return this;
    };
    /**
     * Duplicates a Mat3 instance.
     * @public
     * @returns {og.Mat3}
     */


    Mat3.prototype.clone = function () {
      var res = new Mat3();
      res.set(this);
      return res;
    };
    /**
     * Copy matrix.
     * @public
     * @param {og.Mat3} a - Matrix to copy.
     * @returns {og.Mat3}
     */


    Mat3.prototype.copy = function (a) {
      return this.set(a._m);
    };
    /**
     * Creates trasposed matrix from the current.
     * @public
     * @returns {og.Mat3}
     */


    Mat3.prototype.transposeTo = function () {
      var res = new Mat3();
      var m = this._m;
      res._m[0] = m[0];
      res._m[1] = m[3];
      res._m[2] = m[6];
      res._m[3] = m[1];
      res._m[4] = m[4];
      res._m[5] = m[7];
      res._m[6] = m[2];
      res._m[7] = m[5];
      res._m[8] = m[8];
      return res;
    };
    /**
     * Sets matrix to identity.
     * @public
     * @returns {og.Mat3}
     */


    Mat3.prototype.setIdentity = function () {
      this._m[0] = 1;
      this._m[1] = 0;
      this._m[2] = 0;
      this._m[3] = 0;
      this._m[4] = 1;
      this._m[5] = 0;
      this._m[6] = 0;
      this._m[7] = 0;
      this._m[8] = 1;
      return this;
    };
    /**
     * Multiply to 3d vector.
     * @public
     * @params {og.Vec3} p - 3d vector.
     * @returns {og.Vec3}
     */


    Mat3.prototype.mulVec = function (p) {
      var d = p.x,
          e = p.y,
          g = p.z;
      var m = this._m;
      return new Vec3(m[0] * d + m[3] * e + m[6] * g, m[1] * d + m[4] * e + m[7] * g, m[2] * d + m[5] * e + m[8] * g);
    };
    /**
     * Converts to 4x4 matrix.
     * @public
     * @returns {og.Mat4}
     */


    Mat3.prototype.toMatrix4 = function () {
      var res = new Mat4();
      var b = res._m;
      var a = this._m;
      b[0] = a[0];
      b[1] = a[1];
      b[2] = a[2];
      b[3] = 0;
      b[4] = a[3];
      b[5] = a[4];
      b[6] = a[5];
      b[7] = 0;
      b[8] = a[6];
      b[9] = a[7];
      b[10] = a[8];
      b[11] = 0;
      b[12] = 0;
      b[13] = 0;
      b[14] = 0;
      b[15] = 1;
      return res;
    };

    /**
     * Class represents a 4x4 matrix.
     * @class
     */

    const Mat4 = function () {
      /**
       * A 4x4 matrix, indexable as a column-major order array.
       * @public
       * @type {Array.<number>}
       */
      this._m = new Array(16);
      /**
       * Projection frustum left value.
       * @public
       */

      this.left;
      /**
       * Projection frustum right value.
       * @public
       */

      this.right;
      /**
       * Projection frustum bottom value.
       * @public
       */

      this.bottom;
      /**
       * Projection frustum top value.
       * @public
       */

      this.top;
      /**
       * Projection frustum near value.
       * @public
       */

      this.near;
      /**
       * Projection frustum far value.
       * @public
       */

      this.far;
    };
    /**
     * Returns identity matrix instance.
     * @static
     * @returns {og.Mat4} -
     */

    Mat4.identity = function () {
      var res = new Mat4();
      res._m[0] = 1;
      res._m[1] = 0;
      res._m[2] = 0;
      res._m[3] = 0;
      res._m[4] = 0;
      res._m[5] = 1;
      res._m[6] = 0;
      res._m[7] = 0;
      res._m[8] = 0;
      res._m[9] = 0;
      res._m[10] = 1;
      res._m[11] = 0;
      res._m[12] = 0;
      res._m[13] = 0;
      res._m[14] = 0;
      res._m[15] = 1;
      return res;
    };
    /**
     * Sets column-major order array matrix.
     * @public
     * @param {Array.<number>} m - Matrix array.
     * @returns {og.Mat4} -
     */


    Mat4.prototype.set = function (m) {
      this._m[0] = m[0];
      this._m[1] = m[1];
      this._m[2] = m[2];
      this._m[3] = m[3];
      this._m[4] = m[4];
      this._m[5] = m[5];
      this._m[6] = m[6];
      this._m[7] = m[7];
      this._m[8] = m[8];
      this._m[9] = m[9];
      this._m[10] = m[10];
      this._m[11] = m[11];
      this._m[12] = m[12];
      this._m[13] = m[13];
      this._m[14] = m[14];
      this._m[15] = m[15];
      return this;
    };
    /**
     * Duplicates a Matrix3 instance.
     * @public
     * @returns {og.Mat4} -
     */


    Mat4.prototype.clone = function () {
      var res = new Mat4();
      res.set(this);
      return res;
    };
    /**
     * Copy matrix.
     * @public
     * @param {og.Mat3} a - Matrix to copy.
     */


    Mat4.prototype.copy = function (a) {
      this.set(a._m);
    };
    /**
     * Converts to 3x3 matrix.
     * @public
     * @returns {og.Mat3} -
     */


    Mat4.prototype.toMatrix3 = function () {
      var res = new Mat3();
      var a = this._m,
          b = res._m;
      b[0] = a[0];
      b[1] = a[1];
      b[2] = a[2];
      b[3] = a[4];
      b[4] = a[5];
      b[5] = a[6];
      b[6] = a[8];
      b[7] = a[9];
      b[8] = a[10];
      return res;
    };
    /**
     * Multiply to 3d vector.
     * @public
     * @param {og.Vec3} p - 3d vector.
     * @returns {og.Vec3} -
     */


    Mat4.prototype.mulVec3 = function (p) {
      var d = p.x,
          e = p.y,
          g = p.z;
      return new Vec3(this._m[0] * d + this._m[4] * e + this._m[8] * g + this._m[12], this._m[1] * d + this._m[5] * e + this._m[9] * g + this._m[13], this._m[2] * d + this._m[6] * e + this._m[10] * g + this._m[14]);
    };
    /**
     * Multiply to 4d vector.
     * @public
     * @param {og.Vec4} p - 4d vector.
     * @returns {og.Vec4} -
     */


    Mat4.prototype.mulVec4 = function (p) {
      var d = p.x,
          e = p.y,
          g = p.z,
          f = p.w;
      return new Vec4(this._m[0] * d + this._m[4] * e + this._m[8] * g + this._m[12] * f, this._m[1] * d + this._m[5] * e + this._m[9] * g + this._m[13] * f, this._m[2] * d + this._m[6] * e + this._m[10] * g + this._m[14] * f, this._m[3] * d + this._m[7] * e + this._m[11] * g + this._m[15] * f);
    };
    /**
     * Creates an inversed 3x3 matrix of the current.
     * @public
     * @returns {og.Mat3} -
     */


    Mat4.prototype.toInverseMatrix3 = function () {
      var a = this._m;
      var c = a[0],
          d = a[1],
          e = a[2],
          g = a[4],
          f = a[5],
          h = a[6],
          i = a[8],
          j = a[9],
          k = a[10],
          l = k * f - h * j,
          o = -k * g + h * i,
          m = j * g - f * i,
          n = c * l + d * o + e * m;
      if (!n) return null;
      n = 1 / n;
      var res = new Mat3();
      res._m[0] = l * n;
      res._m[1] = (-k * d + e * j) * n;
      res._m[2] = (h * d - e * f) * n;
      res._m[3] = o * n;
      res._m[4] = (k * c - e * i) * n;
      res._m[5] = (-h * c + e * g) * n;
      res._m[6] = m * n;
      res._m[7] = (-j * c + d * i) * n;
      res._m[8] = (f * c - d * g) * n;
      return res;
    };
    /**
     * Creates an inversed matrix of the current.
     * @public
     * @returns {og.Mat4} -
     */


    Mat4.prototype.inverseTo = function () {
      var c = this._m[0],
          d = this._m[1],
          e = this._m[2],
          g = this._m[3],
          f = this._m[4],
          h = this._m[5],
          i = this._m[6],
          j = this._m[7],
          k = this._m[8],
          l = this._m[9],
          o = this._m[10],
          m = this._m[11],
          n = this._m[12],
          p = this._m[13],
          r = this._m[14],
          s = this._m[15],
          A = c * h - d * f,
          B = c * i - e * f,
          t = c * j - g * f,
          u = d * i - e * h,
          v = d * j - g * h,
          w = e * j - g * i,
          x = k * p - l * n,
          y = k * r - o * n,
          z = k * s - m * n,
          C = l * r - o * p,
          D = l * s - m * p,
          E = o * s - m * r,
          q = 1 / (A * E - B * D + t * C + u * z - v * y + w * x),
          res = new Mat4();
      res._m[0] = (h * E - i * D + j * C) * q;
      res._m[1] = (-d * E + e * D - g * C) * q;
      res._m[2] = (p * w - r * v + s * u) * q;
      res._m[3] = (-l * w + o * v - m * u) * q;
      res._m[4] = (-f * E + i * z - j * y) * q;
      res._m[5] = (c * E - e * z + g * y) * q;
      res._m[6] = (-n * w + r * t - s * B) * q;
      res._m[7] = (k * w - o * t + m * B) * q;
      res._m[8] = (f * D - h * z + j * x) * q;
      res._m[9] = (-c * D + d * z - g * x) * q;
      res._m[10] = (n * v - p * t + s * A) * q;
      res._m[11] = (-k * v + l * t - m * A) * q;
      res._m[12] = (-f * C + h * y - i * x) * q;
      res._m[13] = (c * C - d * y + e * x) * q;
      res._m[14] = (-n * u + p * B - r * A) * q;
      res._m[15] = (k * u - l * B + o * A) * q;
      return res;
    };
    /**
     * Creates a trasposed matrix of the current.
     * @public
     * @returns {og.Mat4} -
     */


    Mat4.prototype.transposeTo = function () {
      var res = new Mat4();
      res._m[0] = this._m[0];
      res._m[1] = this._m[4];
      res._m[2] = this._m[8];
      res._m[3] = this._m[12];
      res._m[4] = this._m[1];
      res._m[5] = this._m[5];
      res._m[6] = this._m[9];
      res._m[7] = this._m[13];
      res._m[8] = this._m[2];
      res._m[9] = this._m[6];
      res._m[10] = this._m[10];
      res._m[11] = this._m[14];
      res._m[12] = this._m[3];
      res._m[13] = this._m[7];
      res._m[14] = this._m[11];
      res._m[15] = this._m[15];
      return res;
    };
    /**
     * Sets matrix to identity.
     * @public
     * @returns {og.Mat4} -
     */


    Mat4.prototype.setIdentity = function () {
      this._m[0] = 1;
      this._m[1] = 0;
      this._m[2] = 0;
      this._m[3] = 0;
      this._m[4] = 0;
      this._m[5] = 1;
      this._m[6] = 0;
      this._m[7] = 0;
      this._m[8] = 0;
      this._m[9] = 0;
      this._m[10] = 1;
      this._m[11] = 0;
      this._m[12] = 0;
      this._m[13] = 0;
      this._m[14] = 0;
      this._m[15] = 1;
      return this;
    };
    /**
     * Computes the product of two matrices.
     * @public
     * @param {og.Mat4} mx - Matrix to multiply.
     * @returns {og.Mat4} -
     */


    Mat4.prototype.mul = function (mx) {
      let d = this._m[0],
          e = this._m[1],
          g = this._m[2],
          f = this._m[3],
          h = this._m[4],
          i = this._m[5],
          j = this._m[6],
          k = this._m[7],
          l = this._m[8],
          o = this._m[9],
          m = this._m[10],
          n = this._m[11],
          p = this._m[12],
          r = this._m[13],
          s = this._m[14],
          a = this._m[15];
      let A = mx._m[0],
          B = mx._m[1],
          t = mx._m[2],
          u = mx._m[3],
          v = mx._m[4],
          w = mx._m[5],
          x = mx._m[6],
          y = mx._m[7],
          z = mx._m[8],
          C = mx._m[9],
          D = mx._m[10],
          E = mx._m[11],
          q = mx._m[12],
          F = mx._m[13],
          G = mx._m[14],
          b = mx._m[15];
      var res = new Mat4();
      res._m[0] = A * d + B * h + t * l + u * p;
      res._m[1] = A * e + B * i + t * o + u * r;
      res._m[2] = A * g + B * j + t * m + u * s;
      res._m[3] = A * f + B * k + t * n + u * a;
      res._m[4] = v * d + w * h + x * l + y * p;
      res._m[5] = v * e + w * i + x * o + y * r;
      res._m[6] = v * g + w * j + x * m + y * s;
      res._m[7] = v * f + w * k + x * n + y * a;
      res._m[8] = z * d + C * h + D * l + E * p;
      res._m[9] = z * e + C * i + D * o + E * r;
      res._m[10] = z * g + C * j + D * m + E * s;
      res._m[11] = z * f + C * k + D * n + E * a;
      res._m[12] = q * d + F * h + G * l + b * p;
      res._m[13] = q * e + F * i + G * o + b * r;
      res._m[14] = q * g + F * j + G * m + b * s;
      res._m[15] = q * f + F * k + G * n + b * a;
      return res;
    };
    /**
     * Add translation vector to the current matrix.
     * @public
     * @param {og.Vec3} v - Translate vector.
     * @returns {og.Mat4} -
     */


    Mat4.prototype.translate = function (v) {
      var d = v.x,
          e = v.y,
          b = v.z;
      var a = this._m;
      a[12] = a[0] * d + a[4] * e + a[8] * b + a[12];
      a[13] = a[1] * d + a[5] * e + a[9] * b + a[13];
      a[14] = a[2] * d + a[6] * e + a[10] * b + a[14];
      a[15] = a[3] * d + a[7] * e + a[11] * b + a[15];
      return this;
    };
    /**
     * Sets translation matrix to the position.
     * @public
     * @param {og.Vec3} v - Translate to position.
     * @returns {og.Mat4} -
     */


    Mat4.prototype.translateToPosition = function (v) {
      var a = this._m;
      a[12] = v.x;
      a[13] = v.y;
      a[14] = v.z;
      return this;
    };
    /**
     * Rotate currrent matrix around the aligned axis and angle.
     * @public
     * @param {og.Vec3} u - Aligned axis.
     * @param {number} angle - Aligned axis angle in radians.
     * @returns {og.Mat4} -
     * @todo: OPTIMIZE: reveal multiplication
     */


    Mat4.prototype.rotate = function (u, angle) {
      var c = Math.cos(angle),
          s = Math.sin(angle);
      var rot = new Mat4();
      var mx = rot._m;
      mx[0] = c + (1 - c) * u.x * u.x;
      mx[1] = (1 - c) * u.y * u.x - s * u.z;
      mx[2] = (1 - c) * u.z * u.x + s * u.y;
      mx[3] = 0;
      mx[4] = (1 - c) * u.x * u.y + s * u.z;
      mx[5] = c + (1 - c) * u.y * u.y;
      mx[6] = (1 - c) * u.z * u.y - s * u.x;
      mx[7] = 0;
      mx[8] = (1 - c) * u.x * u.z - s * u.y;
      mx[9] = (1 - c) * u.y * u.z + s * u.x;
      mx[10] = c + (1 - c) * u.z * u.z;
      mx[11] = 0;
      mx[12] = 0;
      mx[13] = 0;
      mx[14] = 0;
      mx[15] = 1;
      return this.mul(rot);
    };
    /**
     * Sets current rotation matrix around the aligned axis and angle.
     * @public
     * @param {og.Vec3} u - Aligned axis.
     * @param {number} angle - Aligned axis angle in radians.
     * @returns {og.Mat4} -
     */


    Mat4.prototype.setRotation = function (u, angle) {
      var c = Math.cos(angle),
          s = Math.sin(angle);
      var mx = this._m;
      mx[0] = c + (1 - c) * u.x * u.x;
      mx[1] = (1 - c) * u.y * u.x - s * u.z;
      mx[2] = (1 - c) * u.z * u.x + s * u.y;
      mx[3] = 0;
      mx[4] = (1 - c) * u.x * u.y + s * u.z;
      mx[5] = c + (1 - c) * u.y * u.y;
      mx[6] = (1 - c) * u.z * u.y - s * u.x;
      mx[7] = 0;
      mx[8] = (1 - c) * u.x * u.z - s * u.y;
      mx[9] = (1 - c) * u.y * u.z + s * u.x;
      mx[10] = c + (1 - c) * u.z * u.z;
      mx[11] = 0;
      mx[12] = 0;
      mx[13] = 0;
      mx[14] = 0;
      mx[15] = 1;
      return this;
    };
    /**
     * Gets the rotation matrix from one vector to another.
     * @public
     * @param {og.Vec3} a - Firtst vector.
     * @param {og.Vec3} b - Second vector.
     * @returns {og.Mat4} -
     */


    Mat4.prototype.rotateBetweenVectors = function (a, b) {
      var q = Quat.getRotationBetweenVectors(a, b);
      return q.getMat4();
    };
    /**
     * Scale current matrix to the vector values.
     * @public
     * @param {og.Vec3} v - Scale vector.
     * @returns {og.Mat4} -
     */


    Mat4.prototype.scale = function (v) {
      var mx = this._m;
      mx[0] = mx[0] * v.x;
      mx[1] = mx[1] * v.x;
      mx[2] = mx[2] * v.x;
      mx[3] = mx[3] * v.x;
      mx[4] = mx[4] * v.y;
      mx[5] = mx[5] * v.y;
      mx[6] = mx[6] * v.y;
      mx[7] = mx[7] * v.y;
      mx[8] = mx[8] * v.z;
      mx[9] = mx[9] * v.z;
      mx[10] = mx[10] * v.z;
      mx[11] = mx[11] * v.z;
      mx[12] = mx[12];
      mx[13] = mx[13];
      mx[14] = mx[14];
      mx[15] = mx[15];
      return this;
    };
    /**
     * Sets perspective projection matrix frustum values.
     * @public
     * @param {number} left -
     * @param {number} right -
     * @param {number} bottom -
     * @param {number} top -
     * @param {number} near -
     * @param {number} far -
     * @returns {og.Mat4} -
     */


    Mat4.prototype.setFrustum = function (left, right, bottom, top, near, far) {
      //this.left = left;
      //this.right = right;
      //this.bottom = bottom;
      //this.top = top;
      //this.near = near;
      //this.far = far;
      var h = right - left,
          i = top - bottom,
          j = far - near;
      this._m[0] = near * 2 / h;
      this._m[1] = 0;
      this._m[2] = 0;
      this._m[3] = 0;
      this._m[4] = 0;
      this._m[5] = near * 2 / i;
      this._m[6] = 0;
      this._m[7] = 0;
      this._m[8] = (right + left) / h;
      this._m[9] = (top + bottom) / i;
      this._m[10] = -(far + near) / j;
      this._m[11] = -1;
      this._m[12] = 0;
      this._m[13] = 0;
      this._m[14] = -(far * near * 2) / j;
      this._m[15] = 0;
      return this;
    };
    /**
     * Creates current percpective projection matrix.
     * @public
     * @param {number} angle - View angle in degrees.
     * @param {number} aspect - Screen aspect ratio.
     * @param {number} near - Near clip plane.
     * @param {number} far - Far clip plane.
     * @returns {og.Mat4} -
     */


    Mat4.prototype.setPerspective = function (angle, aspect, near, far) {
      angle = near * Math.tan(angle * Math.PI / 360);
      aspect = angle * aspect;
      return this.setFrustum(-aspect, aspect, -angle, angle, near, far);
    };
    /**
     * Creates current orthographic projection matrix.
     * @public
     * @param {number} left -
     * @param {number} right -
     * @param {number} bottom -
     * @param {number} top -
     * @param {number} near -
     * @param {number} far -
     * @return {og.Mat4} -
     */


    Mat4.prototype.setOrtho = function (left, right, bottom, top, near, far) {
      //this.left = left;
      //this.right = right;
      //this.bottom = bottom;
      //this.top = top;
      //this.near = near;
      //this.far = far;
      var lr = 1.0 / (left - right),
          bt = 1.0 / (bottom - top),
          nf = 1.0 / (near - far),
          m = this._m;
      m[0] = -2.0 * lr;
      m[1] = 0;
      m[2] = 0;
      m[3] = 0;
      m[4] = 0;
      m[5] = -2.0 * bt;
      m[6] = 0;
      m[7] = 0;
      m[8] = 0;
      m[9] = 0;
      m[10] = 2.0 * nf;
      m[11] = 0;
      m[12] = (left + right) * lr;
      m[13] = (top + bottom) * bt;
      m[14] = (far + near) * nf;
      m[15] = 1.0;
      return this;
    };
    /**
     * Sets current rotation matrix by euler's angles.
     * @public
     * @param {number} ax - Rotation angle in radians arond X axis.
     * @param {number} ay - Rotation angle in radians arond Y axis.
     * @param {number} az - Rotation angle in radians arond Z axis.
     * @returns {og.Mat4} -
     */


    Mat4.prototype.eulerToMatrix = function (ax, ay, az) {
      var a = Math.cos(ax),
          b = Math.sin(ax),
          c = Math.cos(ay),
          d = Math.sin(ay),
          e = Math.cos(az),
          f = Math.sin(az);
      var ad = a * d,
          bd = b * d;
      var mat = this._m;
      mat[0] = c * e;
      mat[1] = -c * f;
      mat[2] = -d;
      mat[4] = -bd * e + a * f;
      mat[5] = bd * f + a * e;
      mat[6] = -b * c;
      mat[8] = ad * e + b * f;
      mat[9] = -ad * f + b * e;
      mat[10] = a * c;
      mat[3] = mat[7] = mat[11] = mat[12] = mat[13] = mat[14] = 0;
      mat[15] = 1;
      return this;
    };

    /**
     * A set of 4-dimensional coordinates used to represent rotation in 3-dimensional space.
     * @constructor
     * @param {Number} [x=0.0] The X component.
     * @param {Number} [y=0.0] The Y component.
     * @param {Number} [z=0.0] The Z component.
     * @param {Number} [w=0.0] The W component.
     */

    const Quat = function (x, y, z, w) {
      /**
       * The X component.
       * @public
       * @type {Number}
       * @default 0.0
       */
      this.x = x || 0.0;
      /**
       * The Y component.
       * @public
       * @type {Number}
       * @default 0.0
       */

      this.y = y || 0.0;
      /**
       * The Z component.
       * @public
       * @type {Number}
       * @default 0.0
       */

      this.z = z || 0.0;
      /**
       * The W component.
       * @public
       * @type {Number}
       * @default 0.0
       */

      this.w = w || 0.0;
    };
    /**
     * Identity Quat.
     * @const
     * @type {og.Quat}
     */

    Quat.IDENTITY = new Quat(0.0, 0.0, 0.0, 1.0);
    /**
     * Returns a Quat represents rotation around X axis.
     * @static
     * @param {number} a - The angle in radians to rotate around the axis.
     * @returns {og.Quat} -
     */

    Quat.xRotation = function (a) {
      a *= 0.5;
      return new Quat(Math.sin(a), 0.0, 0.0, Math.cos(a));
    };
    /**
     * Returns a Quat represents rotation around Y axis.
     * @static
     * @param {number} a - The angle in radians to rotate around the axis.
     * @returns {og.Quat} -
     */


    Quat.yRotation = function (a) {
      a *= 0.5;
      return new Quat(0.0, Math.sin(a), 0.0, Math.cos(a));
    };
    /**
     * Returns a Quat represents rotation around Z axis.
     * @static
     * @param {number} a - The angle in radians to rotate around the axis.
     * @returns {og.Quat} -
     */


    Quat.zRotation = function (a) {
      a *= 0.5;
      return new Quat(0.0, 0.0, Math.sin(a), Math.cos(a));
    };
    /**
     * Computes a Quat representing a rotation around an axis.
     * @static
     * @param {og.Vec3} axis - The axis of rotation.
     * @param {number} [angle=0.0] The angle in radians to rotate around the axis.
     * @returns {og.Quat} -
     */


    Quat.axisAngleToQuat = function (axis, angle) {
      angle = angle || 0.0;
      var v = axis.normal();
      var half_angle = angle * 0.5;
      var sin_a = Math.sin(half_angle);
      return new Quat(v.x * sin_a, v.y * sin_a, v.z * sin_a, Math.cos(half_angle));
    };
    /**
     * Computes a rotation from the given heading and up vector.
     * @static
     * @param {og.Vec3} forward - Heading target coordinates.
     * @param {og.Vec3} up - Up vector.
     * @returns {og.Quat} -
     */


    Quat.getLookRotation = function (forward, up) {
      var f = forward.normal().negate();
      var s = up.cross(f).normalize();
      var u = f.cross(s);
      var z = 1.0 + s.x + u.y + f.z;

      if (z > 0.000001) {
        let fd = 1.0 / (2.0 * Math.sqrt(z));
        return new Quat((f.y - u.z) * fd, (s.z - f.x) * fd, (u.x - s.y) * fd, 0.25 / fd);
      }

      if (s.x > u.y && s.x > f.z) {
        let fd = 1.0 / (2.0 * Math.sqrt(1.0 + s.x - u.y - f.z));
        return new Quat(0.25 / fd, (u.x + s.y) * fd, (s.z + f.x) * fd, (f.y - u.z) * fd);
      }

      if (u.y > f.z) {
        let fd = 1.0 / (2.0 * Math.sqrt(1.0 + u.y - s.x - f.z));
        return new Quat((u.x + s.y) * fd, 0.25 / fd, (f.y + u.z) * fd, (s.z - f.x) * fd);
      }

      let fd = 1.0 / (2.0 * Math.sqrt(1.0 + f.z - s.x - u.y));
      return new Quat((s.z + f.x) * fd, (f.y + u.z) * fd, 0.25 / fd, (u.x - s.y) * fd);
    };
    /**
     * Computes a Quat from from source point heading to the destination point.
     * @static
     * @param {og.Vec3} sourcePoint - Source coordinate.
     * @param {og.Vec3} destPoint - Destination coordinate.
     * @returns {og.Quat} -
     */


    Quat.getLookAtSourceDest = function (sourcePoint, destPoint) {
      var forwardVector = destPoint.subA(sourcePoint).normalize();
      var dot = Vec3.FORWARD.dot(forwardVector);

      if (Math.abs(dot - -1.0) < 0.000001) {
        return Quat.axisAngleToQuat(Vec3.UP, Math.PI);
      }

      if (Math.abs(dot - 1.0) < 0.000001) {
        return new Quat(0.0, 0.0, 0.0, 1.0);
      }

      var rotAngle = Math.acos(dot);
      var rotAxis = Vec3.FORWARD.cross(forwardVector).normalize();
      return Quat.axisAngleToQuat(rotAxis, rotAngle);
    };
    /**
     * Compute rotation between two vectors.
     * @static
     * @param {og.Vec3} u - First vector.
     * @param {og.Vec3} v - Second vector.
     * @returns {og.Quat} -
     */


    Quat.getRotationBetweenVectors = function (u, v) {
      var w = u.cross(v);
      var q = new Quat(w.x, w.y, w.z, 1.0 + u.dot(v));
      return q.normalize();
    };
    /**
     * Compute rotation between two vectors with around vector up 
     * for exactly opposite vectors. If vectors exaclty in the same
     * direction than returns identity Quat.
     * @static
     * @param {og.Vec3} source - First vector.
     * @param {og.Vec3} dest - Second vector.
     * @param {og.Vec3} up - Up vector.
     * @returns {og.Quat} -
     */


    Quat.getRotationBetweenVectorsUp = function (source, dest, up) {
      var dot = source.dot(dest);

      if (Math.abs(dot + 1.0) < 0.000001) {
        // vector source and dest point exactly in the opposite direction, 
        // so it is a 180 degrees turn around the up-axis
        return Quat.axisAngleToQuat(up, Math.PI);
      }

      if (Math.abs(dot - 1.0) < 0.000001) {
        // vector source and dest point exactly in the same direction
        // so we return the identity Quat
        return new Quat(0, 0, 0, 1);
      }

      var rotAngle = Math.acos(dot);
      var rotAxis = source.cross(dest).normalize();
      return Quat.axisAngleToQuat(rotAxis, rotAngle);
    };
    /**
     * Returns true if the components are zero.
     * @public
     * @param {og.Quat} q - Quat to subtract.
     * @returns {og.Quat} -
     */


    Quat.prototype.isZero = function () {
      return this.x === 0.0 && this.y === 0.0 && this.z === 0.0 && this.w === 0.0;
    };
    /**
     * Clear Quat. Sets zeroes.
     * @public
     * @returns {og.Quat} -
     */


    Quat.prototype.clear = function () {
      this.x = this.y = this.z = this.w = 0;
      return this;
    };
    /**
     * Sets Quat values.
     * @public
     * @param {Number} [x=0.0] The X component.
     * @param {Number} [y=0.0] The Y component.
     * @param {Number} [z=0.0] The Z component.
     * @param {Number} [w=0.0] The W component.
     * @returns {og.Quat} -
     */


    Quat.prototype.set = function (x, y, z, w) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      return this;
    };
    /**
     * Copy Quat values.
     * @public
     * @param {og.Quat} q - Copy Quat.
     * @returns {og.Quat} -
     */


    Quat.prototype.copy = function (q) {
      this.x = q.x;
      this.y = q.y;
      this.z = q.z;
      this.w = q.w;
      return this;
    };
    /**
     * Set current Quat instance to identity Quat.
     * @public
     * @returns {og.Quat} -
     */


    Quat.prototype.setIdentity = function () {
      this.x = 0.0;
      this.y = 0.0;
      this.z = 0.0;
      this.w = 1.0;
      return this;
    };
    /**
     * Duplicates a Quat instance.
     * @public
     * @returns {og.Quat} -
     */


    Quat.prototype.clone = function () {
      return new Quat(this.x, this.y, this.z, this.w);
    };
    /**
     * Computes the componentwise sum of two Quats.
     * @public
     * @param {og.Quat} q - Quat to add.
     * @returns {og.Quat} -
     */


    Quat.prototype.add = function (q) {
      return new Quat(this.x + q.x, this.y + q.y, this.z + q.z, this.w + q.w);
    };
    /**
     * Computes the componentwise difference of two Quats.
     * @public
     * @param {og.Quat} q - Quat to subtract.
     * @returns {og.Quat} -
     */


    Quat.prototype.sub = function (q) {
      return new Quat(this.x - q.x, this.y - q.y, this.z - q.z, this.w - q.w);
    };
    /**
     * Multiplies the provided Quat componentwise by the provided scalar.
     * @public
     * @param {Number} scale - The scalar to multiply with.
     * @returns {og.Quat} -
     */


    Quat.prototype.scaleTo = function (scale) {
      return new Quat(this.x * scale, this.y * scale, this.z * scale, this.w * scale);
    };
    /**
     * Multiplies the provided Quat componentwise.
     * @public
     * @param {Number} scale - The scalar to multiply with.
     * @returns {og.Quat} -
     */


    Quat.prototype.scale = function (scale) {
      return this.x * scale, this.y * scale, this.z * scale, this.w * scale;
    };
    /**
     * Converts Quat values to array.
     * @public
     * @returns {Array.<number,number,number,number>} -
     */


    Quat.prototype.toVec = function () {
      return [this.x, this.y, this.z, this.w];
    };
    /**
     * Sets current quaternion by spherical coordinates.
     * @public
     * @param {number} lat - Latitude.
     * @param {number} lon - Longitude.
     * @param {number} angle - Angle in radians.
     * @returns {og.Quat} -
     */


    Quat.prototype.setFromSphericalCoords = function (lat, lon, angle) {
      var sin_a = Math.sin(angle / 2);
      var cos_a = Math.cos(angle / 2);
      var sin_lat = Math.sin(lat);
      var cos_lat = Math.cos(lat);
      var sin_long = Math.sin(lon);
      var cos_long = Math.cos(lon);
      this.x = sin_a * cos_lat * sin_long;
      this.y = sin_a * sin_lat;
      this.z = sin_a * sin_lat * cos_long;
      this.w = cos_a;
      return this;
    };
    /**
     * Sets rotation with the given heading and up vectors.
     * @static
     * @param {og.Vec3} forward - Heading target coordinates.
     * @param {og.Vec3} up - Up vector.
     * @returns {og.Quat} -
     */


    Quat.prototype.setLookRotation = function (forward, up) {
      var f = forward.normal().negate();
      var s = up.cross(f).normalize();
      var u = f.cross(s);
      var z = 1.0 + s.x + u.y + f.z;

      if (z > 0.000001) {
        let fd = 1.0 / (2.0 * Math.sqrt(z));
        this.x = (f.y - u.z) * fd;
        this.y = (s.z - f.x) * fd;
        this.z = (u.x - s.y) * fd;
        this.w = 0.25 / fd;
      } else if (s.x > u.y && s.x > f.z) {
        let fd = 1.0 / (2.0 * Math.sqrt(1.0 + s.x - u.y - f.z));
        this.x = 0.25 / fd;
        this.y = (u.x + s.y) * fd;
        this.z = (s.z + f.x) * fd;
        this.w = (f.y - u.z) * fd;
      } else if (u.y > f.z) {
        let fd = 1.0 / (2.0 * Math.sqrt(1.0 + u.y - s.x - f.z));
        this.x = (u.x + s.y) * fd;
        this.y = 0.25 / fd;
        this.z = (f.y + u.z) * fd;
        this.w = (s.z - f.x) * fd;
      } else {
        let fd = 1.0 / (2.0 * Math.sqrt(1.0 + f.z - s.x - u.y));
        this.x = (s.z + f.x) * fd;
        this.y = (f.y + u.z) * fd;
        this.z = 0.25 / fd;
        this.w = (u.x - s.y) * fd;
      }

      return this;
    };
    /**
     * Gets spherical coordinates.
     * @public
     * @returns {Object} Returns object with latitude, longitude and alpha. 
     */


    Quat.prototype.toSphericalCoords = function () {
      var cos_a = this.w;
      var sin_a = Math.sqrt(1.0 - cos_a * cos_a);
      if (Math.abs(sin_a) < 0.0005) sin_a = 1;
      var tx = this.x / sin_a;
      var ty = this.y / sin_a;
      var tz = this.z / sin_a;
      var lon,
          lat = -Math.asin(ty);
      if (tx * tx + tz * tz < 0.0005) lon = 0;else lon = Math.atan2(tx, tz);
      if (lon < 0) lon += 360.0;
      return {
        lat: lat,
        lon: lon,
        alpha: Math.acos(cos_a)
      };
    };
    /**
     * Sets current Quat representing a rotation around an axis.
     * @public
     * @param {og.Vec3} axis - The axis of rotation.
     * @param {number} angle The angle in radians to rotate around the axis.
     * @returns {og.Quat} -
     */


    Quat.prototype.setFromAxisAngle = function (axis, angle) {
      var v = axis.normal();
      var half_angle = angle * 0.5;
      var sin_a = Math.sin(half_angle);
      this.set(v.x * sin_a, v.y * sin_a, v.z * sin_a, Math.cos(half_angle));
      return this;
    };
    /**
     * Returns axis and angle of the current Quat.
     * @public
     * @returns {Object} -
     */


    Quat.prototype.getAxisAngle = function () {
      var vl = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      var axis, angle;

      if (vl > 0.0000001) {
        var ivl = 1.0 / vl;
        axis = new Vec3(x * ivl, y * ivl, z * ivl);
        if (this.w < 0) angle = 2.0 * Math.atan2(-vl, -w); //-PI,0 
        else angle = 2.0 * Math.atan2(vl, w); //0,PI 
      } else {
        axis = new Vec3(0, 0, 0);
        angle = 0;
      }

      return {
        axis: axis,
        angle: angle
      };
    };
    /**
     * Sets current Quat by Euler's angles.
     * @public
     * @param {number} pitch - Pitch angle in degrees.
     * @param {number} yaw - Yaw angle in degrees.
     * @param {number} roll - Roll angle in degrees.
     * @returns {og.Quat} -
     */


    Quat.prototype.setFromEulerAngles = function (pitch, yaw, roll) {
      var ex = pitch * RADIANS_HALF,
          ey = yaw * RADIANS_HALF,
          ez = roll * RADIANS_HALF;
      var cr = Math.cos(ex),
          cp = Math.cos(ey),
          cy = Math.cos(ez);
      var sr = Math.sin(ex),
          sp = Math.sin(ey),
          sy = Math.sin(ez);
      var cpcy = cp * cy,
          spsy = sp * sy;
      this.w = cr * cpcy + sr * spsy;
      this.x = sr * cpcy - cr * spsy;
      this.y = cr * sp * cy + sr * cp * sy;
      this.z = cr * cp * sy - sr * sp * cy;
      return this.normalize();
    };
    /**
     * Returns Euler's angles of the current Quat.
     * @public
     * @returns {Object} -
     */


    Quat.prototype.getEulerAngles = function () {
      let x = this.x,
          y = this.y,
          z = this.z,
          w = this.w;
      let sqy = y * y;
      let roll = Math.atan2(2.0 * (w * x + y * z), 1.0 - 2.0 * (x * x + sqy));
      let a = w * y - z * x;

      if (a < -1.0) {
        a = -1.0;
      } else if (a > 1.0) {
        a = 1.0;
      }

      let pitch = Math.asin(2.0 * a);
      let yaw = Math.atan2(2.0 * (w * z + x * y), 1.0 - 2.0 * (sqy + z * z));
      return {
        roll,
        pitch,
        yaw
      };
    };
    /**
     * Computes a Quat from the provided 4x4 matrix instance.
     * @public
     * @param {og.Mat4} m - The rotation matrix.
     * @returns {og.Quat} -
     */


    Quat.prototype.setFromMatrix4 = function (m) {
      var tr,
          s,
          q = [];
      var i, j, k;
      m = m._m;
      var nxt = [1, 2, 0];
      tr = m[0] + m[5] + m[10];

      if (tr > 0.0) {
        s = Math.sqrt(tr + 1.0);
        this.w = s / 2.0;
        s = 0.5 / s;
        this.x = (m[6] - m[9]) * s;
        this.y = (m[8] - m[2]) * s;
        this.z = (m[1] - m[4]) * s;
      } else {
        i = 0;
        if (m[5] > m[0]) i = 1;
        if (m[10] > m[i * 5]) i = 2;
        j = nxt[i];
        k = nxt[j];
        s = Math.sqrt(m[i * 5] - (m[j * 5] + m[k * 5]) + 1.0);
        q[i] = s * 0.5;
        if (s !== 0.0) s = 0.5 / s;
        q[3] = (m[j * 4 + k] - m[k * 4 + j]) * s;
        q[j] = (m[i * 4 + j] + m[j * 4 + i]) * s;
        q[k] = (m[i * 4 + k] + m[k * 4 + i]) * s;
        this.x = q[0];
        this.y = q[1];
        this.z = q[2];
        this.w = q[3];
      }

      return this;
    };
    /**
     * Converts current Quat to the rotation 4x4 matrix.
     * @public
     * @returns {og.Mat4} -
     */


    Quat.prototype.getMat4 = function (out) {
      var xs = this.x + this.x;
      var ys = this.y + this.y;
      var zs = this.z + this.z;
      var wx = this.w * xs;
      var wy = this.w * ys;
      var wz = this.w * zs;
      var xx = this.x * xs;
      var xy = this.x * ys;
      var xz = this.x * zs;
      var yy = this.y * ys;
      var yz = this.y * zs;
      var zz = this.z * zs;
      var m = out || new Mat4();
      return m.set([1 - (yy + zz), xy - wz, xz + wy, 0, xy + wz, 1 - (xx + zz), yz - wx, 0, xz - wy, yz + wx, 1 - (xx + yy), 0, 0, 0, 0, 1]);
    };
    /**
     * Converts current Quat to the rotation 3x3 matrix.
     * @public
     * @returns {og.Mat3} -
     * @todo NOT TESTED
     */


    Quat.prototype.getMat3 = function () {
      var m = new Mat3();
      var mx = m._m;
      var c = this.x,
          d = this.y,
          e = this.z,
          g = this.w,
          f = c + c,
          h = d + d,
          i = e + e,
          j = c * f,
          k = c * h;
      c = c * i;
      var l = d * h;
      d = d * i;
      e = e * i;
      f = g * f;
      h = g * h;
      g = g * i;
      mx[0] = 1 - (l + e);
      mx[1] = k - g;
      mx[2] = c + h;
      mx[3] = k + g;
      mx[4] = 1 - (j + e);
      mx[5] = d - f;
      mx[6] = c - h;
      mx[7] = d + f;
      mx[8] = 1 - (j + l);
      return m;
    };
    /**
     * Returns quatrenion and vector production.
     * @public
     * @param {og.Vec3} v - 3d Vector.
     * @returns {og.Vec3} -
     */


    Quat.prototype.mulVec3 = function (v) {
      //t = 2 * cross(q.xyz, v)
      //v' = v + q.w * t + cross(q.xyz, t)
      var d = v.x,
          e = v.y,
          g = v.z;
      var b = this.x,
          f = this.y,
          h = this.z,
          a = this.w;
      var i = a * d + f * g - h * e,
          j = a * e + h * d - b * g,
          k = a * g + b * e - f * d;
      d = -b * d - f * e - h * g;
      return new Vec3(i * a + d * -b + j * -h - k * -f, j * a + d * -f + k * -b - i * -h, k * a + d * -h + i * -f - j * -b);
    };
    /**
     * Computes the product of two Quats.
     * @public
     * @param {og.Quat} q - Quat to multiply.
     * @returns {og.Quat} -
     */


    Quat.prototype.mul = function (q) {
      var d = this.x,
          e = this.y,
          g = this.z,
          a = this.w;
      var f = q.x,
          h = q.y,
          i = q.z,
          b = q.w;
      return new Quat(d * b + a * f + e * i - g * h, e * b + a * h + g * f - d * i, g * b + a * i + d * h - e * f, a * b - d * f - e * h - g * i);
    };
    /**
     * Computes the product of two Quats.
     * @public
     * @param {og.Quat} q - Quat to multiply.
     * @returns {og.Quat} -
     */


    Quat.prototype.mulA = function (q) {
      var d = this.x,
          e = this.y,
          g = this.z,
          a = this.w;
      var f = q.x,
          h = q.y,
          i = q.z,
          b = q.w;
      this.x = d * b + a * f + e * i - g * h;
      this.y = e * b + a * h + g * f - d * i;
      this.z = g * b + a * i + d * h - e * f;
      this.w = a * b - d * f - e * h - g * i;
      return this;
    };
    /**
     * Gets the conjugate of the Quat.
     * @public
     * @returns {og.Quat} -
     */


    Quat.prototype.conjugate = function () {
      return new Quat(-this.x, -this.y, -this.z, this.w);
    };
    /** 
     * Computes the inverse of the Quat.
     * @public
     * @returns {og.Quat} -
     */


    Quat.prototype.inverse = function () {
      var n = 1 / this.magnitude2();
      return new Quat(-this.x * n, -this.y * n, -this.z * n, this.w * n);
    };
    /**
     * Computes a magnitude of the Quat.
     * @public
     * @returns {number} -
     */


    Quat.prototype.magnitude = function () {
      var b = this.x,
          c = this.y,
          d = this.z,
          a = this.w;
      return Math.sqrt(b * b + c * c + d * d + a * a);
    };
    /**
     * Computes a squared magnitude of the Quat.
     * @public
     * @returns {number} -
     */


    Quat.prototype.magnitude2 = function () {
      var b = this.x,
          c = this.y,
          d = this.z,
          a = this.w;
      return b * b + c * c + d * d + a * a;
    };
    /**
     * Computes the dot (scalar) product of two Quats.
     * @public
     * @param {og.Quat} q - Second quatrnion.
     * @returns {number} -
     */


    Quat.prototype.dot = function (q) {
      return this.x * q.x + this.y * q.y + this.z * q.z;
    };
    /**
     * Current Quat normalization.
     * @public
     * @returns {og.Quat} -
     */


    Quat.prototype.normalize = function () {
      var c = this.x,
          d = this.y,
          e = this.z,
          g = this.w,
          f = Math.sqrt(c * c + d * d + e * e + g * g);

      if (f === 0.0) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
        return this;
      }

      f = 1 / f;
      this.x = c * f;
      this.y = d * f;
      this.z = e * f;
      this.w = g * f;
      return this;
    };
    /**
     * Compares two Quats.
     * @public
     * @param {og.Quat} q - Second quatrnion.
     * @returns {Boolean} -
     */


    Quat.prototype.isEqual = function (q) {
      var matching = this.dot(q);

      if (Math.abs(matching - 1.0) < 0.001) {
        return true;
      }

      return false;
    };
    /**
     * Performs a spherical linear interpolation between two Quats.
     * @public
     * @param {og.Quat} b - The end rotation Quat.
     * @param {number} t - interpolation amount between the two Quats.
     * @returns {og.Quat} -
     */


    Quat.prototype.slerp = function (b, t) {
      var ax = this.x,
          ay = this.y,
          az = this.z,
          aw = this.w,
          bx = b.x,
          by = b.y,
          bz = b.z,
          bw = b.w;
      var omega, cosom, sinom, scale0, scale1;
      cosom = ax * bx + ay * by + az * bz + aw * bw;

      if (cosom < 0.0) {
        cosom = -cosom;
        bx = -bx;
        by = -by;
        bz = -bz;
        bw = -bw;
      }

      if (1.0 - cosom > 0.000001) {
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
      } else {
        scale0 = 1.0 - t;
        scale1 = t;
      }

      return new Quat(scale0 * ax + scale1 * bx, scale0 * ay + scale1 * by, scale0 * az + scale1 * bz, scale0 * aw + scale1 * bw);
    };
    /**
     * Returns a roll angle in radians.
     * @public
     * @param {Boolean} [reprojectAxis] -
     * @returns {Number} -
     */


    Quat.prototype.getRoll = function (reprojectAxis) {
      var x = this.x,
          y = this.y,
          z = this.z,
          w = this.w;

      if (reprojectAxis) {
        var fTy = 2.0 * y;
        var fTz = 2.0 * z;
        var fTwz = fTz * w;
        var fTxy = fTy * x;
        var fTyy = fTy * y;
        var fTzz = fTz * z;
        return Math.atan2(fTxy + fTwz, 1.0 - (fTyy + fTzz));
      } else {
        return Math.atan2(2 * (x * y + w * z), w * w + x * x - y * y - z * z);
      }
    };
    /**
     * Returns a pitch angle in radians.
     * @public
     * @param {Boolean} [reprojectAxis] -
     * @returns {number} -
     */


    Quat.prototype.getPitch = function (reprojectAxis) {
      var x = this.x,
          y = this.y,
          z = this.z,
          w = this.w;

      if (reprojectAxis) {
        var fTx = 2.0 * x;
        var fTz = 2.0 * z;
        var fTwx = fTx * w;
        var fTxx = fTx * x;
        var fTyz = fTz * y;
        var fTzz = fTz * z;
        return Math.atan2(fTyz + fTwx, 1.0 - (fTxx + fTzz));
      } else {
        return Math.atan2(2 * (y * z + w * x), w * w - x * x - y * y + z * z);
      }
    };
    /**
     * Returns a yaw angle in radians.
     * @public
     * @param {Boolean} [reprojectAxis] -
     * @returns {number} -
     */


    Quat.prototype.getYaw = function (reprojectAxis) {
      var x = this.x,
          y = this.y,
          z = this.z,
          w = this.w;

      if (reprojectAxis) {
        var fTx = 2.0 * x;
        var fTy = 2.0 * y;
        var fTz = 2.0 * z;
        var fTwy = fTy * w;
        var fTxx = fTx * x;
        var fTxz = fTz * x;
        var fTyy = fTy * y;
        return Math.atan2(fTxz + fTwy, 1.0 - (fTxx + fTyy));
      } else {
        return Math.asin(-2 * (x * z - w * y));
      }
    };

    /**
     * @module og/math/Vec3
     */
    /**
     * Class represents a 3d vector.
     * @class
     * @param {number} [x] - First value.
     * @param {number} [y] - Second value.
     * @param {number} [z] - Third value.
     */

    const Vec3 = function (x, y, z) {
      /**
       * @public
       * @type {number}
       */
      this.x = x || 0.0;
      /**
       * @public
       * @type {number}
       */

      this.y = y || 0.0;
      /**
       * @public
       * @type {number}
       */

      this.z = z || 0.0;
    };
    /** @const */


    Vec3.UP = new Vec3(0, 1, 0);
    /** @const */

    Vec3.DOWN = new Vec3(0, -1, 0);
    /** @const */

    Vec3.RIGHT = new Vec3(1, 0, 0);
    /** @const */

    Vec3.LEFT = new Vec3(-1, 0, 0);
    /** @const */

    Vec3.FORWARD = new Vec3(0, 0, -1);
    /** @const */

    Vec3.BACKWARD = new Vec3(0, 0, 1);
    /** @const */

    Vec3.ZERO = new Vec3();
    /** @const */

    Vec3.UNIT_X = new Vec3(1, 0, 0);
    /** @const */

    Vec3.UNIT_Y = new Vec3(0, 1, 0);
    /** @const */

    Vec3.UNIT_Z = new Vec3(0, 0, 1);
    /**
     * Separate 63 bit Vec3 to two Vec3 32 bit float values.
     * @function
     * @param {number} value - Double type value.
     * @param {Vec3} high - Out vector high values.
     * @param {Vec3} low - Out vector low values.
     * @returns {Array.<number,number>} Encoded array.
     */

    Vec3.doubleToTwoFloats = function (v, high, low) {
      let x = v.x,
          y = v.y,
          z = v.z;

      if (x >= 0.0) {
        var doubleHigh = Math.floor(x / 65536.0) * 65536.0;
        high.x = Math.fround(doubleHigh);
        low.x = Math.fround(x - doubleHigh);
      } else {
        var doubleHigh = Math.floor(-x / 65536.0) * 65536.0;
        high.x = Math.fround(-doubleHigh);
        low.x = Math.fround(x + doubleHigh);
      }

      if (y >= 0.0) {
        var doubleHigh = Math.floor(y / 65536.0) * 65536.0;
        high.y = Math.fround(doubleHigh);
        low.y = Math.fround(y - doubleHigh);
      } else {
        var doubleHigh = Math.floor(-y / 65536.0) * 65536.0;
        high.y = Math.fround(-doubleHigh);
        low.y = Math.fround(y + doubleHigh);
      }

      if (z >= 0.0) {
        var doubleHigh = Math.floor(z / 65536.0) * 65536.0;
        high.z = Math.fround(doubleHigh);
        low.z = Math.fround(z - doubleHigh);
      } else {
        var doubleHigh = Math.floor(-z / 65536.0) * 65536.0;
        high.z = Math.fround(-doubleHigh);
        low.z = Math.fround(z + doubleHigh);
      }
    };
    /**
     * Separate 63 bit Vec3 to two Vec3 32 bit float values.
     * @function
     * @param {number} value - Double type value.
     * @param {Float32Array} high - Out vector high values.
     * @param {Float32Array} low - Out vector low values.
     * @returns {Array.<number,number>} Encoded array.
     */


    Vec3.doubleToTwoFloat32Array = function (v, high, low) {
      let x = v.x,
          y = v.y,
          z = v.z;

      if (x >= 0.0) {
        var doubleHigh = Math.floor(x / 65536.0) * 65536.0;
        high[0] = Math.fround(doubleHigh);
        low[0] = Math.fround(x - doubleHigh);
      } else {
        var doubleHigh = Math.floor(-x / 65536.0) * 65536.0;
        high[0] = Math.fround(-doubleHigh);
        low[0] = Math.fround(x + doubleHigh);
      }

      if (y >= 0.0) {
        var doubleHigh = Math.floor(y / 65536.0) * 65536.0;
        high[1] = Math.fround(doubleHigh);
        low[1] = Math.fround(y - doubleHigh);
      } else {
        var doubleHigh = Math.floor(-y / 65536.0) * 65536.0;
        high[1] = Math.fround(-doubleHigh);
        low[1] = Math.fround(y + doubleHigh);
      }

      if (z >= 0.0) {
        var doubleHigh = Math.floor(z / 65536.0) * 65536.0;
        high[2] = Math.fround(doubleHigh);
        low[2] = Math.fround(z - doubleHigh);
      } else {
        var doubleHigh = Math.floor(-z / 65536.0) * 65536.0;
        high[2] = Math.fround(-doubleHigh);
        low[2] = Math.fround(z + doubleHigh);
      }
    };
    /**
     * Creates 3d vector from array.
     * @function
     * @param {Array.<number,number,number>} arr - Input array
     * @returns {og.Vec3} -
     */


    Vec3.fromVec = function (arr) {
      return new Vec3(arr[0], arr[1], arr[2]);
    };
    /**
     * Gets angle between two vectors.
     * @static
     * @param {og.Vec3} a - First vector.
     * @param {og.Vec3} b - Second vector.
     * @returns {number} -
     */


    Vec3.angle = function (a, b) {
      return Math.acos(a.dot(b) / Math.sqrt(a.length2() * b.length2()));
    };
    /**
     * Returns two vectors linear interpolation.
     * @static
     * @param {og.Vec3} v1 - Start vector.
     * @param {og.Vec3} v2 - End vector.
     * @param {number} l - Interpolate value.
     * @returns {og.Vec3} -
     */


    Vec3.lerp = function (v1, v2, l) {
      return Vec3(v1.x + (v2.x - v1.x) * l, v1.y + (v2.y - v1.y) * l, v1.z + (v2.z - v1.z) * l);
    };
    /**
     * Returns summary vector.
     * @static
     * @param {og.Vec3} a - First vector.
     * @param {og.Vec3} b - Second vector.
     * @returns {og.Vec3} - Summary vector.
     */


    Vec3.add = function (a, b) {
      var res = new Vec3(a.x, a.y, a.z);
      res.addA(b);
      return res;
    };
    /**
     * Returns two vectors subtraction.
     * @static
     * @param {og.Vec3} a - First vector.
     * @param {og.Vec3} b - Second vector.
     * @returns {og.Vec3} - Vectors subtraction.
     */


    Vec3.sub = function (a, b) {
      var res = new Vec3(a.x, a.y, a.z);
      res.subA(b);
      return res;
    };
    /**
     * Returns scaled vector.
     * @static
     * @param {og.Vec3} a - Input vector.
     * @param {number} scale - Scale value.
     * @returns {og.Vec3} -
     */


    Vec3.scale = function (a, scale) {
      var res = new Vec3(a.x, a.y, a.z);
      res.scale(scale);
      return res;
    };
    /**
     * Returns two vectors production.
     * @static
     * @param {og.Vec3} a - First vector.
     * @param {og.Vec3} b - Second vector.
     * @returns {og.Vec3} -
     */


    Vec3.mul = function (a, b) {
      var res = new Vec3(a.x, a.y, a.z);
      res.mulA(b);
      return res;
    };
    /**
     * Returns true if two vectors are non collinear.
     * @public
     * @param {og.Vec3} a - First vector.
     * @param {og.Vec3} b - Second vector.
     * @returns {og.Vec3} -
     */


    Vec3.noncollinear = function (a, b) {
      return a.y * b.z - a.z * b.y || a.z * b.x - a.x * b.z || a.x * b.y - a.y * b.z;
    };
    /**
     * Get projection of the vector to plane where n - normal to the plane.
     * @static
     * @param {og.Vec3} b - Vector to project.
     * @param {og.Vec3} n - Plane normal.
    * @param {og.Vec3} [def] - Default value for non existed result.
     * @returns {og.Vec3} -
     */


    Vec3.proj_b_to_plane = function (b, n, def) {
      var res = b.sub(n.scaleTo(n.dot(b) / n.dot(n)));

      if (def && res.isZero()) {
        return new Vec3(def.x, def.y, def.z);
      }

      return res;
    };
    /**
     * Get projection of the first vector to the second.
     * @static
     * @param {og.Vec3} b - First vector.
     * @param {og.Vec3} a - Second vector.
     * @returns {og.Vec3} -
     */


    Vec3.proj_b_to_a = function (b, a) {
      return a.scaleTo(a.dot(b) / a.dot(a));
    };
    /**
     * Makes vectors normalized and orthogonal to each other.
     * Normalizes normal. Normalizes tangent and makes sure it is orthogonal to normal (that is, angle between them is 90 degrees).
     * @static
     * @param {og.Vec3} normal - Normal vector.
     * @param {og.Vec3} tangent - Tangent vector.
     * @returns {og.Vec3} -
     */


    Vec3.orthoNormalize = function (normal, tangent) {
      normal = normal.normal();
      normal.scale(tangent.dot(normal));
      return tangent.subA(normal).normalize();
    };
    /**
     * Returns vector components division product one to another.
     * @static
     * @param {og.Vec3} a - First vector.
     * @param {og.Vec3} b - Second vector.
     * @returns {og.Vec3} -
     */


    Vec3.div = function (a, b) {
      var res = new Vec3(a.x, a.y, a.z);
      res.divA(b);
      return res;
    };
    /**
     * Converts to 4d vector, Fourth value is 1.0.
     * @public
     * @returns {og.Vec4} -
     */


    Vec3.prototype.toVec4 = function () {
      return new Vec4(this.x, this.y, this.z, 1.0);
    };
    /**
     * Returns clone vector.
     * @public
     * @returns {og.Vec3} -
     */


    Vec3.prototype.clone = function () {
      return new Vec3(this.x, this.y, this.z);
    };
    /**
     * Converts vector to text string.
     * @public
     * @returns {string} -
     */


    Vec3.prototype.toString = function () {
      return "(" + this.x + "," + this.y + "," + this.z + ")";
    };
    /**
     * Returns true if vector's values are zero.
     * @public
     * @returns {boolean} -
     */


    Vec3.prototype.isZero = function () {
      return !(this.x || this.y || this.z);
    };
    /**
     * Get projection of the first vector to the second.
     * @static
     * @param {og.Vec3} a - Project vector.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.projToVec = function (a) {
      return a.scaleTo(a.dot(this) / a.dot(a));
    };
    /**
     * Compares with vector. Returns true if it equals another.
     * @public
     * @param {og.Vec3} p - Vector to compare.
     * @returns {boolean} -
     */


    Vec3.prototype.equal = function (p) {
      return this.x === p.x && this.y === p.y && this.z === p.z;
    };
    /**
     * Copy input vector's values.
     * @param {og.Vec3} point3 - Vector to copy.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.copy = function (point3) {
      this.x = point3.x;
      this.y = point3.y;
      this.z = point3.z;
      return this;
    };
    /**
     * Gets vector's length.
     * @public
     * @returns {number} -
     */


    Vec3.prototype.length = function () {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };
    /**
     * Returns squared vector's length.
     * @public
     * @returns {number} -
     */


    Vec3.prototype.length2 = function () {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    };
    /**
     * Converts vector's values to a quaternion object.
     * @public
     * @returns {og.Quat} -
     */


    Vec3.prototype.getQuat = function () {
      return new Quat(this.x, this.y, this.z);
    };
    /**
     * Adds vector to the current.
     * @public
     * @param {og.Vec3} point3 - Point to add.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.addA = function (point3) {
      this.x += point3.x;
      this.y += point3.y;
      this.z += point3.z;
      return this;
    };
    /**
     * Gets two vectors summarization.
     * @public
     * @param {og.Vec3} point3 - Vector to add.
     * @returns {og.Vec3} Returns a sum vector.
     */


    Vec3.prototype.add = function (point3) {
      return new Vec3(this.x + point3.x, this.y + point3.y, this.z + point3.z);
    };
    /**
     * Subtract vector from the current.
     * @public
     * @param {og.Vec3} point3 - Subtract vector.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.subA = function (point3) {
      this.x -= point3.x;
      this.y -= point3.y;
      this.z -= point3.z;
      return this;
    };
    /**
     * Gets vector subtraction.
     * @public
     * @param {og.Vec3} point3 - Subtract vector.
     * @return {og.Vec3} Returns new instance of a subtraction
     */


    Vec3.prototype.sub = function (point3) {
      return new Vec3(this.x - point3.x, this.y - point3.y, this.z - point3.z);
    };
    /**
     * Scale current vector.
     * @public
     * @param {number} scale - Scale value.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.scale = function (scale) {
      this.x *= scale;
      this.y *= scale;
      this.z *= scale;
      return this;
    };
    /**
     * Scale current vector to another instance.
     * @public
     * @param {number} scale - Scale value.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.scaleTo = function (scale) {
      return new Vec3(this.x * scale, this.y * scale, this.z * scale);
    };
    /**
     * Multiply current vector object to another and store result in the current instance.
     * @public
     * @param {og.Vec3} vec - Multiply vector.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.mulA = function (vec) {
      this.x *= vec.x;
      this.y *= vec.y;
      this.z *= vec.z;
      return this;
    };
    /**
     * Multiply current vector object to another and returns new vector instance.
     * @public
     * @param {og.Vec3} vec - Multiply vector.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.mul = function (vec) {
      return new Vec3(this.x * vec.x, this.y * vec.y, this.z * vec.z);
    };
    /**
     * Divide current vector's components to another. Results stores in the current vector object.
     * @public
     * @param {og.Vec3} vec - Div vector.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.divA = function (vec) {
      this.x /= vec.x;
      this.y /= vec.y;
      this.z /= vec.z;
      return this;
    };
    /**
     * Divide current vector's components to another and returns new vector instance.
     * @public
     * @param {og.Vec3} vec - Div vector.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.div = function (vec) {
      return new Vec3(this.x / vec.x, this.y / vec.y, this.z / vec.z);
    };
    /**
     * Gets vectors dot production.
     * @public
     * @param {og.Vec3} point3 - Another vector.
     * @returns {number} -
     */


    Vec3.prototype.dot = function (point3) {
      return point3.x * this.x + point3.y * this.y + point3.z * this.z;
    };
    /**
     * Gets vectors dot production.
     * @public
     * @param {Array.<number,number,number>} arr - Array vector.
     * @returns {number} -
     */


    Vec3.prototype.dotArr = function (arr) {
      return arr[0] * this.x + arr[1] * this.y + arr[2] * this.z;
    };
    /**
     * Gets vectors cross production.
     * @public
     * @param {og.Vec3} point3 - Another vector.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.cross = function (point3) {
      return new Vec3(this.y * point3.z - this.z * point3.y, this.z * point3.x - this.x * point3.z, this.x * point3.y - this.y * point3.x);
    };
    /**
     * Sets vector to zero.
     * @public
     * @returns {og.Vec3} -
     */


    Vec3.prototype.clear = function () {
      this.x = this.y = this.z = 0;
      return this;
    };
    /**
     * Returns normalized vector.
     * @public
     * @returns {og.Vec3} -
     */


    Vec3.prototype.normal = function () {
      var res = new Vec3();
      res.copy(this);
      var length = 1.0 / res.length();
      res.x *= length;
      res.y *= length;
      res.z *= length;
      return res;
    };
    /**
     * Returns normalized negate vector.
     * @public
     * @returns {og.Vec3} -
     */


    Vec3.prototype.normalNegate = function () {
      var res = new Vec3();
      res.copy(this);
      var length = -1.0 / res.length();
      res.x *= length;
      res.y *= length;
      res.z *= length;
      return res;
    };
    /**
     * Returns normalized negate scale vector.
     * @public
     * @returns {og.Vec3} -
     */


    Vec3.prototype.normalNegateScale = function (scale) {
      var res = new Vec3();
      res.copy(this);
      var length = -scale / res.length();
      res.x *= length;
      res.y *= length;
      res.z *= length;
      return res;
    };
    /**
     * Returns normalized scale vector.
     * @public
     * @returns {og.Vec3} -
     */


    Vec3.prototype.normalScale = function (scale) {
      var res = new Vec3();
      res.copy(this);
      var length = scale / res.length();
      res.x *= length;
      res.y *= length;
      res.z *= length;
      return res;
    };
    /**
     * Normalize current vector.
     * @public
     * @returns {og.Vec3} -
     */


    Vec3.prototype.normalize = function () {
      var length = 1.0 / this.length();
      this.x *= length;
      this.y *= length;
      this.z *= length;
      return this;
    };
    /**
     * Converts vector to a number array.
     * @public
     * @returns {Array.<number,number,number>} -
     * @deprecated
     */


    Vec3.prototype.toVec = function () {
      return [this.x, this.y, this.z];
    };
    /**
     * Converts vector to a number array.
     * @public
     * @returns {Array.<number,number,number>} -
     */


    Vec3.prototype.toArray = function () {
      return [this.x, this.y, this.z];
    };
    /**
     * Gets distance to point.
     * @public
     * @param {og.Vec3} point3 - Distant point.
     * @returns {number} -
     */


    Vec3.prototype.distance = function (point3) {
      return Vec3.sub(this, point3).length();
    };
    /**
     * Sets vector's values.
     * @public
     * @param {number} x - Value X.
     * @param {number} y - Value Y.
     * @param {number} z - Value Z.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.set = function (x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    };
    /**
     * Negate current vector.
     * @public
     * @returns {og.Vec3} -
     */


    Vec3.prototype.negate = function () {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
      return this;
    };
    /**
     * Negate current vector to another instance.
     * @public
     * @returns {og.Vec3} -
     */


    Vec3.prototype.negateTo = function () {
      return new Vec3(-this.x, -this.y, -this.z);
    };
    /**
     * Gets projected point coordinates of the current vector on the ray.
     * @public
     * @param {og.Vec3} pos - Ray position.
     * @param {og.Vec3} direction - Ray direction.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.projToRay = function (pos, direction) {
      var v = Vec3.proj_b_to_a(Vec3.sub(this, pos), direction);
      v.addA(pos);
      return v;
    };
    /**
     * Gets angle between two vectors.
     * @public
     * @param {og.Vec3} a - Another vector.
     * @returns {number} -
     */


    Vec3.prototype.angle = function (a) {
      return Vec3.angle(this, a);
    };
    /**
     * Returns two vectors linear interpolation.
     * @public
     * @param {og.Vec3} v2 - End vector.
     * @param {number} l - Interpolate value.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.lerp = function (v2, l) {
      return new Vec3(this.x + (v2.x - this.x) * l, this.y + (v2.y - this.y) * l, this.z + (v2.z - this.z) * l);
    };
    /**
     * Returns vector interpolation by v(t) = v1 * t + v2 * (1 - t)
     * @public
     * @param {og.Vec3} v2 - End vector.
     * @param {number} t - Interpolate value.
     * @returns {og.Vec3} -
     */


    Vec3.prototype.smerp = function (v2, t) {
      var one_d = 1 - t;
      return new Vec3(this.x * t + v2.x * one_d, this.y * t + v2.y * one_d, this.z * t + v2.z * one_d);
    };

    Vec3.LERP_DELTA = 1e-6;
    /**
     * Spherically interpolates between two vectors.
     * Interpolates between current and v2 vector by amount t. The difference between this and linear interpolation (aka, "lerp") is that 
     * the vectors are treated as directions rather than points in space. The direction of the returned vector is interpolated 
     * by the angle and its magnitude is interpolated between the magnitudes of from and to.
     * @public
     * @param {og.Vec3} v2 - 
     * @param {number} t - The parameter t is clamped to the range [0, 1].
     * @returns {og.Vec3} -
     */

    Vec3.prototype.slerp = function (v2, t) {
      var res = new Vec3();

      if (t <= 0.0) {
        res.copy(this);
        return;
      } else if (t >= 1.0) {
        res.copy(v2);
        return;
      }

      var omega, sinom, scale0, scale1;
      var cosom = this.dot(v2);

      if (1.0 - cosom > Vec3.LERP_DELTA) {
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
      } else {
        scale0 = 1.0 - t;
        scale1 = t;
      }

      return Vec3.add(this.scaleTo(scale0), v2.scale(scale1));
    };
    /**
     * Gets the shortest arc quaternion to rotate this vector to the destination vector.
     * @param {Vec3} dest -
     * @param {Vec3} fallbackAxis -
     * @returns {Quat} -
     * @todo: TEST IT!
     */


    Vec3.prototype.getRotationTo = function (dest, fallbackAxis) {
      // Based on Stan Melax's article in Game Programming Gems
      // Copy, since cannot modify local
      let v0 = this.clone();
      let v1 = dest.clone();
      v0.normalize();
      v1.normalize();
      let d = v0.dot(v1); // If dot == 1, vectors are the same

      if (d >= 1.0) {
        return Quat.IDENTITY.clone();
      }

      if (d < 1e-6 - 1.0) {
        if (!fallbackAxis.isEqual(Vec3.ZERO)) {
          // rotate 180 degrees about the fallback axis
          return Quat.axisAngleToQuat(Math.PI, fallbackAxis);
        } else {
          // Generate an axis
          let axis = Vec3.UNIT_X.cross(v0);
          if (axis.isZero()) // pick another if colinear
            axis = Vec3.UNIT_Y.cross(v0);
          axis.normalize();
          return Quat.axisAngleToQuat(Math.PI, axis);
        }
      } else {
        let s = Math.sqrt((1 + d) * 2);
        let invs = 1.0 / s;
        let c = v0.cross(v1);
        let q = new Quat(c.x * invs, c.y * invs, c.z * invs, s * 0.5);
        q.normalise();
        return q;
      }
    };

    /**
     * @module og/math/Vec2
     */
    /**
     * Class represents a 3d vector.
     * @class
     * @param {number} [x] - First value.
     * @param {number} [y] - Second value.
     */

    const Vec2 = function (x, y) {
      /**
       * @public
       * @type {number}
       */
      this.x = x || 0.0;
      /**
       * @public
       * @type {number}
       */

      this.y = y || 0.0;
    };
    /** @const */

    Vec2.UP = new Vec2(0, 1);
    /** @const */

    Vec2.DOWN = new Vec2(0, -1);
    /** @const */

    Vec2.RIGHT = new Vec2(1, 0);
    /** @const */

    Vec2.LEFT = new Vec2(-1, 0);
    /** @const */

    Vec2.ZERO = new Vec2();
    /**
     * Returns summary vector.
     * @static
     * @param {og.math.Vec2} a - First vector.
     * @param {og.math.Vec2} b - Second vector.
     * @returns {og.math.Vec2} - Summary vector.
     */

    Vec2.add = function (a, b) {
      var res = new Vec2(a.x, a.y);
      res.addA(b);
      return res;
    };
    /**
     * Returns two vectors subtraction.
     * @static
     * @param {og.math.Vec2} a - First vector.
     * @param {og.math.Vec2} b - Second vector.
     * @returns {og.math.Vec2} - Vectors subtraction.
     */


    Vec2.sub = function (a, b) {
      var res = new oVec2(a.x, a.y);
      res.subA(b);
      return res;
    };
    /**
     * Returns scaled vector.
     * @static
     * @param {og.math.Vec2} a - Input vector.
     * @param {number} scale - Scale value.
     * @returns {og.math.Vec2}
     */


    Vec2.scale = function (a, scale) {
      var res = new Vec2(a.x, a.y);
      res.scale(scale);
      return res;
    };
    /**
     * Returns two vectors production.
     * @static
     * @param {og.math.Vec2} a - First vector.
     * @param {og.math.Vec2} b - Second vector.
     * @returns {og.math.Vec2}
     */


    Vec2.mul = function (a, b) {
      var res = new Vec2(a.x, a.y);
      res.mulA(b);
      return res;
    };
    /**
     * Returns vector components division product one to another.
     * @static
     * @param {og.math.Vec2} a - First vector.
     * @param {og.math.Vec2} b - Second vector.
     * @returns {og.math.Vec2}
     */


    Vec2.div = function (a, b) {
      var res = new Vec2(a.x, a.y);
      res.divA(b);
      return res;
    };
    /**
     * Get projection of the first vector to the second.
     * @static
     * @param {og.math.Vec2} b - First vector.
     * @param {og.math.Vec2} a - Second vector.
     * @returns {og.math.Vec2}
     */


    Vec2.proj_b_to_a = function (b, a) {
      return a.scaleTo(a.dot(b) / a.dot(a));
    };
    /**
     * Gets angle between two vectors.
     * @static
     * @param {og.math.Vec2} a - First vector.
     * @param {og.math.Vec2} b - Second vector.
     * @returns {number}
     */


    Vec2.angle = function (a, b) {
      return Math.acos(a.dot(b) / Math.sqrt(a.length2() * b.length2()));
    };
    /**
     * Makes vectors normalized and orthogonal to each other.
     * @static
     * @param {og.math.Vec2} normal - Normal vector.
     * @param {og.math.Vec2} tangent - Tangent vector.
     * @returns {og.math.Vec2}
     */


    Vec2.orthoNormalize = function (normal, tangent) {
      normal = normal.norm();
      normal.scale(tangent.dot(normal));
      return tangent.sub(normal).normalize();
    };
    /**
     * Converts to 3d vector, third value is 0.0.
     * @public
     * @returns {og.Vec3}
     */


    Vec2.prototype.toVector3 = function () {
      return new Vec3(this.x, this.y, 0);
    };
    /**
     * Returns clone vector.
     * @public
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.clone = function () {
      return new Vec2(this.x, this.y);
    };
    /**
     * Compares with vector. Returns true if it equals another.
     * @public
     * @param {og.math.Vec2} p - Vector to compare.
     * @returns {boolean}
     */


    Vec2.prototype.equal = function (p) {
      return this.x === p.x && this.y === p.y;
    };
    /**
     * Copy input vector's values.
     * @param {og.math.Vec2} point2 - Vector to copy.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.copy = function (point2) {
      this.x = point2.x;
      this.y = point2.y;
      return this;
    };
    /**
     * Gets vector's length.
     * @public
     * @returns {number}
     */


    Vec2.prototype.length = function () {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    /**
     * Returns squared vector's length.
     * @public
     * @returns {number}
     */


    Vec2.prototype.length2 = function () {
      return this.x * this.x + this.y * this.y;
    };
    /**
     * Adds vector to the current.
     * @public
     * @param {og.math.Vec2}
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.addA = function (v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    };
    /**
     * Summarize two vectors.
     * @public
     * @param {og.math.Vec2}
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.add = function (v) {
      return new Vec2(this.x + v.x, this.y + v.y);
    };
    /**
     * Subtract vector from the current where results saved on the current instance.
     * @public
     * @param {og.math.Vec2} v - Subtract vector.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.subA = function (v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    };
    /**
     * Subtract vector from the current.
     * @public
     * @param {og.math.Vec2} v - Subtract vector.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.sub = function (v) {
      return new Vec2(this.x - v.x, this.y - v.y);
    };
    /**
     * Scale current vector.
     * @public
     * @param {number} scale - Scale value.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.scale = function (scale) {
      this.x *= scale;
      this.y *= scale;
      return this;
    };
    /**
     * Scale current vector to another instance.
     * @public
     * @param {number} scale - Scale value.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.scaleTo = function (scale) {
      return new Vec2(this.x * scale, this.y * scale);
    };
    /**
     * Multiply current vector object to another and store result in the current instance.
     * @public
     * @param {og.math.Vec2} vec - Multiply vector.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.mulA = function (vec) {
      this.x *= vec.x;
      this.y *= vec.y;
      return this;
    };
    /**
     * Multiply current vector object to another and returns new vector instance.
     * @public
     * @param {og.math.Vec2} vec - Multiply vector.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.mul = function (vec) {
      return new Vec2(this.x * vec.x, this.y * vec.y);
    };
    /**
     * Divide current vector's components to another. Results stores in the current vector object.
     * @public
     * @param {og.math.Vec2}
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.divA = function (vec) {
      this.x /= vec.x;
      this.y /= vec.y;
      return this;
    };
    /**
     * Gets vectors dot production.
     * @public
     * @param {og.math.Vec2} v - Another vector.
     * @returns {number}
     */


    Vec2.prototype.dot = function (v) {
      return v.x * this.x + v.y * this.y;
    };
    /**
     * Gets vectors dot production.
     * @public
     * @param {Array.<number,number>} arr - Array vector.
     * @returns {number}
     */


    Vec2.prototype.dotArr = function (arr) {
      return arr[0] * this.x + arr[1] * this.y;
    };
    /**
     * Gets vectors cross production.
     * @public
     * @param {og.math.Vec2} v - Another vector.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.cross = function (v) {
      return this.x * v.y - this.y * v.x;
    };
    /**
     * Sets vector to zero.
     * @public
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.clear = function () {
      this.x = this.y = 0;
      return this;
    };
    /**
     * Returns normalized vector.
     * @public
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.normal = function () {
      var res = new Vec2();
      res.copy(this);
      var length = 1.0 / res.length();
      res.x *= length;
      res.y *= length;
      return res;
    };
    /**
     * Normalize current vector.
     * @public
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.normalize = function () {
      var length = 1.0 / this.length();
      this.x *= length;
      this.y *= length;
      return this;
    };
    /**
     * Converts vector to a number array.
     * @public
     * @returns {Array.<number,number>}
     */


    Vec2.prototype.toVec = function () {
      return [this.x, this.y];
    };
    /**
     * Gets distance to point.
     * @public
     * @param {og.math.Vec2} p - Distant point.
     * @returns {number}
     */


    Vec2.prototype.distance = function (p) {
      var vec = Vec2.sub(this, p);
      return vec.length();
    };
    /**
     * Sets vector's values.
     * @public
     * @param {number} x - Value X.
     * @param {number} y - Value Y.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.set = function (x, y) {
      this.x = x;
      this.y = y;
      return this;
    };
    /**
     * Negate current vector.
     * @public
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.negate = function () {
      this.x = -this.x;
      this.y = -this.y;
      return this;
    };
    /**
     * Negate current vector to another instance.
     * @public
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.negateTo = function () {
      return new Vec2(-this.x, -this.y);
    };
    /**
     * Gets projected point coordinates of the current vector on the ray.
     * @public
     * @param {og.math.Vec2} pos - Ray position.
     * @param {og.math.Vec2} direction - Ray direction.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.projToRay = function (pos, direction) {
      var v = Vec2.proj_b_to_a(Vec2.sub(this, pos), direction);
      v.add(pos);
      return v;
    };
    /**
     * Gets angle between two vectors.
     * @public
     * @param {og.math.Vec2} a - Another vector.
     * @returns {number}
     */


    Vec2.prototype.angle = function (a) {
      return Vec2.angle(this, a);
    };
    /**
     * Returns two vectors linear interpolation.
     * @public
     * @param {og.math.Vec2} v2 - End vector.
     * @param {number} l - Interpolate value.
     * @returns {og.math.Vec2}
     */


    Vec2.prototype.lerp = function (v1, v2, l) {
      var res = Vec2.clone(this);

      if (l <= 0.0) {
        res.copy(v1);
      } else if (l >= 1.0) {
        res.copy(v2);
      } else {
        res = Vec2.add(v1, Vec2.sub(v2, v1).scale(l));
      }

      return res;
    };

    Vec2.LERP_DELTA = 1e-6;
    /**
     * Spherically interpolates between two vectors.
     * Interpolates between current and v2 vector by amount t. The difference between this and linear interpolation (aka, "lerp") is that 
     * the vectors are treated as directions rather than points in space. The direction of the returned vector is interpolated 
     * by the angle and its magnitude is interpolated between the magnitudes of from and to.
     * @public
     * @param {og.math.Vec2} v2 - 
     * @param {number} t - The parameter t is clamped to the range [0, 1].
     * @returns {og.math.Vec2}
     */

    Vec2.prototype.slerp = function (v2, t) {
      var res = new Vec2();

      if (t <= 0.0) {
        res.copy(this);
        return;
      } else if (t >= 1.0) {
        res.copy(v2);
        return;
      }

      var omega, sinom, scale0, scale1;
      var cosom = this.dot(v2);

      if (1.0 - cosom > Vec2.LERP_DELTA) {
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
      } else {
        scale0 = 1.0 - t;
        scale1 = t;
      }

      return Vec2.add(this.scale(scale0), v2.scale(scale1));
    };

    /**
     * @module og/utils/shared
     */

    if (!('createImageBitmap' in window)) {
      window.createImageBitmap = function (blob) {
        return new Promise((resolve, reject) => {
          let img = document.createElement('img');
          img.addEventListener('load', function () {
            resolve(this);
          });
          img.src = URL.createObjectURL(blob);
        });
      };
    }
    function isEmpty(v) {
      return v == null;
    }
    let _stampCounter = 0;
    function stamp(obj) {
      var stamp = obj._openglobus_id;

      if (!stamp) {
        stamp = obj._openglobus_id = ++_stampCounter;
      }

      return stamp;
    }
    /**
     * Finds an item in a sorted array.
     * @param {Array} ar The sorted array to search.
     * @param {Object} el The item to find in the array.
     * @param {og.utils.binarySearch~compare_fn} compare_fn comparator The function to use to compare the item to
     *        elements in the array.
     * @returns {Number} a negative number  if a is less than b; 0 if a is equal to b;a positive number of a is greater than b.
     *
     * @example
     * // Create a comparator function to search through an array of numbers.
     * function comparator(a, b) {
     *     return a - b;
     * };
     * var numbers = [0, 2, 4, 6, 8];
     * var index = og.utils.binarySearch(numbers, 6, comparator); // 3
     */

    function binarySearch(ar, el, compare_fn) {
      var m = 0;
      var n = ar.length - 1;

      while (m <= n) {
        var k = n + m >> 1;
        var cmp = compare_fn(el, ar[k], k);

        if (cmp > 0) {
          m = k + 1;
        } else if (cmp < 0) {
          n = k - 1;
        } else {
          return k;
        }
      }

      return -m - 1;
    }
    /**
     * Binary insertion that uses binarySearch algorithm.
     * @param {Array} ar - The sorted array to insert.
     * @param {Object} el - The item to insert.
     * @param {og.utils.binarySearch~compare_fn} compare_fn - comparator The function to use to compare the item to
     *        elements in the array.
     * @returns {Number} Array index position in which item inserted in.
     */

    function binaryInsert(ar, el, compare_fn) {
      var i = binarySearch(ar, el, compare_fn);

      if (i < 0) {
        i = ~i;
      }

      ar.splice(i, 0, el);
      return i;
    }

    /**
     * @module og/Events
     */
    /**
     * Base events class to handle custom events.
     * @class
     * @param {Array.<string>} [eventNames] - Event names that could be dispatched.
     */

    class Events {
      constructor(eventNames, sender) {
        /**
         * Registered event names.
         * @protected
         * @type {Array.<string>}
         */
        this._eventNames = [];
        eventNames && this.registerNames(eventNames);
        this._sender = sender || this;
        /**
         * Stop propagation flag
         * @protected
         * @type {boolean}
         */

        this._stopPropagation = false;
        this._stampCache = {};
        this.__id = Events._staticCounter++;
      }

      static get _staticCounter() {
        if (!this.__counter__ && this.__counter__ !== 0) {
          this.__counter__ = 0;
        }

        return this.__counter__;
      }

      static set _staticCounter(n) {
        this.__counter__ = n;
      }

      bindSender(sender) {
        this._sender = sender || this;
      }
      /**
       * Function that creates event object properties that would be dispatched.
       * @public
       * @param {Array.<string>} eventNames - Specified event names list.
       */


      registerNames(eventNames) {
        for (var i = 0; i < eventNames.length; i++) {
          this[eventNames[i]] = {
            "active": true,
            "handlers": []
          };

          this._eventNames.push(eventNames[i]);
        }
      }

      _getStamp(name, id, ogid) {
        return `${name}_${id}_${ogid}`;
      }
      /**
       * Returns true if event callback has stamped.
       * @protected
       * @param {Object} name - Event identifier.
       * @param {Object} obj - Event callback.
       * @return {boolean} -
       */


      _stamp(name, obj) {
        var ogid = stamp(obj);

        var st = this._getStamp(name, this.__id, ogid); //name + "_" + this.__id + "_" + ogid;


        if (!this._stampCache[st]) {
          this._stampCache[st] = ogid;
          return true;
        }

        return false;
      }
      /**
       * Attach listener.
       * @public
       * @param {string} name - Event name to listen.
       * @param {eventCallback} callback - Event callback function.
       * @param {Object} sender - Event callback function owner. 
       */


      on(name, callback, sender, priority = 0) {
        if (this._stamp(name, callback)) {
          if (this[name]) {
            let c = callback.bind(sender || this._sender);
            c._openglobus_id = callback._openglobus_id;
            c._openglobus_priority = priority;
            binaryInsert(this[name].handlers, c, (a, b) => {
              return b._openglobus_priority - a._openglobus_priority;
            }); //this[name].handlers.unshift(c);
          }
        }
      }
      /**
       * Stop listening event name with specified callback function.
       * @public
       * @param {string} name - Event name.
       * @param {eventCallback} callback - Attached  event callback.
       */


      off(name, callback) {
        if (callback) {
          var st = this._getStamp(name, this.__id, callback._openglobus_id); //name + "_" + this.__id + "_" + callback._openglobus_id;


          if (callback._openglobus_id && this._stampCache[st]) {
            var h = this[name].handlers;
            var i = h.length;
            var indexToRemove = -1;

            while (i--) {
              var hi = h[i];

              if (hi._openglobus_id === callback._openglobus_id) {
                indexToRemove = i;
                break;
              }
            }

            if (indexToRemove !== -1) {
              h.splice(indexToRemove, 1);
              this._stampCache[st] = undefined;
              delete this._stampCache[st];
            }
          }
        }
      }
      /**
       * Dispatch event.
       * @public
       * @param {Object} event - Event instance property that created by event name.
       * @param {Object} [obj] - Event object.
       */


      dispatch(event, ...args) {
        if (event && event.active) {
          var h = event.handlers;
          var i = h.length;

          while (i-- && !this._stopPropagation) {
            h[i](...args);
          }
        }

        this._stopPropagation = false;
      }
      /**
       * Brakes events propagation.
       * @public
       */


      stopPropagation() {
        this._stopPropagation = true;
      }
      /**
       * Removes all events.
       * @public
       */


      clear() {
        for (var i = 0; i < this._eventNames.length; i++) {
          var e = this[this._eventNames[i]];
          e.handlers.length = 0;
          e.handlers = [];
        }

        this._eventNames.length = 0;
        this._eventNames = [];
      }

    }

    /**
     * @module og/astro/jd
     */
    /**
     * Seconds in millisecond.
     * @const
     * @default
     */

    const SECONDS_PER_MILLISECOND = 0.001;
    /**
     * Milliseconds in second.
     * @const
     * @default
     */

    const MILLISECONDS_PER_SECOND = 1000.0;
    /**
     * Seconds in minute.
     * @const
     * @default
     */

    const SECONDS_PER_MINUTE = 60.0;
    /**
     * One by seconds in minute.
     * @const
     * @default
     */

    const ONE_BY_SECONDS_PER_MINUTE = 1.0 / SECONDS_PER_MINUTE;
    /**
     * Seconds in hour.
     * @const
     * @default
     */

    const SECONDS_PER_HOUR = 3600.0;
    /**
     * One by seconds in hour.
     * @const
     * @default
     */

    const ONE_BY_SECONDS_PER_HOUR = 1.0 / SECONDS_PER_HOUR;
    /**
     * Seconds in 12 hours.
     * @const
     * @default
     */

    const SECONDS_PER_12_HOURS = 12.0 * SECONDS_PER_HOUR;
    /**
     * Seconds in day.
     * @const
     * @default
     */

    const SECONDS_PER_DAY = 86400.0;
    /**
     * Milliseconds in day.
     * @const
     * @default
     */

    const MILLISECONDS_PER_DAY = 86400000.0;
    /**
     * One by milliseconds in day.
     * @const
     * @default
     */

    const ONE_BY_MILLISECONDS_PER_DAY = 1.0 / MILLISECONDS_PER_DAY;
    /**
     * One by seconds in day.
     * @const
     * @default
     */

    const ONE_BY_SECONDS_PER_DAY = 1.0 / SECONDS_PER_DAY;
    /**
     * Julian date of 2000 year. Epoch.
     * @const
     * @default
     */

    const J2000 = 2451545.0;
    /**
     * Gets the date's julian day.
     * @param {number} year - Year.
     * @param {number} month - Month.
     * @param {number} day - Day.
     * @returns {Number} Day number
     */

    function getDayNumber(year, month, day) {
      var a = (month - 14) / 12 | 0;
      var b = year + 4800 + a;
      return (1461 * b / 4 | 0) + (367 * (month - 2 - 12 * a) / 12 | 0) - (3 * ((b + 100) / 100 | 0) / 4 | 0) + day - 32075;
    }
    /**
     * Converts javascript date to the universal(UTC) julian date.
     * @param {Date} date - Date.
     * @returns {number} UTC julian date
     */

    function DateToUTC(date) {
      var dayNumber = getDayNumber(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
      var hour = date.getUTCHours() - 12;

      if (hour < 0) {
        hour += 24;
      }

      var secondsOfDay = date.getUTCSeconds() + hour * SECONDS_PER_HOUR + date.getUTCMinutes() * SECONDS_PER_MINUTE + date.getUTCMilliseconds() * SECONDS_PER_MILLISECOND;

      if (secondsOfDay >= SECONDS_PER_12_HOURS) {
        dayNumber--;
      }

      var extraDays = secondsOfDay * ONE_BY_SECONDS_PER_DAY | 0;
      dayNumber += extraDays;
      secondsOfDay -= SECONDS_PER_DAY * extraDays;

      if (secondsOfDay < 0) {
        dayNumber--;
        secondsOfDay += SECONDS_PER_DAY;
      }

      return dayNumber + secondsOfDay * ONE_BY_SECONDS_PER_DAY;
    }
    /**
     * Converts coordinated universal(UTC) julian date to atomic(TAI) julian date.
     * @param {number} jd - UTC julian date.
     * @returns {number} TAI julian date
     */

    function UTCtoTAI(jd) {
      var leapSeconds = leapSecondsTable;
      var index = binarySearch(leapSeconds, jd, function (a, b) {
        return a - b.jd;
      });

      if (index < 0) {
        index = ~index;
      }

      if (index >= leapSeconds.length) {
        index = leapSeconds.length - 1;
      }

      var offset = leapSeconds[index].leapSeconds;

      if (index !== 0) {
        if ((leapSeconds[index].jd - jd) * SECONDS_PER_DAY > offset) {
          offset = leapSeconds[index - 1].leapSeconds;
        }
      }

      return jd + offset * ONE_BY_SECONDS_PER_DAY;
    }
    /**
     * Converts UTC julian date to the javascript date object.
     * @param {number} utc - UTC julian date.
     * @returns {Date} JavaScript Date object
     */

    function UTCtoDate(utc) {
      var julianDayNumber = utc | 0;
      var secondsOfDay = (utc - julianDayNumber) * SECONDS_PER_DAY;

      if (secondsOfDay >= SECONDS_PER_12_HOURS) {
        julianDayNumber++;
      }

      var L = julianDayNumber + 68569 | 0;
      var N = 4 * L / 146097 | 0;
      L = L - ((146097 * N + 3) / 4 | 0) | 0;
      var I = 4000 * (L + 1) / 1461001 | 0;
      L = L - (1461 * I / 4 | 0) + 31 | 0;
      var J = 80 * L / 2447 | 0;
      var day = L - (2447 * J / 80 | 0) | 0;
      L = J / 11 | 0;
      var month = J + 2 - 12 * L | 0;
      var year = 100 * (N - 49) + I + L | 0;
      var hour = secondsOfDay * ONE_BY_SECONDS_PER_HOUR | 0;
      var remainingSeconds = secondsOfDay - hour * SECONDS_PER_HOUR;
      var minute = remainingSeconds * ONE_BY_SECONDS_PER_MINUTE | 0;
      remainingSeconds = remainingSeconds - minute * SECONDS_PER_MINUTE;
      var second = remainingSeconds | 0;
      var millisecond = (remainingSeconds - second) * MILLISECONDS_PER_SECOND | 0;
      hour += 12;

      if (hour > 23) {
        hour -= 24;
      }

      return new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
    }
    /**
     * Adds milliseconds to the julian date.
     * @param {number} jd - Julian date.
     * @param {number} milliseconds - Milliseconds to add.
     * @returns {number} Julian date
     */

    function addMilliseconds(jd, milliseconds) {
      return jd + milliseconds * ONE_BY_MILLISECONDS_PER_DAY;
    }

    function __ls(jd, leapSeconds) {
      return {
        "jd": jd,
        "leapSeconds": leapSeconds
      };
    }
    const leapSecondsTable = [__ls(2441317.5, 10.0), // 1972-01-01T00:00:00.000Z
    __ls(2441499.5, 11.0), // 1972-07-01T00:00:00.000Z
    __ls(2441683.5, 12.0), // 1973-01-01T00:00:00.000Z
    __ls(2442048.5, 13.0), // 1974-01-01T00:00:00.000Z
    __ls(2442413.5, 14.0), // 1975-01-01T00:00:00.000Z
    __ls(2442778.5, 15.0), // 1976-01-01T00:00:00.000Z
    __ls(2443144.5, 16.0), // 1977-01-01T00:00:00.000Z
    __ls(2443509.5, 17.0), // 1978-01-01T00:00:00.000Z
    __ls(2443874.5, 18.0), // 1979-01-01T00:00:00.000Z
    __ls(2444239.5, 19.0), // 1980-01-01T00:00:00.000Z
    __ls(2444786.5, 20.0), // 1981-07-01T00:00:00.000Z
    __ls(2445151.5, 21.0), // 1982-07-01T00:00:00.000Z
    __ls(2445516.5, 22.0), // 1983-01-01T00:00:00.000Z
    __ls(2446247.5, 23.0), // 1985-07-01T00:00:00.000Z
    __ls(2447161.5, 24.0), // 1988-01-01T00:00:00.000Z
    __ls(2447892.5, 25.0), // 1990-01-01T00:00:00.000Z
    __ls(2448257.5, 26.0), // 1991-01-01T00:00:00.000Z
    __ls(2448804.5, 27.0), // 1992-07-01T00:00:00.000Z
    __ls(2449169.5, 28.0), // 1993-07-01T00:00:00.000Z
    __ls(2449534.5, 29.0), // 1994-07-01T00:00:00.000Z
    __ls(2450083.5, 30.0), // 1996-01-01T00:00:00.000Z
    __ls(2450630.5, 31.0), // 1997-07-01T00:00:00.000Z
    __ls(2451179.5, 32.0), // 1999-01-01T00:00:00.000Z
    __ls(2453736.5, 33.0), // 2006-01-01T00:00:00.000Z
    __ls(2454832.5, 34.0), // 2009-01-01T00:00:00.000Z
    __ls(2456109.5, 35.0), // 2012-07-01T00:00:00.000Z
    __ls(2457204.5, 36.0) // 2015-07-01T00:00:00.000Z
    ];
    UTCtoTAI(J2000);

    /**
     * @module og/Clock
     */
    /**
     * Class represents application timer that stores custom current julian datetime, and time speed multiplier.
     * @class
     * @param {Object} [params]: - Clock parameters:
     * @param {number} [params.startDate=0.0] - Julian start date.
     * @param {number} [params.endDate=0.0] - Julian end date.
     * @param {number} [params.currentDate] - Julian current date. Default: current date.
     * @param {number} [params.multiplier=1.0] - Time speed multiolier.
     */

    class Clock {
      static get _staticCounter() {
        if (!this._counter && this._counter !== 0) {
          this._counter = 0;
        }

        return this._counter;
      }

      static set _staticCounter(n) {
        this._counter = n;
      }

      constructor(params) {
        params = params || {};
        this._id = Clock._staticCounter++;
        /**
         * Clock name.
         * @public
         * @type {string}
         */

        this.name = params.name || "";
        /**
         * Clock events.
         * @public
         * @type {Events}
         */

        this.events = new Events(["tick", "end"], this);
        /**
         * Start julian date clock loop.
         * @public
         * @type {number}
         */

        this.startDate = params.startDate || 0;
        /**
         * End julian date clock loop.
         * @public
         * @type {number}
         */

        this.endDate = params.endDate || 0;
        var currentDate = params.currentDate || DateToUTC(new Date());

        if (params.startDate && currentDate < params.startDate) {
          currentDate = params.startDate;
        }

        if (params.endDate && currentDate > params.endDate) {
          currentDate = params.endDate;
        }
        /**
         * Current julian datetime.
         * @public
         * @type {number}
         */


        this.currentDate = currentDate;
        /**
         * Timer speed multiplier.
         * @public
         * @type {number}
         */

        this.multiplier = params.multiplier !== undefined ? params.multiplier : 1.0;
        /**
         * Animation frame delta time.
         * @public
         * @readonly
         * @type {number}
         */

        this.deltaTicks = 0;
        /**
         * Timer activity.
         * @public
         * @type {boolean}
         */

        this.active = true;
        this._intervalDelay = 0;
        this._intervalStart = 0;
        this._intervalCallback = null;
      }

      clearInterval() {
        this._intervalDelay = 0;
        this._intervalStart = 0;
        this._intervalCallback = null;
      }

      setInterval(delay, callback) {
        this._intervalStart = this.currentDate;
        this._intervalDelay = delay * ONE_BY_MILLISECONDS_PER_DAY;
        this._intervalCallback = callback;
      }
      /**
       * Sets current clock datetime.
       * @public
       * @param {Object} date - JavaScript Date object.
       */


      setDate(date) {
        var d = DateToUTC(date);

        if (this.startDate && d < this.startDate) {
          d = this.startDate;
        }

        if (this.endDate && d > this.endDate) {
          d = this.endDate;
        }

        this.currentDate = d;
      }
      /**
       * Returns current application date.
       * @public
       * @returns {Date} - Current date.
       */


      getDate() {
        return UTCtoDate(this.currentDate);
      }

      reset() {
        if (this.startDate) {
          this.currentDate = this.startDate;
        }
      }

      _tick(dt) {
        this.deltaTicks = dt * this.multiplier;

        if (this.active) {
          var cd = addMilliseconds(this.currentDate, this.deltaTicks);

          if (this.multiplier > 0) {
            if (this.endDate && cd > this.endDate) {
              this.currentDate = this.startDate;
              this.events.dispatch(this.events.end, this);
            } else {
              this.currentDate = cd;
            }
          } else {
            if (this.startDate && cd < this.startDate) {
              this.currentDate = this.endDate;
              this.events.dispatch(this.events.end, this);
            } else {
              this.currentDate = cd;
            }
          }

          if (this._intervalCallback) {
            if (this.currentDate - this._intervalStart >= this._intervalDelay) {
              this._intervalStart = this.currentDate;

              this._intervalCallback(this);
            }
          }

          this.events.dispatch(this.events.tick, this);
        }
      }
      /**
       * @public
       * @param {Clock} clock - Clock instance to compare.
       * @returns {boolean} - Returns true if a clock is the same instance.
       */


      equal(clock) {
        return this._id === clock._id;
      }

    }

    /**
     * This is shader program controller that used by hadler object to access the shader 
     * program capabilities, like switching program during the rendering.
     * Get access to the program from ...handler.programs.<program name> etc.
     * @class
     * @param {og.webgl.Handler} handler - Handler.
     * @param {og.webgl.Program} program - Shader program.
     */

    const ProgramController = function (handler, program) {
      /**
       * Shader program.
       * @private
       * @type {og.webgl.Program}
       */
      this._program = program;
      /**
       * Handler.
       * @private
       * @type {og.webgl.Handler}
       */

      this._handler = handler;
      /**
       * Program current frame activation flag.
       * @private
       * @type {boolean}
       */

      this._activated = false;
    };
    /**
     * Lazy create program call.
     * @public
     */


    ProgramController.prototype.initialize = function () {
      this._program.createProgram(this._handler.gl);
    };
    /**
     * Returns controller's shader program.
     * @public
     * @return {og.webgl.Program} -
     */


    ProgramController.prototype.getProgram = function () {
      return this._program;
    };
    /**
     * Activates current shader program.
     * @public
     * @returns {ProgramController} -
     */


    ProgramController.prototype.activate = function () {
      if (!this._activated) {
        this._handler.activeProgram.deactivate();

        this._handler.activeProgram = this;
        var p = this._program;
        this._activated = true;
        p.enableAttribArrays();
        p.use();
      }

      return this;
    };
    /**
     * Remove program from handler
     * @public
     */


    ProgramController.prototype.remove = function () {
      var p = this._handler.programs;

      if (p[this._program.name]) {
        if (this._activated) {
          this.deactivate();
        }

        this._program.delete();

        p[this._program.name] = null;
        delete p[this._program.name];
      }
    };
    /**
     * Deactivate shader program. This is not necessary while activae function used.
     * @public
     */


    ProgramController.prototype.deactivate = function () {
      this._program.disableAttribArrays();

      this._activated = false;
    };
    /**
     * Returns program activity.
     * @public
     * @return {boolean} -
     */


    ProgramController.prototype.isActive = function () {
      return this._activated;
    };
    /**
     * Sets program uniforms and attributes values and return controller instance.
     * @public
     * @param {Object} params - Object with variable name and value like { value: 12, someArray:[1,2,3], uSampler: texture,... }
     * @return {og.webgl.ProgramController} -
     */


    ProgramController.prototype.set = function (params) {
      this.activate();

      this._program.set(params);

      return this;
    };
    /**
     * Draw index buffer with this program.
     * @public
     * @param {number} mode - Gl draw mode
     * @param {WEBGLBuffer} buffer - Buffer to draw.
     * @return {og.webgl.ProgramController} Returns current shader controller instance.
     */


    ProgramController.prototype.drawIndexBuffer = function (mode, buffer) {
      this._program.drawIndexBuffer(mode, buffer);

      return this;
    };
    /**
     * Calls Gl drawArray function.
     * @param {number} mode - Gl draw mode.
     * @param {number} numItems - draw items count.
     * @return {og.webgl.ProgramController} Returns current shader controller instance.
     */


    ProgramController.prototype.drawArrays = function (mode, numItems) {
      this._program.drawArrays(mode, numItems);

      return this;
    };

    /**
     * @module og/Stack
     */

    class Node$1 {
      constructor() {
        this.next = null;
        this.prev = null;
        this.data = null;
      }

    }

    class Stack {
      constructor(size = 256) {
        this._current = new Node$1();
        this._head = this._current;

        for (var i = 0; i < size; i++) {
          var n = new Node$1();
          n.prev = this._current;
          this._current.next = n;
          this._current = n;
        }

        this._current = this._head;
      }

      current() {
        return this._current;
      }

      push(data) {
        this._current = this._current.next;
        this._current.data = data;
      }

      pop(data) {
        this._current = this._current.prev;
        return this._current.next.data;
      }

      popPrev(data) {
        this._current = this._current.prev;
        return this._current.data;
      }

    }

    /**
     * @module og/webgl/Handler
     */
    /**
     * Maximum texture image size.
     * @const
     * @type {number}
     */

    const MAX_SIZE = 4096;
    const vendorPrefixes = ["", "WEBKIT_", "MOZ_"];
    /**
     * A WebGL handler for accessing low-level WebGL capabilities.
     * @class
     * @param {string} id - Canvas element id that WebGL handler assing with. If it's null
     * or undefined creates hidden canvas and handler bacomes hidden.
     * @param {Object} [params] - Handler options:
     * @param {number} [params.anisotropy] - Anisitropy filter degree. 8 is default.
     * @param {number} [params.width] - Hidden handler width. 256 is default.
     * @param {number} [params.height] - Hidden handler height. 256 is default.
     * @param {Object} [param.scontext] - Native WebGL context attributes. See https://www.khronos.org/registry/webgl/specs/latest/1.0/#WEBGLCONTEXTATTRIBUTES
     * @param {Array.<string>} [params.extensions] - Additional WebGL extension list. Available by default: EXT_texture_filter_anisotropic.
     */

    const Handler = function (id, params) {
      params = params || {};
      /**
       * Application default timer.
       * @public
       * @type {og.Clock}
       */

      this.defaultClock = new Clock();
      /**
       * Custom timers.
       * @protected
       * @type{og.Clock[]}
       */

      this._clocks = [];
      /**
       * Draw frame time in milliseconds.
       * @public
       * @readonly
       * @type {number}
       */

      this.deltaTime = 0;
      /**
       * WebGL rendering canvas element.
       * @public
       * @type {Object}
       */

      this.canvas = null;
      /**
       * WebGL context.
       * @public
       * @type {Object}
       */

      this.gl = null;
      /**
       * Shader program controller list.
       * @public
       * @type {Object.<og.webgl.ProgramController>}
       */

      this.programs = {};
      /**
       * Current active shader program controller.
       * @public
       * @type {og.webgl.ProgramController}
       */

      this.activeProgram = null;
      /**
       * Handler parameters.
       * @private
       * @type {Object}
       */

      this._params = params || {};
      this._params.anisotropy = this._params.anisotropy || 8;
      var w = this._params.width;

      if (w > MAX_SIZE) {
        w = MAX_SIZE;
      }

      this._params.width = w || 256;
      var h = this._params.height;

      if (h > MAX_SIZE) {
        h = MAX_SIZE;
      }

      this._params.height = h || 256;
      this._params.context = this._params.context || {};
      this._params.extensions = this._params.extensions || [];
      this._oneByHeight = 1 / this._params.height;
      /**
       * Current WebGL extensions. Becomes here after context initialization.
       * @public
       * @type {Object}
       */

      this.extensions = {};
      /**
       * HTML Canvas object id.
       * @private
       * @type {Object}
       */

      this._id = id;
      this._lastAnimationFrameTime = 0;
      this._initialized = false;
      /**
       * Animation frame function assigned from outside(Ex. from Renderer).
       * @private
       * @type {frameCallback}
       */

      this._frameCallback = function () {};

      this.transparentTexture = null;
      this.framebufferStack = new Stack();

      if (params.autoActivate || isEmpty(params.autoActivate)) {
        this.initialize();
      }
    };
    /**
     * The return value is null if the extension is not supported, or an extension object otherwise.
     * @param {Object} gl - WebGl context pointer.
     * @param {String} name - Extension name.
     * @returns {Object} -
     */


    Handler.getExtension = function (gl, name) {
      var i, ext;

      for (i in vendorPrefixes) {
        ext = gl.getExtension(vendorPrefixes[i] + name);

        if (ext) {
          return ext;
        }
      }

      return null;
    };

    const CONTEXT_TYPE = ["webgl2", "webgl"];
    /**
     * Returns a drawing context on the canvas, or null if the context identifier is not supported.
     * @param {Object} canvas - HTML canvas object.
     * @param {Object} [contextAttributes] - See canvas.getContext contextAttributes.
     * @returns {Object} -
     */

    Handler.getContext = function (canvas, contextAttributes) {
      var ctx = null;

      try {
        for (let i = 0; i < CONTEXT_TYPE.length; i++) {
          ctx = canvas.getContext(CONTEXT_TYPE[i], contextAttributes);

          if (ctx) {
            ctx.type = CONTEXT_TYPE[i];
            break;
          }
        }
      } catch (ex) {
        console.log("exception during the GL context initialization");
      }

      if (!ctx) {
        console.log("could not initialise WebGL");
      }

      return ctx;
    };
    /**
     * Sets animation frame function.
     * @public
     * @param {callback} callback - Frame callback.
     */


    Handler.prototype.setFrameCallback = function (callback) {
      callback && (this._frameCallback = callback);
    };
    /**
     * Creates NEAREST filter texture.
     * @public
     * @param {Object} image - Image or Canvas object.
     * @returns {Object} - WebGL texture object.
     */


    Handler.prototype.createTexture_n = function (image) {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return texture;
    };
    /**
     * Creates empty texture.
     * @public
     * @param {Number} [width=1] - Specifies the width of the texture image..
     * @param {Number} [height=1] - Specifies the width of the texture image..
     * @param {String} [filter="NEAREST"] - Specifies GL_TEXTURE_MIN(MAX)_FILTER texture value.
     * @param {String} [internalFormat="RGBA"] - Specifies the color components in the texture.
     * @param {String} [format="RGBA"] - Specifies the format of the texel data.
     * @param {String} [type="UNSIGNED_BYTE"] - Specifies the data type of the texel data.
     * @param {Number} [levels=0] - Specifies the level-of-detail number. Level 0 is the base image level. Level n is the nth mipmap reduction image.
     * @returns {Object} - WebGL texture object.
     */


    Handler.prototype.createEmptyTexture2DExt = function (width = 1, height = 1, filter = "NEAREST", internalFormat = "RGBA", format = "RGBA", type = "UNSIGNED_BYTE", level = 0) {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, level, gl[internalFormat.toUpperCase()], width, height, 0, gl[format.toUpperCase()], gl[type.toUpperCase()], null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[filter.toUpperCase()]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[filter.toUpperCase()]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return texture;
    }; ///**
    // * Creates Empty half float texture.
    // * @public
    // * @param {number} width - Empty texture width.
    // * @param {number} height - Empty texture height.
    // * @returns {Object} - WebGL half float texture object.
    // */
    //Handler.prototype.createEmptyTexture_hf = function (width, height) {
    //    var gl = this.gl;
    //    var texture = gl.createTexture();
    //    gl.bindTexture(gl.TEXTURE_2D, texture);
    //    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    //    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.HALF_FLOAT_OES, null);
    //    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    //    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    //    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //    gl.bindTexture(gl.TEXTURE_2D, null);
    //    return texture;
    //}
    ///**
    // * Creates Empty float texture.
    // * @public
    // * @param {number} width - Empty texture width.
    // * @param {number} height - Empty texture height.
    // * @returns {Object} - WebGL float texture object.
    // */
    //Handler.prototype.createEmptyTexture_f = function (width, height) {
    //    var gl = this.gl;
    //    var texture = gl.createTexture();
    //    gl.bindTexture(gl.TEXTURE_2D, texture);
    //    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    //    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    //    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    //    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    //    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //    gl.bindTexture(gl.TEXTURE_2D, null);
    //    return texture;
    //}

    /**
     * Creates Empty NEAREST filtered texture.
     * @public
     * @param {number} width - Empty texture width.
     * @param {number} height - Empty texture height.
     * @returns {Object} - WebGL texture object.
     */


    Handler.prototype.createEmptyTexture_n = function (width, height) {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return texture;
    };
    /**
     * Creates empty LINEAR filtered texture.
     * @public
     * @param {number} width - Empty texture width.
     * @param {number} height - Empty texture height.
     * @returns {Object} - WebGL texture object.
     */


    Handler.prototype.createEmptyTexture_l = function (width, height) {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return texture;
    };
    /**
     * Creates LINEAR filter texture.
     * @public
     * @param {Object} image - Image or Canvas object.
     * @returns {Object} - WebGL texture object.
     */


    Handler.prototype.createTexture_l = function (image) {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return texture;
    };
    /**
     * Creates MIPMAP filter texture.
     * @public
     * @param {Object} image - Image or Canvas object.
     * @returns {Object} - WebGL texture object.
     */


    Handler.prototype.createTexture_mm = function (image) {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return texture;
    };
    /**
     * Creates ANISOTROPY filter texture.
     * @public
     * @param {Object} image - Image or Canvas object.
     * @returns {Object} - WebGL texture object.
     */


    Handler.prototype.createTexture_a = function (image) {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameterf(gl.TEXTURE_2D, this.extensions.EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, this._params.anisotropy);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return texture;
    };
    /**
     * Creates DEFAULT filter texture, ANISOTROPY is default.
     * @public
     * @param {Object} image - Image or Canvas object.
     * @returns {Object} - WebGL texture object.
     */


    Handler.prototype.createTexture = function (image) {
      return this.createTexture_a(image);
    };
    /**
     * Creates cube texture.
     * @public
     * @param {Object.<string>} params - Face image urls:
     * @param {string} params.px - Positive X or right image url.
     * @param {string} params.nx - Negative X or left image url.
     * @param {string} params.py - Positive Y or up image url.
     * @param {string} params.ny - Negative Y or bottom image url.
     * @param {string} params.pz - Positive Z or face image url.
     * @param {string} params.nz - Negative Z or back image url.
     * @returns {Object} - WebGL texture object.
     */


    Handler.prototype.loadCubeMapTexture = function (params) {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      var faces = [[params.px, gl.TEXTURE_CUBE_MAP_POSITIVE_X], [params.nx, gl.TEXTURE_CUBE_MAP_NEGATIVE_X], [params.py, gl.TEXTURE_CUBE_MAP_POSITIVE_Y], [params.ny, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y], [params.pz, gl.TEXTURE_CUBE_MAP_POSITIVE_Z], [params.nz, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];
      var imageCanvas = new ImageCanvas();
      imageCanvas.fillEmpty();
      var emptyImage = imageCanvas.getImage();

      for (let i = 0; i < faces.length; i++) {
        let face = faces[i][1];
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, emptyImage);
      }

      for (let i = 0; i < faces.length; i++) {
        let face = faces[i][1];
        let image = new Image();
        image.crossOrigin = '';

        image.onload = function (texture, face, image) {
          return function () {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          };
        }(texture, face, image);

        image.src = faces[i][0];
      }

      return texture;
    };
    /**
     * Adds shader program to the handler.
     * @public
     * @param {og.webgl.Program} program - Shader program.
     * @param {boolean} [notActivate] - If it's true program will not compile.
     * @return {og.webgl.Program} -
     */


    Handler.prototype.addProgram = function (program, notActivate) {
      if (!this.programs[program.name]) {
        var sc = new ProgramController(this, program);
        this.programs[program.name] = sc;

        this._initProgramController(sc);

        if (notActivate) sc._activated = false;
      } else {
        console.log("og.webgl.Handler:284 - shader program: '" + program.name + "' is allready exists.");
      }

      return program;
    };
    /**
     * Removes shader program from handler.
     * @public
     * @param {String} name - Shader program name.
     */


    Handler.prototype.removeProgram = function (name) {
      this.programs[name] && this.programs[name].remove();
    };
    /**
     * Adds shader programs to the handler.
     * @public
     * @param {Array.<og.webgl.Program>} programsArr - Shader program array.
     */


    Handler.prototype.addPrograms = function (programsArr) {
      for (var i = 0; i < programsArr.length; i++) {
        this.addProgram(programsArr[i]);
      }
    };
    /**
     * Used in addProgram
     * @private
     * @param {og.webgl.ProgramController} sc - Program controller
     */


    Handler.prototype._initProgramController = function (sc) {
      if (this._initialized) {
        sc.initialize();

        if (!this.activeProgram) {
          this.activeProgram = sc;
          sc.activate();
        } else {
          sc.deactivate();

          this.activeProgram._program.enableAttribArrays();

          this.activeProgram._program.use();
        }
      }
    };
    /**
     * Used in init function.
     * @private
     */


    Handler.prototype._initPrograms = function () {
      for (var p in this.programs) {
        this._initProgramController(this.programs[p]);
      }
    };
    /**
     * Initialize additional WebGL extensions.
     * @public
     * @param {string} extensionStr - Extension name.
     * @param {boolean} showLog - Show logging.
     * @return {Object} -
     */


    Handler.prototype.initializeExtension = function (extensionStr, showLog) {
      if (!(this.extensions && this.extensions[extensionStr])) {
        var ext = Handler.getExtension(this.gl, extensionStr);

        if (ext) {
          this.extensions[extensionStr] = ext;
        } else if (showLog) {
          console.log("og.webgl.Handler: extension '" + extensionStr + "' doesn't initialize.");
        }
      }

      return this.extensions && this.extensions[extensionStr];
    };
    /**
     * Main function that initialize handler.
     * @public
     */


    Handler.prototype.initialize = function () {
      if (this._id) {
        this.canvas = document.getElementById(this._id);
      } else {
        this.canvas = document.createElement("canvas");
        this.canvas.width = this._params.width;
        this.canvas.height = this._params.height;
      }

      this.gl = Handler.getContext(this.canvas, this._params.context);

      if (this.gl) {
        this._initialized = true;
        /** Sets deafult extensions */

        this._params.extensions.push("EXT_texture_filter_anisotropic");

        if (this.gl.type === "webgl") {
          this._params.extensions.push("OES_standard_derivatives");

          this._params.extensions.push("OES_element_index_uint");
        } else {
          this._params.extensions.push("EXT_color_buffer_float");

          this._params.extensions.push("OES_texture_float_linear");
        }

        var i = this._params.extensions.length;

        while (i--) {
          this.initializeExtension(this._params.extensions[i], true);
        }

        if (!this.extensions.EXT_texture_filter_anisotropic) this.createTexture = this.createTexture_mm;
        /** Initilalize shaders and rendering parameters*/

        this._initPrograms();

        this._setDefaults();
      }
    };
    /**
     * Sets default gl render parameters. Used in init function.
     * @private
     */


    Handler.prototype._setDefaults = function () {
      this.activateDepthTest();
      this.setSize(this.canvas.clientWidth || this._params.width, this.canvas.clientHeight || this._params.height);
      this.gl.frontFace(this.gl.CCW);
      this.gl.cullFace(this.gl.BACK);
      this.activateFaceCulling();
      this.deactivateBlending();
      var that = this;
      this.createDefaultTexture({
        color: "rgba(0,0,0,0.0)"
      }, function (t) {
        that.transparentTexture = t;
      });
    };
    /**
     * Activate depth test.
     * @public
     */


    Handler.prototype.activateDepthTest = function () {
      this.gl.enable(this.gl.DEPTH_TEST);
    };
    /**
     * Deactivate depth test.
     * @public
     */


    Handler.prototype.deactivateDepthTest = function () {
      this.gl.disable(this.gl.DEPTH_TEST);
    };
    /**
     * Activate face culling.
     * @public
     */


    Handler.prototype.activateFaceCulling = function () {
      this.gl.enable(this.gl.CULL_FACE);
    };
    /**
     * Deactivate face cullting.
     * @public
     */


    Handler.prototype.deactivateFaceCulling = function () {
      this.gl.disable(this.gl.CULL_FACE);
    };
    /**
     * Activate blending.
     * @public
     */


    Handler.prototype.activateBlending = function () {
      this.gl.enable(this.gl.BLEND);
    };
    /**
     * Deactivate blending.
     * @public
     */


    Handler.prototype.deactivateBlending = function () {
      this.gl.disable(this.gl.BLEND);
    };
    /**
     * Creates ARRAY buffer.
     * @public
     * @param {Array.<number>} array - Input array.
     * @param {number} itemSize - Array item size.
     * @param {number} numItems - Items quantity.
     * @param {number} [usage=STATIC_DRAW] - Parameter of the bufferData call can be one of STATIC_DRAW, DYNAMIC_DRAW, or STREAM_DRAW.
     * @return {Object} -
     */


    Handler.prototype.createArrayBuffer = function (array, itemSize, numItems, usage) {
      //
      //TODO: What about binding created buffer
      //
      var buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, array, usage || this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      buffer.itemSize = itemSize;
      buffer.numItems = numItems;
      return buffer;
    };
    /**
     * Creates ELEMENT ARRAY buffer.
     * @public
     * @param {Array.<number>} array - Input array.
     * @param {number} itemSize - Array item size.
     * @param {number} numItems - Items quantity.
     * @param {number} [usage=STATIC_DRAW] - Parameter of the bufferData call can be one of STATIC_DRAW, DYNAMIC_DRAW, or STREAM_DRAW.
     * @return {Object} -
     */


    Handler.prototype.createElementArrayBuffer = function (array, itemSize, numItems, usage) {
      var buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, array, usage || this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
      buffer.itemSize = itemSize;
      buffer.numItems = numItems || array.length;
      return buffer;
    };
    /**
     * Sets handler canvas size.
     * @public
     * @param {number} w - Canvas width.
     * @param {number} h - Canvas height.
     */


    Handler.prototype.setSize = function (w, h) {
      if (w > MAX_SIZE) {
        w = MAX_SIZE;
      }

      if (h > MAX_SIZE) {
        h = MAX_SIZE;
      }

      this._params.width = w;
      this._params.height = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this._oneByHeight = 1 / h;
      this.gl && this.gl.viewport(0, 0, w, h);
      this.onCanvasResize && this.onCanvasResize(this.canvas);
    };
    /**
     * Returns context screen width.
     * @public
     * @returns {number} -
     */


    Handler.prototype.getWidth = function () {
      return this.canvas.width;
    };
    /**
     * Returns context screen height.
     * @public
     * @returns {number} -
     */


    Handler.prototype.getHeight = function () {
      return this.canvas.height;
    };
    /**
     * Returns canvas aspect ratio.
     * @public
     * @returns {number} -
     */


    Handler.prototype.getClientAspect = function () {
      return this.canvas.clientWidth / this.canvas.clientHeight;
    };
    /**
     * Returns screen center coordinates.
     * @public
     * @returns {number} -
     */


    Handler.prototype.getCenter = function () {
      var c = this.canvas;
      return new Vec2(Math.round(c.width * 0.5), Math.round(c.height * 0.5));
    };
    /**
     * Draw single frame.
     * @public
     * @param {number} now - Frame current time milliseconds.
     */


    Handler.prototype.drawFrame = function () {
      /** Calculate frame time */
      var now = new Date().getTime();
      this.deltaTime = now - this._lastAnimationFrameTime;
      this._lastAnimationFrameTime = now;

      this.defaultClock._tick(this.deltaTime);

      for (var i = 0; i < this._clocks.length; i++) {
        this._clocks[i]._tick(this.deltaTime);
      }
      /** Canvas resize checking */


      var canvas = this.canvas;

      if (canvas.clientWidth !== canvas.width || canvas.clientHeight !== canvas.height) {
        this.setSize(canvas.clientWidth, canvas.clientHeight);
      }
      /** Draw frame */


      this._frameCallback();
    };
    /**
     * Clearing gl frame.
     * @public
     */


    Handler.prototype.clearFrame = function () {
      var gl = this.gl;
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };
    /**
     * Starts animation loop.
     * @public
     */


    Handler.prototype.start = function () {
      if (!this._requestAnimationFrameId && this._initialized) {
        var d = new Date();
        this._lastAnimationFrameTime = d.getTime();
        this.defaultClock.setDate(d);

        this._animationFrameCallback();
      }
    };

    Handler.prototype.stop = function () {
      if (this._requestAnimationFrameId) {
        window.cancelAnimationFrame(this._requestAnimationFrameId);
        this._requestAnimationFrameId = null;
      }
    };
    /**
     * Make animation.
     * @private
     */


    Handler.prototype._animationFrameCallback = function () {
      this._requestAnimationFrameId = window.requestAnimationFrame(() => {
        this.drawFrame();

        this._animationFrameCallback();
      });
    };
    /**
     * Creates default texture object
     * @public
     * @param {Object} [params] - Texture parameters:
     * @param {Array.<number, number, number, number>} [params.color] - Texture RGBA color
     * @param {number} [params.url] - Texture source url
     * @param {callback} success - Creation callback
     */


    Handler.prototype.createDefaultTexture = function (params, success) {
      var imgCnv;
      var texture;

      if (params && params.color) {
        imgCnv = new ImageCanvas(2, 2);
        imgCnv.fillColor(params.color);
        texture = this.createTexture_n(imgCnv._canvas);
        texture.default = true;
        success(texture);
      } else if (params && params.url) {
        var img = new Image();
        var that = this;

        img.onload = function () {
          texture = that.createTexture(this);
          texture.default = true;
          success(texture);
        };

        img.src = params.url;
      } else {
        imgCnv = new ImageCanvas(2, 2);
        imgCnv.fillColor("#C5C5C5");
        texture = this.createTexture_n(imgCnv._canvas);
        texture.default = true;
        success(texture);
      }
    };
    /**
     * @public
     */


    Handler.prototype.destroy = function () {
      var gl = this.gl;
      this.stop();

      for (var p in this.programs) {
        this.removeProgram(p);
      }

      gl.deleteTexture(this.transparentTexture);
      this.transparentTexture = null;
      this.framebufferStack = null;
      this.framebufferStack = new Stack();

      if (this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }

      this.canvas.width = 1;
      this.canvas.height = 1;
      this.canvas = null;
      var numAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      var tmp = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, tmp);

      for (let ii = 0; ii < numAttribs; ++ii) {
        gl.disableVertexAttribArray(ii);
        gl.vertexAttribPointer(ii, 4, gl.FLOAT, false, 0, 0);
        gl.vertexAttrib1f(ii, 0);
      }

      gl.deleteBuffer(tmp);
      var numTextureUnits = gl.getParameter(gl.MAX_TEXTlURE_IMAGE_UNITS);

      for (let ii = 0; ii < numTextureUnits; ++ii) {
        gl.activeTexture(gl.TEXTURE0 + ii);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.useProgram(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.DITHER);
      gl.disable(gl.SCISSOR_TEST);
      gl.blendColor(0, 0, 0, 0);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.ONE, gl.ZERO);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.clearStencil(-1);
      this.gl = null;
      this._initialized = false;
    };

    Handler.prototype.addClock = function (clock) {
      if (!clock.__handler) {
        clock.__handler = this;

        this._clocks.push(clock);
      }
    };

    Handler.prototype.addClocks = function (clockArr) {
      for (var i = 0; i < clockArr.length; i++) {
        this.addClock(clockArr[i]);
      }
    };

    Handler.prototype.removeClock = function (clock) {
      if (clock.__handler) {
        var c = this._clocks;
        var i = c.length;

        while (i--) {
          if (c[i].equal(clock)) {
            clock.__handler = null;
            c.splice(i, 1);
            break;
          }
        }
      }
    };

    /**
     * @module og/webgl/types
     */

    let _declarations = ["FLOAT", "DOUBLE", "BOOL", "INT", "UINT", "VEC2", "VEC3", "VEC4", "DVEC2", "DVEC3", "DVEC4", "BVEC2", "BVEC3", "BVEC4", "IVEC2", "IVEC3", "IVEC4", "UVEC2", "UVEC3", "UVEC4", "MAT2", "DMAT2", "MAT3", "DMAT3", "MAT4", "DMAT4", "MAT2X3", "MAT2X4", "MAT3X2", "MAT3X4", "MAT4X2", "MAT4X3", "DMAT2X3", "DMAT2X4", "DMAT3X2", "DMAT3X4", "DMAT4X2", "DMAT4X3", "SAMPLER1D", "SAMPLER2D", "SAMPLER3D", "SAMPLERCUBE", "SAMPLER2DSHADOW", "SAMPLER2DXX", "INTXX", "FLOATXX"];
    const types = {};

    for (let i = 0; i < _declarations.length; i++) {
      types[_declarations[i]] = i;
    }

    const typeStr = {};

    for (let i = 0; i < _declarations.length; i++) {
      typeStr[_declarations[i].toLowerCase()] = types[_declarations[i]];
    }

    /**
     * @module og/webgl/callbacks
     */
    /*=========================
       Uniforms callbacks
     =========================*/

    const callbacks = {
      'u': [],
      'a': []
    };

    callbacks.u[types.MAT4] = function (program, variable) {
      program.gl.uniformMatrix4fv(variable._pName, false, variable.value);
    };

    callbacks.u[types.MAT3] = function (program, variable) {
      program.gl.uniformMatrix3fv(variable._pName, false, variable.value);
    };

    callbacks.u[types.FLOAT] = function (program, variable) {
      program.gl.uniform1f(variable._pName, variable.value);
    };

    callbacks.u[types.INT] = function (program, variable) {
      program.gl.uniform1i(variable._pName, variable.value);
    };

    callbacks.u[types.VEC2] = function (program, variable) {
      program.gl.uniform2fv(variable._pName, variable.value);
    };

    callbacks.u[types.VEC3] = function (program, variable) {
      program.gl.uniform3fv(variable._pName, variable.value);
    };

    callbacks.u[types.VEC4] = function (program, variable) {
      program.gl.uniform4fv(variable._pName, variable.value);
    };

    callbacks.u[types.SAMPLER2D] = function (program, variable) {
      let pgl = program.gl;
      pgl.activeTexture(pgl.TEXTURE0 + program._textureID);
      pgl.bindTexture(pgl.TEXTURE_2D, variable.value);
      pgl.uniform1i(variable._pName, program._textureID);
      program._textureID++;
    };

    callbacks.u[types.SAMPLERCUBE] = function (program, variable) {
      let pgl = program.gl;
      pgl.activeTexture(pgl.TEXTURE0 + program._textureID);
      pgl.bindTexture(pgl.TEXTURE_CUBE_MAP, variable.value);
      pgl.uniform1i(variable._pName, program._textureID);
      program._textureID++;
    };

    callbacks.u[types.SAMPLER2DXX] = function (program, variable) {
      let pgl = program.gl,
          size = variable.value.length;
      let samplerArr = new Int32Array(size);

      for (let i = 0; i < size; i++) {
        pgl.activeTexture(pgl.TEXTURE0 + program._textureID + i);
        pgl.bindTexture(pgl.TEXTURE_2D, variable.value[i]);
        samplerArr[i] = i;
      }

      pgl.uniform1iv(variable._pName, samplerArr);
    };

    callbacks.u[types.INTXX] = function (program, variable) {
      pgl.uniform1iv(variable._pName, variable.value);
    };

    callbacks.u[types.FLOATXX] = function (program, variable) {
      program.gl.uniform1fv(variable._pName, variable.value);
    };
    /*========================
       Attributes callbacks
     ========================*/


    callbacks.a[types.FLOAT] = function (program, variable) {
      program.gl.vertexAttrib1f(variable._pName, variable.value);
    };

    callbacks.a[types.VEC2] = function (program, variable) {
      program.gl.vertexAttrib2fv(variable._pName, variable.value);
    };

    callbacks.a[types.VEC3] = function (program, variable) {
      program.gl.vertexAttrib3fv(variable._pName, variable.value);
    };

    callbacks.a[types.VEC4] = function (program, variable) {
      program.gl.vertexAttrib4fv(variable._pName, variable.value);
    };

    /**
     * Console logging singleton object.
     * @class
     */

    class Cons {
      constructor() {
        this._container = document.createElement("div");

        this._container.classList.add("ogConsole");

        this._container.style.display = "none";

        if (document.body) {
          document.body.appendChild(this._container);
        }

        this._visibility = false;
      }

      getVisibility() {
        return this._visibility;
      }

      setVisibility(visibility) {
        if (this._visibility != visibility) {
          this._visibility = visibility;

          if (this._visibility) {
            this.show();
          } else {
            this.hide();
          }
        }
      }
      /**
       * Show console panel.
       * @public
       */


      show() {
        if (!this._container.parentNode) {
          if (document.body) {
            document.body.appendChild(this._container);
          }
        }

        this._container.style.display = "block";
        this._visibility = true;
      }
      /**
       * Hide console panel.
       * @public
       */


      hide() {
        this._container.style.display = "none";
        this._visibility = false;
      }
      /**
       * Adds error text in the console.
       * @public
       * @param {string} str - Error text.
       */


      logErr(str) {
        var d = document.createElement("div");
        d.classList.add("ogConsole-text");
        d.classList.add("ogConsole-error");
        d.innerHTML = "error: " + str;
        console.log(d.innerHTML);

        this._container.appendChild(d);

        this.show();
      }
      /**
       * Adds warning text in the console.
       * @public
       * @param {string} str - Warning text.
       */


      logWrn(str) {
        var d = document.createElement("div");
        d.classList.add("ogConsole-text");
        d.classList.add("ogConsole-warning");
        d.innerHTML = "warning: " + str;
        console.log(d.innerHTML);

        this._container.appendChild(d);

        this.show();
      }
      /**
       * Adds log text in the console.
       * @public
       * @param {string} str - Log text.
       * @param {Object} [style] - HTML style.
       */


      log(str, style) {
        var d = document.createElement("div");
        d.classList.add("ogConsole-text");

        if (style) {
          for (var s in style) {
            d.style[s] = style[s];
          }
        }

        d.innerHTML = str;
        console.log(str);

        this._container.appendChild(d);

        this.show();
      }

    }
    const cons = new Cons();

    /**
     * @module og/webgl/Program
     */
    /**
     * Represents more comfortable using WebGL shader program.
     * @class
     * @param {string} name - Shader program name identificator.
     * @param {object} material - Object stores uniforms, attributes and program codes:
     * @param {object} material.uniforms - Uniforms definition section.
     * @param {object} material.attributes - Attributes definition section.
     * @param {string} material.vertexShader - Vertex glsl code.
     * @param {string} material.fragmentShader - Fragment glsl code.
     */

    class Program {
      constructor(name, material) {
        /**
         * Shader progarm name.
         * @public
         * @type {string}
         */
        this.name = name;
        this.attributes = {};
        this.uniforms = {};
        /**
         * Attributes.
         * @public
         * @type {Object}
         */

        this._attributes = {};

        for (let t in material.attributes) {
          if (typeof material.attributes[t] === "string" || typeof material.attributes[t] === "number") {
            this._attributes[t] = {
              'type': material.attributes[t]
            };
          } else {
            this._attributes[t] = material.attributes[t];
          }
        }
        /**
         * Uniforms.
         * @public
         * @type {Object}
         */


        this._uniforms = {};

        for (let t in material.uniforms) {
          if (typeof material.uniforms[t] === "string" || typeof material.uniforms[t] === "number") {
            this._uniforms[t] = {
              'type': material.uniforms[t]
            };
          } else {
            this._uniforms[t] = material.uniforms[t];
          }
        }
        /**
         * Vertex shader.
         * @public
         * @type {string}
         */


        this.vertexShader = material.vertexShader;
        /**
         * Fragment shader.
         * @public
         * @type {string}
         */

        this.fragmentShader = material.fragmentShader;
        /**
         * Webgl context.
         * @public
         * @type {Object}
         */

        this.gl = null;
        /**
         * All program variables.
         * @private
         * @type {Object}
         */

        this._variables = {};
        /**
         * Program pointer.
         * @private
         * @type {Object}
         */

        this._p = null;
        /**
         * Texture counter.
         * @prvate
         * @type {number}
         */

        this._textureID = 0;
        /**
         * Program attributes array.
         * @private
         * @type {Array.<Object>}
         */

        this._attribArrays = [];
      }
      /**
       * Sets the current program frame.
       * @public
       */


      use() {
        this.gl.useProgram(this._p);
      }
      /**
       * Sets program variables.
       * @public
       * @param {Object} material - Variables and values object.
       */


      set(material) {
        this._textureID = 0;

        for (var i in material) {
          this._variables[i].value = material[i];

          this._variables[i]._callback(this, this._variables[i]);
        }
      }
      /**
       * Apply current variables.
       * @public
       */


      apply() {
        this._textureID = 0;
        var v = this._variables;

        for (var i in v) {
          v[i]._callback(this, v[i]);
        }
      }
      /**
       * Calls drawElements index buffer function.
       * @public
       * @param {number} mode - Draw mode(GL_TRIANGLES, GL_LINESTRING etc.).
       * @param {Object} buffer - Index buffer.
       */


      drawIndexBuffer(mode, buffer) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
        this.gl.drawElements(mode, buffer.numItems, this.gl.UNSIGNED_SHORT, 0);
      }
      /**
       * Calls drawArrays function.
       * @public
       * @param {number} mode - Draw mode(GL_TRIANGLES, GL_LINESTRING etc.).
       * @param {number} numItems - Curent binded buffer drawing items count.
       */


      drawArrays(mode, numItems) {
        this.gl.drawArrays(mode, 0, numItems);
      }
      /**
       * Check and log for an shader compile errors and warnings. Returns True - if no errors otherwise returns False.
       * @private
       * @param {Object} shader - WebGl shader program.
       * @param {string} src - Shader program source.
       * @returns {boolean} -
       */


      _getShaderCompileStatus(shader, src) {
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
          cons.logErr("og/Program/Program:" + this.name + " - " + this.gl.getShaderInfoLog(shader) + ".");
          return false;
        }

        return true;
      }
      /**
       * Returns compiled vertex shader program pointer.
       * @private
       * @param {string} src - Vertex shader source code.
       * @returns {Object} -
       */


      _createVertexShader(src) {
        var shader = this.gl.createShader(this.gl.VERTEX_SHADER);

        if (!this._getShaderCompileStatus(shader, src)) {
          return null;
        }

        return shader;
      }
      /**
       * Returns compiled fragment shader program pointer.
       * @private
       * @param {string} src - Vertex shader source code.
       * @returns {Object} -
       */


      _createFragmentShader(src) {
        var shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        if (!this._getShaderCompileStatus(shader, src)) {
          return null;
        }

        return shader;
      }
      /**
       * Disable current program vertexAttribArrays.
       * @public
       */


      disableAttribArrays() {
        var gl = this.gl;
        var a = this._attribArrays;
        var i = a.length;

        while (i--) {
          gl.disableVertexAttribArray(a[i]);
        }
      }
      /**
       * Enable current program vertexAttribArrays.
       * @public
       */


      enableAttribArrays() {
        var gl = this.gl;
        var a = this._attribArrays;
        var i = a.length;

        while (i--) {
          gl.enableVertexAttribArray(a[i]);
        }
      }
      /**
       * Delete program.
       * @public
       */


      delete() {
        this.gl.deleteProgram(this._p);
      }
      /**
       * Creates program.
       * @public
       * @param {Object} gl - WebGl context.
       */


      createProgram(gl) {
        this.gl = gl;
        this._p = this.gl.createProgram();

        var fs = this._createFragmentShader(this.fragmentShader);

        var vs = this._createVertexShader(this.vertexShader);

        gl.attachShader(this._p, fs);
        gl.attachShader(this._p, vs);
        gl.linkProgram(this._p);

        if (!gl.getProgramParameter(this._p, gl.LINK_STATUS)) {
          cons.logErr("og/Program/Program:" + this.name + " - couldn't initialise shaders. " + gl.getProgramInfoLog(this._p) + ".");
          gl.deleteProgram(this._p);
          return;
        }

        this.use();

        for (var a in this._attributes) {
          //this.attributes[a]._name = a;
          this._variables[a] = this._attributes[a]; //Maybe, it will be better to remove enableArray option...

          this._attributes[a].enableArray = this._attributes[a].enableArray != undefined ? this._attributes[a].enableArray : true;
          if (this._attributes[a].enableArray) this._attributes[a]._callback = Program.bindBuffer;else {
            if (typeof this._attributes[a].type === "string") {
              this._attributes[a]._callback = callbacks.a[typeStr[this._attributes[a].type.trim().toLowerCase()]];
            } else {
              this._attributes[a]._callback = callbacks.a[this._attributes[a].type];
            }
          }
          this._p[a] = gl.getAttribLocation(this._p, a);

          if (this._p[a] == undefined) {
            cons.logErr("og/Program/Program:" + this.name + " - attribute '" + a + "' is not exists.");
            gl.deleteProgram(this._p);
            return;
          }

          if (this._attributes[a].enableArray) {
            this._attribArrays.push(this._p[a]);

            gl.enableVertexAttribArray(this._p[a]);
          }

          this._attributes[a]._pName = this._p[a];
          this.attributes[a] = this._p[a];
        }

        for (var u in this._uniforms) {
          //this.uniforms[u]._name = u;
          if (typeof this._uniforms[u].type === "string") {
            this._uniforms[u]._callback = callbacks.u[typeStr[this._uniforms[u].type.trim().toLowerCase()]];
          } else {
            this._uniforms[u]._callback = callbacks.u[this._uniforms[u].type];
          }

          this._variables[u] = this._uniforms[u];
          this._p[u] = gl.getUniformLocation(this._p, u);

          if (this._p[u] == undefined) {
            cons.logErr("og/Program/Program:" + this.name + " - uniform '" + u + "' is not exists.");
            gl.deleteProgram(this._p);
            return;
          }

          this._uniforms[u]._pName = this._p[u];
          this.uniforms[u] = this._p[u];
        }

        gl.detachShader(this._p, fs);
        gl.detachShader(this._p, vs);
        gl.deleteShader(fs);
        gl.deleteShader(vs);
      }
      /**
       * Bind program buffer.
       * @function
       * @param {og.webgl.Program} program - Used program.
       * @param {Object} variable - Variable represents buffer data.
       */


      static bindBuffer(program, variable) {
        var gl = program.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, variable.value);
        gl.vertexAttribPointer(variable._pName, variable.value.itemSize, gl.FLOAT, false, 0, 0);
      }

    }

    /**
     * 2D Rectangle class.
     * @class
     * @param {number} [left] - Left coordinate. 0 - default.
     * @param {number} [top] - Top coordinate. 0 - default.
     * @param {number} [right] - Right coordinate. 0 - default.
     * @param {number} [bottom] - Bottom coordinate. 0 - default.
    */

    class Rectangle {
      constructor(left, top, right, bottom) {
        /**
         * Left coordinate.
         * @public
         * @type {number}
         */
        this.left = left || 0;
        /**
         * Right coordinate.
         * @public
         * @type {number}
         */

        this.right = right || 0;
        /**
         * Top coordinate.
         * @public
         * @type {number}
         */

        this.top = top || 0;
        /**
         * Top coordinate.
         * @public
         * @type {number}
         */

        this.bottom = bottom || 0;
      }
      /**
       * Clone rectangle object.
       * @public
       * @returns {og.Rectangle}
       */


      clone() {
        return new Rectangle(this.left, this.top, this.right, this.bottom);
      }
      /**
       * Returns rectangle width.
       * @public
       * @type {number}
       */


      getWidth() {
        return Math.abs(this.right - this.left);
      }
      /**
       * Returns rectangle height.
       * @public
       * @type {number}
       */


      getHeight() {
        return Math.abs(this.bottom - this.top);
      }
      /**
       * Returns rectangle area.
       * @public
       * @type {number}
       */


      getSquare() {
        return this.getHeight() * this.getWidth();
      }
      /**
       * Returns rectangle diagonal size.
       * @public
       * @type {number}
       */


      getDiagonal() {
        var w = this.getWidth(),
            h = this.getHeight();
        return Math.sqrt(h * h + w * w);
      }
      /**
       * Returns true if rectangle fits their size in width and height.
       * @public
       * @param {number} width - Width.
       * @param {number} height - Height.
       * @type {boolean}
       */


      fit(width, height) {
        return this.getWidth() == width && this.getHeight() == height;
      }

      isInside(x, y) {
        return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom;
      }

    }

    class QueueArray {
      constructor(size) {
        this._size = size || 2048;
        this._array = new Array(this._size);
        this._popIndex = parseInt(this._size * 0.5);
        this._shiftIndex = this._popIndex;
        this.length = 0;
      }

      reset() {
        this._popIndex = parseInt(this._size * 0.5);
        this._shiftIndex = this._popIndex;
        this.length = 0;
      }

      clear() {
        this._array.length = 0;
        this._array = new Array(this._size);
        this._popIndex = parseInt(this._size * 0.5);
        this._shiftIndex = this._popIndex;
        this.length = 0;
      }

      push(data) {
        this.length++;
        this._array[this._popIndex++] = data;
      }

      pop() {
        if (this.length) {
          this.length--;
          var res = this._array[--this._popIndex];
          this._array[this._popIndex] = null;

          if (!this._array[this._popIndex - 1]) {
            this._popIndex = parseInt(this._size * 0.5);
            this._shiftIndex = this._popIndex;
          }

          return res;
        }

        return undefined;
      }

      unshift(data) {
        this.length++;
        this._array[--this._shiftIndex] = data;
      }

      shift() {
        if (this.length) {
          this.length--;
          var res = this._array[this._shiftIndex];
          this._array[this._shiftIndex++] = null;

          if (!this._array[this._shiftIndex]) {
            this._popIndex = parseInt(this._size * 0.5);
            this._shiftIndex = this._popIndex;
          }

          return res;
        }

        return undefined;
      }

      each(callback) {
        for (var i = this._shiftIndex; i < this._popIndex; i++) {
          callback(this._array[i]);
        }
      }

    }

    class ImagesCacheManager {
      constructor() {
        this.imagesCache = {};
        this._counter = 0;
        this._pendingsQueue = new QueueArray();
        this._imageIndexCounter = 0;
      }

      load(src, success) {
        if (this.imagesCache[src]) {
          success(this.imagesCache[src]);
        } else {
          var req = {
            "src": src,
            "success": success
          };

          if (this._counter >= 1) {
            this._pendingsQueue.push(req);
          } else {
            this._exec(req);
          }
        }
      }

      _exec(req) {
        this._counter++;
        var that = this;
        var img = new Image();
        img.crossOrigin = '';

        img.onload = function () {
          that.imagesCache[req.src] = img;
          this.__nodeIndex = that._imageIndexCounter++;
          req.success(this);

          that._dequeueRequest();
        };

        img.onerror = function () {
          that._dequeueRequest();
        };

        img.src = req.src;
      }

      _dequeueRequest() {
        this._counter--;

        if (this._pendingsQueue.length && this._counter < 1) {
          while (this._pendingsQueue.length) {
            var req = this._pendingsQueue.pop();

            if (req) {
              if (this.imagesCache[req.src]) {
                if (this._counter <= 0) this._counter = 0;else this._counter--;
                req.success(this.imagesCache[req.src]);
              } else {
                this._exec(req);

                break;
              }
            }
          }
        }
      }

    }

    /**
     * Texture atlas stores images in one texture. Each image has its own 
     * atlas texture coordinates.
     * @class
     * @param {number} [width] - Texture atlas width, if it hasn't 1024 default.
     * @param {number} [height] - Texture atlas height, if it hasn't 1024 default..
     */

    class TextureAtlas {
      constructor(width, height) {
        /**
         * Atlas nodes where input images store. It can be access by image.__nodeIndex.
         * @public
         * @type {Array.<og.utils.TextureAtlasNode >}
         */
        this.nodes = [];
        /**
         * Created gl texture.
         * @public
         */

        this.texture = null;
        /**
         * Atlas canvas.
         * @public
         * @type {canvas}
         */

        this.canvas = new ImageCanvas(width || 1024, height || 1024);
        this.clearCanvas();
        this._handler = null;
        this._images = [];
        this._btree = null;
        this._imagesCacheManager = new ImagesCacheManager();
        this.borderSize = 4;
      }
      /**
       * Returns atlas javascript image object.
       * @public
       * @returns {Object} -
       */


      getImage() {
        return this.canvas.getImage();
      }
      /**
       * Returns canvas object.
       * @public
       * @returns {Object} -
       */


      getCanvas() {
        return this.canvas._canvas;
      }
      /**
       * Clear atlas with black.
       * @public
       */


      clearCanvas() {
        this.canvas.fillEmpty("black");
      }

      clear() {
        this.canvas.fillEmpty("black");
        this.nodes = [];
        this._images = [];
        this._btree = null;
        this.createTexture();
      }
      /**
       * Sets openglobus gl handler that creates gl texture.
       * @public
       * @param {og.webgl.Handler} handler - WebGL handler.
       */


      assignHandler(handler) {
        this._handler = handler;
        this.createTexture();
      }
      /**
       * Returns image diagonal size.
       * @param {Object} image - JavaSript image object.
       * @returns {number} -
       */


      getDiagonal(image) {
        var w = image.atlasWidth || image.width,
            h = image.atlasHeight || image.height;
        return Math.sqrt(w * w + h * h);
      }
      /**
       * Adds image to the atlas and returns creted node with texture coordinates of the stored image.
       * @public
       * @param {Object} image - Input javascript image object.
       * @param {boolean} [fastInsert] - If it's true atlas doesnt restore all images again 
       * and store image in the curent atlas sheme.
       * @returns {og.utils.TextureAtlasNode} -
       */


      addImage(image, fastInsert) {
        if (!(image.width && image.height)) {
          return;
        }

        this._images.push(image);

        this._makeAtlas(fastInsert);

        return this.nodes[image.__nodeIndex];
      }

      _completeNode(nodes, node) {
        if (node) {
          var w = this.canvas.getWidth(),
              h = this.canvas.getHeight();
          var im = node.image;
          var r = node.rect;
          var bs = Math.round(this.borderSize * 0.5);
          this.canvas.drawImage(im, r.left + bs, r.top + bs, im.atlasWidth, im.atlasHeight);
          var tc = node.texCoords;
          tc[0] = (r.left + bs) / w;
          tc[1] = (r.top + bs) / h;
          tc[2] = (r.left + bs) / w;
          tc[3] = (r.bottom - bs) / h;
          tc[4] = (r.right - bs) / w;
          tc[5] = (r.bottom - bs) / h;
          tc[6] = (r.right - bs) / w;
          tc[7] = (r.bottom - bs) / h;
          tc[8] = (r.right - bs) / w;
          tc[9] = (r.top + bs) / h;
          tc[10] = (r.left + bs) / w;
          tc[11] = (r.top + bs) / h;
          nodes[im.__nodeIndex] = node;
        }
      }
      /**
       * Main atlas making function.
       * @private
       * @param {boolean} [fastInsert] - If it's true atlas doesnt restore all images again 
       * and store image in the curent atlas sheme.
       */


      _makeAtlas(fastInsert) {
        if (fastInsert && this._btree) {
          let im = this._images[this._images.length - 1];

          this._completeNode(this.nodes, this._btree.insert(im));
        } else {
          let im = this._images.slice(0);

          im.sort(function (b, a) {
            return (a.atlasWidth || a.width) - (b.atlasWidth || b.width) || (a.atlasHeight || a.height) - (b.atlasHeight || b.height);
          });
          this._btree = new TextureAtlasNode(new Rectangle(0, 0, this.canvas.getWidth(), this.canvas.getHeight()));
          this._btree.atlas = this;
          this.clearCanvas();
          var newNodes = [];

          for (var i = 0; i < im.length; i++) {
            this._completeNode(newNodes, this._btree.insert(im[i]));
          }

          this.nodes = [];
          this.nodes = newNodes;
        }
      }
      /**
       * Creates atlas gl texture.
       * @public
       */


      createTexture() {
        if (this._handler) {
          this._handler.gl.deleteTexture(this.texture);

          this.texture = this._handler.createTexture_mm(this.canvas._canvas);
        }
      }
      /**
       * Image handler callback. 
       * @callback Object~successCallback
       * @param {Image} img - Loaded image.
       */

      /**
       * Asynchronous function that loads and creates image to the image cache, and call success callback when it's done.
       * @public
       * @param {string} src - Image object src string.
       * @param {Object~successCallback} success - The callback that handles the image loads done.
       */


      loadImage(src, success) {
        this._imagesCacheManager.load(src, success);
      }

      getImageTexCoordinates(img) {
        if (img.__nodeIndex != null && this.nodes[img.__nodeIndex]) {
          return this.nodes[img.__nodeIndex].texCoords;
        }
      }

    }
    /**
     * Atlas binary tree node.
     * @class
     * @param {og.Rectangle} rect - Node image rectangle.
     */


    class TextureAtlasNode {
      constructor(rect) {
        this.childNodes = null;
        this.image = null;
        this.rect = rect;
        this.texCoords = [];
        this.atlas = null;
      }

      insert(img) {
        if (this.childNodes) {
          var newNode = this.childNodes[0].insert(img);
          if (newNode != null) return newNode;
          return this.childNodes[1].insert(img);
        } else {
          if (this.image != null) return null;
          var rc = this.rect;
          var w = (img.atlasWidth || img.width) + this.atlas.borderSize;
          var h = (img.atlasHeight || img.height) + this.atlas.borderSize;
          if (w > rc.getWidth() || h > rc.getHeight()) return null;

          if (rc.fit(w, h)) {
            this.image = img;
            return this;
          }

          this.childNodes = new Array(2);
          this.childNodes[0] = new TextureAtlasNode();
          this.childNodes[0].atlas = this.atlas;
          this.childNodes[1] = new TextureAtlasNode();
          this.childNodes[1].atlas = this.atlas;
          var dw = rc.getWidth() - w;
          var dh = rc.getHeight() - h;

          if (dw > dh) {
            this.childNodes[0].rect = new Rectangle(rc.left, rc.top, rc.left + w, rc.bottom);
            this.childNodes[1].rect = new Rectangle(rc.left + w, rc.top, rc.right, rc.bottom);
          } else {
            this.childNodes[0].rect = new Rectangle(rc.left, rc.top, rc.right, rc.top + h);
            this.childNodes[1].rect = new Rectangle(rc.left, rc.top + h, rc.right, rc.bottom);
          }

          return this.childNodes[0].insert(img);
        }
      }

    }

    /* eslint-disable no-unused-vars */
    //
    // Copyright (c) 2016, Mapbox
    //
    // Permission to use, copy, modify, and/or distribute this software for any purpose
    // with or without fee is hereby granted, provided that the above copyright notice
    // and this permission notice appear in all copies.
    //
    // THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    // REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
    // FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    // INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
    // OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
    // TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
    // THIS SOFTWARE.
    //
    //https://github.com/mapbox/earcut

    function earcut(data, holeIndices, dim) {
      dim = dim || 2;
      var hasHoles = holeIndices && holeIndices.length,
          outerLen = hasHoles ? holeIndices[0] * dim : data.length,
          outerNode = linkedList(data, 0, outerLen, dim, true),
          triangles = [];
      if (!outerNode) return triangles;
      var minX, minY, maxX, maxY, x, y, size;
      if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim); // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox

      if (data.length > 80 * dim) {
        minX = maxX = data[0];
        minY = maxY = data[1];

        for (var i = dim; i < outerLen; i += dim) {
          x = data[i];
          y = data[i + 1];
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        } // minX, minY and size are later used to transform coords into integers for z-order calculation


        size = Math.max(maxX - minX, maxY - minY);
      }

      earcutLinked(outerNode, triangles, dim, minX, minY, size);
      return triangles;
    } // create a circular doubly linked list from polygon points in the specified winding order


    function linkedList(data, start, end, dim, clockwise) {
      var i, last;

      if (clockwise === signedArea(data, start, end, dim) > 0) {
        for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
      } else {
        for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
      }

      if (last && equals(last, last.next)) {
        removeNode(last);
        last = last.next;
      }

      return last;
    } // eliminate colinear or duplicate points


    function filterPoints(start, end) {
      if (!start) return start;
      if (!end) end = start;
      var p = start,
          again;

      do {
        again = false;

        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
          removeNode(p);
          p = end = p.prev;
          if (p === p.next) return null;
          again = true;
        } else {
          p = p.next;
        }
      } while (again || p !== end);

      return end;
    } // main ear slicing loop which triangulates a polygon (given as a linked list)


    function earcutLinked(ear, triangles, dim, minX, minY, size, pass) {
      if (!ear) return; // interlink polygon nodes in z-order

      if (!pass && size) indexCurve(ear, minX, minY, size);
      var stop = ear,
          prev,
          next; // iterate through ears, slicing them one by one

      while (ear.prev !== ear.next) {
        prev = ear.prev;
        next = ear.next;

        if (size ? isEarHashed(ear, minX, minY, size) : isEar(ear)) {
          // cut off the triangle
          triangles.push(prev.i / dim);
          triangles.push(ear.i / dim);
          triangles.push(next.i / dim);
          removeNode(ear); // skipping the next vertice leads to less sliver triangles

          ear = next.next;
          stop = next.next;
          continue;
        }

        ear = next; // if we looped through the whole remaining polygon and can't find any more ears

        if (ear === stop) {
          // try filtering points and slicing again
          if (!pass) {
            earcutLinked(filterPoints(ear), triangles, dim, minX, minY, size, 1); // if this didn't work, try curing all small self-intersections locally
          } else if (pass === 1) {
            ear = cureLocalIntersections(ear, triangles, dim);
            earcutLinked(ear, triangles, dim, minX, minY, size, 2); // as a last resort, try splitting the remaining polygon into two
          } else if (pass === 2) {
            splitEarcut(ear, triangles, dim, minX, minY, size);
          }

          break;
        }
      }
    } // check whether a polygon node forms a valid ear with adjacent nodes


    function isEar(ear) {
      var a = ear.prev,
          b = ear,
          c = ear.next;
      if (area(a, b, c) >= 0) return false; // reflex, can't be an ear
      // now make sure we don't have other points inside the potential ear

      var p = ear.next.next;

      while (p !== ear.prev) {
        if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
        p = p.next;
      }

      return true;
    }

    function isEarHashed(ear, minX, minY, size) {
      var a = ear.prev,
          b = ear,
          c = ear.next;
      if (area(a, b, c) >= 0) return false; // reflex, can't be an ear
      // triangle bbox; min & max are calculated like this for speed

      var minTX = a.x < b.x ? a.x < c.x ? a.x : c.x : b.x < c.x ? b.x : c.x,
          minTY = a.y < b.y ? a.y < c.y ? a.y : c.y : b.y < c.y ? b.y : c.y,
          maxTX = a.x > b.x ? a.x > c.x ? a.x : c.x : b.x > c.x ? b.x : c.x,
          maxTY = a.y > b.y ? a.y > c.y ? a.y : c.y : b.y > c.y ? b.y : c.y; // z-order range for the current triangle bbox;

      var minZ = zOrder(minTX, minTY, minX, minY, size),
          maxZ = zOrder(maxTX, maxTY, minX, minY, size); // first look for points inside the triangle in increasing z-order

      var p = ear.nextZ;

      while (p && p.z <= maxZ) {
        if (p !== ear.prev && p !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
        p = p.nextZ;
      } // then look for points in decreasing z-order


      p = ear.prevZ;

      while (p && p.z >= minZ) {
        if (p !== ear.prev && p !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;
      }

      return true;
    } // go through all polygon nodes and cure small local self-intersections


    function cureLocalIntersections(start, triangles, dim) {
      var p = start;

      do {
        var a = p.prev,
            b = p.next.next;

        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {
          triangles.push(a.i / dim);
          triangles.push(p.i / dim);
          triangles.push(b.i / dim); // remove two nodes involved

          removeNode(p);
          removeNode(p.next);
          p = start = b;
        }

        p = p.next;
      } while (p !== start);

      return p;
    } // try splitting polygon into two and triangulate them independently


    function splitEarcut(start, triangles, dim, minX, minY, size) {
      // look for a valid diagonal that divides the polygon into two
      var a = start;

      do {
        var b = a.next.next;

        while (b !== a.prev) {
          if (a.i !== b.i && isValidDiagonal(a, b)) {
            // split the polygon in two by the diagonal
            var c = splitPolygon(a, b); // filter colinear points around the cuts

            a = filterPoints(a, a.next);
            c = filterPoints(c, c.next); // run earcut on each half

            earcutLinked(a, triangles, dim, minX, minY, size);
            earcutLinked(c, triangles, dim, minX, minY, size);
            return;
          }

          b = b.next;
        }

        a = a.next;
      } while (a !== start);
    } // link every hole into the outer loop, producing a single-ring polygon without holes


    function eliminateHoles(data, holeIndices, outerNode, dim) {
      var queue = [],
          i,
          len,
          start,
          end,
          list;

      for (i = 0, len = holeIndices.length; i < len; i++) {
        start = holeIndices[i] * dim;
        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        list = linkedList(data, start, end, dim, false);
        if (list === list.next) list.steiner = true;
        queue.push(getLeftmost(list));
      }

      queue.sort(compareX); // process holes from left to right

      for (i = 0; i < queue.length; i++) {
        eliminateHole(queue[i], outerNode);
        outerNode = filterPoints(outerNode, outerNode.next);
      }

      return outerNode;
    }

    function compareX(a, b) {
      return a.x - b.x;
    } // find a bridge between vertices that connects hole with an outer ring and and link it


    function eliminateHole(hole, outerNode) {
      outerNode = findHoleBridge(hole, outerNode);

      if (outerNode) {
        var b = splitPolygon(outerNode, hole);
        filterPoints(b, b.next);
      }
    } // David Eberly's algorithm for finding a bridge between hole and outer polygon


    function findHoleBridge(hole, outerNode) {
      var p = outerNode,
          hx = hole.x,
          hy = hole.y,
          qx = -Infinity,
          m; // find a segment intersected by a ray from the hole's leftmost point to the left;
      // segment's endpoint with lesser x will be potential connection point

      do {
        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
          var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);

          if (x <= hx && x > qx) {
            qx = x;

            if (x === hx) {
              if (hy === p.y) return p;
              if (hy === p.next.y) return p.next;
            }

            m = p.x < p.next.x ? p : p.next;
          }
        }

        p = p.next;
      } while (p !== outerNode);

      if (!m) return null;
      if (hx === qx) return m.prev; // hole touches outer segment; pick lower endpoint
      // look for points inside the triangle of hole point, segment intersection and endpoint;
      // if there are no points found, we have a valid connection;
      // otherwise choose the point of the minimum angle with the ray as connection point

      var stop = m,
          mx = m.x,
          my = m.y,
          tanMin = Infinity,
          tan;
      p = m.next;

      while (p !== stop) {
        if (hx >= p.x && p.x >= mx && hx !== p.x && pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
          tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

          if ((tan < tanMin || tan === tanMin && p.x > m.x) && locallyInside(p, hole)) {
            m = p;
            tanMin = tan;
          }
        }

        p = p.next;
      }

      return m;
    } // interlink polygon nodes in z-order


    function indexCurve(start, minX, minY, size) {
      var p = start;

      do {
        if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, size);
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
      } while (p !== start);

      p.prevZ.nextZ = null;
      p.prevZ = null;
      sortLinked(p);
    } // Simon Tatham's linked list merge sort algorithm
    // http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html


    function sortLinked(list) {
      var i,
          p,
          q,
          e,
          tail,
          numMerges,
          pSize,
          qSize,
          inSize = 1;

      do {
        p = list;
        list = null;
        tail = null;
        numMerges = 0;

        while (p) {
          numMerges++;
          q = p;
          pSize = 0;

          for (i = 0; i < inSize; i++) {
            pSize++;
            q = q.nextZ;
            if (!q) break;
          }

          qSize = inSize;

          while (pSize > 0 || qSize > 0 && q) {
            if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
              e = p;
              p = p.nextZ;
              pSize--;
            } else {
              e = q;
              q = q.nextZ;
              qSize--;
            }

            if (tail) tail.nextZ = e;else list = e;
            e.prevZ = tail;
            tail = e;
          }

          p = q;
        }

        tail.nextZ = null;
        inSize *= 2;
      } while (numMerges > 1);

      return list;
    } // z-order of a point given coords and size of the data bounding box


    function zOrder(x, y, minX, minY, size) {
      // coords are transformed into non-negative 15-bit integer range
      x = 32767 * (x - minX) / size;
      y = 32767 * (y - minY) / size;
      x = (x | x << 8) & 0x00FF00FF;
      x = (x | x << 4) & 0x0F0F0F0F;
      x = (x | x << 2) & 0x33333333;
      x = (x | x << 1) & 0x55555555;
      y = (y | y << 8) & 0x00FF00FF;
      y = (y | y << 4) & 0x0F0F0F0F;
      y = (y | y << 2) & 0x33333333;
      y = (y | y << 1) & 0x55555555;
      return x | y << 1;
    } // find the leftmost node of a polygon ring


    function getLeftmost(start) {
      var p = start,
          leftmost = start;

      do {
        if (p.x < leftmost.x) leftmost = p;
        p = p.next;
      } while (p !== start);

      return leftmost;
    } // check if a point lies within a convex triangle


    function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
      return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 && (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 && (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
    } // check if a diagonal between two polygon nodes is valid (lies in polygon interior)


    function isValidDiagonal(a, b) {
      return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b);
    } // signed area of a triangle


    function area(p, q, r) {
      return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    } // check if two points are equal


    function equals(p1, p2) {
      return p1.x === p2.x && p1.y === p2.y;
    } // check if two segments intersect


    function intersects(p1, q1, p2, q2) {
      if (equals(p1, q1) && equals(p2, q2) || equals(p1, q2) && equals(p2, q1)) return true;
      return area(p1, q1, p2) > 0 !== area(p1, q1, q2) > 0 && area(p2, q2, p1) > 0 !== area(p2, q2, q1) > 0;
    } // check if a polygon diagonal intersects any polygon segments


    function intersectsPolygon(a, b) {
      var p = a;

      do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i && intersects(p, p.next, a, b)) return true;
        p = p.next;
      } while (p !== a);

      return false;
    } // check if a polygon diagonal is locally inside the polygon


    function locallyInside(a, b) {
      return area(a.prev, a, a.next) < 0 ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
    } // check if the middle point of a polygon diagonal is inside the polygon


    function middleInside(a, b) {
      var p = a,
          inside = false,
          px = (a.x + b.x) / 2,
          py = (a.y + b.y) / 2;

      do {
        if (p.y > py !== p.next.y > py && p.next.y !== p.y && px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x) inside = !inside;
        p = p.next;
      } while (p !== a);

      return inside;
    } // link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
    // if one belongs to the outer ring and another to a hole, it merges it into a single ring


    function splitPolygon(a, b) {
      var a2 = new Node(a.i, a.x, a.y),
          b2 = new Node(b.i, b.x, b.y),
          an = a.next,
          bp = b.prev;
      a.next = b;
      b.prev = a;
      a2.next = an;
      an.prev = a2;
      b2.next = a2;
      a2.prev = b2;
      bp.next = b2;
      b2.prev = bp;
      return b2;
    } // create a node and optionally link it with previous one (in a circular doubly linked list)


    function insertNode(i, x, y, last) {
      var p = new Node(i, x, y);

      if (!last) {
        p.prev = p;
        p.next = p;
      } else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
      }

      return p;
    }

    function removeNode(p) {
      p.next.prev = p.prev;
      p.prev.next = p.next;
      if (p.prevZ) p.prevZ.nextZ = p.nextZ;
      if (p.nextZ) p.nextZ.prevZ = p.prevZ;
    }

    function Node(i, x, y) {
      // vertice index in coordinates array
      this.i = i; // vertex coordinates

      this.x = x;
      this.y = y; // previous and next vertice nodes in a polygon ring

      this.prev = null;
      this.next = null; // z-order curve value

      this.z = null; // previous and next nodes in z-order

      this.prevZ = null;
      this.nextZ = null; // indicates whether this is a steiner point

      this.steiner = false;
    } // return a percentage difference between the polygon area and its triangulation area;

    function signedArea(data, start, end, dim) {
      var sum = 0;

      for (var i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
      }

      return sum;
    } // turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts


    function flatten(data) {
      var dim = data[0][0].length,
          result = {
        vertices: [],
        holes: [],
        dimensions: dim
      },
          holeIndex = 0;

      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
          for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
        }

        if (i > 0) {
          holeIndex += data[i - 1].length;
          result.holes.push(holeIndex);
        }
      }

      return result;
    }

    // exports.Framebuffer = Framebuffer;
    // exports.Handler = Handler;
    // exports.Program = Program;
    // exports.TextureAtlas = TextureAtlas;
    // exports.earcut = earcut;
    // exports.flatten = flatten;
    // exports.types = types;

    // Object.defineProperty(exports, '__esModule', { value: true });

    // return exports;
export default {
    Framebuffer,
    Handler,
    Program,
    TextureAtlas,
    earcut,
    flatten,
    types
};
// }({}));
//# sourceMappingURL=gmxWebGL.js.map
