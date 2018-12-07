let camera;
// The entire scene
let scene = new THREE.Scene();
// The scene with everything in the earth's rotational frame.
let earthGroup = new THREE.Group();
let fixedPathGroup = new THREE.Group();
let starGroup = new THREE.Group();
let renderer;
let controls;

// Between 1 and 10-ish
let animSpeed = 5;
let animInc = animSpeed*5;
if (localStorage.animInc) {
  animInc = Number(localStorage.animInc);
}
// document.getElementById('speed').value = animInc.toFixed(1);
document.getElementById('speed').innerHTML = animInc.toFixed(1);

const radius = 1;
let radiusInWindow;

let plane;//, arrows;
let arrowLen = 0.22;
const headLen = 0.045;
let starSize = 0.007;
let visiblePath = 0;
let starStreaks = false;

let map = new Map();

let animation = false;
let lineWidth = 2;

const blue = 0x0000cc;
const black = 0x000000;
const lightBlue = 0x0000ff;
const red = 0xcc0000;

const vecRenderOrder = 10;
const eastRenderOrder = 8;
const northRenderOrder = 8;
const pathRenderOrder = 2;
const greatCircleRenderOrder = 1;
const globeRenderOrder = 0;

// Number of degrees we rotate the fixed frame for the view
const fixedViewRotation0 = radians(45);
// Number of seconds the simulation has gone
const time0 = 0;//.2*60*60;
let time = time0;
// Number of seconds we've spent in geostationary orbit
let geoStationaryTime = 0;

const launchLongitude = -75;
let sim = new CoriolisSim(radians(launchLongitude));

const ROTATIONAL_VIEW = 0;
const FIXED_VIEW = 1;
const view0 = ROTATIONAL_VIEW;
// const view0 = FIXED_VIEW;
let view = view0;

if (view == FIXED_VIEW) {
  document.getElementById('frame').innerHTML = 'fixed'
} else {
  document.getElementById('frame').innerHTML = 'rotational'
}

document.getElementById('time').value = (time/(60*60)).toFixed(2);
// document.getElementById('rotation').value =
//   degrees(earthRotation(time)).toFixed(2);
document.getElementById('rotation').innerHTML =
  degrees(earthRotation(time)).toFixed(2);

const zPosition = 10;
const zZero = -1.1;

function incTime(inc) {
  time += inc;
  document.getElementById('time').value = (time/(60*60)).toFixed(2);
  // document.getElementById('rotation').value =
  //   degrees(earthRotation(time)).toFixed(2);
  document.getElementById('rotation').innerHTML =
    degrees(earthRotation(time)).toFixed(2);

  if (view == ROTATIONAL_VIEW) {
    geoStationaryTime += inc;
  }

  if (starStreaks) {
    updateBackgroundStars();
  }
}

function viewRotationEarthMap() {
  return earthRotation(-geoStationaryTime) + earthRotation(time) + fixedViewRotation0;
}

function viewRotationEarth() {
  return earthRotation(time);
}

const skyRotationFactor = 0.7;
function viewRotationSky() {
  return -earthRotation(-geoStationaryTime)*skyRotationFactor;
}

function viewRotationScene() {
  return earthRotation(-geoStationaryTime) + fixedViewRotation0;
}

runTests();

init();
tick();

//------------------------------------------------------------
// events
//------------------------------------------------------------
function timeChanged() {
  const newTime = Number(document.getElementById("time").value)*60*60;
  const diff = newTime - time;
  if (view == ROTATIONAL_VIEW) {
    geoStationaryTime += diff;
  }
  time = newTime;
  document.getElementById('rotation').value =
    degrees(earthRotation(time)).toFixed(2);
  updateBackgroundStars();
  updateAndRender();
}

function rotationChanged() {
  console.log("Not supported at this time");
}

//------------------------------------------------------------
// Initialization/setup
//------------------------------------------------------------

