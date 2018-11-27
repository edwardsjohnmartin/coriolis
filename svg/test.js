let camera, scene, rotScene, renderer, controls;

let plane;//, arrows;
let arrowLen = 0.27;

let animation = false;
let lineWidth = 2;

const blue = 0x0000cc;
const lightBlue = 0x0000ff;
const red = 0xcc0000;

const vecRenderOrder = 10;
const eastRenderOrder = 8;
const northRenderOrder = 8;
const greatCircleRenderOrder = 0;
const globeRenderOrder = 0;

init();
render();
animate();

//------------------------------------------------------------
// Coordinate conversion functions
//------------------------------------------------------------

function radians(deg) {
  return deg * Math.PI / 180;
}

function degrees(rad) {
  return rad * 180 / Math.PI;
}

// Lat and lon are given in radians.
function latLon2xyz(lat, lon) {
  let r = Math.cos(lat);
  let x = r*Math.cos(-lon);
  let y = Math.sin(lat);
  let z = r*Math.sin(-lon);
  return new THREE.Vector3(x,y,z);
}

//------------------------------------------------------------
// Initialization/setup
//------------------------------------------------------------

function init() {
  // camera = new THREE.PerspectiveCamera(
  //   33, window.innerWidth / window.innerHeight, 0.1, 100);
  let width = 3;
  let height = width;
  camera = new THREE.OrthographicCamera(
     width / - 2, width / 2, height / 2, height / - 2, 1, 100);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(1, 1, 1);

  renderer = new THREE.SVGRenderer();
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

  scene.add(getTransparentPlane());

  greatCircle = new GreatCircle(1, Math.PI/4, 0);
  scene.add(getGlobe());
  scene.add(getGreatCircle());
  scene.add(getArrowsGroup());

  window.addEventListener( 'resize', onWindowResize, false );
  controls.addEventListener('change', render);
}

//------------------------------------------------------------
// Functions to create 3D objects
//------------------------------------------------------------

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
    latlon.add(lon);
  }
  return latlon;
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
  var greatCircleGeometry = new THREE.BufferGeometry();
  greatCircleGeometry.addAttribute(
    'position', new THREE.Float32BufferAttribute(greatCircle.vertices, 3));
  let greatCircleMaterial = new THREE.LineBasicMaterial( {
    color: 0xaaaa00,
    linewidth: lineWidth
  } );
  var gcLine = new THREE.Line(greatCircleGeometry, greatCircleMaterial);
  gcLine.renderOrder = greatCircleRenderOrder;
  return gcLine;
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
    const headLen = 0.03;
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
