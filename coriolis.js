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
var Coriolis = function(lat0, lon0, v0, earth) {
  // console.log(earth);
  let V = earth.V;
  let R = earth.R;
  this.earth = earth;

  // The initial position
  this.p0 = new Position(lat0, lon0);
  // The initial velocity
  // meters per second in each dimension
  // v0 is in the fixed frame
  // this.v0 = new Velocity(Math.sqrt(5/4)*V, V, 0);
  this.v0 = new Velocity(v0.north, v0.east+V, 0);
  console.log('v0', v0);

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

  // ellipsoidal params
  this.eccentricity = 0.5

  // this.earthType = earth.type;

  // seconds
  this.L0 = (this.earth.OMEGA + this.phi_dot0) * sq(Math.cos(this.theta0));
  if (this.earth.type == EARTH_SPHERE) {
    // sec^2
    this.T0 = sq(this.earth.OMEGA + this.phi_dot0) * sq(Math.cos(this.theta0)) +
      sq(this.theta_dot0);
    this._thetaMax = Math.acos(Math.sqrt(sq(this.L0)/this.T0));
    this._thetaMin = -this._thetaMax;
  } else if (this.earth.type == EARTH_ELLIPSOID) {
    // sec^2
    this.T = sq(this.phi_dot0) * sq(Math.cos(this.theta0)) +
      sq(this.theta_dot0);

    const num1 = -Math.sqrt(this.T) + Math.sqrt(
      this.T+4*this.earth.OMEGA*this.L0);
    // num2 can give a negative number which makes acos undefined.
    const num2 = -Math.sqrt(this.T) - Math.sqrt(
      this.T+4*this.earth.OMEGA*this.L0);
    const den = 2 * earth.OMEGA;
    this._thetaMax = Math.acos(num1/den);
    // console.log('num2', num2, num2/den);
    const y = num2/den;
    if (y >= -1 && y <= 1) {
      this._thetaMin = Math.acos(num2/den);
      if (this._thetaMin > Math.PI/2) {
        this._thetaMin = Math.PI - this._thetaMin;
      }
    } else {
      this._thetaMin = -this._thetaMax;
    }
  } else {
    throw "Illegal earth type: " + earth.type;
  }

  if (this.earth.V == 0) {
    this._thetaMax = this.theta0;
    this._thetaMin = -this._thetaMax;
  }

  if (Math.abs(this._thetaMax - this._thetaMin) < EPSILON) {
    this._thetaMin = this._thetaMax;
    this.theta0 = Math.min(this.theta0, this._thetaMax);
    this.theta0 = Math.max(this.theta0, this._thetaMin);
  } else {
    this.theta0 = Math.min(this.theta0, this._thetaMax-EPSILON);
    this.theta0 = Math.max(this.theta0, this._thetaMin+EPSILON);
  }

  this._theta = this.theta0;
  // console.log("this._theta: " + this._theta);
  // this._phi = radians(-75);
  this._phi = this.phi0;

  // this.theta_dot_negate = false;

  this.rotPath = [];
  this.inertialPath = [];
  this.lastRotPoint = null;
  this.lastInertialPoint = null;

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

const F = (e) => {
  const Fr = 0.8086
  const er = 0.08182
  const A = (1 - Fr) / (1 - er)
  const B = (Fr - er) / (1 - er)
  return A * e + B;
}

const sphereAngularSpeed = 1.242 / 1000

const secondEccentricity = (e) => {
  return e / Math.sqrt(1 - e * e)
}

const q = (e) => {
  const es = secondEccentricity(e)
  return 1 / es * (1 + 3 / (es * es)) * Math.atan(es) - 3 / (es * es)
}

const stableAngularSpeed = (e) => {
  const determinant = 15 / 4 * q(e) * (1 - 3 * F(e) / 5)
  return sphereAngularSpeed * Math.sqrt(determinant)
}

const angularSpeed = (e) => {
  // if fixed , 2 * Math.PI / T
  return stableAngularSpeed(e)
}

const L = (dphi, e, theta) => {
  const cos_sq = Math.cos(theta) * Math.cos(theta)
  return cos_sq * (1 + dphi / angularSpeed(e)) / (1 - e * e * (1 - cos_sq))
}

const T = (dphi, dtheta, e) => {
  const cos_sq = Math.cos(theta) * Math.cos(theta)
  const sin_sq = 1 - cos_sq
  const s_sq = stableAngularSpeed(e)
  const D = 1 - e * e * sin_sq
  return cos_sq * dphi * dphi / s_sq / D + dtheta * dtheta / s_sq * Math.pow(1 - e * e, 2)  / Math.pow(D, 3)
}

const Tdot = (theta, dphi, dtheta, e) => {
  const A = Math.pow(stableAngularSpeed(e), 2) / Math.pow(angularSpeed(e), 2) - 1
  const B = (1 - e * e) * Math.sin(2 * theta) / Math.pow(1 - e * e * Math.pow(Math.sin(theta), 2)) * dtheta / angularSpeed(e)
  return angularSpeed(e) * A * B;
}

const f1 = (theta, dphi, e) => {
  return (1 - e * e * Math.pow(Math.sin(theta), 2)) * L(dphi, e, theta) / Math.pow(Math.cos(theta), 2) - 1
}

const f2 = (theta, phi_dot, theta_dot, e) => {
  const a = 1 - e * e * Math.pow(Math.sin(theta), 2)
  return  Math.pow(a, 1.5) / (1 - e * e) * Math.pow(T(phi_dot, theta_dot, e) - Math.pow(f1(theta, phi_dot, e) * Math.cos(theta) / a), 0.5)
}

const f3 = (theta, dphi, dtheta, e) => {
  const A = Math.pow(stableAngularSpeed(e), 2) / Math.pow(angularSpeed(e), 2) - 1
  const B = (1 - e * e) * Math.sin(2 * theta) / Math.pow(1 - e * e * Math.pow(Math.sin(theta), 2))
  return A * B * f2(theta, dphi, dtheta, e)
}

// Returns value in seconds
Coriolis.prototype.theta_dot_impl = function(theta) {
  // sec^2
  if (this.earth.type == EARTH_SPHERE) {
    // spherical
    let radicand = this.T0 - sq(this.L0/Math.cos(theta));
    if (radicand < 0) {
      // Negative radicand!
      throw("Overshot the theta maximum: " + theta);
    }
    if (this.theta_dot_negate) {
      return -1 * Math.sqrt(radicand);
    }
    return Math.sqrt(radicand);
  }
  return angularSpeed(theta) * f2(theta, this.prev_phi_dot, this.prev_theta_dot, this.eccentricity)
}

Coriolis.prototype.phi_dot_impl = function(theta) {
  return this.L0 / sq(Math.cos(theta)) - this.earth.OMEGA;
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

  this.prev_theta_dot = (1/6)*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0])
  this.prev_phi_dot = (1/6)*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])
  return [this._theta + (1/6)*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0]),
          this._phi + (1/6)*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])];
}

