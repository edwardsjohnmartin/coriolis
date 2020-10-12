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
  this.v0 = new Velocity(v0.north, v0.east, 0);
  console.log('v0', v0);

  // Speed of the puck
  this.speedRotational = this.v0.north;
  this.speedFixed = Math.sqrt(sq(this.v0.east)+sq(this.v0.north));
  // this.alpha = Math.atan2(Math.sqrt(5/4), 1);
  this.alpha = Math.atan2(this.v0.north/V, this.v0.east/V);
  this.speedFactor = 0.0005;

  this.eccentricity = eccentricity

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

const w0 = 1.242 * 1e-3

Coriolis.prototype.L_momentum = function(phi_dot, theta) {
  const cos_sq = sq(Math.cos(theta))
  const res = cos_sq * (1 + phi_dot / this.earth.OMEGA) / (1 - sq(this.eccentricity * Math.sin(theta)))
  console.log('L', { res, phi_dot, theta })
  return res
}

Coriolis.prototype.Kinetic = function(theta, dphi, dtheta) {
  const cos_sq = Math.cos(theta) * Math.cos(theta)
  const sin_sq = 1 - cos_sq
  const s_sq = sq(this.earth.OMEGA)
  const D = 1 - sq(this.eccentricity) * sin_sq
  const res = cos_sq * dphi * dphi / D + dtheta * dtheta * sq(1 - sq(this.eccentricity)) / Math.pow(D, 3)
  console.log('T', { res, theta, dphi, dtheta })
  return res / s_sq
}

//----------------------------------------
// Functions for the RK4 stepping
//----------------------------------------

// var FState = function(theta, T) {
//   this.theta = theta;
//   this.T = T;
// }

// An object that stores phi, theta, and T
var PhiThetaT = function(phi, theta, T) {
  this.phi = phi;
  this.theta = theta;
  this.T = T;
}

PhiThetaT.prototype.add = function(state) {
  return new PhiThetaT(this.phi + state.phi, this.theta + state.theta, this.T + state.T);
  // this.phi += state.phi;
  // this.theta += state.theta;
  // this.T += state.T;
  // return this;
}

PhiThetaT.prototype.mult = function(scalar) {
  return new PhiThetaT(this.phi * scalar, this.theta * scalar, this.T * scalar);
  // this.phi *= scalar;
  // this.theta *= scalar;
  // this.T *= scalar;
  // return this;
}

// Coriolis.prototype.f1 = function(theta) {
//   const res = (1 - sq(this.eccentricity * Math.sin(theta))) / sq(Math.cos(theta)) * this.L0 - 1;
//   return res;
// }

// Coriolis.prototype.f2 = function (theta, T) {
//   const a = 1 - sq(this.eccentricity * Math.sin(theta));
//   let res =  Math.pow(a, 1.5) / (1 - sq(this.eccentricity)) * sqrt(this.f4(theta, T));
//   if (this.theta_dot_negate) {
//     res *= -1;
//   }
//   return res;
// }

// Coriolis.prototype.f3 = function (theta) {
//   const A = Math.pow(this.earth.stableAngularSpeed, 2) / Math.pow(this.earth.OMEGA, 2) - 1;
//   const B = (1 - sq(this.eccentricity)) * Math.sin(2 * theta) /
//     Math.pow(1 - sq(this.eccentricity) * Math.pow(Math.sin(theta), 2));
//   const res = A * B * this.f2(theta);
//   return res;
// }

// Coriolis.prototype.f4 = function (theta, T) {
//   const a = 1 - sq(this.eccentricity * Math.sin(theta));
//   const res = T - sq(this.f1(theta) * Math.cos(theta)) / a;
//   return res;
// }

Coriolis.prototype.f1 = function(state) {
  const res = (1 - sq(this.eccentricity * Math.sin(state.theta))) / sq(Math.cos(state.theta)) * this.L0 - 1;
  let theta = state.theta;
  // console.log('f1', { res, theta });
  return res;
}

