#version 300 es

uniform mat4 u_Model;      

uniform mat4 u_ModelInvTr;  
uniform mat4 u_ViewProj;    
in vec4 vs_Pos;             
in vec4 vs_Nor;             
in vec4 vs_Col;             

out vec4 fs_Nor;
out vec4 fs_Col;

uniform float u_Time;
uniform float u_FbmLoop;
uniform float u_UpBias;

out float displaceFactor;


float noise1D(int n){
    n = (n << 13) ^ n;
    n = n * (n * n * 15731 + 789221) + 1376312589;
    return float( n & ivec3(0x0fffffff))/float(0x0fffffff);
}

vec3 hash( vec3 p ) 
{                    
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

#define OCTAVES 4
float fbm (in vec3 st) {
    // Initial values
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.5;
    //
    // Loop of octaves
    for (int i = 0; i < int(u_FbmLoop); i++) {
        value += amplitude * noise(st * frequency);
        st *= 2.;
        amplitude *= .5;
        frequency *= 1.1;
    }
    return value;
}

float parabola(float x, float k)
{
    return pow(4. * x * (1.0 - x), k);
}

float impulse(float k, float x)
{
    float h = k * x;
    return h * exp(1.0f-h);
}

float recurrentImpulse(float k, float x, float frequency) {
    float periodicX = mod(x, 2.0 * 3.14159 * frequency) / frequency;
    return impulse(k, periodicX);
}

float pcurve(float x, float a, float b)
{
    float k = pow(a+b,a+b)/(pow(a,a) * pow(b,b));
    return k * pow(x,a) * pow(1.0-x, b);
}


float flameNoise(vec3 p) //Thx to Las^Mercury
{
	vec3 i = floor(p);
	vec4 a = dot(i, vec3(1., 57., 21.)) + vec4(0., 57., 21., 78.);
	vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
	a = mix(sin(cos(a)*a),sin(cos(1.+a)*(1.+a)), f.x);
	a.xy = mix(a.xz, a.yw, f.y);
	return mix(a.x, a.y, f.z);
}

float flame(vec3 p, float time) {
    float d = length(p - vec3(.0, -0.6, .0)) - 1.0;
    return d + (flameNoise(p + vec3(.0, time * 2., .0)) + flameNoise(p * 3.) * .5) * .25 * (p.y);
}

float ease_in_quadratic(float t){
    return t *t;
}

float ease_in_out_quadratic(float t){
    if(t < 0.5)
        return ease_in_quadratic(t*2.0)/2.0;
    else
        return 1.0 - ease_in_quadratic(t*2.0)/2.0;
}

void main()
{
    fs_Col = vs_Col;    

    float highFreqDisplacement = fbm(vs_Pos.xyz + u_Time * 0.005) * 3.0;
    if(highFreqDisplacement < 0.0) highFreqDisplacement *= -1.;
    float sinCosDisplacement = (4. *sin(u_Time* 0.005 + vs_Pos.x) * cos(u_Time * 0.005 + vs_Pos.z)) * 0.125 + 0.5;
    float recurringImpulseDisplacement = recurrentImpulse(1.0, u_Time * 0.005, 1.0); 
    float combinedDisplacement = mix(highFreqDisplacement, sinCosDisplacement, ease_in_out_quadratic(recurringImpulseDisplacement));


    float displacementFactor = mix(0.1, 1.0, clamp(vs_Nor.y * 0.5 + 0.5, 0.0, 1.0));
    vec4 dispalcementBase = displacementFactor * vs_Nor * vec4(1.0, u_UpBias, 1.0, 1.0) 
                    * flame(vs_Pos.xyz, u_Time * 0.005) * combinedDisplacement;
    vec4 newpos = vs_Pos + dispalcementBase - vec4(0.0,0.5,0.0,0.0);
    displaceFactor = length(dispalcementBase);

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          
    gl_Position = u_ViewProj * u_Model * newpos; 
    
}
