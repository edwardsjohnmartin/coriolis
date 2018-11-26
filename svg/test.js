let camera, scene, rotScene, renderer, controls;

let plane, arrows;
let arrowLen = 0.27;

let animation = false;

const blue = 0x0000cc;
const lightBlue = 0x0000ff;
const red = 0xcc0000;

init();
render();
animate();

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
  // renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setSize(w, w);
  document.body.appendChild(renderer.domElement);

  var vertices = [];
  var divisions = 80;
  for ( var i = 0; i <= divisions; i ++ ) {
    var v = ( i / divisions ) * ( Math.PI * 2 );
    var x = Math.sin( v );
    var y = Math.cos( v );
    vertices.push( x, y, 0 );
  }

  rotScene = new THREE.Scene();
  scene.add(rotScene);

  var geometry = new THREE.BufferGeometry();
  geometry.addAttribute(
    'position', new THREE.Float32BufferAttribute( vertices, 3 ));

  // Lat/lon
  let lineMaterial = new THREE.LineBasicMaterial( {
    color: 0xaaaaaa,
    linewidth: 2
  } );
  let inc = 15;

  // Latitude
  for (let i = -90; i < 90; i+=inc) {
    var lat = new THREE.Line(geometry, lineMaterial);
    lat.scale.setScalar(Math.cos(i*Math.PI/180));
    lat.translateY(Math.sin(i*Math.PI/180));
    lat.rotateX(Math.PI/2);
    scene.add(lat);
  }

  // Longitude
  for (let i = 0; i < 180; i+=inc) {
    var lon = new THREE.Line( geometry, lineMaterial );
    lon.scale.setScalar(1);
    lon.rotateY(i*Math.PI/180);
    scene.add(lon);
  }

  plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(20, 20),
    new THREE.MeshBasicMaterial({
      color:0xffffff, opacity:0.8, transparent:true, wireframe:false
    }));
  scene.add( plane );

  // var material = new THREE.LineDashedMaterial( {
  //   color: 'blue',
  //   linewidth: 1,
  //   dashSize: 10,
  //   gapSize: 10
  // } );
  // var line = new THREE.Line( geometry, material );
  // line.scale.setScalar( 2 );
  // rotScene.add( line );

  initArrows();

  arrows.forEach(arrow => {
    const headLen = 0.07;
    if (arrow.length > headLen) {
      let p = latLon2xyz(radians(arrow.lat), radians(arrow.lon));
      // Move the origin out just a bit to minimize z fighting
      p = p.multiplyScalar(1.001);

      let n = new THREE.Vector3().copy(p).normalize();
      let east = new THREE.Vector3(0,1,0).cross(n);
      let north = new THREE.Vector3(1,0,0).cross(east);

      let dir = east;
      let origin = p;
      let length = arrow.length;
      let arrowHelper =
        new THREE.ArrowHelper(dir, origin, length, arrow.color, headLen, 0.06);
      arrowHelper.rotateOnWorldAxis(n, radians(arrow.angle));
      scene.add(arrowHelper);
    }
  });

  window.addEventListener( 'resize', onWindowResize, false );
  controls.addEventListener('change', render);
}

function initArrows() {
  greatCircle = new GreatCircle(1, Math.PI/4, 0);
  arrows = [];
  let len = arrowLen;
  // lond is longitude in degrees
  for (let lond = -90; lond <= 0; lond += 15) {
    // for (let lond = 0; lond < 1; lond += 15) {
    let lon = radians(lond);
    let lat = greatCircle.getlat(lon);
    let veast = greatCircle.veast(lat, lon, len);
    let vnorth = greatCircle.vnorth(lat, lon, len);
    let dlatdlon = greatCircle.dlatdlon(lat, lon);
    // east
    arrows.push({ lat:degrees(lat), lon:degrees(lon), angle:0,
                  length:veast, color:blue, onTop:false });
    // north
    arrows.push({ lat:degrees(lat), lon:degrees(lon), angle:90,
                  length:vnorth, color:blue, onTop:false });

    // arrow
    arrows.push({ lat:degrees(lat), lon:degrees(lon),
                  angle:degrees(Math.atan(dlatdlon)),
                  length:len, color:red, onTop:true });
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function render() {
  plane.rotation.x = camera.rotation.x;
  plane.rotation.y = camera.rotation.y;
  plane.rotation.z = camera.rotation.z;

  renderer.render( scene, camera );
}



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

function snap() {
  console.log('snap');
  XMLS = new XMLSerializer();
  svgfile = XMLS.serializeToString(renderer.domElement);
  // console.log(svgfile);

  let test = document.getElementById("output");
  test.innerHTML = svgfile;

  // var w = window.open();
  // w.document.open("text/html", "replace");
  // w.document.write(svgfile);
  // w.document.close();

  // document.open("text/html", "replace");
  // document.write(svgfile);
  // document.close();
}
