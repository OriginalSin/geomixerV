#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 position;
// attribute boolean start_ring;
attribute vec2 normal;
attribute float hop;
attribute float miter;
uniform float thickness;
uniform mat4 projection;
uniform vec4 extentParams;
varying float edge;

// #include ../metrToPixels;

void main() {
	// edge = abs(miter) - 1.0;
	edge = hop;
	
	// vec2 p = metrToPixels(position, extentParams); // Из WebMercatora в пиксели
	// vec2 xy = p + vec2(normal * extentParams.zw * miter * thickness / 2.0); // Передвинуть точку вдоль нормали на половину толщины
	// gl_Position = vec4(xy, 0.0, 1.0);
	vec2 xy = position.xy + vec2(normal * extentParams.zw * miter * thickness / 2.0); // Передвинуть точку вдоль нормали на половину толщины
	gl_Position = projection * vec4(xy, 0.0, 1.0);

	// vec2 p = position.xy + vec2(normal * thickness/2.0 * miter);
	// gl_Position = projection * vec4(p, 0.0, 1.0);
	// gl_Position = projection * vec4(p, 0.0, 1.0);
}
