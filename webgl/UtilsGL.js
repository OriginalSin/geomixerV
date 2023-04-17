export default {
    createArrayBuffer: (gl, array, itemSize, numItems, usage) => {
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		const data = array instanceof Float32Array ? array : new Float32Array(array);
		gl.bufferData(gl.ARRAY_BUFFER, data, usage || gl.STATIC_DRAW);
		// gl.bindBuffer(gl.ARRAY_BUFFER, null);
		buffer.itemSize = itemSize;
		buffer.numItems = numItems;
		return buffer;
		
// export const updateVertexBuffer = (gl, buffer, array) => {
  // const data = array instanceof Float32Array ? array : new Float32Array(array)
  // gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  // gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
// }

	}
};

