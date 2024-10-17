varying vec2 vUv;
uniform float uOpacity;
uniform sampler2D uTexture;

void main()  {

	gl_FragColor = vec4( vUv.x, 0, 0, uOpacity );
}