function gravityVector(rho1, z1, rho2, z2, rho3, gravRho, gravZ, s, polRad) {
    let container = document.getElementById("container");

    let gravTheta = Math.atan2(z2-z1, rho2-rho1)*180/Math.PI - 90

    let marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "triangle");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "0");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerUnits", "strokeWidth");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "8");
    marker.setAttribute("orient", "auto");

    let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute('transform', `translate(${rho2} ${z2}) rotate(${gravTheta})`);
    container.appendChild(g);


   let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
   path.setAttribute("d", `M 0 0 l 2.5 -5 M 0 0 l -2.5 -5 `);
   path.style.stroke = "maroon";
   path.style.strokeWidth = "2px";
   g.appendChild(path);

    let arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrow.setAttribute("d", `M ${rho1},${z1} L ${rho2} ${z2}`);
    arrow.setAttribute("id", "gravPath");
    arrow.style.stroke = "maroon";
    arrow.style.strokeWidth = "2px";
    container.appendChild(arrow);
    arrow.setAttributeNS("marker-end", "triangle", "void");
}

function accelCentVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, polRad) {
    let container = document.getElementById("container");

    let marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "triangle");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "0");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerUnits", "strokeWidth");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "8");
    marker.setAttribute("orient", "auto");

    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${rho3} ${z2} l -5 2.5 M ${rho3} ${z2} l -5 -2.5`);
    path.style.stroke = "darkorange";
    path.style.strokeWidth = "2px";
    container.appendChild(path);

    let arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrow.setAttribute("d", `M ${rho2},${z2} L ${rho3} ${z2}`);
    arrow.setAttribute("id", "accelCentPath");
    arrow.style.stroke = "darkorange";
    arrow.style.strokeWidth = "2px";
    container.appendChild(arrow);
    arrow.setAttributeNS("marker-end", "triangle", "void");
}

function apperantGravVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, polRad) {
    let container = document.getElementById("container");

    let appGravTheta = Math.atan2(z2-z, rho3-rho)*180/Math.PI - 90;

    let marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "triangle");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "0");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerUnits", "strokeWidth");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "8");
    marker.setAttribute("orient", "auto");

    let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute('transform', `translate(${rho3} ${z2}) rotate(${appGravTheta})`);
    container.appendChild(g);

    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M 0 0 l 2.5 -5 M 0 0 l -2.5 -5 `);
    path.style.stroke = "dodgerblue";
    path.style.strokeWidth = "2px";
    g.appendChild(path);

    let arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrow.setAttribute("d", `M ${rho},${z} L ${rho3} ${z2}`);
    arrow.style.stroke = "dodgerblue";
    arrow.style.strokeWidth = "2px";
    container.appendChild(arrow);
    arrow.setAttributeNS("marker-end", "triangle", "void");
}
