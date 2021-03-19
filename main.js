var View = function() {
}

let demos = [];

let camera;
// The entire scene
let scene = new THREE.Scene();
// The scene with everything in the earth's rotational frame.
let earthGroup = new THREE.Group();
let fixedPathGroup = new THREE.Group();
let starGroup = new THREE.Group();
let renderer;
let controls;
let efficientPath = true;
// turning transparency off improves the FPS only a little -- from ~25
// to ~30.
let transparency = true;
const maxPathSegments = 300;

// Between 1 and 10-ish
let animSpeed = 5;
let animInc = animSpeed*5;
if (localStorage.animInc) {
  animInc = Number(localStorage.animInc);
}
document.getElementById('speed').innerHTML = animInc.toFixed(1);

// const eccentricitySlider = document.getElementById('eccentricity-slider')

const radius = 1;
let radiusInWindow;

let arrowScale = 0.002;
let starStreakScale = 1;

let plane;//, arrows;
let arrowLen = 0.22;
const headLen = 0.045;
let starSize = 0.007;

let starStreaks = false;
let arrowsVisible = 1;
let puckVisible = false;
let northVisible = false;
let eastVisible = false;
let vVisible = false;
updateArrowVisibility();

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
const time0 = 0;
let time = time0;
let oldTime = -1;
// Number of seconds we've spent in geostationary orbit
let geoStationaryTime = 0;

const ROTATIONAL_VIEW = 0;
const FIXED_VIEW = 1;
const DEBUG_VIEW = 2;
const view0 = ROTATIONAL_VIEW;
let view = view0;

let globalEarth = null;

if (localStorage.view) {
  view = +localStorage.view;
  document.getElementById('frame').value = Number(localStorage.view);
}

if (localStorage.arrowScale) {
  arrowScale = +localStorage.arrowScale;
}
if (localStorage.starStreakScale) {
  starStreakScale = +localStorage.starStreakScale;
}

if (view == FIXED_VIEW) {
  document.getElementById('frame').innerHTML = 'Inertial'
} else if (view == ROTATIONAL_VIEW) {
  document.getElementById('frame').innerHTML = 'Rotating'
} else if (view == DEBUG_VIEW) {
  document.getElementById('frame').innerHTML = 'debug'
}

let visiblePath = 0;
let rotatingPathVisible = false;
let inertialPathVisible = false;
updatePathVisibility();

// document.getElementById('time').value = (time/(60*60)).toFixed(DEBUG_DECIMALS);
document.getElementById('time').innerHTML = (time/(60*60)).toFixed(DEBUG_DECIMALS);

if (localStorage.lat0) {
  document.getElementById('lat0').value = Number(localStorage.lat0);
}
if (localStorage.lon0) {
  document.getElementById('lon0').value = Number(localStorage.lon0);
}
if (localStorage.north0) {
  document.getElementById('north0').value = Number(localStorage.north0);
}
if (localStorage.east0) {
  document.getElementById('east0').value = Number(localStorage.east0);
}
if (localStorage.eccentricity) {
  document.getElementById('eccentricity-value').value = Number(localStorage.eccentricity);
}
document.getElementById('angular-speed-ratio').value = 1;

const angularSpeedRatioInput = document.getElementById('angular-speed-ratio')
const eccentricityInput = document.getElementById('eccentricity-value')

function getEccentricityScale(eccentricity) {
  const sq_eccentricity = eccentricity * eccentricity

  let scaleA = Math.pow(1 - sq_eccentricity, -1/6);
  let scaleB = Math.pow(1 - sq_eccentricity, 1/3);

  // Keep the x-axis scale the same
  // scaleB = scaleB / scaleA;
  // scaleA = 1;

  const graphic = document.getElementById('graphic')

  let target = new THREE.Vector3(0,0,0);
  let dir = camera.getWorldDirection(target).normalize();

  // scaleA >= 1
  // scaleB <= 1
  // 0 <= dir.y <= 1

  const theta = Math.abs(Math.atan2(dir.y, Math.sqrt(1-sq(dir.y))));

  // // Code keeping the x-axis scale the same
  // const diffA = scaleA - 1;
  // const diffB = 1-scaleB;
  // const f = Math.sin(Math.abs(dir.y)*Math.PI/2);
  // scaleA -= f * diffA;
  // scaleB += f * diffB;

  // Code keeping volume constant
  const diffA = 0;
  const diffB = scaleA-scaleB;
  // const f = Math.sin(Math.abs(dir.y)*Math.PI/2);
  const f = Math.sin(theta);
  scaleA -= f * diffA;
  scaleB += f * diffB;

  // if (Math.abs(dir.y) > 1e-4) {
  //   scaleA = 1;
  //   scaleB = 1;
  // }

  return [scaleA, scaleB];
}

