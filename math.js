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
// Sphere math stuff
//------------------------------------------------------------

//------------------------------------------------------------
// east
// Computes the east vector at point p. The returned vector
// is in cartesian coordinates in the fixed reference frame.
// The returned vector is normalized.
//------------------------------------------------------------
function east(p) {
  // Get the tangent vector to the circle in the xz plane
  return new THREE.Vector3(p.z, 0, -p.x).normalize();
}

//------------------------------------------------------------
// north
// Computes the north vector at point p. The returned vector
// is in cartesian coordinates in the fixed reference frame.
// The returned vector is normalized.
//------------------------------------------------------------
function north(p) {
  return p.clone().normalize().cross(east(p));
}

//------------------------------------------------------------
// General math stuff
//------------------------------------------------------------

function sq(x) {
  return x*x;
}
