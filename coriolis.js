const old = false;

//------------------------------------------------------------
// Everything should be in the rotating frame -- all equations
// in the paper are in the rotating frame.
//------------------------------------------------------------

//------------------------------------------------------------
// Constructor
// lon0 - longitude in radians at which the puck was struck.
// v0 - velocity of the puck in the rotating frame
//------------------------------------------------------------
var Coriolis = function(lat0, lon0, v0, earth) {
  const a = earth.a;
  this.earth = earth;

  // The initial position
  this.p0 = new Position(lat0, lon0);
  // The initial velocity
  // meters per second in each dimension
  // v0 is in the fixed frame
  // this.v0 = new Velocity(Math.sqrt(5/4)*V, V, 0);
  this.v0 = new Velocity(v0.north, v0.east, 0);

  // Speed of the puck in the two frames
  this.speedRotational = this.v0.north;
  this.speedFixed = Math.sqrt(sq(this.v0.east)+sq(this.v0.north));

  // radians
  this.theta0 = this.p0.lat;
  // radians
  this.phi0 = this.p0.lon;
  // meters/second
  this.vtheta0 = this.v0.north;
  // meters/second
  this.vphi0 = this.v0.east;

  // 54a, 54b

  const rho = this.earth.a * Math.cos(this.theta0)
    / Math.sqrt(1 - sq(this.earth.e*Math.sin(this.theta0)));
  // seconds
  this.phi_dot0 = this.vphi0 / rho;
  this._theta = this.theta0;
  this._phi = this.phi0;
  // seconds
  this.theta_dot0 = this.vtheta0 / this.earth.R(this.theta0);

  // Equation 66 of the paper
  const Omega = this.earth.Omega;
  const OmegaS = this.earth.OmegaS;
  // northward component of net force per unit mass
  const Fn = rho * Math.sin(this._theta)
    * (sq(Omega) - sq(OmegaS) + 2 * Omega * this.phi_dot0);
  // direction indicator if thetadot = Fn = 0
  const ind = -this._theta * this.phi_dot0; 
  if (this.theta_dot0 != 0) {
    // some north/south motion
    this.dir = this.theta_dot0 / Math.abs(this.theta_dot0);    
  } else if(Fn != 0) {
    // east/west motion with a north/south force
    this.dir = Fn / Math.abs(Fn);
    this.theta_dot0 = this.dir * 1e-10;
  }
  else if (ind != 0) {
    // east/west motion with no force; e = OmegaS = Omega = 0
    this.dir = ind / Math.abs(ind);
    this.theta_dot0 = this.dir * 1e-10;
  }
  else {
    // east/west motion at the equator
    this.dir = 0;
  }

  this.L0 = this.L_momentum(this.phi_dot0, this.theta0)
  // Kinetic energy
  // this.T = this.T0 = this.Kinetic(this.theta0, this.phi_dot0, this.theta_dot0)
  this.T = this.Kinetic(this.theta0, this.phi_dot0, this.theta_dot0)

  this.rotPath = [];
  this.inertialPath = [];
  this.lastRotPoint = null;
  this.lastInertialPoint = null;

  console.log('****************************************');
  console.log('Coriolis parameters');
  console.log('****************************************');
  console.log('R', this.earth.R(this.theta0));
  console.log('v0', v0);
  // console.log('vtheta0', this.vtheta0);
  console.log('phi0', this.phi0);
  console.log('theta0', this.theta0);
  console.log('phi_dot0', this.phi_dot0);
  console.log('theta_dot0', this.theta_dot0);
  // console.log('Omega', this.earth.Omega);
  console.log('L0', this.L0);
  // console.log('T0', this.T);
  // console.log('eccentricity', this.earth.e)
  console.log('rho', rho)
}

const sqrt = (v) => {
  if (v < 0) {
    // console.log('negative sqrt of ', v)
    throw "negative radicand"
  }
  return Math.sqrt(v)
}

Coriolis.prototype.L_momentum = function(phi_dot, theta) {
  const cos_sq = sq(Math.cos(theta));
  let res;
  if (old) {
    res = cos_sq * (1 + phi_dot / this.earth.Omega)
      / (1 - sq(this.earth.e * Math.sin(theta)))
  } else {
    res = (cos_sq / (1 - sq(this.earth.e * Math.sin(theta))))
      * ((this.earth.Omega + phi_dot) / OmegaR);
  }
  return res;
}

