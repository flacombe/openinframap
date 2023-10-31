import { svg, setStyle } from 'redom';

function getLayer(layers, id) {
  for (let l of layers) {
    if (l['id'] == id) {
      return l;
    }
  }
  return null;
}

export function svgLine(colour, thickness, dash = '') {
  const height = 15;
  const width = 30;

  let line = svg('line', {
    x1: 0,
    y1: height / 2,
    x2: width,
    y2: height / 2,
  });

  setStyle(line, {
    stroke: colour,
    'stroke-width': thickness,
    'stroke-dasharray': dash,
  });

  return svg('svg', line, { height: height, width: width });
}

export function svgLineFromLayer(layers, name, thickness = 2) {
  let layer = getLayer(layers, name);
  let dasharray = '';
  if (layer['paint']['line-dasharray']) {
    dasharray = layer['paint']['line-dasharray'].join(' ');
  }
  return svgLine(layer['paint']['line-color'], thickness, dasharray);
}

export function svgRect(colour, stroke = 'black', opacity = 1) {
  const height = 15;
  const width = 30;

  let rect = svg('rect', {
    width: width,
    height: height,
  });

  setStyle(rect, {
    fill: colour,
    stroke: stroke,
    'stroke-width': 1,
    opacity: opacity,
  });

  return svg('svg', rect, { height: height, width: width });
}

export function svgCircle(colour, stroke = 'black', opacity = 1, radius = 10) {
  let shape = svg('circle', {
    r: radius,
    cx : radius,
    cy : radius
  });

  setStyle(shape, {
    fill: colour,
    stroke: stroke,
    'stroke-width': 1,
    opacity: opacity,
  });

  return svg('svg', shape, {height: 2 * radius, width: 2 * radius});
}

export function svgRectFromLayer(layers, name) {
  let layer = getLayer(layers, name);
  let dasharray = '';
  let opacity = 1;
  let outline_color = '';
  if (layer['paint']['fill-opacity']) {
    opacity = layer['paint']['fill-opacity'];
  }
  if (layer['paint']['fill-outline-color']) {
    outline_color = layer['paint']['fill-outline-color'];
  }
  return svgRect(layer['paint']['fill-color'], outline_color, opacity);
}

export function svgCircleFromLayer(layers, name) {
  let layer = getLayer(layers, name);
  let opacity = 1;
  let outline_color = '';
  if (layer['paint']['circle-opacity']) {
    opacity = layer['paint']['circle-opacity'];
  }
  if (layer['paint']['circle-stroke-color']) {
    outline_color = layer['paint']['circle-stroke-color'];
  }
  return svgCircle(layer['paint']['circle-color'], outline_color, opacity, 7);
}
