let camera;
// The entire scene
let scene = new THREE.Scene();
// The scene with everything in the earth's rotational frame.
let rotGroup = new THREE.Group();
let renderer;
let controls;

// Between 1 and 10-ish
let animSpeed = 5;
let animInc = animSpeed*0.01;
if (localStorage.animInc) {
  animInc = Number(localStorage.animInc);
}

const radius = 1;
let radiusInWindow;

let plane;//, arrows;
let arrowLen = 0.22;
const headLen = 0.045;

let map = new Map();

let animation = false;
let lineWidth = 2;

const blue = 0x0000cc;
const lightBlue = 0x0000ff;
const red = 0xcc0000;

const vecRenderOrder = 10;
const eastRenderOrder = 8;
const northRenderOrder = 8;
const pathRenderOrder = 2;
const greatCircleRenderOrder = 1;
const globeRenderOrder = 0;

// Longitude for the different views
// Where we're looking when in the rotational view
const rotationalViewLon = 0;
// Number of degrees we rotate the fixed frame for the view
// const fixedViewRotation = 75;
const fixedViewRotation = 0;
// Number of degrees the earth is rotated from the Prime Meridian
// in the fixed frame view.
let earthRotation = 0;

const launchLongitude = -30;
let sim = new CoriolisSim(radians(launchLongitude));

const ROTATIONAL_VIEW = 0;
const FIXED_VIEW = 1;
const view = ROTATIONAL_VIEW;

function viewRotation() {
  return fixedViewRotation + earthRotation;
}

runTests();

init();
tick();
animate();

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
     width / - 2, width / 2, height / 2, height / - 2, 1, 100);

  // Don't remove this comment.
  // Setting the background makes the renderer clear everything
  // before rendering. We want control over the clear so we can
  // draw the earth.
  // scene.background = new THREE.Color(1, 1, 1);

  renderer = new THREE.SVGRenderer();
  renderer.autoClear = false;
  // renderer = new THREE.WebGLRenderer();

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;

  camera.position.z = 10;

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
  scene.add(rotGroup);

  scene.add(getBackgroundPlanet());

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
    changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    animInc *= 1.1;
    localStorage.setItem("animInc", animInc);
    changed = true;
  } else if (x == 39) {
    // Right arrow
    earthRotation += animInc*2;
    changed = true;
  } else if (x == 37) {
    // Left arrow
    earthRotation -= animInc*2;
    changed = true;
  } else if (key == "d") {
  } else if (key == " ") {
    animation = !animation;
    if (animation)
      animate();
  }
  if (changed) {
    tick();
  }
}

//------------------------------------------------------------
// Functions to create 3D objects
//------------------------------------------------------------

function getBackgroundPlanet() {
  let group = new THREE.Group();

  //-----------------------
  // Background sphere
  let geometry = new THREE.SphereBufferGeometry(.08, 32, 32);
  let material = new THREE.MeshBasicMaterial({color: blue});
  let sphere = new THREE.Mesh(geometry, material);
  const p = new THREE.Vector3(-1.5, 1, -2);
  sphere.translateOnAxis(p, 1);
  group.add(sphere);

  const r = 0.2;
  var circle =
    new THREE.EllipseCurve(0, 0, r, r);
  var points = circle.getPoints(50);
  var circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
  let lineMaterial = new THREE.LineBasicMaterial( {
    color: 0xaa0000,
    linewidth: lineWidth
  } );
  let inc = 15;

  let latlon = new THREE.Group();
  // Longitude
  var ring = new THREE.Line( circleGeometry, lineMaterial );
  ring.translateOnAxis(p, 1);
  ring.rotateZ(Math.PI/8);
  ring.rotateX(Math.PI/2);
  group.add(ring);
  return group;
}

// //----------------------------------------
// // getGlobe
// //----------------------------------------
// function getGlobe() {
//   var vertices = [];
//   var divisions = 80;
//   for ( var i = 0; i <= divisions; i ++ ) {
//     var v = ( i / divisions ) * ( Math.PI * 2 );
//     var x = Math.sin( v );
//     var y = Math.cos( v );
//     vertices.push( x, y, 0 );
//   }

//   var circleGeometry = new THREE.BufferGeometry();
//   circleGeometry.addAttribute(
//     'position', new THREE.Float32BufferAttribute( vertices, 3 ));

//   rotGroup = new THREE.Scene();
//   scene.add(rotGroup);

//   // Lat/lon
//   let lineMaterial = new THREE.LineBasicMaterial( {
//     color: 0xaaaaaa,
//     linewidth: lineWidth
//   } );
//   let inc = 15;

//   let latlon = new THREE.Group();
//   // Latitude
//   for (let i = -90; i < 90; i+=inc) {
//     var lat = new THREE.Line(circleGeometry, lineMaterial);
//     lat.renderOrder = globeRenderOrder;
//     lat.scale.setScalar(Math.cos(i*Math.PI/180));
//     lat.translateY(Math.sin(i*Math.PI/180));
//     lat.rotateX(Math.PI/2);
//     latlon.add(lat);
//   }