function init() {
  document.onkeydown = keydown;

  // camera = new THREE.PerspectiveCamera(
  //   33, window.innerWidth / window.innerHeight, 0.1, 100);
  let width = 2.5;
  let height = width;
  camera = new THREE.OrthographicCamera(
    width / - 2, width / 2, height / 2, height / - 2,
    zPosition+zZero, zPosition+10);

  // Don't remove this comment.
  // Setting the background makes the renderer clear everything
  // before rendering. We want control over the clear so we can
  // draw the earth.
  // scene.background = new THREE.Color(1, 1, 1);

  renderer = new THREE.SVGRenderer();
  renderer.autoClear = false;
  // renderer = new THREE.WebGLRenderer();

  if (!renderer.domElement.viewBox) {
    renderer.setClearColor(0xffffff, 0);
    renderer.clear();
  }

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;

  camera.position.z = zPosition;

  // if (view == ROTATIONAL_VIEW) {
  //   const theta = radians(rotationalViewLon);
  //   camera.position.x = 10 * Math.sin(theta);
  //   camera.position.z = 10 * Math.cos(theta);
  // } else {
  //   const theta = radians(rotationalViewLon);
  //   camera.position.x = 10 * Math.sin(theta);
  //   camera.position.z = 10 * Math.cos(theta);
  // }

  controls.update();
  
  // Set the window sizes
  let graphicParent = document.getElementById("graphic");
  // console.log(graphicParent.clientWidth);
  let w = graphicParent.clientWidth;
  if (graphicParent.clientHeight < w) {
    w = graphicParent.clientHeight;
  }
  renderer.setSize(w, w);
  graphicParent.appendChild(renderer.domElement);

  radiusInWindow = radius/(width/2)*(w/2);

  // scene.add(getTransparentPlane());

  // greatCircle = new GreatCircle(1, Math.PI/4, 0);
  // scene.add(getGlobe());
  // scene.add(getGreatCircle());
  // scene.add(getArrowsGroup());

  updateEarthGroup();
  scene.add(earthGroup);
  scene.add(fixedPathGroup);

  updateBackgroundStars();
  scene.add(starGroup);

  window.addEventListener('resize', onWindowResize, false);
  controls.addEventListener('change', render);
}

function keydown(event) {
  event.stopPropagation();
  var x = event.keyCode;
  var key = event.key;
  var changed = false;
  if (x == 40 || key == "j" || key == "J") {
    // console.log('down');
    // Down arrow
    if (event.shiftKey) {
    } else if (event.ctrlKey) {
    } else {
    }
    animInc /= 1.1;
    localStorage.setItem("animInc", animInc);
    // document.getElementById('speed').value = animInc.toFixed(1);
    document.getElementById('speed').innerHTML = animInc.toFixed(1);
    changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    animInc *= 1.1;
    localStorage.setItem("animInc", animInc);
    // document.getElementById('speed').value = animInc.toFixed(1);
    document.getElementById('speed').innerHTML = animInc.toFixed(1);
    changed = true;
  } else if (x == 39) {
    // Right arrow
    // earthRotation += animInc*2;
    // time += animInc*2;
    incTime(2*animInc);
    changed = true;
  } else if (x == 37) {
    // Left arrow
    // earthRotation -= animInc*2;
    // time -= animInc*2;
    incTime(-2*animInc);
    changed = true;
  } else if (key == 'f') {
    if (view == FIXED_VIEW) {
      view = ROTATIONAL_VIEW;
      document.getElementById('frame').innerHTML = 'rotational'
    } else {
      view = FIXED_VIEW;
      document.getElementById('frame').innerHTML = 'fixed'
    }
    changed = true;
  } else if (key == 'p') {
    visiblePath = (visiblePath+1)%3;
    changed = true;
  } else if (key == 's') {
    starSize /= 1.1;
    console.log('starSize', starSize);
    updateBackgroundStars();
    changed = true;
  } else if (key == 'S') {
    starSize *= 1.1;
    console.log('starSize', starSize);
    updateBackgroundStars();
    changed = true;
  } else if (key == 't') {
    if (animation) {
      starStreaks = false;
    } else {
      starStreaks = !starStreaks;
    }
    updateBackgroundStars();
    changed = true;
  } else if (key == 'r') {
    // reset
    time = time0;
    geoStationaryTime = 0;
    view = view0;
    changed = true;
  } else if (key == ' ') {
    animation = !animation;
    if (animation) {
      starStreaks = false;
      tick();
    }
  }
  if (changed) {
    updateAndRender();
  }
}

