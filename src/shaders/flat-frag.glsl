#version 300 es

precision highp float;

uniform float u_Time;
uniform vec2 u_Resolution;


out vec4 frag_Col;

// adapted from https://www.shadertoy.com/view/MdX3zr

//1D hash by Hugo Elias
float noise1D(int n){
    n = (n << 13) ^ n;
    n = n * (n * n * 15731 + 789221) + 1376312589;
    return float( n & ivec3(0x0fffffff))/float(0x0fffffff);
}

//3D hash by iq: https://www.shadertoy.com/view/4sfGzS
vec3 hash( vec3 p ) 
{                        
    // 3D -> 1D
    float n = p.x*3.0 + p.y*113.0 + p.z*311.0;
    return 2.0 * vec3(noise1D(int(n))) - 1.0;
}

float noise( vec3 x )
{
    vec3 i = floor(x),
         f = fract(x),
         u = f*f*f* (f * ( -15.0 + 6.0* f ) + 10.0); 
 
    return mix(
              mix( mix( dot( hash( i + vec3(0,0,0) ), f - vec3(0,0,0) ), 
                        dot( hash( i + vec3(1,0,0) ), f - vec3(1,0,0) ), u.x),
                   mix( dot( hash( i + vec3(0,1,0) ), f - vec3(0,1,0) ), 
                        dot( hash( i + vec3(1,1,0) ), f - vec3(1,1,0) ), u.x), u.y),
              mix( mix( dot( hash( i + vec3(0,0,1) ), f - vec3(0,0,1) ), 
                        dot( hash( i + vec3(1,0,1) ), f - vec3(1,0,1) ), u.x),
                   mix( dot( hash( i + vec3(0,1,1) ), f - vec3(0,1,1) ), 
                        dot( hash( i + vec3(1,1,1) ), f - vec3(1,1,1) ), u.x), u.y), 
                u.z);
}

float sphere(vec3 p, vec4 spr)
{
	return length(spr.xyz-p) - spr.w;
}

float flameSDF(vec3 p)
{
	float d = sphere(p*vec3(1.,.5,1.), vec4(.0,-1.45,.0,1.));
	return d + (noise(p+vec3(.0,u_Time*0.05,.0)) + noise(p*2.)*.5)*.25*(p.y) ;
}

float scene(vec3 p)
{
	return min(150.-length(p) , abs(flameSDF(p)) );
}

vec4 raymarch(vec3 org, vec3 dir)
{
	float t = 0.0, glow = 0.0, eps = 0.02;
	vec3  p = org;
	bool glowed = false;
	
	for(int i=0; i<64; i++)
	{
		t = scene(p) + eps;
		p += t * dir;
		if( t > eps )
		{
			if(flameSDF(p) < .0)
				glowed=true;
			if(glowed)
       			glow = float(i)/64.;
		}
	}
	return vec4(p,glow);
}


void main()
{
	vec2 v = -1.0 + 2.0 * gl_FragCoord.xy / u_Resolution.xy;
    v.x *= u_Resolution.x / u_Resolution.y;

    vec3 org = vec3(0., -2., 4.);
    vec3 dir = normalize(vec3(v.x*1.6, -v.y, -1.5));

    vec4 p = raymarch(org, dir);
    float glow = p.w;



    vec4 col = mix(vec4(1., .5, .1, 1.), vec4(0.1, .5, 1., 1.), p.y * .02 + .4);
    frag_Col = mix(vec4(0.), col, pow(glow * 2., 4.));
    frag_Col.a = 1.0;
}


