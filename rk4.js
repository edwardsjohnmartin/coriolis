const rk4 = (stepSize, position, derivative_funcs) => {
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