const resizeGlobe = (eccentricity) => {
  document.getElementById('eccentricity-value').value = eccentricity

  const [scaleA, scaleB] = getEccentricityScale(eccentricity);

  const svg = graphic.getElementsByTagName('svg')[0]
  // svg.style.transform = `scale(${scaleA}, ${scaleB})`
  svg.style.transform = `scale(${scaleA}, ${scaleB})`
}

const zPosition = 10;
const zZero = -1.1;

const formatted = (v) => {
  return v < 10 ? "0" + v : v;
};

function incTime(inc) {
  time += inc;

  document.getElementById('time').innerHTML = (time/(60*60)).toFixed(DEBUG_DECIMALS);
  // document.getElementById('time').value = (time/(60*60)).toFixed(DEBUG_DECIMALS);
  // document.getElementById('rotation').value =
  //   degrees(earthRotation(time)).toFixed(2);
  // const clock = document.getElementById('clock')

  // const dayItem = clock.getElementsByClassName('day')[0]
  // const hourItem = clock.getElementsByClassName('hour')[0]
  // const minItem = clock.getElementsByClassName('min')[0]
  // const secItem = clock.getElementsByClassName('sec')[0]

  // let seconds = Math.floor(time)
  // dayItem.innerHTML = formatted(Math.floor(seconds / 86400));
  // seconds %= 86400;

  // hourItem.innerHTML = formatted(Math.floor(seconds / 3600));
  // seconds = seconds % 3600;

  // minItem.innerHTML = formatted(Math.floor(seconds / 60));

  // seconds %= 60;
  // secItem.innerHTML = formatted(Math.floor(seconds));

  document.getElementById('rotation').innerHTML =
    degrees(globalEarth.earthRotation(time)).toFixed(2);

  if (view == ROTATIONAL_VIEW) {
    geoStationaryTime += inc;
  }

  if (starStreaks) {
    updateBackgroundStars();
  }
}

function rotDelta() {
  let delta = 0;
  if (view == DEBUG_VIEW) {
    delta = -sim.p(time).lon - globalEarth.earthRotation(time) -
      globalEarth.earthRotation(-geoStationaryTime) - fixedViewRotation0;
  }
  return delta;
}

function viewRotationEarthMap() {
  const d = rotDelta();
  return globalEarth.earthRotation(-geoStationaryTime) +
    globalEarth.earthRotation(time) + fixedViewRotation0 + d;
}

function viewRotationEarth() {
  const d = rotDelta();
  return globalEarth.earthRotation(time) + d;
}

const skyRotationFactor = 0.7;
function viewRotationSky() {
  const d = rotDelta();
  return -globalEarth.earthRotation(-geoStationaryTime)*skyRotationFactor - d;
}

function viewRotationScene() {
  return globalEarth.earthRotation(-geoStationaryTime) + fixedViewRotation0;
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
    degrees(globalEarth.earthRotation(time)).toFixed(2);
  updateBackgroundStars();
  updateAndRender();
}

function lat0Changed() {
  localStorage.lat0 = +document.getElementById('lat0').value;
  resetSim();
}
function lon0Changed() {
  localStorage.lon0 = +document.getElementById('lon0').value;
  resetSim();
}
function north0Changed() {
  localStorage.north0 = +document.getElementById('north0').value;
  resetSim();
}
function east0Changed() {
  localStorage.east0 = +document.getElementById('east0').value;
  resetSim();
}

