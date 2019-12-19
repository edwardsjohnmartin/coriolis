function gravityVector(rho1, z1, rho2, z2, rho3, gravRho, gravZ, s, polRad) {
    let svg = document.getElementById('diagram');

    let marker= document.createElementNS('http://www.w3.org/2000/svg',
        'marker');
    marker.setAttribute('id', 'triangle');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '0');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('orient', 'auto');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${rho2} ${z2} l 5 0 l -5 10 l -5 -10 z`);
    path.style.stroke = 'green';
    path.style.strokeWidth = '5px';
    svg.appendChild(path);

    let arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', `M ${rho1},${z1} L ${rho2} ${z2}`);
    arrow.setAttribute('id', 'gravPath')
    arrow.style.stroke = 'black';
    arrow.style.strokeWidth = '2px';
    svg.appendChild(arrow);
    arrow.setAttributeNS('marker-end', 'triangle', 'void');
}

function accelCentVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, polRad) {
    let svg = document.getElementById('diagram');

    let marker= document.createElementNS('http://www.w3.org/2000/svg',
        'marker');
    marker.setAttribute('id', 'triangle');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '0');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('orient', 'auto');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${rho3} ${z2} l 5 0 l -5 10 l -5 -10 z`);
    path.style.stroke = 'black';
    path.style.strokeWidth = '5px';
    svg.appendChild(path);

    let arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', `M ${rho2},${z2} L ${rho3} ${z2}`);
    arrow.setAttribute('id', 'accelCentPath');
    arrow.style.stroke = 'red';
    arrow.style.strokeWidth = '2px';
    svg.appendChild(arrow);
    arrow.setAttributeNS('marker-end', 'triangle', 'void');
}

function apperantGravVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, polRad) {
    let svg = document.getElementById('diagram');

    let marker= document.createElementNS('http://www.w3.org/2000/svg',
        'marker');
    marker.setAttribute('id', 'triangle');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '0');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('orient', 'auto');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${rho3} ${z2} l 5 0 l -5 10 l -5 -10 z`);
    path.style.stroke = 'black';
    path.style.strokeWidth = '5px';
    svg.appendChild(path);

    let arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', `M ${rho},${z} L ${rho3} ${z2}`);
    arrow.style.stroke = 'blue';
    arrow.style.strokeWidth = '2px';
    svg.appendChild(arrow);
    arrow.setAttributeNS('marker-end', 'triangle', 'void');
}