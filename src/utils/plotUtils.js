function plot2d(X, pallete, alpha) {
  const a = alpha || 255;

  push();
  const windowScale = 1.5;
  let i = 0;
  X.forEach((row) => {
    let [x, y] = row;
    x = map(x, -windowScale, windowScale, -width / 2, width / 2);
    y = map(y, -windowScale, windowScale, -height / 2, height / 2);

    const ci = color(pallete[i]);
    ci.setAlpha(a);
    fill(ci);
    noStroke(0);
    ellipse(x, y, 20, 20);
    i += 1;
  });
  pop();
}

function drawAxes() {
  line(0, -height / 2, 0, height / 2);
  line(-width / 2, 0, width / 2, 0);
}

function animatePoints(a, b, i, start, end) {
  const nRows = a.length;
  const nCols = a[0].length;

  const output = new Array(nRows);
  for (let r = 0; r < nRows; r += 1) {
    output[r] = new Array(nCols);
    for (let c = 0; c < nCols; c += 1) {
      output[r][c] = map(i, start, end, a[r][c], b[r][c], true);
    }
  }
  return output;
}

export default {
  plot2d, drawAxes, animatePoints,
};
