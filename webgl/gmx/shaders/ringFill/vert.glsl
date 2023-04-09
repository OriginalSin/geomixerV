//uniform mat4 u_matrix;
attribute vec4 a_vertex;
attribute vec4 a_color;
attribute float a_pointSize;
varying vec4 v_color;
uniform vec4 extentParams;

#include ../metrToPixels;

void main() {
	// Set the size of the point
	gl_PointSize =  a_pointSize;

	// multiply each vertex by a matrix.
	// gl_Position = u_matrix * a_vertex;
	vec2 xy = metrToPixels(a_vertex.xy, extentParams);

	gl_Position = vec4(xy, 0, 1);

	// pass the color to the fragment shader
	v_color = a_color;
}