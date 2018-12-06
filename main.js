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
document.getElementById('speed').value = animInc.toFixed(1);

const radius = 1;
let radiusInWindow;

let plane;//, arrows;
let arrowLen = 0.22;
const headLen = 0.045;

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
// const fixedViewRotation = 75;
const startFixedViewRotation = radians(45);
// let fixedViewRotation1 = radians(startFixedViewRotation);
// Number of seconds the simulation has gone
let time = 2*60*60;
// Number of seconds we've spent in geostationary orbit
let geoStationaryTime = 0;

const launchLongitude = -75;
let sim = new CoriolisSim(radians(launchLongitude));

const ROTATIONAL_VIEW = 0;
const FIXED_VIEW = 1;
let view = ROTATIONAL_VIEW;
// let view = FIXED_VIEW;

if (view == FIXED_VIEW) {
  document.getElementById('frame').innerHTML = 'fixed'
} else {
  document.getElementById('frame').innerHTML = 'rotational'
}

document.getElementById('time').value = (time/(60*60)).toFixed(2);
document.getElementById('rotation').value =
  degrees(earthRotation(time)).toFixed(2);

const zPosition = 10;
const zZero = -1.1;

function incTime(inc) {
  time += inc;
  document.getElementById('time').value = (time/(60*60)).toFixed(2);
  document.getElementById('rotation').value =
    degrees(earthRotation(time)).toFixed(2);

  if (view == ROTATIONAL_VIEW) {
    geoStationaryTime += inc;
  }
}

function viewRotationEarthMap() {
  return earthRotation(-geoStationaryTime) + earthRotation(time) + startFixedViewRotation;
}

function viewRotationEarth() {
  return earthRotation(time);// + startFixedViewRotation;
}

function viewRotationSky() {
  return -earthRotation(-geoStationaryTime)*0.7;
}

function viewRotationScene() {
  return earthRotation(-geoStationaryTime) + startFixedViewRotation;
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
  updateAndRender();
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

  updateRotGroup();
  scene.add(earthGroup);
  scene.add(fixedPathGroup);

  scene.add(getBackgroundStars());

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
    document.getElementById('speed').value = animInc.toFixed(1);
    changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    animInc *= 1.1;
    localStorage.setItem("animInc", animInc);
    document.getElementById('speed').value = animInc.toFixed(1);
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
  } else if (key == ' ') {
    animation = !animation;
    if (animation)
      tick();
  }
  if (changed) {
    updateAndRender();
  }
}

function getBackgroundStars() {
  starGroup.children = [];

  //-----------------------
  // Background stars
  const w = 0.007;
  for (let i = 0; i < 1000; ++i) {
    let geometry = new THREE.BoxBufferGeometry(w,w,w);
    let material = new THREE.MeshBasicMaterial({color: black});
    let materialOccluded = new THREE.MeshBasicMaterial({color: black});
    materialOccluded.color.setHSL(0,0,0.8);
    let sphere = new THREE.Mesh(geometry, material);
    const a = 2*Math.PI*Math.random();
    const r = 3;
    const p = new THREE.Vector3(r*Math.cos(a), 3*Math.random()-1.5, r*Math.sin(a));
    sphere.translateOnAxis(p, 1);
    sphere.visible = true;
    sphere.simType = 'star';
    sphere.materialFront = material;
    sphere.materialOccluded = materialOccluded;
    starGroup.add(sphere);
  }

  return starGroup;
}

//----------------------------------------
// getLonLine
//----------------------------------------
function getLonLine(lonRadians, color) {
  var circle =
    new THREE.EllipseCurve(0, 0, radius, radius, -Math.PI/2, Math.PI/2);
  var points = circle.getPoints(50);
  var circleGeometry = new THREE.BufferGeometry().setFromPoints(points);

  let lineMaterial = new THREE.LineBasicMaterial( {
    color: color,
    linewidth: lineWidth
  } );
  let inc = 15;

  let latlon = new THREE.Group();
  // Longitude
  var lon = new THREE.Line( circleGeometry, lineMaterial );
  lon.renderOrder = globeRenderOrder;
  lon.scale.setScalar(1);
  lon.rotateY(lonRadians);
  latlon.add(lon);
  return latlon;
}

//----------------------------------------
//----------------------------------------
function getPuckPathRotating(t, color) {
  let pointsRot = sim.pathRot(0, t, 30);
  pointsRot.forEach((p, i, arr) => {
    arr[i] = p.cartesian;
  });
  let circleGeometry = new THREE.BufferGeometry().setFromPoints(pointsRot);
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

  var path = new THREE.Line( circleGeometry, lineMaterial );
  path.renderOrder = pathRenderOrder;
  path.simType = 'path';
  path.materialFront = lineMaterial;
  path.materialOccluded = materialOccluded;
  return path;
}

//----------------------------------------
// getPuckPathFixed
//----------------------------------------
function getPuckPathFixed(t, color) {
  let pointsFixed = sim.pathFixed(0, t, 30);
  pointsFixed.forEach((p, i, arr) => {
    arr[i] = p.cartesian;
  });
  let circleGeometry = new THREE.BufferGeometry().setFromPoints(pointsFixed);
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

  var path = new THREE.Line( circleGeometry, lineMaterial );
  path.renderOrder = pathRenderOrder;
  path.materialFront = lineMaterial;
  path.materialOccluded = materialOccluded;
  path.simType = 'path';
  return path;
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

function updateRotGroup() {
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

    const v = sim.v(t).normalize();
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
      let dir = E.normalize();
      let origin = p.cartesian;
      let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                        necolor, 20, headLen, 0.6*headLen);
      prepArrowHelper(arrowHelper, eastRenderOrder);
      arrowsGroup.add(arrowHelper);
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
    if (view == ROTATIONAL_VIEW) {
      let path = getPuckPathRotating(t, rotatingPathColor);
      earthGroup.add(path);
    } else {
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
  if (plane) {
    plane.rotation.x = camera.rotation.x;
    plane.rotation.y = camera.rotation.y;
    plane.rotation.z = camera.rotation.z;
  }

  updateRotGroup();

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
