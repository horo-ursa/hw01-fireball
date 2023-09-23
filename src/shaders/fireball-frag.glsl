#version 300 es

precision highp float;

uniform vec4 u_Color; 

in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

in float displaceFactor;

uniform vec4 u_BottomColor;
uniform vec4 u_TopColor;


out vec4 out_Col; 

void main()
{
    
    float mappedFactor = clamp(displaceFactor, 0.0, 1.0); 

    vec4 topColor = vec4(255.0/255.0, 103.0/255.0,27.0/255.0, 1.0);
    vec4 bottomColor = vec4(100.0/255.0, 127.0/255.0,255.0/255.0, 1.0);
    
    vec4 col = mix(u_BottomColor / 255.0, u_TopColor / 255.5, mappedFactor * 5.0);
    out_Col = vec4(col.xyz, 0.99); 

    // float c = mix(0.1, 1.0, displaceLength / (displaceLength + 1.0));
    // out_Col = vec4(c, 0, 0, 1);
}