// function timePeriodChanged(forceStablePeriod = false) {
//   localStorage.timePeriod = +timePeriodInput.value;
//   rebuildGlobalEarth(forceStablePeriod)
//   resetSim();
// }

function angularSpeedRatioChanged() {
  localStorage.angularSpeedRatio = +angularSpeedRatioInput.value;
  rebuildGlobalEarth();//forceStablePeriod)
  resetSim();
}

function setToStableAngularSpeed() {
  angularSpeedRatioInput.value = (globalEarth.OmegaS / OmegaR).toFixed(4);
  angularSpeedRatioChanged();
}

function rotationChanged() {
  console.log("Not supported at this time");
}

function rebuildGlobalEarth() {
  const angularSpeedRatio = +angularSpeedRatioInput.value;
  // globalEarth = new Earth(+eccentricitySlider.value, angularSpeedRatio);
  globalEarth = new Earth(+eccentricityInput.value, angularSpeedRatio);
  // const period = !forceStablePeriod && !rotateAtStableSpeed.checked ? +timePeriodInput.value : undefined
  // globalEarth = new Earth(true, +eccentricitySlider.value, period);
}

//------------------------------------------------------------
// Initialization/setup
//------------------------------------------------------------

function init() {
  document.onkeydown = keydown;

  loadDemos();

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
  let graphicParent = document.getElementById('graphic');
  let w = graphicParent.clientWidth;
  if (graphicParent.clientHeight < w) {
    w = graphicParent.clientHeight;
  }
  renderer.setSize(w, w);
  // renderer.domElement.setAttribute('shape-rendering', 'optimizeSpeed');
  graphicParent.appendChild(renderer.domElement);

  radiusInWindow = radius/(width/2)*(w/2);

  // scene.add(getTransparentPlane());

  // greatCircle = new GreatCircle(1, Math.PI/4, 0);
  // scene.add(getGlobe());
  // scene.add(getGreatCircle());
  // scene.add(getArrowsGroup());

  // //----------------------------------------
  // let svg = renderer.domElement;
  // let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  // while (svg.firstChild) {
  //   g.appendChild(svg.firstChild);
  // }

  // const e = document.getElementById('eccentricity-value').value;
  // const [scaleA, scaleB] = getEccentricityScale(e);
  // g.setAttribute('transform', `scale(${scaleA}, ${scaleB})`);

  // console.log(svg);
  // console.log(g);
  // svg.appendChild(g);
  // //----------------------------------------

  rebuildGlobalEarth();

  // rk4test1();
  // rk4test2();
  // rk4test3();
  // rk4test4();

  document.getElementById('rotation').innerHTML =
    degrees(globalEarth.earthRotation(time)).toFixed(2);
  resetSim(false);


  updateEarthGroup();
  scene.add(earthGroup);
  scene.add(fixedPathGroup);

  updateBackgroundStars();
  scene.add(starGroup);

  window.addEventListener('resize', onWindowResize, false);
  controls.addEventListener('change', render);
}

function resetSim(dorender=true, launchNorth=null, launchEast=null, newView=true) {
  pathInc = PATH_INC_DEFAULT;
  const launchLatitude = +document.getElementById('lat0').value;
  const launchLongitude = +document.getElementById('lon0').value;
  if (launchNorth == null) {
    launchNorth = +document.getElementById('north0').value;// * globalEarth._V;
  }
  if (launchEast == null) {
    launchEast = +document.getElementById('east0').value;// * globalEarth._V
      // + globalEarth._V;
  }
  const launchV = new Velocity(launchNorth, launchEast, 0);

  time = time0;
  oldTime = -1;
  geoStationaryTime = 0;

  console.log('newView',newView);
  if (newView) {
    view = view0;
    if (localStorage.view) {
      view = +localStorage.view;
      document.getElementById('frame').value = Number(localStorage.view);
    }
  }
  console.log(view, ROTATIONAL_VIEW);

  sim = new Coriolis(
      // radians(launchLatitude), radians(launchLongitude), launchV, globalEarth, +eccentricitySlider.value);
      radians(launchLatitude), radians(launchLongitude), launchV, globalEarth);

  if (dorender) {
    render();
  }
}

