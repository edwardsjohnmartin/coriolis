let camera, scene, rotScene, renderer, controls;

const radius = 1;

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

let sim;

init();
render();
animate();

//------------------------------------------------------------
// Initialization/setup
//------------------------------------------------------------

function init() {
  document.onkeydown = keydown;

  // camera = new THREE.PerspectiveCamera(
  //   33, window.innerWidth / window.innerHeight, 0.1, 100);
  let width = 3;
  let height = width;
  camera = new THREE.OrthographicCamera(
     width / - 2, width / 2, height / 2, height / - 2, 1, 100);

  scene = new THREE.Scene();
  // scene.background = new THREE.Color(1, 1, 1);

  renderer = new THREE.SVGRenderer();
  renderer.autoClear = false;
  // renderer = new THREE.WebGLRenderer();

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  camera.position.z = 10;
  controls.update();
  
  let w = window.innerWidth;
  if (window.innerHeight < w) {
    w = window.innerHeight;
  }
  renderer.setSize(w, w);
  document.body.appendChild(renderer.domElement);

  // scene.add(getTransparentPlane());

  greatCircle = new GreatCircle(1, Math.PI/4, 0);
  sim = new CoriolisSim(radians(-90));
  // scene.add(getGlobe());
  // scene.add(getGreatCircle());
  // scene.add(getArrowsGroup());

  let arrowsGroup = new THREE.Group();
  // for (let hours = 0; hours <= 4; hours++) {
  for (let hours = 4; hours <= 4; hours++) {
    const t = hours*60*60;
    const phi = sim.phi(t);
    const phi_ = sim.phi_(t);
    const colorL = sq(0.9-hours/12);
    const vcolor = new THREE.Color().setHSL(0, 1, colorL);
    const lonLineColor = new THREE.Color().setHSL(0, 1, colorL);
    const necolor = new THREE.Color().setHSL(0.7, 1, colorL);
    const rotatingPathColor = new THREE.Color().setHSL(0.15, 1, colorL);

    {
      // // longitude line
      // var geometry = new THREE.SphereBufferGeometry(.02, 32, 32);
      // var material = new THREE.MeshBasicMaterial({color: 0xaa0000});
      // var sphere = new THREE.Mesh(geometry, material);
      // // sphere.translateY(Math.sin(lat));
      // sphere.translateX(Math.cos(-phi));
      // sphere.translateZ(Math.sin(-phi));
      // scene.add(sphere);
    } {
      // puck
      let geometry = new THREE.SphereBufferGeometry(.02, 32, 32);
      let material = new THREE.MeshBasicMaterial({color: vcolor});
      let sphere = new THREE.Mesh(geometry, material);
      const p = sim.p(t);
      sphere.translateOnAxis(p, 1);
      sphere.renderOrder = vecRenderOrder;
      scene.add(sphere);

      const v = sim.v(t);
      let E = east(p);
      let N = north(p);
      E = E.multiplyScalar(v.clone().dot(E));
      N = N.multiplyScalar(v.clone().dot(N));
      const f = 0.25;
      {
        // v
        let length = v.length() * f;
        let dir = v.normalize();
        let origin = p;
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
        let origin = p;
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
          let origin = p;
          let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                            necolor, 20, headLen, 0.6*headLen);
          // arrowHelper.rotateOnWorldAxis(n, radians(arrow.angle));
          arrowHelper.children[0].renderOrder = northRenderOrder;
          arrowHelper.children[1].renderOrder = northRenderOrder;
          arrowsGroup.add(arrowHelper);
        }
      }
      // Longitude line
      let lonLine = getLonLine(phi, lonLineColor);
      scene.add(lonLine);

      // puck's path
      let path = getPuckPath(t, rotatingPathColor);
      scene.add(path);
    }
  }
  scene.add(arrowsGroup);

  scene.add(getBackgroundPlanet());
  // scene.add(getEarth());
  getEarth();

  // drawMap();
  // map.draw();

  window.addEventListener( 'resize', onWindowResize, false );
  controls.addEventListener('change', render);
}

function keydown(event) {
  var x = event.keyCode;
  var key = event.key;
  var changed = false;
  if (x == 40 || key == "j" || key == "J") {
    console.log('down');
    // Down arrow
    if (event.shiftKey) {
    } else if (event.ctrlKey) {
    } else {
    }
    // changed = true;
  } else if (x == 38 || key == "k" || key == "K") {
    // Up arrow
    // changed = true;
  } else if (x == 39) {
    // Right arrow
    // changed = true;
  } else if (x == 37) {
    // Left arrow
    // changed = true;
  } else if (key == "d") {
  }
  if (changed) {
    map.draw();
  }
}

//------------------------------------------------------------
// Functions to create 3D objects
//------------------------------------------------------------

function getEarth() {
  // new THREE.TextureLoader().load("test.jpg", texture => {
  //   let geometry = new THREE.SphereBufferGeometry(0.5,100,100);
  //   let material = new THREE.MeshBasicMaterial({map: texture});

  //   let sphere = new THREE.Mesh(geometry, material);
  //   scene.add(sphere);
  // });

  // let texture = new THREE.TextureLoader().load("test.jpg");
  // let geometry = new THREE.SphereBufferGeometry(0.5,100,100);
  // let material = new THREE.MeshBasicMaterial({map: texture});

  // let sphere = new THREE.Mesh(geometry, material);
  // scene.add(sphere);
}

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

