precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D ditherGridMap;

void main(void) {
	// get pixels
	vec2 uv = vTextureCoord;

	// original
	vec4 orig = texture2D(uSampler, vTextureCoord);

	// get dither limit
	vec2 p = gl_FragCoord.xy / 4.0;
	float f = texture2D(ditherGridMap, p).r;

	// dither alpha
	if (orig.a < f) {
		discard;
	}
	gl_FragColor = vec4(orig.rgb/orig.a, 1.0);
}
