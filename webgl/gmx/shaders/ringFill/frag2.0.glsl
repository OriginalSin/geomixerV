#version 300 es
precision mediump float;

in vec4 v_color;
out vec4 gl_FragColor;

void main() {
	// -- squares
	gl_FragColor = v_color; //vec4(0.8, 0.1,0.1, 0.9); //v_color;
	
	gl_FragColor.a = 0.8;
}
