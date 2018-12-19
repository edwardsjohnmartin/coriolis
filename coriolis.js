//------------------------------------------------------------
//------------------------------------------------------------
// This code uses analytic equations for puck position and
// velocity.
//------------------------------------------------------------
//------------------------------------------------------------


//------------------------------------------------------------
// Constructor
// lon0 is the longitude in radians at which the puck was
// struck.
//------------------------------------------------------------
var Coriolis = function(lon0) {
  // The initial position
  this.p0 = new Position(0, lon0);
  // The initial velocity
  // this.v0 = new Velocity(V, Math.sqrt(5/4)*V, 0);
  this.v0 = new Velocity(Math.sqrt(5/4)*V, V, 0);
  // Speed of the puck
  this.speedRotational = this.v0.north;
  this.speedFixed = Math.sqrt(sq(this.v0.east)+sq(this.v0.north));
  this.alpha = Math.atan2(Math.sqrt(5/4), 1);
  this.speedFactor = 0.0005;

  //--------------------
  // New stuff
  //--------------------
  this.theta0 = this.p0.lat;
  this.phi0 = this.p0.lon;
  this.vtheta0 = this.v0.north;
  this.vphi0 = this.v0.east;
  this.theta_dot0 = this.vtheta0 / R;
  this.phi_dot0 = this.vphi0 / (R * Math.cos(this.theta0));

  this.L0 = (OMEGA + this.phi_dot0) * sq(Math.cos(this.theta0));
  this.T0 = sq(OMEGA + this.phi_dot0) * sq(Math.cos(this.theta0)) +
    sq(this.theta_dot0);
  this.T = sq(this.phi_dot0) * sq(Math.cos(this.theta0)) +
    sq(this.theta_dot0);

  this._theta = 0;
  this._phi = radians(-75);
}

Coriolis.prototype.theta_dot = function() {
  return Math.sqrt(this.T0 - sq(this.L0)/Math.cos(this._theta));
}

Coriolis.prototype.phi_dot = function() {
  return this.L0 / sq(Math.cos(this._theta)) - OMEGA;
}

Coriolis.prototype.step = function() {
  // Euler integration
  this._theta += this.theta_dot()*100;
  this._phi += this.phi_dot()*100;
}

//------------------------------------------------------------
// phi
// Computes the time-dependent azimuthal position of the
// launch point of the puck as seen by an observer in the
// fixed frame. It tracks the line of longitude from which the
// puck was fired. Return value is the azimuthal position in
// radians.
//------------------------------------------------------------
Coriolis.prototype.phi = function(t) {
  return this.p0.lon + 2 * Math.PI * t / T;
}

//------------------------------------------------------------
// phi_
// Computes the time-dependent azimuthal position of the puck
// at time t in the fixed frame. At t=0, phi == phi_. Return
// value is the azimuthal angle in radians.
//------------------------------------------------------------
Coriolis.prototype.phi_ = function(t) {
  let a = 2*Math.PI*t/T_;
  const s = Math.sin(a);
  const c = Math.cos(a);
  let p = this.p0.lon + Math.atan2((V/this.speedFixed)*s, c);
  return p;
}

//------------------------------------------------------------
// theta_
// Computes the time-dependent pitch position of the puck
// at time t in the fixed frame. At t=0, theta_ == 0. Return
// value is the pitch angle in radians.
//------------------------------------------------------------
Coriolis.prototype.theta_ = function(t) {
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
Coriolis.prototype.phi_rotating = function(t) {
  return this.p0.lon + (this.phi_(t) - this.phi(t));
}

//------------------------------------------------------------
// p
// Computes the time-dependent position of the puck.
//------------------------------------------------------------
Coriolis.prototype.p = function(t) {
  const lat = this.theta_(t);
  const lon = this.phi_rotating(t);
  return new Position(lat, lon);
}

Coriolis.prototype.new_p = function(t) {
  return new Position(this._theta, this._phi);
}

//------------------------------------------------------------
// v
// Computes the time-dependent velocity vector of the puck.
//------------------------------------------------------------
Coriolis.prototype.vFixed = function(t) {
  let rad = this.v0.theta * Math.cos((t/T_)*2*Math.PI);
  // return velFromRadians(rad, this.speedFixed).cartesian(this.p(t));
  // return this.vNormalized(velFromRadians(rad, this.speedFixed).cartesian(this.p(t)));
  let v = velFromRadians(rad, this.speedFixed).cartesian(this.p(t));
  v = v.normalize();
  v = v.multiplyScalar(this.speedFactor*this.speedFixed);
  return v;
}

//------------------------------------------------------------
// v
// Computes the time-dependent velocity vector of the puck.
//------------------------------------------------------------
Coriolis.prototype.vRotational = function(t) {
  let rad = this.v0.theta * Math.cos((t/T_)*2*Math.PI);
  let vLatLon = velFromRadians(rad, this.speedFixed);
  vLatLon = new Velocity(vLatLon.north, vLatLon.east - V);
  // return vLatLon.cartesian(this.p(t));
  // return this.vNormalized(vLatLon.cartesian(this.p(t)));
  let v = vLatLon.cartesian(this.p(t));
  v = v.normalize();
  v = v.multiplyScalar(this.speedFactor*this.speedRotational);
  return v;
}

// Step every 10 minutes
const cPathInc = 10*60;


//------------------------------------------------------------
// path
// Computes the puck's path from time t0 to time t1 in the
// fixed frame. divisions
// is the number of pieces to divide the curve into. Coordinates
// returned in fixed-frame cartesian coordinates.
//------------------------------------------------------------
Coriolis.prototype.pathRot = function(t0, t1) {
  if (t0 == t1) return [];

  // const inc = (t1-t0)/divisions;
  const inc = cPathInc;
  let points = [];
  for (let t = t0; t < t1; t += inc) {
    points.push(this.p(t));
  }
  // Catch the last point
  points.push(this.p(t1));

  return points;
}

//------------------------------------------------------------
// path
// Computes the puck's path from time t0 to time t1 in the
// fixed frame. divisions
// is the number of pieces to divide the curve into. Coordinates
// returned in fixed-frame cartesian coordinates.
//------------------------------------------------------------
Coriolis.prototype.pathFixed = function(t0, t1) {
  if (t0 == t1) return [];

  // const inc = (t1-t0)/divisions;
  const inc = cPathInc;
  let points = [];
  for (let t = t0; t < t1; t += inc) {
    pp = new Position(this.theta_(t), this.phi_(t));
    points.push(pp);
  }
  // Catch the last point
  pp = new Position(this.theta_(t1), this.phi_(t1));
  points.push(pp);

  return points;
}