// Dimensionless kinetic energy, rotating frame
Coriolis.prototype.Kinetic = function(theta, dphi, dtheta) {
  const e = this.earth.e;
  const c = 1-sq(e) * sq(Math.sin(theta))
  const phidot = dphi;
  const thetadot = dtheta;
  const Omega = this.earth.Omega;
  let T;
  if (old) {
    T = sq(Math.cos(theta)) * sq(phidot / Omega) / c 
      + sq(1-sq(e)) * sq(thetadot / Omega) / (c*c*c) 
  } else {
    T = sq(Math.cos(theta)) * sq(phidot / OmegaR) / c 
      + sq(1-sq(e)) * sq(thetadot / OmegaR) / (c*c*c) 
  }
  return T;
}

// Dimensionless kinetic energy, rotating frame
Coriolis.prototype.T0 = function(theta, dphi, dtheta) {
  const e = this.earth.e;
  const c = 1-sq(e) * sq(Math.sin(theta))
  const phidot = dphi;
  const thetadot = dtheta;
  const Omega = this.earth.Omega;
  let T0;
  T0 = sq(Math.cos(theta)) * sq(phidot + Omega) / (c*sq(OmegaR)) 
    + sq(1-sq(e)) * sq(thetadot / OmegaR) / (c*c*c) 
  return T0;
}

function angSpeedRatio2DegPerHr(ratio) {
  return degrees(ratio * OmegaR) * 3600;
}

function angSpeedRatio2RadPerSec(ratio) {
  return ratio * OmegaR * 1e5;
}

function degPerHr2AngSpeedRatio(degPerHr) {
  return radians(degPerHr / 3600) / OmegaR;
}

function radPerSec2AngSpeedRatio(radPerSec) {
  return (radPerSec/1e5) / OmegaR;
}

//------------------------------------------------------------
// An object that stores phi, theta, and T
var PhiThetaT = function(phi, theta, T) {
  this.phi = phi;
  this.theta = theta;
  this.T = T;
}

PhiThetaT.prototype.add = function(state) {
  return new PhiThetaT(this.phi + state.phi, this.theta + state.theta, this.T + state.T);
}

PhiThetaT.prototype.mult = function(scalar) {
  return new PhiThetaT(this.phi * scalar, this.theta * scalar, this.T * scalar);
}
//------------------------------------------------------------

//------------------------------------------------------------
// Functions for the RK4 stepping
// Dependencies
// f1 <- f4 <- f2 <- f3
//------------------------------------------------------------

Coriolis.prototype.f1 = function(state) {
  const c1 = 1 - sq(this.earth.e) * sq(Math.sin(state.theta));
  let res;
  if (old) {
    res = c1 * this.L0 / sq(Math.cos(state.theta)) - 1;
  } else {
    res = c1 * this.L0 / sq(Math.cos(state.theta)) - this.earth.Omega/OmegaR;
  }
  return res;
}

Coriolis.prototype.f2 = function (state) {
  const c1 = 1 - sq(this.earth.e) * sq(Math.sin(state.theta));
  const c2 = 1 - sq(this.earth.e);
  let res =  this.dir*Math.pow(c1, 1.5) * sqrt(this.f4(state)) / c2;
  return res;
}

Coriolis.prototype.f3 = function (state) {
  const c1 = 1 - sq(this.earth.e) * sq(Math.sin(state.theta));
  const c2 = 1 - sq(this.earth.e);
  const OmegaS = this.earth.OmegaS;
  const Omega = this.earth.Omega;
  let res;
  if (old) {
    res = (sq(OmegaS/Omega) - 1)
      * c2 * Math.sin(2 * state.theta) * this.f2(state) / sq(c1);
  } else {
    const c3 = (sq(OmegaS)-sq(Omega))/sq(OmegaR);
    res = c3 * c2 * Math.sin(2 * state.theta) * this.f2(state) / sq(c1);
  }
  return res;
}

Coriolis.prototype.f4 = function(state) {
  const c1 = 1 - sq(this.earth.e) * sq(Math.sin(state.theta));
  const res = state.T - sq(this.f1(state) * Math.cos(state.theta)) / c1;
  return res;
}