function keydown(event) {
  event.stopPropagation();
  var x = event.keyCode;
  var key = event.key;
  var changed = false;
  if (x == 40 || key == "j" || key == "J") {
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
    // incTime(2*animInc);
    sim.step(1000);
    changed = true;
  } else if (x == 37) {
  //   // Left arrow
  //   // earthRotation -= animInc*2;
  //   // time -= animInc*2;
  //   incTime(-2*animInc);
  //   changed = true;
  } else if (key == 'f') {
    console.log('view', view);
    if (view == FIXED_VIEW) {
      view = ROTATIONAL_VIEW;
      document.getElementById('frame').innerHTML = 'Rotating'
    } else if (view == ROTATIONAL_VIEW) {
    //   view = DEBUG_VIEW;
    //   document.getElementById('frame').innerHTML = 'debug'
    // } else if (view == DEBUG_VIEW) {
      view = FIXED_VIEW;
      document.getElementById('frame').innerHTML = 'Inertial'
    } else {
      view = ROTATIONAL_VIEW;
      document.getElementById('frame').innerHTML = 'Rotating'
    }
    localStorage.view = view;
    updatePathVisibility();
    changed = true;
  } else if (key == 'p') {
    visiblePath = (visiblePath+1)%5;
    if (visiblePath == 0) {
      document.getElementById('path').innerHTML = 'Match frame';
    } else if (visiblePath == 1) {
      document.getElementById('path').innerHTML = 'All';
    } else if (visiblePath == 2) {
      document.getElementById('path').innerHTML = 'Rotating';
    } else if (visiblePath == 3) {
      document.getElementById('path').innerHTML = 'Inertial';
    } else {
      document.getElementById('path').innerHTML = 'None';
    }
    updatePathVisibility();
    changed = true;
  } else if (key == 'P') {
    efficientPath = !efficientPath;
    document.getElementById('path-draw').innerHTML = efficientPath ? 'Efficient' : 'Exact';
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
  } else if (key == 'u') {
    arrowScale /= 1.1;
    localStorage.arrowScale = arrowScale;
    changed = true;
  } else if (key == 'U') {
    arrowScale *= 1.1;
    localStorage.arrowScale = arrowScale;
    changed = true;
  } else if (key == 'x') {
    starStreakScale /= 1.1;
    localStorage.starStreakScale = starStreakScale;
    updateBackgroundStars();
    changed = true;
  } else if (key == 'X') {
    starStreakScale *= 1.1;
    localStorage.starStreakScale = starStreakScale;
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
  } else if (key == 'a') {
    arrowsVisible = (arrowsVisible+1)%4;
    updateArrowVisibility();
    changed = true;
  } else if (key == 'r') {
    // reset
    resetSim();
    changed = true;
  } else if (key == ' ') {
    toggleAnimate();
    // animation = !animation;
    // if (animation) {
    //   starStreaks = false;
    //   tick();
    // }
  }
  if (changed) {
    updateAndRender();
  }
}

function updatePathVisibility() {
  if (visiblePath == 0) {
    // matches frame
    rotatingPathVisible = (view == ROTATIONAL_VIEW);
    inertialPathVisible = (view == FIXED_VIEW);
  } else {
    rotatingPathVisible = (visiblePath == 1 || visiblePath == 2);
    inertialPathVisible = (visiblePath == 1 || visiblePath == 3);
  }
}