//   // Longitude
//   for (let i = 0; i < 180; i+=inc) {
//     var lon = new THREE.Line( circleGeometry, lineMaterial );
//     lon.renderOrder = globeRenderOrder;
//     lon.scale.setScalar(1);
//     lon.rotateY(i*Math.PI/180);
//     // latlon.add(lon);
//   }
//   return latlon;
// }

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
// getLonLine
//----------------------------------------
function getPuckPath(t, color) {
  let points = sim.path(0, t, 30);
  points.forEach((p, i, arr) => {
    arr[i] = p.cartesian;
  });
  // let points = sim.pathFixed(0, t, 30);
  let circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
  // let lineMaterial = new THREE.LineBasicMaterial( {
  //   color: color,
  //   linewidth: lineWidth
  // } );
  let lineMaterial = new THREE.LineDashedMaterial( {
    color: color,
    linewidth: lineWidth,
    dashSize: 5,
    gapSize: 10,
  } );
  var path = new THREE.Line( circleGeometry, lineMaterial );
  path.renderOrder = pathRenderOrder;
  return path;
}

// //----------------------------------------
// // getLonLine
// //----------------------------------------
// function getPuckPathRotating(t, color) {
//   let points = sim.pathRotating(0, t, 30);
//   // let points = sim.pathFixed(0, t, 30);
//   let circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
//   // let lineMaterial = new THREE.LineBasicMaterial( {
//   //   color: color,
//   //   linewidth: lineWidth
//   // } );
//   let lineMaterial = new THREE.LineDashedMaterial( {
//     color: color,
//     linewidth: lineWidth,
//     dashSize: 5,
//     gapSize: 10,
//   } );
//   var path = new THREE.Line( circleGeometry, lineMaterial );
//   path.renderOrder = pathRenderOrder;
//   return path;
// }

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

// //----------------------------------------
// // getGreatCircle
// //----------------------------------------
// function getGreatCircle() {
//   var greatCircleGeometry = new THREE.BufferGeometry();
//   greatCircleGeometry.addAttribute(
//     'position', new THREE.Float32BufferAttribute(greatCircle.vertices, 3));
//   let greatCircleMaterial = new THREE.LineBasicMaterial( {
//     color: 0xaaaa00,
//     linewidth: lineWidth
//   } );
//   var gcLine = new THREE.Line(greatCircleGeometry, greatCircleMaterial);
//   gcLine.renderOrder = greatCircleRenderOrder;
//   return gcLine;
// }

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

// //----------------------------------------
// // getArrowsGroup
// //----------------------------------------
// function getArrowsGroup() {
//   let arrows = [];
//   let len = arrowLen;
//   // lond is longitude in degrees
//   for (let lond = -90; lond <= 0; lond += 15) {
//   // for (let lond = -75; lond <= -75; lond += 15) {
//     let lon = radians(lond);
//     let lat = greatCircle.getlat(lon);
//     let veast = greatCircle.veast(lat, lon, len);
//     let vnorth = greatCircle.vnorth(lat, lon, len);
//     let dlatdlon = greatCircle.dlatdlon(lat, lon);
//     let angle = degrees(Math.atan(dlatdlon));
//     // east
//     if (Math.abs(angle) > 1) {
//       arrows.push({ lat:degrees(lat), lon:degrees(lon), angle:0,
//                     renderOrder:eastRenderOrder,
//                     length:veast, color:blue, onTop:false });
//     }
//     // north
//     arrows.push({ lat:degrees(lat), lon:degrees(lon), angle:90,
//                   renderOrder:northRenderOrder,
//                   length:vnorth, color:blue, onTop:false });
//     // arrow
//     arrows.push({ lat:degrees(lat), lon:degrees(lon),
//                   angle:angle, renderOrder:vecRenderOrder,
//                   length:len, color:red, onTop:true });
//   }

//   let arrowsGroup = new THREE.Group();
//   arrows.forEach(arrow => {
//     if (arrow.length > headLen) {
//       let p = latLon2xyz(radians(arrow.lat), radians(arrow.lon));
//       // Move the origin out just a bit to minimize z fighting
//       // p = p.multiplyScalar(1.01);

//       let n = new THREE.Vector3().copy(p).normalize();
//       let east = new THREE.Vector3(0,1,0).cross(n);
//       let north = new THREE.Vector3(1,0,0).cross(east);

//       let dir = east;
//       let origin = p;
//       let length = arrow.length;
//       let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
//                                         arrow.color, 20, headLen, 0.6*headLen);
//       arrowHelper.rotateOnWorldAxis(n, radians(arrow.angle));
//       arrowHelper.children[0].renderOrder = arrow.renderOrder;
//       arrowHelper.children[1].renderOrder = arrow.renderOrder;
//       arrowsGroup.add(arrowHelper);
//     }
//   });
//   return arrowsGroup;
// }

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

