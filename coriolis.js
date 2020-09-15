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
    console.log('negative sqrt of ', v)
    throw "fatal error"
  }
  return Math.sqrt(v)
}

const F = (e) => {
  const Fr = 0.8086
  const er = 0.08182
  const A = (1 - Fr) / (1 - er)
  const B = (Fr - er) / (1 - er)
  return A * e + B;
}

const secondEccentricity = (e) => {
  return e / Math.sqrt(1 - e * e)
}

const q = (e) => {
  const es = secondEccentricity(e)
  if (es < 1e-7) {
    return 0;
  }
  const res = 1 / es * (1 + 3 / (es * es)) * Math.atan(es) - 3 / (es * es)
  return res
}

const w0 = 1.242 * 1e-3

const stableAngularSpeed = (e) => {
  const determinant = 15 / 4 * q(e) * (1 - 3 * F(e) / 5)
  const result = w0 * Math.sqrt(determinant)
  console.log('stableAngularSpeed', { result })
  return result
}

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

Coriolis.prototype.f1 = function(theta) {
  const res = (1 - sq(this.eccentricity * Math.sin(theta))) / sq(Math.cos(theta)) * this.L0 - 1
  console.log('f1', { res, theta })
  return res
}

Coriolis.prototype.f2 = function (theta, T) {
  const a = 1 - sq(this.eccentricity * Math.sin(theta))
  let res =  Math.pow(a, 1.5) / (1 - sq(this.eccentricity)) * sqrt(this.f4(theta, T))
  if (this.theta_dot_negate) {
    res *= -1;
  }
  console.log('f2', { res, theta })
  return res
}

Coriolis.prototype.f3 = function (theta) {
  const A = Math.pow(stableAngularSpeed(this.eccentricity), 2) / Math.pow(this.earth.OMEGA, 2) - 1
  const B = (1 - sq(this.eccentricity)) * Math.sin(2 * theta) / Math.pow(1 - sq(this.eccentricity) * Math.pow(Math.sin(theta), 2))
  const res = A * B * this.f2(theta)
  console.log('f3', { res, theta })
  return res
}

Coriolis.prototype.f4 = function (theta, T) {
  const a = 1 - sq(this.eccentricity * Math.sin(theta))
  const res = T - sq(this.f1(theta) * Math.cos(theta)) / a
  console.log('f4', { res, theta })
  return res
}

// Returns value in seconds
Coriolis.prototype.theta_dot_impl = function(theta, T) {
  const res = this.earth.OMEGA * this.f2(theta, T)
  return res;
}

Coriolis.prototype.phi_dot_impl = function(theta) {
  const res = this.earth.OMEGA * this.f1(theta)
  console.log('phi_dot', { res, theta })
  return res
}

Coriolis.prototype.t_dot_impl = function(theta, T) {
  return this.t_dot(theta, T)
}

// Returns value in seconds
Coriolis.prototype.theta_dot = function() {
  return this.theta_dot_impl(this._theta, this.T);
}

// Returns value in seconds
Coriolis.prototype.phi_dot = function() {
  return this.phi_dot_impl(this._theta);
}

Coriolis.prototype.t_dot = function (theta, T) {
  const A = sq(stableAngularSpeed(this.eccentricity)) / sq(this.earth.OMEGA) - 1
  const B = (1 - sq(this.eccentricity)) * Math.sin(2 * theta) / sq(1 - sq(this.eccentricity * Math.sin(theta))) * this.f2(theta, T)
  const result = this.earth.OMEGA * A * B;
  console.log('t_dot', { result })
  return result;
}

// RK4
Coriolis.prototype.stepRK4 = function(h) {
  if (h === 0) {
    return [this._theta, this._phi, this.T]
  }

  let error = false
  let low = 0, high = h;
  while (low + 1e-10 < high) {
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

