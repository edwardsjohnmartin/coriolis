
// stepSize
// position - Array with position values
// derivative_funcs - Array with functions to compute derivatives
// const rk4 = (stepSize, position, derivative_funcs) => {
//   // console.log(position.length);
//   const n = position.length;

//   let delta1 = [1,2,3];
//   let delta2 = [1,2,3];
//   let delta3 = [1,2,3];
//   let delta4 = [1,2,3];

//   for (let i=0; i < n; ++i) {
//     delta1[i] = stepSize * derivative_funcs[i](position[i]);
//   }
//   for (let i=0; i < n; ++i) {
//     delta2[i] = stepSize * derivative_funcs[i](position[i] + delta1[i] / 2);
//   }
//   for (let i=0; i < n; ++i) {
//     delta3[i] = stepSize * derivative_funcs[i](position[i] + delta2[i] / 2);
//   }
//   for (let i=0; i < n; ++i) {
//     delta4[i] = stepSize * derivative_funcs[i](position[i] + delta3[i]);
//   }
  
//   let res = [1,2,3];
//   for (let i=0; i < n; ++i) {
//     res[i] = position[i] + (delta1[i] + 2 * delta2[i] + 2 * delta3[i] + delta4[i]) / 6
//   }

//   console.log(delta1)//, res);
//   return res;
  
//   // const delta1 = derivative_funcs.map(func => stepSize * func(...position))
//   // const delta2 = derivative_funcs.map(func => stepSize * func(...position.map((value, idx) => value + delta1[idx] / 2)))
//   // const delta3 = derivative_funcs.map(func => stepSize * func(...position.map((value, idx) => value + delta2[idx] / 2)))
//   // const delta4 = derivative_funcs.map(func => stepSize * func(...position.map((value, idx) => value + delta3[idx])))
//   // return position.map((value, idx) => {
//   //   return value + (delta1[idx] + 2 * delta2[idx] + 2 * delta3[idx] + delta4[idx]) / 6
//   // })
// }

const rk4 = (stepSize, position, derivative_func) => {
  // console.log('delta1');
  const delta1 = derivative_func(position).mult(stepSize);
  // console.log('delta2');
  const delta2 = derivative_func(position.add(delta1.mult(0.5))).mult(stepSize);
  // console.log('delta3');
  const delta3 = derivative_func(position.add(delta2.mult(0.5))).mult(stepSize);
  // console.log('delta4');
  const delta4 = derivative_func(position.add(delta3)).mult(stepSize);
  // console.log('rk4 done');
  const sum = delta1.add(delta2.mult(2)).add(delta3.mult(2)).add(delta4);
  return position.add(sum.mult(1/6));

  // return position.map((value, idx) => {
  //   return value + (delta1[idx] + 2 * delta2[idx] + 2 * delta3[idx] + delta4[idx]) / 6
  // })
}

const rk4_old = (stepSize, position, derivative_funcs) => {
    const delta1 = derivative_funcs.map(func => stepSize * func(...position))
    const delta2 = derivative_funcs.map(func => stepSize * func(...position.map((value, idx) => value + delta1[idx] / 2)))
    const delta3 = derivative_funcs.map(func => stepSize * func(...position.map((value, idx) => value + delta2[idx] / 2)))
    const delta4 = derivative_funcs.map(func => stepSize * func(...position.map((value, idx) => value + delta3[idx])))
    return position.map((value, idx) => {
        return value + (delta1[idx] + 2 * delta2[idx] + 2 * delta3[idx] + delta4[idx]) / 6
    })
}

const rk4test = () => {
    let x = 0
    let v = 1
    console.log({ x, v, sint: Math.sin(0), cost: Math.cos(0) })
    let steps = 60
    const stepSize = 0.02 * 2 * Math.PI
    let t = 0
    while (steps--) {
        [x, v] = rk4(stepSize, [x, v], [(x, v) => v, (x, v) => -x])
        t += stepSize
        console.log({ x, v, sint: Math.sin(t), cost: Math.cos(t) })
    }
}
