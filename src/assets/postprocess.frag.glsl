precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 overlay;
uniform float invert;
uniform float curTime;
uniform vec2 camPos;
uniform vec2 size;
uniform sampler2D ditherGridMap;
const vec2 ditherSize = vec2(4.0);
const float posterize = 32.0;
const float brightness = 1.0;
const float contrast = 1.0;
const float PI = 3.14159;
const float PI2 = PI*2.0;

// https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner
float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}


vec3 tex(vec2 uv){
	return texture2D(uSampler, uv).rgb;
}
// chromatic abberation
vec3 chrAbb(vec2 uv, float separation, float rotation){
	vec2 o = 1.0/size * separation;
	return vec3(
		tex(uv + vec2(o.x*sin(PI2*1.0/3.0+rotation),o.y*cos(PI2*1.0/3.0+rotation))).r,
		tex(uv + vec2(o.x*sin(PI2*2.0/3.0+rotation),o.y*cos(PI2*2.0/3.0+rotation))).g,
		tex(uv + vec2(o.x*sin(PI2*3.0/3.0+rotation),o.y*cos(PI2*3.0/3.0+rotation))).b
	);
}
float vignette(vec2 uv, float amount){
	uv = uv;
	uv*=2.0;
	uv -= 1.0;
	return clamp((1.0-uv.y*uv.y)*(1.0-uv.x*uv.x)/amount, 0.0, 1.0);
}

vec3 dither(vec3 rgbPreDither) {
	// dither
	vec2 uvDither = fract(((gl_FragCoord.xy - mod(gl_FragCoord.xy, 1.0)) + vec2(0.5)) / (ditherSize.xy));
	vec3 limit = texture2D(ditherGridMap, uvDither).rgb;
	// posterization
	vec3 posterized = rgbPreDither - mod(rgbPreDither, 1.0/posterize);
	// dithering
	vec3 dither = step(limit, (rgbPreDither-posterized)*posterize)/posterize;
	// output
	return posterized + dither;
}

void main(void) {
	// get pixels
	vec2 uv = vTextureCoord;
	float t = mod(curTime/1000.0,1000.0);
	vec2 noiseT = vec2(rand(vec2(0.0, t - mod(t, 0.4))), rand(vec2(t - mod(t, 0.4), 0.0)));
	uv += noise(uv*10.0 + noiseT)*0.001;

	vec3 orig = texture2D(uSampler, uv).rgb;

	vec3 rgb = chrAbb(uv, abs(uv.x-0.5)*2.0, 0.0);

	// fx
	rgb = mix(rgb, overlay.rgb, overlay.a);
	rgb = mix(rgb, vec3(1.0) - rgb, invert);

	// soft vignette
	float haze = 0.02;
	rgb *= (vignette(uv + noise(uv*5.0+t)*haze, 1.0)*0.75+0.25);
	// noise
	rgb += ((noise((uv+noiseT)*size.xy*vec2(1.0, 0.05)) * noise((uv+noiseT)*size.xy)) - 0.5)*(1.0-vignette(uv,1.0)*0.5)*0.1;
	// hard edge vignette
	rgb *= vignette(uv, 0.05);

	// 
	// rgbPreDither = (rgbPreDither - 0.5 + (brightness - 1.0)) * contrast + 0.5;
	rgb = dither(rgb);

	gl_FragColor = vec4(rgb, 1.0);
	// gl_FragColor = vec4(texture2D(uSampler, uvPreview).rgb, 1.0);
}