function updateBackgroundStarsBox() {
  starGroup.children = [];

  //-----------------------
  // Background stars
  const w = starSize;
  for (let i = 0; i < 1000; ++i) {
    let geometry = new THREE.BoxBufferGeometry(w,w,w);
    let material = new THREE.MeshBasicMaterial({color: black});
    let materialOccluded = new THREE.MeshBasicMaterial({color: black});
    materialOccluded.color.setHSL(0,0,0.8);
    let sphere = new THREE.Mesh(geometry, material);

    // Sample on a sphere -- See mathworld.wolfram.com/SpherePointPicking.html
    const u = Math.random();
    const v = Math.random();
    const r = 3;
    // theta is azimuthal and phi is polar
    const theta = 2*Math.PI*u;
    const phi = Math.acos(2*v-1) - Math.PI/2;
    const R = r*Math.cos(phi);
    const p = new THREE.Vector3(R*Math.cos(theta), r*Math.sin(phi), R*Math.sin(theta));
    sphere.translateOnAxis(p, 1);

    sphere.visible = true;
    sphere.simType = 'star';
    sphere.materialFront = material;
    sphere.materialOccluded = materialOccluded;
    starGroup.add(sphere);
  }

  return starGroup;
}

function updateBackgroundStars() {
  // let viewMatrix = new THREE.Matrix();
  // viewMatrix.copy(camera.matrixWorldInverse);
  // _vector3.setFromMatrixPosition( object.matrixWorld );
  // let temp = _vector3.clone().applyMatrix4(_viewMatrix);

  starGroup.children = [];

  let lineMaterial = new THREE.LineBasicMaterial( {
    color: black,
    linewidth: starSize*300,
  } );
  let materialOccluded = new THREE.LineBasicMaterial( {
    color: new THREE.Color(0.9,0.9,0.9),
    linewidth: starSize*300,
    visible: false, // just don't show the stars when they're occluded.
  } );
  let streakMaterial = new THREE.LineBasicMaterial( {
    color: black,
    linewidth: starSize*100,
  } );
  let streakMaterialOccluded = new THREE.LineBasicMaterial( {
    color: new THREE.Color(0.9,0.9,0.9),
    linewidth: starSize*100,
    visible: false, // just don't show the stars when they're occluded.
  } );

  const k = viewRotationSky()*0.42;//*skyRotationFactor;
  // const k = viewRotationEarth()*0.42*skyRotationFactor;

  // Use a local random number generator so we can seed it and not
  // be bothered by the fact that the constructor of THREE.Object3D generates
  // random numbers.
  let random = new Math.seedrandom(0);
  for (let i = 0; i < 500; ++i) {
    // Sample on a sphere -- See mathworld.wolfram.com/SpherePointPicking.html
    // const u = Math.random();
    // const v = Math.random();
    const u = random();
    const v = random();
    const r = 3;
    // theta is azimuthal and phi is polar
    const theta = 2*Math.PI*u;
    const phi = Math.acos(2*v-1) - Math.PI/2;
    const R = r*Math.cos(phi);
    const y = r*Math.sin(phi);
    const p = new THREE.Vector3(
      R*Math.cos(theta), y, R*Math.sin(theta));
    const d = 0.001;
    const p2 = new THREE.Vector3(
      R*Math.cos(theta+d), y, R*Math.sin(theta+d));

    const points = [p, p2];
    let geometry = new THREE.BufferGeometry().setFromPoints(points);
    let path = new THREE.Line(geometry, lineMaterial);
    path.renderOrder = pathRenderOrder;
    path.materialFront = lineMaterial;
    path.materialOccluded = materialOccluded;
    path.simType = 'star';
    starGroup.add(path);

    if (starStreaks && view == ROTATIONAL_VIEW && k > 0.00001) {
      const start = theta - k;
      const end = theta;
      const inc = (end-start)/10;
      for (let theta_ = start; theta_ <= end-inc+0.000001; theta_ += inc) {
        const q0 = new THREE.Vector3(
          R*Math.cos(theta_), y, R*Math.sin(theta_));
        const q1 = new THREE.Vector3(
          R*Math.cos(theta_+inc), y, R*Math.sin(theta_+inc));
        const points = [q0, q1];
        let geometry = new THREE.BufferGeometry().setFromPoints(points);
        let path = new THREE.Line(geometry, streakMaterial);
        path.renderOrder = pathRenderOrder;
        path.materialFront = streakMaterial;
        path.materialOccluded = streakMaterialOccluded;
        path.simType = 'star';
        starGroup.add(path);
      }
    }
  }

  return starGroup;
}

