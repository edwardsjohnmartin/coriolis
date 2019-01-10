//------------------------------------------------------------
//------------------------------------------------------------
// This code uses analytic equations for puck position and
// velocity.
//------------------------------------------------------------
//------------------------------------------------------------

//------------------------------------------------------------
// Constructor
// lon0 is the longitude in radians at which the puck was
// struck. earthType is EARTH_SPHERE or EARTH_ELLIPSOID.
//------------------------------------------------------------
// start a 1/4 Omega * R
// start at 40 degrees
// should make little circles around that latitude and drift westward
// there will be a theta min and theta max
// try initial velocity of zero - will stay there in ellipsoidal and
// move in spherical if released away from equator
var Coriolis = function(lat0, lon0, v0, earthType) {
  // The initial position
  this.p0 = new Position(lat0, lon0);
  // The initial velocity
  // meters per second in each dimension
  // v0 is in the fixed frame
  // this.v0 = new Velocity(Math.sqrt(5/4)*V, V, 0);
  this.v0 = new Velocity(v0.north, v0.east+V, 0);
  // Speed of the puck
  this.speedRotational = this.v0.north;
  this.speedFixed = Math.sqrt(sq(this.v0.east)+sq(this.v0.north));
  // this.alpha = Math.atan2(Math.sqrt(5/4), 1);
  this.alpha = Math.atan2(this.v0.north/V, this.v0.east/V);
  this.speedFactor = 0.0005;

  //--------------------
  // New stuff
  //--------------------
  // radians
  this.theta0 = this.p0.lat;
  // radians
  this.phi0 = this.p0.lon;
  // meters/second
  this.vtheta0 = this.v0.north;
  // meters/second
  this.vphi0 = this.v0.east - V;
  // seconds
  this.theta_dot0 = this.vtheta0 / R;
  // seconds
  this.phi_dot0 = this.vphi0 / (R * Math.cos(this.theta0));

  this.earthType = earthType;

  // seconds
  this.L0 = (OMEGA + this.phi_dot0) * sq(Math.cos(this.theta0));
  if (this.earthType == EARTH_SPHERE) {
    // sec^2
    this.T0 = sq(OMEGA + this.phi_dot0) * sq(Math.cos(this.theta0)) +
      sq(this.theta_dot0);
    this._thetaMax = Math.acos(Math.sqrt(sq(this.L0)/this.T0));
    this._thetaMin = -this._thetaMax;
  } else if (earthType == EARTH_ELLIPSOID) {
    // sec^2
    this.T = sq(this.phi_dot0) * sq(Math.cos(this.theta0)) +
      sq(this.theta_dot0);

    const num1 = -Math.sqrt(this.T) + Math.sqrt(this.T+4*OMEGA*this.L0);
    // num2 can give a negative number which makes acos undefined.
    const num2 = -Math.sqrt(this.T) - Math.sqrt(this.T+4*OMEGA*this.L0);
    const den = 2 * OMEGA;
    this._thetaMax = Math.acos(num1/den);
    if (num2 < 0) {
      this._thetaMin = -this._thetaMax;
    } else {
      this._thetaMin = Math.acos(num2/den);
    }
  } else {
    throw "Illegal earth type: " + earthType;
  }

  this.theta0 = Math.min(this.theta0, this._thetaMax);
  this.theta0 = Math.max(this.theta0, this._thetaMin);

  this._theta = this.theta0;
  // this._phi = radians(-75);
  this._phi = this.phi0;

  // this.theta_dot_negate = false;

  this.path = [];
  this.lastPoint = null;

  console.log('V', V);
  console.log('vtheta0', this.vtheta0);
  console.log('theta_dot0', this.theta_dot0);
  console.log('phi_dot0', this.phi_dot0);
  console.log('theta0', this.theta0);
  console.log('L0', this.L0);
  console.log('T0', this.T0);
  console.log('thetaMax', degrees(this._thetaMax));
  console.log('thetaMin', degrees(this._thetaMin));
}

