// Nice files: 05_05, 12_04, 14_03

"use strict";

var canvas;
var gl;

var axis;
var floor;
var segment;
var arrow;
var sphere;
var world;
var greatCircle;

let eye, at;
let canvasWidth, canvasHeight;
let activeRotMatrix;
const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;

var flatLineProgram;
var lineProgram;
var sphereProgram;

// Viewing
var aspect = 1.0;
// var zoom = 1;
var zoom = 0.25;
var showJoints = false;

let mvMatrix, pMatrix, nMatrix;

// Animation
var startTime = 0;
var frameIndex = 0;
var frameIndexOffset = 0;
var speedFactor = 1.0;
var paused = true;

// Data
var bvh;

let arrows = [];

const blue = vec4(0,0,0.8,1);
const red = vec4(0.8,0,0,1);

// Stack stuff
var matrixStack = new Array();
function pushMatrix() {
  matrixStack.push(mat4(mvMatrix));
}
function popMatrix() {
  mvMatrix = matrixStack.pop();
}

var reader = new FileReader();
reader.onload = function(e) {
  var text = reader.result;
}

//------------------------------------------------------------
// Programs
//------------------------------------------------------------

var FlatLineProgram = function() {
  this.program = initShaders(gl, "flat-line-vshader", "flat-line-fshader");
  gl.useProgram(this.program);

  this.vertexLoc = gl.getAttribLocation(this.program, "vPosition");

  this.colorLoc = gl.getUniformLocation(this.program, "uColor");
  this.lookAtLoc = gl.getUniformLocation(this.program, "lookAt");
  this.mvMatrixLoc = gl.getUniformLocation(this.program, "mvMatrix");
  this.pMatrixLoc = gl.getUniformLocation(this.program, "pMatrix");
  this.rotMatrixLoc = gl.getUniformLocation(this.program, "rotMatrix");
}

var LineProgram = function() {
  this.program = initShaders(gl, "line-vshader", "line-fshader");
  gl.useProgram(this.program);

  this.vertexLoc = gl.getAttribLocation(this.program, "vPosition");
  this.colorLoc = gl.getAttribLocation(this.program, "vColor");

  this.mvMatrixLoc = gl.getUniformLocation(this.program, "mvMatrix");
  this.pMatrixLoc = gl.getUniformLocation(this.program, "pMatrix");
  this.nMatrixLoc = gl.getUniformLocation(this.program, "nMatrix");
}

var SphereProgram = function() {
  this.program = initShaders(gl, "sphere-vshader", "sphere-fshader");
  gl.useProgram(this.program);

  this.vertexLoc = gl.getAttribLocation(this.program, "vPosition");
  this.normalLoc = gl.getAttribLocation(this.program, "vNormal");
  this.colorLoc = gl.getAttribLocation(this.program, "vColor");

  this.mvMatrixLoc = gl.getUniformLocation(this.program, "mvMatrix");
  this.pMatrixLoc = gl.getUniformLocation(this.program, "pMatrix");
  this.nMatrixLoc = gl.getUniformLocation(this.program, "nMatrix");
}

//------------------------------------------------------------
// Render
//------------------------------------------------------------