//----------------------------------------
// getPuckPath
//----------------------------------------
function getPuckPath(points, color) {
  points.forEach((p, i, arr) => {
    arr[i] = p.cartesian;
  });
  let lineMaterial = new THREE.LineBasicMaterial( {
    color: color,
    linewidth: lineWidth,
  } );
  let materialOccluded = new THREE.LineBasicMaterial( {
    color: color,
    linewidth: lineWidth,
  } );
  let hsl = new Object();
  materialOccluded.color.getHSL(hsl);
  materialOccluded.color.offsetHSL(0,0,(1-hsl.l)*.8);

  // Make separate geometries for each line to ease lightening
  // segments on the backside of the globe. See code in
  // Projector.js.
  let pathGroup = new THREE.Group();
  for (let i = 0; i < points.length-1; ++i) {
    let geometry = new THREE.BufferGeometry().setFromPoints(
      points.slice(i, i+2));
    var path = new THREE.Line(geometry, lineMaterial);
    path.renderOrder = pathRenderOrder;
    path.materialFront = lineMaterial;
    path.materialOccluded = materialOccluded;
    path.simType = 'path';
    pathGroup.add(path);
  }
  return pathGroup;
}

//----------------------------------------
//----------------------------------------
function getPuckPathRotating(t, color) {
  return getPuckPath(sim.pathRot(0, t), color);
}

//----------------------------------------
// getPuckPathFixed
//----------------------------------------
function getPuckPathFixed(t, color) {
  return getPuckPath(sim.pathFixed(0, t), color);
}

//----------------------------------------
// getTransparentPlane
//----------------------------------------
function getTransparentPlane() {
  plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(20, 20),
    new THREE.MeshBasicMaterial({
      color:0xffffff, opacity:0.8, transparent:true, wireframe:false
    }));
  return plane;
}

//----------------------------------------
// getGreatCircle
//----------------------------------------
function getGreatCircle() {
  var circle = new THREE.EllipseCurve(0, 0, radius, radius);
  var points = circle.getPoints(50);
  var geometry = new THREE.BufferGeometry().setFromPoints(points);
  var material = new THREE.LineBasicMaterial({ color : 0xaaaa00 });
  var ellipse = new THREE.Line(geometry, material);
  let theta = -new THREE.Vector3(-1,0,0).angleTo(sim.rotAxis);
  ellipse.rotateOnAxis(new THREE.Vector3(0,0,1), theta);
  ellipse.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/2);
  return ellipse;
}

//------------------------------------------------------------
// Utility functions
//------------------------------------------------------------

//----------------------------------------
// onWindowResize
//----------------------------------------
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function occludeMaterial(m) {
  let hsl = new Object();
  m.color.getHSL(hsl);
  m.color.offsetHSL(0,0,(1-hsl.l)*.8);
}

function prepArrowHelper(arrowHelper, renderOrder) {
  arrowHelper.children[0].renderOrder = renderOrder;
  arrowHelper.children[1].renderOrder = renderOrder;
  arrowHelper.traverseVisible(o => {o.simType = 'vector';});
  arrowHelper.traverseVisible(o => {
    if (o.material) {
      o.materialFront = o.material;
      o.materialOccluded = o.material.clone();
      o.materialOccluded.color = o.materialOccluded.color.clone();
      occludeMaterial(o.materialOccluded);
    }
  });
}

