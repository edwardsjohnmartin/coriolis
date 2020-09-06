const rk4 = (stepSize, position, derivative_funcs) => {
    const delta1 = derivative_funcs.map(func => stepSize * func(...position))
    const delta2 = derivative_funcs.map(func => stepSize * func(...position.map((value, idx) => value + delta1[idx] / 2)))
    const delta3 = derivative_funcs.map(func => stepSize * func(...position.map((value, idx) => value + delta2[idx] / 2)))
    const delta4 = derivative_funcs.map(func => stepSize * func(...position.map((value, idx) => value + delta3[idx])))
    return position.map((value, idx) => {
        return value + (delta1[idx] + 2 * delta2[idx] + 2 * delta3[idx] + delta4[idx]) / 6
    })
}