Coriolis.prototype.phi_dot_impl = function(state) {
  let res;
  if (old) {
    res = this.earth.Omega * this.f1(state);
  } else {
    res = OmegaR * this.f1(state);
  }
  return res;
}

// Returns value in seconds
Coriolis.prototype.theta_dot_impl = function(state) {
  let res;
  if (old) {
    res = this.earth.Omega * this.f2(state);
  } else {
    res = OmegaR * this.f2(state);
  }
  return res;
}

Coriolis.prototype.T_dot_impl = function(state) {
  // const res = this.earth.Omega * this.f3(state);
  const c4 = (sq(this.earth.OmegaS) - sq(this.earth.Omega))/sq(OmegaR);
  const c5 = (1 - sq(this.earth.e)) * Math.sin(2*state.theta);
  const c6 = sq(1 - sq(this.earth.e) * sq(Math.sin(state.theta)));
  // theta dot
  const c7 = OmegaR * this.f2(state);
  const res = c4 * c5 * c7 / c6;
  return res;
}

// Phi, Theta, and T derivative functions
Coriolis.prototype._dot = function(state) {
  // console.log('f1', this.f1(state));
  // console.log('f2', this.f2(state));
  // console.log('f3', this.f3(state));
  // console.log('f4', this.f4(state));
  let phi_dot = this.phi_dot_impl(state);
  let theta_dot = this.theta_dot_impl(state);
  let T_dot = this.T_dot_impl(state);
  return new PhiThetaT(phi_dot, theta_dot, T_dot);
}

// Returns value in seconds
Coriolis.prototype.theta_dot = function() {
  return this.theta_dot_impl(new PhiThetaT(this._phi, this._theta, this.T));
}

// Returns value in seconds
Coriolis.prototype.phi_dot = function() {
  return this.phi_dot_impl(new PhiThetaT(this._phi, this._theta, this.T));
}

Coriolis.prototype.T_dot = function() {
  return this.T_dot_impl(new PhiThetaT(this._phi, this._theta, this.T));
}

//------------------------------------------------------------
// The following is test code from Boyd.

// series1.txt
// e = 0.08182 (earth’s eccentricity)
// Tau = stable period (23.935 hr) for that eccentricity
// Phi = 30°
// Theta = 45°
// Vphi = 0
// Vtheta = 0.1 v

// The code integrates forward with a regular time step of h = 1000 s until one of these time steps is invalid (that is, when one of the four radicands is negative).  Then the code integrates forward with a time step of h/2 until one of these time steps is invalid, then with h/4, etc., with the smallest time step being h/1024.  The code declares the last valid result at this time step to be the extremum.  The attached file shows all valid time steps.  Note that, for the two theta extrema found by the code, neither is within its original invalid time step of 1000 s.  The last column of the file says “theta” when the code is searching for a theta extremum, and "phi" for a phi extremum.  The second-to-last column gives the time step used for the previous step. 
function rk4test1(h0 = 1000) {
  // V is in m/s, so N is in m/s
  const v_theta = 0.1 * globalEarth.a * globalEarth.Omega;
  const E = 0;//globalEarth._V;
  
  const V = new Velocity(v_theta, E, 0);
  c = new Coriolis(radians(45), radians(30), V, globalEarth, 0.08182);
  console.log('*******************************************');
  console.log('       t (s)    phi    theta      K      K/K0   K_/K0_     h      ext');

  t = 0;
  if (debug) c.printValues(t, h0);
  for (let i = 0; i < 80; i++) {
    t = stepRK4(c, h0, t, true);
  }
  console.log('completed test');
  console.log('*******************************************');
}