function updateRotGroup() {
  let arrowsGroup = new THREE.Group();
  rotGroup.children = [];
  // for (let hours = 0; hours <= 4; hours++) {
  {
    const hours = 24*earthRotation/360;
    const t = hours*60*60;
    const phi = sim.phi(t);
    const phi_ = sim.phi_(t);
    const colorL = sq(0.9-hours/12);
    const vcolor = new THREE.Color().setHSL(0, 1, colorL);
    const lonLineColor = new THREE.Color().setHSL(0, 1, colorL);
    const necolor = new THREE.Color().setHSL(0.7, 1, colorL);
    const rotatingPathColor = new THREE.Color().setHSL(0.15, 1, colorL);
    const green = new THREE.Color(0, 1, 0);

    {
      // puck
      let geometry = new THREE.SphereBufferGeometry(.02, 32, 32);
      let material = new THREE.MeshBasicMaterial({color: vcolor});
      let sphere = new THREE.Mesh(geometry, material);
      // const p = sim.pRotating(t);
      const p = sim.p(t);
      sphere.translateOnAxis(p, 1);
      sphere.renderOrder = vecRenderOrder;
      rotGroup.add(sphere);

      const v = sim.v(t).normalize();
      let E = east(p.cartesian);
      let N = north(p.cartesian);
      E = E.multiplyScalar(v.clone().dot(E));
      N = N.multiplyScalar(v.clone().dot(N));
      const f = 0.25;
      
      {
        // // test
        // let testp = new Position(radians(45), radians(-45));
        // let testdir = new Velocity(1, 1);
        // testdir = testdir.cartesian(testp);
        // // console.log(testdir);
        // const length = testdir.length()*f;
        // let arrowHelper = new ArrowHelper(testdir.clone().normalize(),
        //                                   testp.cartesian,
        //                                   length, lineWidth,
        //                                   green, 20, headLen, 0.6*headLen);
        // // arrowHelper.rotateOnWorldAxis(n, radians(arrow.angle));
        // arrowHelper.children[0].renderOrder = vecRenderOrder;
        // arrowHelper.children[1].renderOrder = vecRenderOrder;
        // arrowsGroup.add(arrowHelper);
      }
      {
        // v
        let length = v.length() * f;
        let dir = v.normalize();
        let origin = p.cartesian;

        let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                          vcolor, 20, headLen, 0.6*headLen);
        // arrowHelper.rotateOnWorldAxis(n, radians(arrow.angle));
        arrowHelper.children[0].renderOrder = vecRenderOrder;
        arrowHelper.children[1].renderOrder = vecRenderOrder;
        arrowsGroup.add(arrowHelper);
      } {
        // east
        let length = E.length() * f;
        let dir = E.normalize();
        let origin = p.cartesian;
        let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                          necolor, 20, headLen, 0.6*headLen);
        // arrowHelper.rotateOnWorldAxis(n, radians(arrow.angle));
        arrowHelper.children[0].renderOrder = eastRenderOrder;
        arrowHelper.children[1].renderOrder = eastRenderOrder;
        arrowsGroup.add(arrowHelper);
      } {
        // north
        let length = N.length() * f;
        if (length > headLen) {
          let dir = N.normalize();
          let origin = p.cartesian;
          let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                            necolor, 20, headLen, 0.6*headLen);
          // arrowHelper.rotateOnWorldAxis(n, radians(arrow.angle));
          arrowHelper.children[0].renderOrder = northRenderOrder;
          arrowHelper.children[1].renderOrder = northRenderOrder;
          arrowsGroup.add(arrowHelper);
        }
      }
      // // Longitude line
      // let lonLine = getLonLine(phi, lonLineColor);
      // scene.add(lonLine);

      // // puck's path
      // // let path = getPuckPathRotating(t, rotatingPathColor);
      // let path = getPuckPath(t, rotatingPathColor);
      // rotGroup.add(path);
    }
  }
  rotGroup.add(arrowsGroup);
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
  // rotGroup.rotateY(earthRotation);
  // rotGroup.rotation.y = earthRotation;
  // rotGroup.traverse(function (child) {
  //   child.rotation.y = radians(earthRotation);
  // });
  rotGroup.rotation.y = radians(earthRotation);
  scene.rotation.y = radians(fixedViewRotation);

  renderer.clear();
  map.draw();
  renderer.render(scene, camera);
}

function tick() {
  controls.update();
  render();
}

//----------------------------------------
// animate
//----------------------------------------
var prevTime = null;
function animate() {
  if (!animation) return;

  // var time = performance.now() * (animSpeed/1000);
  // if (prevTime) {
  //   earthRotation += (time-prevTime)*2;
  // }
  // prevTime = time;

  earthRotation += animInc;

  tick();

  requestAnimationFrame( animate );
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