function updateEarthGroup() {
  let arrowsGroup = new THREE.Group();
  earthGroup.children = [];
  fixedPathGroup.children = [];

  const hours = time / (60*60);
  const t = time;
  const phi = sim.phi(t);
  const phi_ = sim.phi_(t);
  // const colorL = sq(0.9-hours/12);
  const colorL = 0.4;
  const vcolor = new THREE.Color().setHSL(0, 1, colorL);
  const lonLineColor = new THREE.Color().setHSL(0, 1, colorL);
  const necolor = new THREE.Color().setHSL(0.7, 1, colorL);
  const rotatingPathColor = new THREE.Color().setHSL(0.15, 1, colorL);
  const fixedPathColor = new THREE.Color().setHSL(0.45, 1, colorL);
  const green = new THREE.Color(0, 1, 0);

  {
    // puck
    let geometry = new THREE.SphereBufferGeometry(.02, 32, 32);
    let material = new THREE.MeshBasicMaterial({color: vcolor});
    let materialOccluded = new THREE.MeshBasicMaterial({color: vcolor});
    occludeMaterial(materialOccluded);
    let sphere = new THREE.Mesh(geometry, material);
    // const p = sim.pRotating(t);
    const p = sim.p(t);
    sphere.translateOnAxis(p, 1);
    sphere.renderOrder = vecRenderOrder;
    sphere.materialFront = material;
    sphere.materialOccluded = materialOccluded;
    earthGroup.add(sphere);

    let v;
    if (view == ROTATIONAL_VIEW) {
      v = sim.vRotational(t).normalize();
    } else {
      v = sim.vFixed(t).normalize();
    }
    let E = east(p.cartesian);
    let N = north(p.cartesian);
    E = E.multiplyScalar(v.clone().dot(E));
    N = N.multiplyScalar(v.clone().dot(N));
    const f = 0.25;
    
    {
      // v
      let length = v.length() * f;
      let dir = v.normalize();
      let origin = p.cartesian;

      let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                        vcolor, 20, headLen, 0.6*headLen);
      prepArrowHelper(arrowHelper, vecRenderOrder);
      arrowsGroup.add(arrowHelper);
    } {
      // east
      let length = E.length() * f;
      if (length > headLen) {
        let dir = E.normalize();
        let origin = p.cartesian;
        let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                          necolor, 20, headLen, 0.6*headLen);
        prepArrowHelper(arrowHelper, eastRenderOrder);
        arrowsGroup.add(arrowHelper);
      }
    } {
      // north
      let length = N.length() * f;
      if (length > headLen) {
        let dir = N.normalize();
        let origin = p.cartesian;
        let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                          necolor, 20, headLen, 0.6*headLen);
        prepArrowHelper(arrowHelper, northRenderOrder);
        arrowsGroup.add(arrowHelper);
      }
    }
    // puck's path
    // if (view == ROTATIONAL_VIEW) {
    if (visiblePath == 0 || visiblePath == 1) {
      let path = getPuckPathRotating(t, rotatingPathColor);
      earthGroup.add(path);
    }
    if (visiblePath == 0 || visiblePath == 2) {
      let path = getPuckPathFixed(t, fixedPathColor);
      fixedPathGroup.add(path);
    }
  }
  earthGroup.add(arrowsGroup);
}

//----------------------------------------
// render
//----------------------------------------
function render() {
  scene.traverseVisible(o => {
    if (o.materialFront) {
      o.material = o.materialFront;
    }
  });

  if (plane) {
    plane.rotation.x = camera.rotation.x;
    plane.rotation.y = camera.rotation.y;
    plane.rotation.z = camera.rotation.z;
  }

  updateEarthGroup();

  // console.log('a', viewRotationEarth());
  // console.log('b', viewRotationSky());
  // console.log('c', viewRotationScene());
  earthGroup.rotation.y = viewRotationEarth();
  starGroup.rotation.y = viewRotationSky();
  scene.rotation.y = viewRotationScene();

  renderer.clear();
  map.draw();
  renderer.render(scene, camera);
}

function updateAndRender() {
  controls.update();
  render();
}

//----------------------------------------
// animate
//----------------------------------------
// var prevTime = null;
function tick() {
  if (!animation) return;
  // if (time > T_/2) {
  //   animation = false;
  //   return;
  // }

  // var time = performance.now() * (animSpeed/1000);
  // if (prevTime) {
  //   earthRotation += (time-prevTime)*2;
  // }
  // prevTime = time;

  incTime(animInc);

  updateAndRender();

  requestAnimationFrame(tick);
}

//----------------------------------------
// snap
//----------------------------------------
function snap() {
  console.log('Taking SVG snapshot');
  XMLS = new XMLSerializer();
  svgfile = XMLS.serializeToString(renderer.domElement);

  let textarea = document.getElementById("snapshot-output");
  textarea.innerHTML = svgfile;
}