// series2.txt
// e = 0.3 ! eccentricity (reference = 0.08182) TEST 2
// Tau = 10 ! earth's sidereal period (hr) TEST 2
// phi = 5 ! initial longitude (degrees) TEST 2
// theta = 10 ! initial latitude (degrees) TEST 2
// vphi = -0.8 ! initial dimensionless eastward velocity TEST 2
// vtheta = 0.1 ! initial dimensionless northward velocity TEST 2
// Here are the angular speeds:
//   stable angular speed (rad/s) =   0.0002617225
//   angular speed (rad/s) =   0.0001745329
function rk4test2(h0 = 1000) {
  let earth = new Earth(true, 0.3, 10)
  // V is in m/s, so N is in m/s
  const v_theta = 0.1 * earth.a * earth.Omega;
  const E = -0.8 * earth.a * earth.Omega;// + earth._V;

  const V = new Velocity(v_theta, E, 0);
  c = new Coriolis(radians(10), radians(5), V, earth, earth.e);
  console.log('*******************************************');
  console.log('       t (s)    phi    theta      K      K/K0   K_/K0_     h      ext');

  t = 0;
  if (debug) c.printValues(t, h0);
  for (let i = 0; i < 80; i++) {
    t = stepRK4(c, h0, t, true);
  }
  console.log('completed test');
  console.log('*******************************************');
}

// series3.txt
// e = 0.3  eccentricity
// OmegaRat = 2  ratio of angular speed to reference angular speed
// phi = 5 initial longitude (degrees)
// theta = 10 initial latitude (degrees)
// vphi = -700 initial eastward velocity (m/s)
// vtheta = 100 initial westward velocity (m/s)
// m = 70 number of integration steps
// h = 1000 regular time step (s)
function rk4test3(h0 = 1000) {
  let earth = new Earth(0.3, 2)
  // V is in m/s, so N is in m/s
  // const v_theta = 0.1 * earth.a * earth.Omega;
  // const E = -0.8 * earth.a * earth.Omega;// + earth._V;

  // const V = new Velocity(v_theta, E, 0);
  const V = new Velocity(100, -700);
  c = new Coriolis(radians(10), radians(5), V, earth);
  console.log('*******************************************');
  console.log('       t (s)    phi    theta      K      K/K0   K_/K0_     h      ext');

  t = 0;
  if (debug) c.printValues(t, h0);
  for (let i = 0; i < 70; i++) {
    t = stepRK4(c, h0, t, true);
  }
  console.log('completed test');
  console.log('*******************************************');
}

// series4.txt
// e = 0  eccentricity
// OmegaRat = 0  ratio of angular speed to reference angular speed
// phi = 45 initial longitude (degrees)
// theta = 30 initial latitude (degrees)
// vphi = 500 initial eastward velocity (m/s)
// vtheta = 0 initial northward velocity (m/s)
// m = 70 number of integration steps
// h = 1000 regular time step (s)
function rk4test4(h0 = 1000) {
  let earth = new Earth(0, 0)
  // V is in m/s, so N is in m/s
  // const v_theta = 0.1 * earth.a * earth.Omega;
  // const E = -0.8 * earth.a * earth.Omega;// + earth._V;

  // const V = new Velocity(v_theta, E, 0);
  const V = new Velocity(0, 500);
  c = new Coriolis(radians(30), radians(45), V, earth);
  console.log('*******************************************');
  console.log('       t (s)    phi    theta      K      K/K0   K_/K0_     h      ext');

  t = 0;
  if (debug) c.printValues(t, h0);
  for (let i = 0; i < 70; i++) {
    t = stepRK4(c, h0, t, true);
  }
  console.log('completed test');
  console.log('*******************************************');
}

Coriolis.prototype.printValues = function(t, h) {
  // Succeeded, so print out values
  const phi = degrees(this._phi).toFixed(5).padStart(6, ' ');
  const theta = degrees(this._theta).toFixed(5).padStart(8, ' ');
  const K = this.T.toFixed(5).padStart(6, ' ');
  const KK0 = '.'.padStart(9);
  const K_K0_ = '.'.padStart(8);
  const hs = h.toFixed(3).padStart(9, ' ');
  console.log(`${t.toFixed(3).padStart(12, ' ')} ${phi} ${theta} ${K} ${KK0} ${K_K0_} ${hs}`);
}

Coriolis.prototype.getState = function() {
  return new PhiThetaT(this._phi, this._theta, this.T);
}

