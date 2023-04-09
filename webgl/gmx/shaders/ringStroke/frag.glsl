#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 diffuse;
uniform float opacity;
varying float edge;

void main() {
	float v = edge;
	// float v = 1.0;
	// float v = step(0.00000001, edge);
	// float v = edge;
	// if (v > 0.0) v = 1.0;
	// gl_FragColor = vec4(diffuse, opacity);
	gl_FragColor = vec4(diffuse, opacity * v);
	// gl_FragColor = mix(vec4(diffuse, opacity), vec4(0.0), v);
}