Coriolis.prototype.f2 = function (state) {
  const a = 1 - sq(this.eccentricity * Math.sin(state.theta));
  let res =  Math.pow(a, 1.5) / (1 - sq(this.eccentricity)) * sqrt(this.f4(state));
  // if (this.theta_dot_negate) {
  //   res *= -1;
  // }
  let theta = state.theta;
  // console.log('f2', { res, theta });
  return res;
}

Coriolis.prototype.f3 = function (state) {
  const A = Math.pow(this.earth.stableAngularSpeed, 2) / Math.pow(this.earth.OMEGA, 2) - 1;
  const B = (1 - sq(this.eccentricity)) * Math.sin(2 * state.theta) /
    Math.pow(1 - sq(this.eccentricity) * Math.pow(Math.sin(state.theta), 2));
  const res = A * B * this.f2(state);
  let theta = state.theta;
  // console.log('f3', { res, theta });
  return res;
}

Coriolis.prototype.f4 = function(state) {
  const a = 1 - sq(this.eccentricity * Math.sin(state.theta));
  const res = state.T - sq(this.f1(state) * Math.cos(state.theta)) / a;
  let theta = state.theta;
  // console.log('f4', { res, theta });
  return res;
}

// Returns value in seconds
Coriolis.prototype.theta_dot_impl = function(state) {
  // console.log('theta_dot', state.theta);
  const res = this.earth.OMEGA * this.f2(state);
  // console.log('theta_dot', res);
  return res;
}

Coriolis.prototype.phi_dot_impl = function(state) {
  // console.log('phi_dot ' + this._theta);
  const res = this.earth.OMEGA * this.f1(state)
  // console.log('phi_dot', { res, theta })
  return res
}

Coriolis.prototype.T_dot_impl = function(state) {
  // console.log('t_dot')
  const theta = state.theta;
  const T = state.T;
  const A = sq(this.earth.stableAngularSpeed) / sq(this.earth.OMEGA) - 1;
  const B = (1 - sq(this.eccentricity)) * Math.sin(2 * theta) /
    sq(1 - sq(this.eccentricity * Math.sin(theta))) * this.f2(state);
  const result = this.earth.OMEGA * A * B;
  // console.log('t_dot', { result })
  return result;
}

// Phi, Theta, and T derivative functions
Coriolis.prototype._dot = function(state) {
  // console.log('_dot');
  let newState = new PhiThetaT(state.phi, state.theta, state.T);
  newState.theta = this.theta_dot_impl(state);
  newState.T = this.T_dot_impl(state);
  newState.phi = this.phi_dot_impl(state);
  // console.log('_dot--');
  return newState;
}

// Returns value in seconds
Coriolis.prototype.theta_dot = function() {
  // return this.theta_dot_impl(this._theta, this.T);
  return this.theta_dot_impl(new PhiThetaT(this._phi, this._theta, this.T));
}

// Returns value in seconds
Coriolis.prototype.phi_dot = function() {
  // return this.phi_dot_impl(this._theta);
  return this.phi_dot_impl(new PhiThetaT(this._phi, this._theta, this.T));
}

// Coriolis.prototype.t_dot = function (theta, T) {
Coriolis.prototype.T_dot = function() {
  // const theta = this._theta;
  // const T = this.T;
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
  const N = 0.1 * globalEarth.V;
  const E = globalEarth.V;
  const V = new Velocity(N, E, 0);
  c = new Coriolis(radians(45), radians(30), V, globalEarth, 0.08182);
  console.log('*******************************************');
  console.log('       t (s)    phi    theta      K      K/K0   K_/K0_     h      ext');

  t = 0;
  for (let i = 0; i < 4; i++) {
    t = rk4test1step(c, h0, t);
    // p = rk4test1step(c, h0, t);
    // c._theta = p[0];
    // c._phi = p[1];
    // c.T = p[2]
    // t += h0;
  }
  console.log('completed test');
  console.log('*******************************************');
}