function renderAxis() {
  gl.useProgram(lineProgram.program);

  gl.enableVertexAttribArray(lineProgram.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, axis.vertexBuffer);
  gl.vertexAttribPointer(lineProgram.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(lineProgram.colorLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, axis.colorBuffer);
  gl.vertexAttribPointer(lineProgram.colorLoc, 4, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(lineProgram.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(lineProgram.pMatrixLoc, false, flatten(pMatrix));

  gl.drawArrays(gl.LINES, 0, axis.numPoints);
};

function renderFloor() {
  gl.useProgram(lineProgram.program);

  gl.enableVertexAttribArray(lineProgram.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, floor.vertexBuffer);
  gl.vertexAttribPointer(lineProgram.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(lineProgram.colorLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, floor.colorBuffer);
  gl.vertexAttribPointer(lineProgram.colorLoc, 4, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(lineProgram.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(lineProgram.pMatrixLoc, false, flatten(pMatrix));

  gl.drawArrays(gl.LINES, 0, floor.numPoints);
};

function renderSegmentBak() {
  gl.useProgram(lineProgram.program);

  gl.enableVertexAttribArray(lineProgram.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, segment.vertexBuffer);
  gl.vertexAttribPointer(lineProgram.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(lineProgram.colorLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, segment.colorBuffer);
  gl.vertexAttribPointer(lineProgram.colorLoc, 4, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(lineProgram.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(lineProgram.pMatrixLoc, false, flatten(pMatrix));

  gl.drawArrays(gl.LINES, 0, segment.numPoints);
};

function renderSegment() {
  gl.useProgram(flatLineProgram.program);

  gl.enableVertexAttribArray(flatLineProgram.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, segment.vertexBuffer);
  gl.vertexAttribPointer(flatLineProgram.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(flatLineProgram.colorLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, segment.colorBuffer);
  gl.vertexAttribPointer(flatLineProgram.colorLoc, 4, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(flatLineProgram.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(flatLineProgram.pMatrixLoc, false, flatten(pMatrix));

  gl.drawArrays(gl.LINES, 0, segment.numPoints);
};

function renderArrow(color, activeRotMatrix) {
  gl.useProgram(flatLineProgram.program);

  gl.enableVertexAttribArray(flatLineProgram.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, arrow.vertexBuffer);
  gl.vertexAttribPointer(flatLineProgram.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.uniform4fv(flatLineProgram.lookAtLoc, flatten(vec4(subtract(at, eye), 1)));
  gl.uniform4fv(flatLineProgram.colorLoc, flatten(color));
  gl.uniformMatrix4fv(flatLineProgram.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(flatLineProgram.pMatrixLoc, false, flatten(pMatrix));
  gl.uniformMatrix4fv(flatLineProgram.rotMatrixLoc, false, flatten(activeRotMatrix));
  // gl.uniformMatrix4fv(flatLineProgram.rotMatrixLoc, false, flatten(mat4(1)));

  gl.drawArrays(gl.LINES, 0, arrow.numPoints);
};

function renderWorld() {
  gl.useProgram(flatLineProgram.program);

  gl.enableVertexAttribArray(flatLineProgram.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, world.vertexBuffer);
  gl.vertexAttribPointer(flatLineProgram.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.uniform4fv(flatLineProgram.lookAtLoc, flatten(vec4(subtract(at, eye), 1)));
  let c = 0.4;
  gl.uniform4fv(flatLineProgram.colorLoc, flatten(vec4(c,c,c,1)));
  gl.uniformMatrix4fv(flatLineProgram.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(flatLineProgram.pMatrixLoc, false, flatten(pMatrix));
  gl.uniformMatrix4fv(flatLineProgram.rotMatrixLoc, false, flatten(activeRotMatrix));

  let cols = world.numBandPoints;
  for (let i = 0; i < world.numLatBands; ++i) {
    gl.drawArrays(gl.LINE_STRIP, i*cols, cols);
  }
  for (let i = 0; i < world.numLonBands; ++i) {
    gl.drawArrays(gl.LINE_STRIP, world.lonOffset+i*cols, cols);
  }
  // gl.drawArrays(gl.LINE_STRIP, 0, world.numPoints);
};

function renderGreatCircle(greatCircle) {
  gl.useProgram(flatLineProgram.program);

  gl.enableVertexAttribArray(flatLineProgram.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, greatCircle.vertexBuffer);
  gl.vertexAttribPointer(flatLineProgram.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.uniform4fv(flatLineProgram.lookAtLoc, flatten(vec4(subtract(at, eye), 1)));
  let c = 0.4;
  gl.uniform4fv(flatLineProgram.colorLoc, flatten(vec4(c,c,c,1)));
  gl.uniformMatrix4fv(flatLineProgram.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(flatLineProgram.pMatrixLoc, false, flatten(pMatrix));
  gl.uniformMatrix4fv(flatLineProgram.rotMatrixLoc, false, flatten(activeRotMatrix));

  gl.drawArrays(gl.LINE_STRIP, 0, greatCircle.numPoints);
};

function renderSphere() {
  gl.useProgram(sphereProgram.program);

  gl.enableVertexAttribArray(sphereProgram.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexBuffer);
  gl.vertexAttribPointer(sphereProgram.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(sphereProgram.normalLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphere.normalBuffer);
  gl.vertexAttribPointer(sphereProgram.normalLoc, 4, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(sphereProgram.colorLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphere.colorBuffer);
  gl.vertexAttribPointer(sphereProgram.colorLoc, 4, gl.FLOAT, false, 0, 0);

  nMatrix = normalMatrix(mvMatrix, false);

  gl.uniformMatrix4fv(sphereProgram.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(sphereProgram.pMatrixLoc, false, flatten(pMatrix));
  gl.uniformMatrix4fv(sphereProgram.nMatrixLoc, false, flatten(nMatrix));

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indexBuffer);
  gl.drawElements(gl.TRIANGLES, sphere.numIndices, gl.UNSIGNED_SHORT, 0);
};

//------------------------------------------------------------
// Animation
//------------------------------------------------------------

function tick() {
  if (!paused)
    requestAnimFrame(tick);
  render();
  animate();
}

function animate() {
  if (paused)
    return;
  
  var timeNow = new Date().getTime();
  if (startTime != 0) {
    var elapsed = speedFactor*(timeNow - startTime);
    frameIndex = frameIndexOffset + parseInt(elapsed / (bvh.frameTime*1000));
    frameIndex = frameIndex % bvh.numFrames;
  } else {
    startTime = timeNow;
    frameIndex = 0;
  }
}

function setSpeedFactor(f) {
  startTime = new Date().getTime();
  frameIndexOffset = frameIndex;
  speedFactor = f;
}

// Lat and lon are given in radians.
function latLon2xyz(lat, lon) {
  let r = Math.cos(lat);
  let x = r*Math.cos(-lon);
  let y = Math.sin(lat);
  let z = r*Math.sin(-lon);
  return vec3(x,y,z);
}

function renderArrows() {
  arrows.forEach(arrow => {
    let f = arrow.length;

    let p = latLon2xyz(radians(arrow.lat), radians(arrow.lon));
    let x = p[0];
    let y = p[1];
    let z = p[2];

    let n = normalize(vec3(x,y,z));
    let up = vec3(0,1,0);
    let t = cross(up, n);
    // let d = t;
    let d = t;
    
    let v = cross(vec3(1,0,0), normalize(d));
    let theta = Math.acos(dot(vec3(1,0,0), d) / length(d));

    // let myRotMatrix = mult(activeRotMatrix, scalem(1,1,1));

    pushMatrix();
    mvMatrix = mult(mvMatrix, translate(x, y, z));
    if (theta == theta && theta != 0.0) {
      mvMatrix = mult(mvMatrix, rotate(degrees(theta), v));
      mvMatrix = mult(mvMatrix, rotate(arrow.lat, vec3(-1,0,0)));

      // myRotMatrix = mult(myRotMatrix, rotate(degrees(theta), v));
      // myRotMatrix = mult(myRotMatrix, rotate(arrow.lat, vec3(-1,0,0)));
    }
    mvMatrix = mult(mvMatrix, rotate(arrow.angle, vec3(0,0,1)));
    // myRotMatrix = mult(myRotMatrix, rotate(arrow.angle, vec3(0,0,1)));
    mvMatrix = mult(mvMatrix, scalem(f, f, 1));
    // renderArrow(arrow.color, myRotMatrix);
    renderArrow(arrow.color, mat4(1));
    popMatrix();
  });
}

// function renderSegments(bb) {
//   var frame = bvh.frames[frameIndex];
//   for (var i = 0; i < bvh.roots.length; ++i) {
//     renderSegment1(bvh.roots[i], frame, bb);
//   }
// }

// function renderSegment1(segment, frame, bb) {

//   if (bb == null) {
//     var v = vec3(segment.offsets);
//     const len = length(v);
//     const a = vec3(1,0,0);
//     var n = cross(v, a);
//     var phi = -Math.acos(dot(normalize(v), a));
//     pushMatrix();
//     mvMatrix = mult(mvMatrix, rotate(degrees(phi), n));
//     mvMatrix = mult(mvMatrix, scalem(len, len, len));
//     renderSegment();
//     popMatrix();
//   }

//   mvMatrix = mult(mvMatrix, translate(segment.offsets[0], segment.offsets[1],
//                                       segment.offsets[2]));
//   var len = segment.channels.length;
//   for (var i = 0; i < len; ++i) {
//     var j = segment.channelOffset + i;
//     var val = parseFloat(frame[j]);
//     if (segment.channels[i] == "Xposition") {
//       mvMatrix = mult(mvMatrix, translate(val, 0, 0));
//     } else if (segment.channels[i] == "Yposition") {
//       mvMatrix = mult(mvMatrix, translate(0, val, 0));
//     } else if (segment.channels[i] == "Zposition") {
//       mvMatrix = mult(mvMatrix, translate(0, 0, val));
//     } else if (segment.channels[i] == "Xrotation") {
//       mvMatrix = mult(mvMatrix, rotateX(val));
//     } else if (segment.channels[i] == "Yrotation") {
//       mvMatrix = mult(mvMatrix, rotateY(val));
//     } else if (segment.channels[i] == "Zrotation") {
//       mvMatrix = mult(mvMatrix, rotateZ(val));
//     }
//   }


//   if (bb) {
//     var P = vec4(0.0, 0.0, 0.0, 1.0);
//     P = mult(mvMatrix, P);
//     bb.add(P);
//   }
  
//   pushMatrix();
//   var scaleSphere = scale*5;
//   mvMatrix = mult(mvMatrix, scalem(scaleSphere, scaleSphere, scaleSphere));
//   if (bb == null && showJoints) {
//     renderSphere();
//   }
//   popMatrix();

//   pushMatrix();
//   for (var i = 0; i < segment.children.length; ++i) {
//     renderSegment1(segment.children[i], frame, bb);
//   }
//   popMatrix();
// }

var theta = radians(145);
var phi = radians(35);
var scale = 1.0;
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fovy = 40.0;
  const near = 0.01;
  const far = 100;
  const radius = 3 * zoom;
  // const eye = vec3(radius * Math.sin(theta),
  //                  radius * Math.sin(radians(35.0)),
  //                  radius * Math.cos(theta));
  // const at = vec3(0.0, 0.0, 0.0);
  eye = vec3(radius * Math.sin(theta),
                   // radius * Math.sin(radians(35.0)),
                   radius * Math.sin(phi),
                   radius * Math.cos(theta));
  at = vec3(0.0, 0.0, 0.0);
  const up = vec3(0.0, 1.0, 0.0);

  // pMatrix = perspective(fovy, aspect, near, far);
  const w = 1.1;
  pMatrix = ortho(-w, w, -w, w, -w, 2*w);//near, far);
  // mvMatrix = lookAt(eye, at, up);

  // activeRotMatrix = rotate(rotAngle*180.0/Math.PI, rotVec);
  if (rotVec[0] == rotVec[0]) {
    activeRotMatrix = mult(rotate(rotAngle*180.0/Math.PI, rotVec), rotMatrix);
  } else {
    activeRotMatrix = rotMatrix;
  }
  
  mvMatrix = lookAt(vec3(0, 0, radius), vec3(0, 0, 0), vec3(0, 1, 0));
  mvMatrix = mult(mvMatrix, activeRotMatrix);
  // mvMatrix = mult(mvMatrix, rotMatrix);

  // renderFloor();


  // scale = 1;
  // mvMatrix = mult(mvMatrix, scalem(scale, scale, scale));

  const center = vec3(0,0,0);
  // mvMatrix = mult(mvMatrix, translate(-center[0], -bb.min[1], -center[2]));
  // mvMatrix = mult(mvMatrix, translate(-center[0], -bb.min[1], -center[2]));
  
  // renderSegments(null);

  // renderAxis();
  pushMatrix();
  // var scaleSphere = scale;
  // mvMatrix = mult(mvMatrix, translate(0, 0.8, 0));
  // mvMatrix = mult(mvMatrix, scalem(scaleSphere, scaleSphere, scaleSphere));
  // renderSphere();
  renderWorld();
  popMatrix();

  renderGreatCircle(greatCircle);
  renderArrows();
}

function keyDown(e) {
  switch (e.keyCode) {
  case 37:
    // left
    theta -= Math.PI / 180.0;
    break;
  case 38:
    // up
    // zoom *= 0.9;
    phi -= Math.PI / 180.0;
    // console.log(zoom);
    break;
  case 39:
    // right
    theta += Math.PI / 180.0;
    break;
  case 40:
    // down
    // zoom *= 1.1;
    phi += Math.PI / 180.0;
    // console.log(zoom);
    break;
  case "F".charCodeAt(0):
    setSpeedFactor(speedFactor * 1.1);
    break;
  case "D".charCodeAt(0):
    setSpeedFactor(speedFactor * 0.9);
    break;
  case "S".charCodeAt(0):
    showJoints = !showJoints;
    break;
  case 32:
    // spacebar
    paused = !paused;
    if (!paused)
      tick();
    break;
  default:
    // To see what the code for a certain key is, uncomment this line,
    // reload the page in the browser and press the key.
    // console.log("Unrecognized key press: " + e.keyCode);
    break;
  }
  if (paused)
    tick();
}

function win2obj(p) {
  var x = 2 * p[0] / canvasWidth - 1;
  var y = 2 * (canvasHeight-p[1]) / canvasHeight - 1;
  x = Math.max(Math.min(x, 1.0), -1.0);
  y = Math.max(Math.min(y, 1.0), -1.0);
  return vec2(x, y);
}

window.onload = function init() {
  document.onkeydown = keyDown;
  document.onmousedown = onMouseDown;
  document.onmouseup = onMouseUp;
  document.onmousemove = onMouseMove;

  canvas = document.getElementById("gl-canvas");
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.viewport(0, 0, canvas.width, canvas.height);

  aspect =  canvas.width/canvas.height;

  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  axis = new Axis();
  floor = new Floor();
  arrow = new Arrow();
  segment = new Segment();
  sphere = new Sphere(1, 20, 20);
  // world = new World(1, 20, 20);
  world = new World(1, 1, 15, 15);
  greatCircle = new GreatCircle(1, Math.PI/4, 0);
  // greatCircle = new GreatCircle(1, Math.PI/4, -90);
  // greatCircle = new GreatCircle(1, Math.PI/3, 0);

  arrows = [];
  let len = 0.2;
  // lond is longitude in degrees
  for (let lond = -120; lond <= 0; lond += 15) {
  // for (let lond = 0; lond < 1; lond += 15) {
    let lon = radians(lond);
    let lat = greatCircle.getlat(lon);
    let veast = greatCircle.veast(lat, lon, len);
    let vnorth = greatCircle.vnorth(lat, lon, len);
    let dlatdlon = greatCircle.dlatdlon(lat, lon);
    // east
    arrows.push({ lat:degrees(lat), lon:degrees(lon), angle:0,
                  length:veast, color:blue });
    // north
    arrows.push({ lat:degrees(lat), lon:degrees(lon), angle:90,
                  length:vnorth, color:blue });

    // arrow
    arrows.push({ lat:degrees(lat), lon:degrees(lon),
                  angle:degrees(Math.atan(dlatdlon)),
                  length:len, color:red });
  }



  //  Load shaders and initialize attribute buffers
  flatLineProgram = new FlatLineProgram();
  lineProgram = new LineProgram();
  sphereProgram = new SphereProgram();

  // var fileInput = document.getElementById('fileInput');
  // fileInput.addEventListener('change', function(e) {
  //   var file = fileInput.files[0];
  //   if (file && file.name) {
  //     if (file.name.match(/.*\.bvh/)) {
  //       var reader = new FileReader();
  //       reader.onload = function(e) {
  //         parse(reader.result);
  //         tick();
  //       }

  //       reader.readAsText(file);	
  //     } else {
  //       console.log("File not supported! " + file.type);
  //     }
  //   }
  // });

  // parse(testData2);

  paused = true;
  tick();
}