let pathInc = 1; // In degrees
Coriolis.prototype.step = function(h) {
  // console.log('theta = ' + this._theta);
  let p = null;
  try {
    p = this.stepRK4(h);
  } catch(e) {
    // We pushed past the theta max limit.
    console.log('error: ' + e);
  }
  console.log('p = ' + p);
  // if (p == null || Math.abs(p[0]) > Math.abs(this._thetaMax)) {
  if (p == null || p[0] > this._thetaMax || p[0] < this._thetaMin) {
    // We're overshooting the max theta value. This is a hack. We fix
    // theta to thetaMax and adjust phi as necessary.
    // console.log("overshot");
    p = [];
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
  // console.log("x = " + this._theta);
  this._theta = p[0];
  this._phi = p[1];

  const newRotPoint = new Position(this._theta, this._phi);
  if (this.lastRotPoint == null ||
      this.lastRotPoint.dist(newRotPoint) > radians(pathInc)) {
    this.lastRotPoint = newRotPoint;
    this.rotPath.push(newRotPoint);
  }

  const newInertialPoint =
    new Position(this._theta, this._phi+this.earth.earthRotation(time));
  if (this.lastInertialPoint == null ||
      this.lastInertialPoint.dist(newInertialPoint) > radians(pathInc)) {
    this.lastInertialPoint = newInertialPoint;
    this.inertialPath.push(newInertialPoint);
  }

  // console.log('path length =', this.rotPath.length);
  if (this.rotPath.length > maxPathSegments) {
    console.log('updating path - new pathInc =', pathInc*2);
    let newrp = [];
    let newip = [];
    for (let i = 0; i < this.rotPath.length; i += 2) {
      newrp.push(this.rotPath[i]);
      newip.push(this.inertialPath[i]);
    }
    this.rotPath = newrp;
    this.inertialPath = newip;
    pathInc *= 2;
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
  let rad = this.v0.theta * Math.cos((t/this.earth.T_)*2*Math.PI);
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
  let rad = this.v0.theta * Math.cos((t/this.earth.T_)*2*Math.PI);
  let vLatLon = velFromRadians(rad, this.speedFixed);
  vLatLon = new Velocity(vLatLon.north, vLatLon.east - this.earth.V);
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
  this.rotPath.forEach(p => {
    points.push(p);
  });
  points.push(new Position(this._theta, this._phi));

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

  // // const inc = (t1-t0)/divisions;
  // const inc = cPathInc;
  // let points = [];
  // for (let t = t0; t < t1; t += inc) {
  //   pp = new Position(this.theta_(t), this.phi_(t));
  //   points.push(pp);
  // }
  // // Catch the last point
  // pp = new Position(this.theta_(t1), this.phi_(t1));
  // points.push(pp);

  let points = [];
  this.inertialPath.forEach(p => {
    points.push(p);
  });
  points.push(new Position(this._theta,
                           this._phi+this.earth.earthRotation(time)));

  return points;
}