function updateArrowVisibility() {
  puckVisible = (arrowsVisible == 0 || arrowsVisible == 2 ||
                 arrowsVisible == 3);
  northVisible = (arrowsVisible < 2);
  eastVisible = (arrowsVisible < 2);
  vVisible = (arrowsVisible < 3);
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
  // let streakMaterial = new THREE.LineBasicMaterial( {
  //   color: new THREE.Color(0.6,0.6,0.6),
  //   // color: black,
  //   linewidth: starSize*100,
  // } );
  let streakMaterials = [];
  let streakSegs = 20;
  for (let i = streakSegs; i > 0; --i) {
    let m = new THREE.LineBasicMaterial( {
      color: new THREE.Color(i/streakSegs, i/streakSegs, i/streakSegs),
      linewidth: starSize*200,
    } );
    streakMaterials.push(m);
  }
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

    // if (starStreaks && view == ROTATIONAL_VIEW && k > -0.00001) {
    //   // const start = theta - k - .02;
    //   const start = theta - .08;
    //   const end = theta;
    //   const inc = (end-start)/10;
    //   for (let theta_ = start; theta_ <= end-inc+0.000001; theta_ += inc) {
    //     const q0 = new THREE.Vector3(
    //       R*Math.cos(theta_), y, R*Math.sin(theta_));
    //     const q1 = new THREE.Vector3(
    //       R*Math.cos(theta_+inc), y, R*Math.sin(theta_+inc));
    //     const points = [q0, q1];
    //     let geometry = new THREE.BufferGeometry().setFromPoints(points);
    //     let path = new THREE.Line(geometry, streakMaterials[0]);
    //     path.renderOrder = pathRenderOrder;
    //     path.materialFront = streakMaterials[0];
    //     path.materialOccluded = streakMaterialOccluded;
    //     path.simType = 'star';
    //     starGroup.add(path);
    //   }
    // }
    if (starStreaks && view == ROTATIONAL_VIEW) {
      const length = 0.16 * starStreakScale;
      const start = theta - length;
      const end = theta;
      const inc = (end-start)/streakSegs;
      for (let i = 0; i < streakSegs; ++i) {
        const theta_ = start + i*inc;
        const q0 = new THREE.Vector3(
          R*Math.cos(theta_), y, R*Math.sin(theta_));
        const q1 = new THREE.Vector3(
          R*Math.cos(theta_+inc), y, R*Math.sin(theta_+inc));
        const points = [q0, q1];
        let geometry = new THREE.BufferGeometry().setFromPoints(points);
        let path = new THREE.Line(geometry, streakMaterials[i]);
        path.renderOrder = pathRenderOrder;
        path.materialFront = streakMaterials[i];
        path.materialOccluded = streakMaterialOccluded;
        path.simType = 'star';
        path.materialFront.linecap = 'butt';
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

  if (transparency) {
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
  } else {
    // for (let i = 0; i < points.length-1; ++i) {
      let geometry = new THREE.BufferGeometry().setFromPoints(
        points.slice(0, points.length));
      var path = new THREE.Line(geometry, lineMaterial);
      path.renderOrder = pathRenderOrder;
      path.materialFront = lineMaterial;
      path.materialOccluded = materialOccluded;
      path.simType = 'path';
      pathGroup.add(path);
    // }
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
  let timeInc = 0;
  if (oldTime > 0) {
    timeInc = time - oldTime;
  }
  oldTime = time;
  // const t = time;
  // const phi = sim.phi(t);
  // const phi_ = sim.phi_(t);
  // debug.phi = phi;
  // debug.phi_ = phi_;

  let T0 = sim.T0(sim._theta, sim.phi_dot(time), sim.theta_dot(time));

  debug.theta = sim._theta;
  debug.phi = sim._phi;
  debug.T = sim.T;
  // debug.v = Math.sqrt(sim.T) * globalEarth.a * globalEarth.Omega;
  debug.v = Math.sqrt(sim.T) * globalEarth.a * OmegaR;
  // debug.v0 = Math.sqrt(sim.T0) * globalEarth.a * globalEarth.Omega;
  // debug.v0 = Math.sqrt(T0) * globalEarth.a * globalEarth.Omega;
  debug.v0 = Math.sqrt(T0) * globalEarth.a * OmegaR;
  debug.theta_dot = sim.theta_dot(time);
  debug.phi_dot = sim.phi_dot(time);
  debug.L0 = sim.L0;
  debug.T0 = T0;//sim.T0;

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
    let pradius = 0.02;
    // let bradius = 0.06;
    let sgeometry = new THREE.SphereBufferGeometry(pradius, 32, 32);
    // let sgeometry = new THREE.BoxBufferGeometry(bradius, bradius, bradius);
    let material = new THREE.MeshBasicMaterial({color: vcolor});
    let materialOccluded = new THREE.MeshBasicMaterial({color: vcolor});
    occludeMaterial(materialOccluded);
    let sphere = new THREE.Mesh(sgeometry, material);
    sim.step(timeInc);
    // const p = sim.p(t);
    const p = sim.p(time);
    sphere.translateOnAxis(p.cartesian, 1);
    sphere.renderOrder = vecRenderOrder;
    sphere.materialFront = material;
    sphere.materialOccluded = materialOccluded;
    // if (arrowsVisible == 0 || arrowsVisible == 2 || arrowsVisible == 3) {
    if (puckVisible) {
      earthGroup.add(sphere);
    }

    let v;
    if (view == ROTATIONAL_VIEW) {
      v = sim.vRotating(time);
    } else {
      v = sim.vInertial(time);
    }
    // if (sim._theta > Math.PI/2 || sim._theta < -Math.PI/2) {
    //   v = v.multiplyScalar(-1);
    //   // E = E.multiplyScalar(-1);
    //   // N = N.multiplyScalar(-1);
    // }
    let E = east(p.cartesian);
    let N = north(p.cartesian);
    E = E.multiplyScalar(v.clone().dot(E));
    N = N.multiplyScalar(v.clone().dot(N));
    // debug.temp = v.x + " " + v.y;

    // if (arrowsVisible < 2) {
    if (vVisible) {
      // v
      let length = v.length();
      let dir = v.normalize();
      let origin = p.cartesian;

      let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                        vcolor, 20, headLen, 0.6*headLen);
      prepArrowHelper(arrowHelper, vecRenderOrder);
      arrowsGroup.add(arrowHelper);
    }
    if (eastVisible) {
      // east
      let length = E.length();
      if (length > headLen) {
        let dir = E.normalize();
        let origin = p.cartesian;
        let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                          necolor, 20, headLen, 0.6*headLen);
        prepArrowHelper(arrowHelper, eastRenderOrder);
        arrowsGroup.add(arrowHelper);
      }
    }
    if (northVisible) {
      // north
      let length = N.length();
      if (length > headLen) {
        let dir = N.normalize();
        let origin = p.cartesian;
        let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                          necolor, 20, headLen, 0.6*headLen);
        prepArrowHelper(arrowHelper, northRenderOrder);
        arrowsGroup.add(arrowHelper);
      }
    }
    // }
    // puck's path
    // if (view == ROTATIONAL_VIEW) {
    // if (visiblePath == 0 || visiblePath == 1) {
    if (rotatingPathVisible) {
      // let path = getPuckPathRotating(t, rotatingPathColor);
      let path = getPuckPathRotating(time, rotatingPathColor);
      earthGroup.add(path);

    }
    if (inertialPathVisible) {
      let path = getPuckPathFixed(time, fixedPathColor);
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

  earthGroup.rotation.y = viewRotationEarth();
  starGroup.rotation.y = viewRotationSky();
  fixedPathGroup.rotation.y = rotDelta();
  scene.rotation.y = viewRotationScene();

  renderer.clear();
  map.draw();
  renderer.render(scene, camera);

  // resizeGlobe(+eccentricitySlider.value)
  resizeGlobe(+eccentricityInput.value)
}

function updateAndRender() {
  controls.update();
  render();
}

//----------------------------------------
// animate
//----------------------------------------
// var prevTime = null;
const times = [];
let fps;
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

  // update fps
  const now = performance.now();
  while (times.length > 0 && times[0] <= now - 1000) {
    times.shift();
  }
  times.push(now);
  fps = times.length;
  debug.fps = fps;

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
  svgtext = XMLS.serializeToString(renderer.domElement);

  let textarea = document.getElementById("snapshot-output");
  // textarea.innerHTML = svgtext;
  textarea.value = svgtext;

  textarea.select();
  document.execCommand('copy');

  // const el = document.createElement('textarea');
  // el.value = svgtext;
  // document.body.appendChild(el);
  // el.select();
  // document.execCommand('copy');
  // document.body.removeChild(el);
}

