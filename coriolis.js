//------------------------------------------------------------
//------------------------------------------------------------
// This code uses analytic equations for puck position and
// velocity.
//------------------------------------------------------------
//------------------------------------------------------------

//------------------------------------------------------------
//------------------------------------------------------------
// Everything should be in rotating frame -- all equations in
// the paper are rotating frame.
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
var Coriolis = function(lat0, lon0, v0, earth, eccentricity = 0.08182) {
  // console.log();
  // console.log();
  // console.log();
  // console.log();

  const V = earth.V;
  const a = earth.a;
  this.earth = earth;

  // The initial position
  this.p0 = new Position(lat0, lon0);
  // The initial velocity
  // meters per second in each dimension
  // v0 is in the fixed frame
  // this.v0 = new Velocity(Math.sqrt(5/4)*V, V, 0);
  this.v0 = new Velocity(v0.north, v0.east, 0);
  console.log('v0', v0);

  // Speed of the puck in the two frames
  this.speedRotational = this.v0.north;
  this.speedFixed = Math.sqrt(sq(this.v0.east)+sq(this.v0.north));

  this.alpha = Math.atan2(this.v0.north/V, this.v0.east/V);
  this.speedFactor = 0.0005;

  this.eccentricity = eccentricity

  // radians
  this.theta0 = this.p0.lat;
  // radians
  this.phi0 = this.p0.lon;
  // meters/second
  this.vtheta0 = this.v0.north;
  // meters/second
  this.vphi0 = this.v0.east - V;
  // seconds
  this.theta_dot0 = this.vtheta0 / this.earth.R(this.theta0);
  if (this.theta_dot0 > 0) {
    this.dir = 1; // thetadot is positive
  } else {
    this.dir = -1; // thetadot is negative
  }

  // seconds
  this.phi_dot0 = this.vphi0 / (this.earth.R(this.theta0) * Math.cos(this.theta0));

  this._theta = this.theta0;

  this._phi = this.phi0;

  this.L0 = this.L_momentum(this.phi_dot0, this.theta0)
  this.T = this.T0 = this.Kinetic(this.theta0, this.phi_dot0, this.theta_dot0)

  this.rotPath = [];
  this.inertialPath = [];
  this.lastRotPoint = null;
  this.lastInertialPoint = null;

  console.log('V', V);
  console.log('vtheta0', this.vtheta0);
  console.log('theta_dot0', this.theta_dot0);
  console.log('phi_dot0', this.phi_dot0);
  console.log('theta0', this.theta0);
  console.log('phi0', this.phi0);
  console.log('OMEGA', this.earth.OMEGA);
  console.log('L0', this.L0 * this.earth.OMEGA);
  console.log('T0', this.T * this.earth.OMEGA * this.earth.OMEGA);
  console.log('eccentricity', this.eccentricity)
}

const sqrt = (v) => {
  if (v < 0) {
    // console.log('negative sqrt of ', v)
    throw "negative radicand"
  }
  return Math.sqrt(v)
}

Coriolis.prototype.L_momentum = function(phi_dot, theta) {
  const cos_sq = sq(Math.cos(theta))
  const res = cos_sq * (1 + phi_dot / this.earth.OMEGA) / (1 - sq(this.eccentricity * Math.sin(theta)))
  console.log('L', { res, phi_dot, theta })
  return res
}

