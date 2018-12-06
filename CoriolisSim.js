// R: earth's radius (assumed spherical)
// T: earth's period of rotation (24 hours, stored in seconds)
// V: earth's tangential equatorial speed -- V = 2*PI*R/T
const R = 6371393; // in meters
const T = 24*60*60; // in seconds
const V = 2 * Math.PI * (R / T); // meters per second
// T_: the period of the puck
const T_ = 16*60*60;

// returns the number of radians the earth has rotated after
// time seconds
function earthRotation(t) {
  // return (t/T_)*2*Math.PI;
  return (t/T)*2*Math.PI;
}

//------------------------------------------------------------
// Constructor
// lon0 is the longitude in radians at which the puck was
// struck.
//------------------------------------------------------------
var CoriolisSim = function(lon0) {
  // The initial position
  this.p0 = new Position(0, lon0);
  // The initial velocity
  this.v0 = new Velocity(V, Math.sqrt(5/4)*V, 0);
  // Speed of the puck
  this.speed = Math.sqrt(sq(this.v0.east)+sq(this.v0.north));
  this.alpha = Math.atan2(Math.sqrt(5/4), 1);
}

//------------------------------------------------------------
// phi
// Computes the time-dependent azimuthal position of the
// launch point of the puck as seen by an observer in the
// fixed frame. It tracks the line of longitude from which the
// puck was fired. Return value is the azimuthal position in
// radians.
//------------------------------------------------------------
CoriolisSim.prototype.phi = function(t) {
  return this.p0.lon + 2 * Math.PI * t / T;
}

//------------------------------------------------------------
// phi_
// Computes the time-dependent azimuthal position of the puck
// at time t in the fixed frame. At t=0, phi == phi_. Return
// value is the azimuthal angle in radians.
//------------------------------------------------------------
CoriolisSim.prototype.phi_ = function(t) {
  let a = 2*Math.PI*t/T_;
  const s = Math.sin(a);
  const c = Math.cos(a);
  let p = this.p0.lon + Math.atan2((V/this.speed)*s, c);

  // // HACK - hard-coded hack
  // if (t/T_ > 0.5) {
  //   const overage = Math.atan2((V/this.speed)*s, c) - Math.PI;
  //   p -= overage;
  // }
  // console.log(Math.atan2((V/this.speed)*Math.sin(Math.PI), Math.cos(Math.PI)));

  return p;
}

//------------------------------------------------------------
// theta_
// Computes the time-dependent pitch position of the puck
// at time t in the fixed frame. At t=0, theta_ == 0. Return
// value is the pitch angle in radians.
//------------------------------------------------------------
CoriolisSim.prototype.theta_ = function(t) {
  return this.p0.lat +
    Math.asin(Math.sin(this.alpha) * Math.sin(2*Math.PI*t/T_));
}

//------------------------------------------------------------
// phi_rotating
// Computes the time-dependent longitudinal position of the puck
// at time t in the rotating frame, or the starting longitude
// plus azimuthal degrees of
// travel from the starting point. At t=0, phi_ == 0. Return
// value is the azimuthal angle in radians.
//------------------------------------------------------------
CoriolisSim.prototype.phi_rotating = function(t) {
  return this.p0.lon + (this.phi_(t) - this.phi(t));
}

//------------------------------------------------------------
// p
// Computes the time-dependent position of the puck.
//------------------------------------------------------------
CoriolisSim.prototype.p = function(t) {
  const lat = this.theta_(t);
  const lon = this.phi_rotating(t);
  return new Position(lat, lon);
}

//------------------------------------------------------------
// v
// Computes the time-dependent velocity vector of the puck.
//------------------------------------------------------------
CoriolisSim.prototype.v = function(t) {
  let rad = this.v0.theta * Math.cos((t/T_)*2*Math.PI);
  return velFromRadians(rad, this.speed).cartesian(this.p(t));
}

//------------------------------------------------------------
// path
// Computes the puck's path from time t0 to time t1 in the
// fixed frame. divisions
// is the number of pieces to divide the curve into. Coordinates
// returned in fixed-frame cartesian coordinates.
//------------------------------------------------------------
CoriolisSim.prototype.pathRot = function(t0, t1, divisions) {
  if (t0 == t1) return [];

  const inc = (t1-t0)/divisions;
  let points = [];
  for (let t = t0; t <= t1; t += inc) {
    points.push(this.p(t));
  }
  return points;
}

//------------------------------------------------------------
// path
// Computes the puck's path from time t0 to time t1 in the
// fixed frame. divisions
// is the number of pieces to divide the curve into. Coordinates
// returned in fixed-frame cartesian coordinates.
//------------------------------------------------------------
CoriolisSim.prototype.pathFixed = function(t0, t1, divisions) {
  if (t0 == t1) return [];

  const inc = (t1-t0)/divisions;
  let points = [];
  for (let t = t0; t <= t1; t += inc) {
    const lat = this.theta_(t);
    const lon = this.phi_(t);
    pp = new Position(lat, lon);// + earthRotation(t));
    points.push(pp);
  }
  return points;
}