var Demo = function(msg, frame, lat, lon, north, east, simSpeed, ecc, ang) {
  this.msg = msg;
  this.frame = frame;
  this.lat = lat;
  this.lon = lon;
  this.north = north;
  this.east = east;
  this.simSpeed = simSpeed;
  this.ecc = ecc;
  this.ang = ang;
}

//----------------------------------------
// demoChanged
//----------------------------------------
function demoChanged() {
  let demoName = document.getElementById('demos').value;
  console.log('demo: ', demoName);
  instructions = document.getElementById('demoInstructions');

  animate = true;
  let demo = demos[demoName];

  instructions.style.visibility = 'visible';

  puckVisible = true;
  northVisible = false;
  eastVisible = false;
  vVisible = false;

  // rotatingPathVisible = false;
  // inertialPathVisible = false;

  console.log(demo);

  instructions.innerHTML = demo.msg;
  if (demo.frame == "rotating") {
    view = ROTATIONAL_VIEW;
    document.getElementById('frame').innerHTML = 'Rotating'
  } else {
    view = FIXED_VIEW;
    document.getElementById('frame').innerHTML = 'Inertial'
  }
  updatePathVisibility();

  document.getElementById('lat0').value = demo.lat;
  document.getElementById('lon0').value = demo.lon;
  document.getElementById('north0').value = demo.north;
  document.getElementById('east0').value = demo.east;

  animInc = demo.simSpeed;
  document.getElementById('speed').innerHTML = animInc.toFixed(1);

  document.getElementById('eccentricity-value').value = demo.ecc;
  document.getElementById('angular-speed-ratio').value = demo.ang;

  rebuildGlobalEarth();
  // globalEarth = new Earth(false);

  resetSim(true, null, null, false);
  // animate = false;
  // animation = false;

  updateAndRender();
  // if (animate && !animation) {
  //   // animation = true;
  //   // tick();
  //   toggleAnimate();
  // }
}

