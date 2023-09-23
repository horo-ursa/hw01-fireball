import {mat4, vec3, vec2, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader, ShaderData} from './rendering/gl/ShaderProgram';
import Cube from './geometry/Cube';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially，
  topColor: {
    r: 255.0,
    g: 103.0,
    b: 27.0
  }, 
  bottomColor: {
    r: 100.0,
    g: 127.0,
    b: 255.0
  },
  noise: {
    fbmLoop: 4.0,
    upbias: 3.0,
  }
};

let icosphere: Icosphere;
let square: Square;
let prevTesselations: number = 5;

let cube : Cube;
let shaderData: ShaderData;

let time:GLfloat = 0.0;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 0.6, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();

  cube = new Cube(vec3.fromValues(0,0,0), vec3.fromValues(1,1,1));
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');

  // gui.add(controls, 'tesselations');
  // gui.addColor(controls, 'topColor');
  // gui.addColor(controls, 'bottomColor');
  // gui.add(controls.noise, 'fbmLoop');
  // gui.add(controls.noise, 'upbias');


  const colorFolder0 = gui.addFolder('BottomColor');
  colorFolder0.add(controls.bottomColor, 'r', 0.0, 255.0).step(1.);
  colorFolder0.add(controls.bottomColor, 'g', 0.0, 255.0).step(1.);
  colorFolder0.add(controls.bottomColor, 'b', 0.0, 255.0).step(1.);
  colorFolder0.open();

  const colorFolder1 = gui.addFolder('TopColor');
  colorFolder1.add(controls.topColor, 'r', 0.0, 255.0).step(1.);
  colorFolder1.add(controls.topColor, 'g', 0.0, 255.0).step(1.);
  colorFolder1.add(controls.topColor, 'b', 0.0, 255.0).step(1.);
  colorFolder1.open();

  const NoiseController = gui.addFolder('NoiseController');
  NoiseController.add(controls.noise, 'fbmLoop', 0.0, 16.0).step(1.);
  NoiseController.add(controls.noise, 'upbias', 0.0, 10.0).step(1.);
  NoiseController.open();

  let params = {
    myFunction: function() {
      controls.topColor.r = 255.0;
      controls.topColor.g = 103.0;
      controls.topColor.b = 27.0;
  
      controls.bottomColor.r = 100.0;
      controls.bottomColor.g = 127.0;
      controls.bottomColor.b = 255.0;
  
      controls.noise.fbmLoop = 4.0;
      controls.noise.upbias = 3.0;
  
      controls.tesselations = 5;
      colorFolder0.updateDisplay();
      colorFolder1.updateDisplay();
      NoiseController.updateDisplay(); 
    }
  };
  gui.add(params, 'myFunction').name('Restore to Initial Button');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const perlinNoise = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/perlin-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/perlin-frag.glsl')),
  ]);

  const fireballShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);
  
  const flameBackground = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    time  = time + 1.0;
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    shaderData = new ShaderData(mat4.create(), 
                                mat4.create(), 
                                time);
    shaderData.setResolution(vec2.fromValues(canvas.width,canvas.height));
    shaderData.color = vec4.fromValues(1.0,1.0,1.0,1.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    fireballShader.setBottomColor(vec4.fromValues(controls.bottomColor.r,controls.bottomColor.g,controls.bottomColor.b, 1.0));
    fireballShader.setTopColor(vec4.fromValues(controls.topColor.r,controls.topColor.g,controls.topColor.b, 1.0));
    fireballShader.setFbm(controls.noise.fbmLoop);
    fireballShader.setUpBias(controls.noise.upbias);
    renderer.render(camera, fireballShader, shaderData, [
      icosphere
    ]);

    renderer.drawBackground(camera, flameBackground, shaderData,);
    stats.end();
    gl.disable(gl.BLEND);
    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
