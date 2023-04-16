precision highp float;
uniform float alpha;
varying vec4 vColor;
void main() {
	gl_FragColor = vec4(vColor.rgb, alpha * vColor.a);
}