//----------------------------------------
// snap
//----------------------------------------
function snap() {
  console.log('Taking SVG snapshot');

  let svg = renderer.domElement;
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  while (svg.firstChild) {
    g.appendChild(svg.firstChild);
  }

  const e = document.getElementById('eccentricity-value').value;
  const [scaleA, scaleB] = getEccentricityScale(e);
  g.setAttribute('transform', `scale(${scaleA}, ${scaleB})`);

  console.log(svg);
  console.log(g);
  svg.appendChild(g);

  XMLS = new XMLSerializer();
  // svgtext = XMLS.serializeToString(renderer.domElement);
  svgtext = XMLS.serializeToString(svg);

  let textarea = document.getElementById("snapshot-output");
  // textarea.innerHTML = svgtext;
  textarea.value = svgtext;

  textarea.select();
  document.execCommand('copy');

  // const el = document.createElement('textarea');
  // el.value = svgtext;
  // document.body.appendChild(el);
  // el.select();
  // document.execCommand('copy');
  // document.body.removeChild(el);

  while (g.firstChild) {
    svg.appendChild(g.firstChild);
  }
  svg.removeChild(g);
}

document.getElementById('reset-eccentricity').onclick = function() {
  // eccentricitySlider.value = "0.08182"
  eccentricityInput.value = "0.08182"
  localStorage.eccentricity = +eccentricityInput.value;
  rebuildGlobalEarth()
  resetSim()
}

document.getElementById('reset-eccentricity-sphere').onclick = function() {
  // eccentricitySlider.value = "0"
  eccentricityInput.value = "0"
  localStorage.eccentricity = +eccentricityInput.value;
  rebuildGlobalEarth()
  resetSim()
}

const rotateAtStableSpeed = document.getElementById('rotate-at-stable-speed')

// const rebuildGlobalEarth = (forceStablePeriod = false) => {
//   const period = !forceStablePeriod && !rotateAtStableSpeed.checked ? +timePeriodInput.value : undefined
//   globalEarth = new Earth(true, +eccentricitySlider.value, period);
// }