Coriolis.prototype.Kinetic = function(theta, dphi, dtheta) {
  const e = this.eccentricity;
  const c = 1-sq(e) * sq(Math.sin(theta))
  const phidot = dphi;
  const thetadot = dtheta;
  const Omega = this.earth.OMEGA;
  const T = sq(Math.cos(theta)) * sq(phidot / Omega) / c 
    + sq(1-sq(e)) * sq(thetadot / Omega) / (c*c*c) // dimensionless kinetic energy, rotating frame
  return T;
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
//------------------------------------------------------------

Coriolis.prototype.f1 = function(state) {
  const c1 = 1 - sq(this.eccentricity) * sq(Math.sin(state.theta));
  const res = c1 * this.L0 / sq(Math.cos(state.theta)) - 1;
  return res;
}

Coriolis.prototype.f2 = function (state) {
  const c1 = 1 - sq(this.eccentricity) * sq(Math.sin(state.theta));
  const c2 = 1 - sq(this.eccentricity);
  let res =  this.dir*Math.pow(c1, 1.5) * sqrt(this.f4(state)) / c2;
  return res;
}

// In the paper, OMEGA is the angular speed and OMEGA~ is the stable angular speed
Coriolis.prototype.f3 = function (state) {
  // Code to match Boyd's
  const c1 = 1 - sq(this.eccentricity) * sq(Math.sin(state.theta));
  const c2 = 1 - sq(this.eccentricity);
  const OmegaS = this.earth.stableAngularSpeed;
  const Omega = this.earth.OMEGA;
  const res = (sq(OmegaS/Omega) - 1) * c2 * Math.sin(2 * state.theta) * this.f2(state) / sq(c1)
  return res;
}

Coriolis.prototype.f4 = function(state) {
  const c1 = 1 - sq(this.eccentricity) * sq(Math.sin(state.theta));
  const res = state.T - sq(this.f1(state) * Math.cos(state.theta)) / c1;
  return res;
}

Coriolis.prototype.phi_dot_impl = function(state) {
  const res = this.earth.OMEGA * this.f1(state);
  return res;
}

// Returns value in seconds
Coriolis.prototype.theta_dot_impl = function(state) {
  const res = this.earth.OMEGA * this.f2(state);
  return res;
}

Coriolis.prototype.T_dot_impl = function(state) {
  const res = this.earth.OMEGA * this.f3(state);
  return res;
}

// Phi, Theta, and T derivative functions
Coriolis.prototype._dot = function(state) {
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

// e = 0.08182 (earth’s eccentricity)
// Tau = stable period (23.935 hr) for that eccentricity
// Phi = 30°
// Theta = 45°
// Vphi = 0
// Vtheta = 0.1 v

// The code integrates forward with a regular time step of h = 1000 s until one of these time steps is invalid (that is, when one of the four radicands is negative).  Then the code integrates forward with a time step of h/2 until one of these time steps is invalid, then with h/4, etc., with the smallest time step being h/1024.  The code declares the last valid result at this time step to be the extremum.  The attached file shows all valid time steps.  Note that, for the two theta extrema found by the code, neither is within its original invalid time step of 1000 s.  The last column of the file says “theta” when the code is searching for a theta extremum, and “phi” for a phi extremum.  The second-to-last column gives the time step used for the previous step. 
function rk4test1(h0 = 1000) {
  // V is in m/s, so N is in m/s
  // const N = 0.1 * globalEarth.V;
  const v_theta = 0.1 * globalEarth.a * globalEarth.OMEGA;
  const E = globalEarth.V;
  
  const V = new Velocity(v_theta, E, 0);
  c = new Coriolis(radians(45), radians(30), V, globalEarth, 0.08182);
  console.log('*******************************************');
  console.log('       t (s)    phi    theta      K      K/K0   K_/K0_     h      ext');

  t = 0;
  for (let i = 0; i < 80; i++) {
    // t = rk4test1step(c, h0, t);
    t = stepRK4(c, h0, t, true);
    // console.log('*');
    // p = rk4test1step(c, h0, t);
    // c._theta = p[0];
    // c._phi = p[1];
    // c.T = p[2]
    // t += h0;
  }
  console.log('completed test');
  console.log('*******************************************');
}

// function rk4test1step(c, h0, t) {
//   try {
//     p = c.stepRK4(h0, t);
//     c._theta = p.theta;
//     c._phi = p.phi;
//     c.T = p.T;
//     t += h0;
//   } catch(e) {
//     // We went into illegal territory, so do the modified binary search:
//     // console.log('illegal', e);
//     h = h0/2;
//     while (h > h0/2048) {
//       try {
//         // Go as far as we can with this step size
//         while(true) {
//           const p = c.stepRK4(h, t);
//           c._theta = p.theta;
//           c._phi = p.phi;
//           c.T = p.T;
//           t += h;
//         }
//       } catch(e) {
//         // console.log('illegal', e);
//         h /= 2;
//       }
//     }
//     c.dir = -c.dir;
//   }
//   return t;
// }

Coriolis.prototype.getState = function() {
  return new PhiThetaT(this._phi, this._theta, this.T);
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

// RK4
// Coriolis.prototype.stepRK4 = function(c, h) {//, t=0) {
function stepRK4(c, h0, t, debug=false) {//, t=0) {
  try {
    // p = c.stepRK4(h0, t);
    const p = rk4(h0, c.getState(), c._dot.bind(c));

    c._theta = p.theta;
    c._phi = p.phi;
    c.T = p.T;
    if (debug) c.printValues(t, h0);
    t += h0;
  } catch(e) {
    if (e != 'negative radicand') {
      throw e;
    }
    // We went into illegal territory, so do the modified binary search:
    // console.log('illegal', e);
    h = h0/2;
    while (h > h0/2048) {
      try {
        // Go as far as we can with this step size
        while(true) {
          const p = rk4(h, c.getState(), c._dot.bind(c));
          // const p = c.stepRK4(h, t);
          c._theta = p.theta;
          c._phi = p.phi;
          c.T = p.T;
          t += h;
          if (debug) c.printValues(t, h);
        }
      } catch(e) {
        if (e != 'negative radicand') {
          throw e;
        }
        // console.log('illegal', e);
        h /= 2;
      }
    }
    c.dir = -c.dir;
  }
  return t;
  // return c;

  // const state = new PhiThetaT(this._phi, this._theta, this.T);
  // if (h === 0) {
  //   return state;
  // }

  // const newState = rk4(h, state, this._dot.bind(this));

  // // Succeeded, so print out values
  // const phi = degrees(this._phi).toFixed(5).padStart(6, ' ');
  // const theta = degrees(this._theta).toFixed(5).padStart(8, ' ');
  // const K = this.T.toFixed(5).padStart(6, ' ');
  // const KK0 = '.'.padStart(9);
  // const K_K0_ = '.'.padStart(8);
  // const hs = h.toFixed(3).padStart(9, ' ');
  // console.log(`${t.toFixed(3).padStart(12, ' ')} ${phi} ${theta} ${K} ${KK0} ${K_K0_} ${hs}`);

  // return newState;
}

let pathInc = 1; // In degrees
Coriolis.prototype.step = function(h) {
  stepRK4(this, h, 0);
  // const p = this.stepRK4(h);
  // console.log('params', { theta: p[0], phi: p[1], T: p[2] })

  // this._theta = p[0];
  // this._phi = p[1];
  // this.T = p[2]

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