// Returns value in seconds
Coriolis.prototype.theta_dot_impl = function(theta) {
  // sec^2
  let radicand = null;
  if (this.earthType == EARTH_SPHERE) {
    // spherical
    radicand = this.T0 - sq(this.L0/Math.cos(theta));
  } else {
    // ellipsoidal
    const num = this.L0-OMEGA*sq(Math.cos(theta));
    radicand = this.T - sq(num/Math.cos(theta));
  }
  if (radicand < 0) {
    // Negative radicand!
    throw("Overshot the theta maximum: " + theta);
  }
  if (this.theta_dot_negate) {
    return -1 * Math.sqrt(radicand);
  }
  return Math.sqrt(radicand);
}

Coriolis.prototype.phi_dot_impl = function(theta) {
  return this.L0 / sq(Math.cos(theta)) - OMEGA;
}

// Returns value in seconds
Coriolis.prototype.theta_dot = function() {
  return this.theta_dot_impl(this._theta);
}

// Returns value in seconds
Coriolis.prototype.phi_dot = function() {
  return this.phi_dot_impl(this._theta);
}

// RK4
Coriolis.prototype.stepRK4 = function(h) {
  const k1 = [h * this.theta_dot_impl(this._theta),
              h * this.phi_dot_impl(this._theta)];
  const k2 = [h * this.theta_dot_impl(this._theta+k1[0]/2),
              h * this.phi_dot_impl(this._theta+k1[1]/2)];
  const k3 = [h * this.theta_dot_impl(this._theta+k2[0]/2),
              h * this.phi_dot_impl(this._theta+k2[1]/2)];
  const k4 = [h * this.theta_dot_impl(this._theta+k3[0]),
              h * this.phi_dot_impl(this._theta+k3[1])];
  
  return [this._theta + (1/6)*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0]),
          this._phi + (1/6)*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])];
}

Coriolis.prototype.step = function(h) {
  let p = null;
  try {
    p = this.stepRK4(h);
  } catch {
    // We pushed past the theta max limit.
  }
  // if (p == null || Math.abs(p[0]) > Math.abs(this._thetaMax)) {
  if (p == null || p[0] > this._thetaMax || p[0] < this._thetaMin) {
    // We're overshooting the max theta value. This is a hack. We fix
    // theta to thetaMax and adjust phi as necessary.
    p = [];
    const EPSILON = 0.0000001;
    const theta_dot = this.theta_dot();
    if (theta_dot > 0) {
      p[0] = this._thetaMax - EPSILON;
    } else {
      p[0] = this._thetaMin + EPSILON;
    }
    const h_ = (Math.abs(p[0]-this._theta)+2*EPSILON) /
      Math.abs(this.theta_dot());
    p[1] = this._phi + this.phi_dot_impl(this._theta)*h_;

    this.theta_dot_negate = !this.theta_dot_negate;
  }
  this._theta = p[0];
  this._phi = p[1];

  const newPoint = new Position(this._theta, this._phi);
  if (this.lastPoint == null || this.lastPoint.dist(newPoint) > radians(1)) {
    this.lastPoint = newPoint;
    this.path.push(newPoint);
  }
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
Coriolis.prototype.old_p = function(t) {
  const lat = this.theta_(t);
  const lon = this.phi_rotating(t);
  return new Position(lat, lon);
}

Coriolis.prototype.p = function(t) {
  return new Position(this._theta, this._phi);
}

//------------------------------------------------------------
// v
// Computes the time-dependent velocity vector of the puck.
//------------------------------------------------------------
Coriolis.prototype.vFixed = function(t) {
  let rad = this.v0.theta * Math.cos((t/T_)*2*Math.PI);
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

  // // const inc = (t1-t0)/divisions;
  // const inc = cPathInc;
  // let points = [];
  // for (let t = t0; t < t1; t += inc) {
  //   points.push(this.p(t));
  // }
  // // Catch the last point
  // points.push(this.p(t1));

  // return points;

  let points = [];
  this.path.forEach(p => {
    points.push(p);
  });

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