// eccentricitySlider.onchange = function(e) {
//   rebuildGlobalEarth()
//   resetSim()
// }

document.getElementById('eccentricity-value').oninput = function(e) {
  // eccentricitySlider.value = e.target.value
  localStorage.eccentricity = +eccentricityInput.value;
  console.log('*-**', localStorage.eccentricity);

  rebuildGlobalEarth()
  resetSim()
}

// rotateAtStableSpeed.onchange = function(e) {
//   timePeriodInput.disabled = e.target.checked
//   rebuildGlobalEarth()
//   resetSim()
// }

function addDemo(name, r, theta, phi, pr, ptheta, pphi,
                 gamma=0, gamma_star=0, eta=0, eta_star=0, mu_m=0, simSpeed=1,
                 collisionType="elastic", updateP=true, updateM=true,
                 showPath=true, zoom=0.5) {
  // console.log("adding " + name);
  demos[name] = { r:r,
                  theta:theta,
                  phi:phi,
                  pr:pr,
                  ptheta:ptheta,
                  pphi:pphi,
                  gamma:gamma,
                  gamma_star:gamma_star,
                  eta:eta,
                  eta_star:eta_star,
                  mu_m:mu_m,
                  simSpeed:simSpeed,
                  collisionType:collisionType,
                  updateP:updateP,
                  updateM:updateM,
                  showPath:showPath,
                  zoom:zoom,
                };
  // console.log(demos);
}

function updateDemos(data) {
  var demoSelect = document.getElementById("demos");

  var lines = data.split(/\r\n|\n|\r/);
  var headers = lines[0].split(',');
  for (var i = 1; i < lines.length; ++i) {
    var tokens = lines[i].split(',');
    if (tokens.length > 3) {
      var j = 1;
      var name = tokens[0];
      var option = document.createElement("option");
      option.text = name;
      demoSelect.add(option);

      // (msg, frame, lat, lon, north, east, simSpeed, ecc, ang)
      demos[name] = new Demo(tokens[j++],
                             tokens[j++], // frame
                             Number(tokens[j++]),
                             Number(tokens[j++]),
                             Number(tokens[j++]),
                             Number(tokens[j++]),
                             Number(tokens[j++]),
                             Number(tokens[j++]),
                             Number(tokens[j++])
                            );
      // console.log(demos[name]);

      // addDemo(name, 
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         Number(tokens[j++]),
      //         tokens[j++],
      //         (tokens[j++].toLowerCase() == "true"),
      //         (tokens[j++].toLowerCase() == "true"),
      //         (tokens[j++].toLowerCase() == "true"),
      //         Number(tokens[j++])
      //        );
    }
  }
}

function loadDemos() {
  $.ajax({
    async:true,
    url: 'demos.csv',
    dataType: 'text',
    success: function(data) 
    {
      $('element').append(data);
      console.log(data);
      updateDemos(data);
      
    //   checkDemoCookie(demo);
    //   demoChanged();

    //   if (paramsString) {
    //     let params = paramsString.split(',').map(x => +x);
    //     addDemo("url", params[0], params[1], params[2],
    //             params[3], params[4], params[5],
    //             0, 0, 0, 0, 0, 1,
    //              "elastic", true, true,
    //              true, zoom);

    //     var option = document.createElement("option");
    //     option.text = "url";
    //     document.getElementById('demos').add(option);

    //     // console.log(demos);
    //     demo = "url";
    //     // console.log(params);
    //     document.getElementById("demos").value = "url";
    //     demoChanged();
    //     toggleAnimate();

    //     loadView();
    //   }
    }
  });
}

function removeFocus() {
  document.activeElement.blur();
}

function toggleAnimate() {
  animation = !animation;
  if (animation) {
    starStreaks = false;
    tick();
  }

  if (animation) {
    document.getElementById("play").innerHTML =
      "<font size=\"6\"><i class=\"fa fa-pause\"></i>";
    tick();
  } else {
    document.getElementById("play").innerHTML =
      "<font size=\"6\"><i class=\"fa fa-play\"></i>";
  }
}
