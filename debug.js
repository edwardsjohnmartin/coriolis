var debug = {
  set temp(v) {
    document.getElementById('temp').innerHTML = v;
  },
  set theta(v) {
    document.getElementById('theta').innerHTML = degrees(v).toFixed(10);
  },
  set phi(v) {
    document.getElementById('phi').innerHTML = degrees(v).toFixed(10);
  },
  set T(v) {
    document.getElementById('T').innerHTML = (v * 10000).toFixed(1);
  },
  set theta_dot(v) {
    document.getElementById('theta_dot').innerHTML = (v*10000).toFixed(10);
  },
  set phi_dot(v) {
    document.getElementById('phi_dot').innerHTML = (v*10000).toFixed(10);
  },
  set L0(v) {
    document.getElementById('L0').innerHTML = (v*10000).toFixed(1);
  },
  set T0(v) {
    document.getElementById('T0').innerHTML = (v*10000).toFixed(1);
  },
  set fps(v) {
    document.getElementById('fps').innerHTML = v.toFixed(0);
  },
  // set phi(v) {
  //   this._phi = v;
  //   document.getElementById('phi').innerHTML = v.toFixed(1);
  // },
  // set phi_(v) {
  //   this._phi_ = v;
  //   document.getElementById('phi_').innerHTML = v.toFixed(1);
  //   document.getElementById('phi2').innerHTML =
  //     (this._phi_-this._phi).toFixed(1);
  // }
}

