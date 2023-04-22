attribute vec2 a_vertex;
attribute vec4 a_color;

uniform vec4 extentParams; 
varying vec4 v_color;

void main() {
	gl_Position = vec4((-1.0 + (a_vertex - extentParams.xy) * extentParams.zw) * vec2(1.0, -1.0), 0.0, 1.0); 
	v_color = a_color;
}