//----------------------------------------
// getGlobe
//----------------------------------------
function getGlobe() {
  var vertices = [];
  var divisions = 80;
  for ( var i = 0; i <= divisions; i ++ ) {
    var v = ( i / divisions ) * ( Math.PI * 2 );
    var x = Math.sin( v );
    var y = Math.cos( v );
    vertices.push( x, y, 0 );
  }

  var circleGeometry = new THREE.BufferGeometry();
  circleGeometry.addAttribute(
    'position', new THREE.Float32BufferAttribute( vertices, 3 ));

  rotScene = new THREE.Scene();
  scene.add(rotScene);

  // Lat/lon
  let lineMaterial = new THREE.LineBasicMaterial( {
    color: 0xaaaaaa,
    linewidth: lineWidth
  } );
  let inc = 15;

  let latlon = new THREE.Group();
  // Latitude
  for (let i = -90; i < 90; i+=inc) {
    var lat = new THREE.Line(circleGeometry, lineMaterial);
    lat.renderOrder = globeRenderOrder;
    lat.scale.setScalar(Math.cos(i*Math.PI/180));
    lat.translateY(Math.sin(i*Math.PI/180));
    lat.rotateX(Math.PI/2);
    latlon.add(lat);
  }

  // Longitude
  for (let i = 0; i < 180; i+=inc) {
    var lon = new THREE.Line( circleGeometry, lineMaterial );
    lon.renderOrder = globeRenderOrder;
    lon.scale.setScalar(1);
    lon.rotateY(i*Math.PI/180);
    // latlon.add(lon);
  }
  return latlon;
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
// getLonLine
//----------------------------------------
function getPuckPath(t, color) {
  var points = sim.path(0, t, 30);
  var circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
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

//----------------------------------------
// getArrowsGroup
//----------------------------------------
function getArrowsGroup() {
  let arrows = [];
  let len = arrowLen;
  // lond is longitude in degrees
  for (let lond = -90; lond <= 0; lond += 15) {
  // for (let lond = -75; lond <= -75; lond += 15) {
    let lon = radians(lond);
    let lat = greatCircle.getlat(lon);
    let veast = greatCircle.veast(lat, lon, len);
    let vnorth = greatCircle.vnorth(lat, lon, len);
    let dlatdlon = greatCircle.dlatdlon(lat, lon);
    let angle = degrees(Math.atan(dlatdlon));
    // east
    if (Math.abs(angle) > 1) {
      arrows.push({ lat:degrees(lat), lon:degrees(lon), angle:0,
                    renderOrder:eastRenderOrder,
                    length:veast, color:blue, onTop:false });
    }
    // north
    arrows.push({ lat:degrees(lat), lon:degrees(lon), angle:90,
                  renderOrder:northRenderOrder,
                  length:vnorth, color:blue, onTop:false });
    // arrow
    arrows.push({ lat:degrees(lat), lon:degrees(lon),
                  angle:angle, renderOrder:vecRenderOrder,
                  length:len, color:red, onTop:true });
  }

  let arrowsGroup = new THREE.Group();
  arrows.forEach(arrow => {
    if (arrow.length > headLen) {
      let p = latLon2xyz(radians(arrow.lat), radians(arrow.lon));
      // Move the origin out just a bit to minimize z fighting
      // p = p.multiplyScalar(1.01);

      let n = new THREE.Vector3().copy(p).normalize();
      let east = new THREE.Vector3(0,1,0).cross(n);
      let north = new THREE.Vector3(1,0,0).cross(east);

      let dir = east;
      let origin = p;
      let length = arrow.length;
      let arrowHelper = new ArrowHelper(dir, origin, length, lineWidth,
                                        arrow.color, 20, headLen, 0.6*headLen);
      arrowHelper.rotateOnWorldAxis(n, radians(arrow.angle));
      arrowHelper.children[0].renderOrder = arrow.renderOrder;
      arrowHelper.children[1].renderOrder = arrow.renderOrder;
      arrowsGroup.add(arrowHelper);
    }
  });
  return arrowsGroup;
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

//----------------------------------------
// render
//----------------------------------------
function render() {
  if (plane) {
    plane.rotation.x = camera.rotation.x;
    plane.rotation.y = camera.rotation.y;
    plane.rotation.z = camera.rotation.z;
  }

  renderer.clear();
  map.draw();
  renderer.render( scene, camera );
}

//----------------------------------------
// animate
//----------------------------------------
function animate() {
  if (!animation) return;

  var count = 0;
  var time = performance.now() / 1000;

  rotScene.traverse( function ( child ) {
    child.rotation.x = count + ( time / 3 );
    child.rotation.z = count + ( time / 4 );

    count ++;
  } );

  controls.update();
  render();

  requestAnimationFrame( animate );
}

//----------------------------------------
// snap
//----------------------------------------
function snap() {
  console.log('snap');
  XMLS = new XMLSerializer();
  svgfile = XMLS.serializeToString(renderer.domElement);

  let test = document.getElementById("output");
  test.innerHTML = svgfile;
}
