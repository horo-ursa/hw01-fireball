import {vec4,vec2, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

export class ShaderData{
  model: mat4;
  viewProj:  mat4;
  color: vec4;
  time: GLfloat;
  resolution: vec2;
  topColor: vec4;
  bottomColor: vec4;
  fbmLoop: number;
  upBias: number;

  constructor(model: mat4, viewProj: mat4, time: GLfloat){
    this.model = model;
    this.viewProj = viewProj;
    this.time = time;
  }

  setResolution(Res:vec2){
    this.resolution = Res;
  }

};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifResolution: WebGLUniformLocation;

  unifTopColor: WebGLUniformLocation;
  unifBottomColor: WebGLUniformLocation;
  unifFbmLoop: WebGLUniformLocation;
  unifUpBias: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");

    this.unifTime       = gl.getUniformLocation(this.prog, "u_Time");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");
    this.unifResolution = gl.getUniformLocation(this.prog, "u_Resolution");

    this.unifBottomColor = gl.getUniformLocation(this.prog, "u_BottomColor");
    this.unifTopColor    = gl.getUniformLocation(this.prog, "u_TopColor");
    this.unifFbmLoop     = gl.getUniformLocation(this.prog, "u_FbmLoop");
    this.unifUpBias      = gl.getUniformLocation(this.prog, "u_UpBias");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== -1) {
      gl.uniform4fv(this.unifColor, color);
    }
  }

  setTime(time: GLfloat){
    this.use();
    if(this.unifTime !== -1){
      gl.uniform1f(this.unifTime, time);
    }
  }

  setResolution(resolu: vec2)
  {
    this.use();
    if(this.unifResolution !== -1)
    {
      gl.uniform2fv(this.unifResolution, resolu);
    }
  }

  setTopColor(color: vec4)
  {
    this.use();
    if(this.unifTopColor !== -1)
    {
      gl.uniform4fv(this.unifTopColor, color);
    }
  }

  setBottomColor(color: vec4)
  {
    this.use();
    if(this.unifBottomColor !== -1)
    {
      gl.uniform4fv(this.unifBottomColor, color);
    }
  }

  setFbm(count: number)
  {
    this.use();
    if(this.unifFbmLoop !== -1)
    {
      gl.uniform1f(this.unifFbmLoop, count);
    }
  }

  setUpBias(bias: number)
  {
    this.use();
    if(this.unifUpBias !== -1)
    {
      gl.uniform1f(this.unifUpBias, bias);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }

  drawArray(d: Drawable){
    this.use();
    gl.drawArrays(d.drawMode(), 0, 6);
  }

  drawQuad(){
    this.use();
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
};

export default ShaderProgram;