function rk4test1step(c, h0, t) {
  try {
    // return c.stepRK4(h0, t);
    p = c.stepRK4(h0, t);
    // c._theta = p[0];
    // c._phi = p[1];
    // c.T = p[2]
    c._theta = p.theta;
    c._phi = p.phi;
    c.T = p.T;
    t += h0;
  } catch(e) {
    // We went into illegal territory, so do the modified binary search:
    console.log('illegal', e);
    h = h0/2;
    while (h > h0/2048) {
      try {
        // Go as far as we can with this step size
        while(true) {
          const p = c.stepRK4(h, t);
          // c._theta = p[0];
          // c._phi = p[1];
          // c.T = p[2]
          c._theta = p.theta;
          c._phi = p.phi;
          c.T = p.T;
          t += h;
        }
      } catch(e) {
        h /= 2;
      }
    }
  }
  return t;
}

// // Same order, same values
// Coriolis.prototype.test1 = function(h, t) {
//   const [new_theta, new_T, new_phi] = rk4(
//       h,
//       [this._theta, this.T, this._phi],
//       [this.theta_dot_impl.bind(this), this.t_dot_impl.bind(this), this.phi_dot_impl.bind(this)]
//   )
//   console.log(new_theta, new_T, new_phi);
//   // console.log('a', this._phi);
//   // console.log(this);

//   const [new_theta5, new_T5, new_phi5] = rk4(
//       h,
//       [this._theta, this.T, this._phi],
//       [this.theta_dot_impl.bind(this), this.t_dot_impl.bind(this), this.phi_dot_impl.bind(this)]
//   )
//   console.log(new_theta5, new_T5, new_phi5);
//   // console.log('b', this._phi);
//   // console.log(this);
// }

// // Different order
// Coriolis.prototype.test2 = function(h, t) {
//   const [new_theta, new_T, new_phi] = rk4(
//       h,
//       [this._theta, this.T, this._phi],
//       [this.theta_dot_impl.bind(this), this.t_dot_impl.bind(this), this.phi_dot_impl.bind(this)]
//   )
//   console.log(new_theta, new_T, new_phi);
//   // console.log('a', this._phi);
//   // console.log(this);

//   const [new_theta_, new_phi_, new_T_] = rk4(
//       h,
//       [this._theta, this._phi, this.T],
//       [this.theta_dot_impl.bind(this), this.phi_dot_impl.bind(this), this.t_dot_impl.bind(this)]
//   )
//   console.log(new_theta_, new_T_, new_phi_);
//   // console.log('e', this._phi);
//   // console.log(this);
// }