// stepRK4
// If we tread into illegal territory (theta exceeds/falls below theta_max/theta_min)
// then cut the step in half and go as far as you can. Then cut the step in half again...
function stepRK4(c, h0, t, debug=false) {
  try {
    const p = rk4(h0, c.getState(), c._dot.bind(c));

    c._theta = p.theta;
    c._phi = p.phi;
    c.T = p.T;
    t += h0;
    if (debug) c.printValues(t, h0);
  } catch(e) {
    if (e != 'negative radicand') throw e;
    // We went into illegal territory, so do the modified binary search:
    // console.log('illegal', e);
    h = h0/2;
    while (h > h0/2048) {
      try {
        // Go as far as we can with this step size
        while(true) {
          const p = rk4(h, c.getState(), c._dot.bind(c));
          c._theta = p.theta;
          c._phi = p.phi;
          c.T = p.T;
          t += h;
          if (debug) c.printValues(t, h);
        }
      } catch(e) {
        if (e != 'negative radicand') throw e;
        h /= 2;
      }
    }
    c.dir = -c.dir;
  }
  return t;
}

// const PATH_INC_DEFAULT = 1;
const PATH_INC_DEFAULT = 1;
let pathInc = PATH_INC_DEFAULT; // In degrees
Coriolis.prototype.step = function(h) {
  stepRK4(this, h, 0);

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
    // if (typeof newInertialPoint == 'undefined') {
    //   console.log('xxxx undefined');
    // }
    this.inertialPath.push(newInertialPoint);
  }

  let newPathInc = pathInc;

  if (efficientPath && this.rotPath.length > maxPathSegments) {
    this.rotPath.shift();
    // console.log('updating path - new pathInc =', pathInc*2);
    // let newrp = [];
    // for (let i = 0; i < this.rotPath.length; i += 2) {
    //   newrp.push(this.rotPath[i]);
    // }
    // this.rotPath = newrp;
    // newPathInc = pathInc * 2;
  }

  if (efficientPath && this.inertialPath.length > maxPathSegments) {
    this.inertialPath.shift();
    // console.log('updating path - new pathInc =', pathInc*2);
    // let newip = [];
    // for (let i = 0; i < this.inertialPath.length; i += 2) {
    //   if (typeof this.inertialPath[i] == 'undefined') {
    //     console.log('xxxx undefined', i, this.inertialPath.length);
    //   }
    //   newip.push(this.inertialPath[i]);
    // }
    // this.inertialPath = newip;
    // newPathInc = pathInc * 2;
  }

  pathInc = newPathInc;
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
  throw 'Unexpected call of Coriolis.phi_()';
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
  throw 'Unexpected call of Coriolis.theta_()';
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
Coriolis.prototype.vInertial = function(time) {
  const vphi = this.earth.rho(this._theta) * this.phi_dot_impl(this.getState())
    + this.earth.Omega*this.earth.rho(this._theta);
  const vtheta = this.earth.R(this._theta) * this.theta_dot_impl(this.getState());
  const length = Math.sqrt(sq(vphi) + sq(vtheta));
  let v = new Velocity(vtheta, vphi).cartesian(this.p(time));
  v = v.normalize();
  v = v.multiplyScalar(length * arrowScale);

  let theta = ((degrees(this._theta) % 360) + 360) % 360;
  if (theta > 270) {
  } else if (theta > 180) {
    v = v.multiplyScalar(-1);
  } else if (theta > 90) {
    v = v.multiplyScalar(-1);
  }

  return v;
}

//------------------------------------------------------------
// v
// Computes the time-dependent velocity vector of the puck.
//------------------------------------------------------------
Coriolis.prototype.vRotating = function(time) {
  const vphi = this.earth.rho(this._theta) * this.phi_dot_impl(this.getState());
  const vtheta = this.earth.R(this._theta) * this.theta_dot_impl(this.getState());
  const length = Math.sqrt(sq(vphi) + sq(vtheta));
  let v = new Velocity(vtheta, vphi).cartesian(this.p(time));
  v = v.normalize();
  v = v.multiplyScalar(length * arrowScale);

  let theta = ((degrees(this._theta) % 360) + 360) % 360;
  if (theta > 270) {
  } else if (theta > 180) {
    v = v.multiplyScalar(-1);
  } else if (theta > 90) {
    v = v.multiplyScalar(-1);
  }

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
    if (typeof p == 'undefined') {
      console.log('inertial path Undefined!');
    }
    points.push(p);
  });
  points.push(new Position(this._theta,
                           this._phi+this.earth.earthRotation(time)));

  return points;
}

