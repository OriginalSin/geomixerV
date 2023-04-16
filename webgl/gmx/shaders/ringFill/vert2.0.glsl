#version 300 es
layout (location=0) in vec4 a_vertex;
layout (location=1) in vec4 a_color;
attribute float a_pointSize;
uniform mat4 u_matrix;
out vec4 v_color;

void main() {
	// Set the size of the point
	gl_PointSize =  a_pointSize;

	// multiply each vertex by a matrix.
	gl_Position = u_matrix * a_vertex;

	// pass the color to the fragment shader
	v_color = a_color;
}
