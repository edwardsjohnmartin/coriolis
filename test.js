function runTests() {
  if (xyz2latLon(new THREE.Vector3(1,0,0)).lat != 0) {
    throw 1;
  }

  // let sim = new CoriolisSim(0);
  // console.log('alpha=', degrees(sim.alpha));
  // console.log(degrees(sim.v0.north/sim.speed));
  // for (let t = 0; t < T_/2; t += 1000) {
  //   console.log('t=',t,'lat=',degrees(sim.theta_(t)));
  // }
}
