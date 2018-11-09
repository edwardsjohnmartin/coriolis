var mouseDown = false;
var mouseDownPos;
var mousePos;
var button = 0;
var rotVec = vec3(1, 0, 0);
var rotAngle = 0;
var rotMatrix = mat4(1.0);

function mapMouse(p) {
  var x = p[0];
  var y = p[1];
  if (x*x + y*y > 1) {
    const len = Math.sqrt(x*x + y*y);
    x = x/len;
    y = y/len;
  }
  const z = Math.sqrt(Math.max(0.0, 1 - x*x - y*y));
  return vec3(x, y, z);
}

function onMouseDown(e) {
  mouseDown = true;
  mouseDownPos = win2obj(vec2(e.clientX, e.clientY));
  button = e.button;
  if (button == RIGHT_BUTTON) {
    downZoom = zoom;
  }
}

function onMouseUp() {
  if (mouseDown) {
    mouseDown = false;
    if (button == LEFT_BUTTON) {
      rotMatrix = mult(rotate(rotAngle*180.0/Math.PI, rotVec), rotMatrix);
      rotAngle = 0;
    } else {

    }
  }
}

function onMouseMove(e) {
  mousePos = win2obj(vec2(e.clientX, e.clientY));

  if (mouseDown && mouseDownPos != mousePos) {
    if (button == LEFT_BUTTON) {
      const down_v = mapMouse(mouseDownPos);
      const v = mapMouse(mousePos);
      rotVec = normalize(cross(down_v, v));
      rotAngle = Math.acos(dot(down_v, v) / length(v));
    } else {
      const factor = 2;
      zoom = downZoom * Math.pow(factor, mousePos[1] - mouseDownPos[1]);
    }
    render();
  }
}