// RK4
Coriolis.prototype.stepRK4 = function(h, t=0) {
  const phi = degrees(this._phi).toFixed(3).padStart(6, ' ');
  const theta = degrees(this._theta).toFixed(3).padStart(8, ' ');
  const K = this.T.toFixed(3).padStart(6, ' ');
  const KK0 = '.'.padStart(9);
  const K_K0_ = '.'.padStart(8);
  const hs = h.toFixed(3).padStart(9, ' ');
  console.log(`${t.toFixed(3).padStart(12, ' ')} ${phi} ${theta} ${K} ${KK0} ${K_K0_} ${hs}`);

  const state = new PhiThetaT(this._phi, this._theta, this.T);
  if (h === 0) {
    // return [this._theta, this._phi, this.T]
    return state;
  }

  // this.test2(h, t);

  // const a = this._theta;
  // const b = this.T;
  // const c = this._phi;
  // const p = new PhiThetaT(this._theta, this.T, this._phi);
  // const [new_theta, new_T, new_phi] = rk4(
  //   h,
  //   // [this._theta, this.T, this._phi],
  //   p,
  //   [this.theta_dot_impl.bind(this), this.t_dot_impl.bind(this), this.phi_dot_impl.bind(this)]
  // )
  // console.log('phi = ' + state.phi);
  // console.log('calling rk4');
  const newState = rk4(h, state, this._dot.bind(this));
  // console.log('called rk4');
  // console.log(new_theta, new_T, new_phi);
  // console.log('a', this._phi);
  // console.log(this);

  // const [new_theta5, new_T5, new_phi5] = rk4(
  //     h,
  //     [this._theta, this.T, this._phi],
  //     [this.theta_dot_impl.bind(this), this.t_dot_impl.bind(this), this.phi_dot_impl.bind(this)]
  // )
  // console.log(new_theta5, new_T5, new_phi5);
  // console.log('b', this._phi);
  // console.log(this);

  // try {
  //   const [new_phi4, new_T4, new_theta4] = rk4(
  //     h,
  //     [this._phi, this.T, this._theta],
  //     [this.phi_dot_impl.bind(this), this.t_dot_impl.bind(this), this.theta_dot_impl.bind(this)]
  //   )
  //   console.log('x');
  //   console.log('c', this._phi);
  // } catch (e) {
  //   console.log(e);
  // }
  // console.log(new_theta4, new_T4, new_phi4);

  // const [new_theta_, new_phi_, new_T_] = rk4(
  //     h,
  //     [this._theta, this._phi, this.T],
  //     [this.theta_dot_impl.bind(this), this.phi_dot_impl.bind(this), this.t_dot_impl.bind(this)]
  // )
  // console.log(new_theta_, new_T_, new_phi_);
  // console.log('e', this._phi);
  // console.log(this);

  // const [new_T3, new_theta3, new_phi3] = rk4(
  //     h,
  //     [this.T, this._theta, this._phi],
  //     [this.t_dot_impl.bind(this), this.theta_dot_impl.bind(this), this.phi_dot_impl.bind(this)]
  // )
  // console.log(new_theta3, new_T3, new_phi3);
  // const [new_theta2, new_T2, new_phi2] = rk4(
  //     h,
  //     [this._theta, this.T, this._phi],
  //     [this.theta_dot_impl.bind(this), this.t_dot_impl.bind(this), this.phi_dot_impl.bind(this)]
  // )
  // console.log(new_theta2, new_T2, new_phi2);

  // return [new_theta, new_phi, new_T];
  return newState;
}

Coriolis.prototype.stepRK4_old = function(h) {
  console.log(`rk4: ${this._theta}`);

  if (h === 0) {
    return [this._theta, this._phi, this.T]
  }

  let error = false
  let low = 0, high = h;
  while (low + 1e-6 < high) {
    const mid = (low + high) / 2;
    try {
      rk4(mid, [this._theta, this.T], [this.theta_dot_impl.bind(this), this.t_dot_impl.bind(this)])
      low = mid
    } catch (e) {
      error = true
      high = mid
    }
  }

  if (!error) {
    low = h
  }

  if (low === 0) {
    alert('what')
    console.log('integration inverted', this.theta_dot_negate)
    return [this._theta, this._phi, this.T]
  }

  const [new_theta, new_T, new_phi] = rk4(
      low,
      [this._theta, this.T, this._phi],
      [this.theta_dot_impl.bind(this), this.t_dot_impl.bind(this), this.phi_dot_impl.bind(this)]
  )

  if (error) {
    this.theta_dot_negate = !this.theta_dot_negate
    console.log('integration inverted', this.theta_dot_negate)
  }

  return [new_theta, new_phi, new_T];
}

let pathInc = 1; // In degrees
Coriolis.prototype.step = function(h) {
  // console.log('theta = ' + this._theta);
  const p = this.stepRK4(h);
  console.log('params', { theta: p[0], phi: p[1], T: p[2] })

  this._theta = p[0];
  this._phi = p[1];
  this.T = p[2]

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

