const canvasW = 512;
const canvasH = 512;

// dang globalists
let data;
let centeredData;
let projectedData;

let covarianceMatrix;
let eigVals;
let eigVectors;
let projectionMatrix;

function myRound(x, n) {
  const mag = 10 ** n;
  return Math.round(x * mag) / mag;
}

function mean(x) {
  return x.reduce((accum, curr) => accum + curr) / x.length;
}

// A lot of assuming good input is going on in the matrix functions
function matTrace(a) {
  let traceTotal = 0;
  for (let i = 0; i < a.length; i += 1) {
    traceTotal += a[i][i];
  }
  return traceTotal;
}

function determinant2by2(a) {
  return a[0][0] * a[1][1] - a[0][1] * a[1][0];
}

function eigenvalues2by2(a) {
  const trA = matTrace(a);
  const detA = determinant2by2(a);

  const quadraticPart2 = sqrt(trA ** 2 - 4 * detA);
  const root1 = (trA + quadraticPart2) / 2;
  const root2 = (trA - quadraticPart2) / 2;

  // ignore sign and sort
  const roots = [root1, root2].sort((x, y) => abs(y) - abs(x));

  return roots;
}

function eigenvectors2by2(m, eigenvalues) {
  const prec = 8;

  const a = myRound(m[0][0], prec);
  const b = myRound(m[0][1], prec);
  const c = myRound(m[1][0], prec);
  const d = myRound(m[1][1], prec);

  const l1 = eigenvalues[0];
  const l2 = eigenvalues[1];

  let ev1;
  let ev2;
  if (c !== 0) {
    ev1 = [l1 - d, c];
    ev2 = [l2 - d, c];
  } else if (b !== 0) {
    ev1 = [b, l1 - a];
    ev2 = [b, l2 - a];
  } else {
    ev1 = [1, 0];
    ev2 = [0, 1];
  }

  if (ev1[0] < 0) {
    ev1[0] *= -1;
    ev1[1] *= -1;
  }

  if (ev2[1] < 0) {
    ev2[0] *= -1;
    ev2[1] *= -1;
  }

  // normalize
  const ev1Mag = dist(0, 0, ev1[0], ev1[1]);
  const ev2Mag = dist(0, 0, ev2[0], ev2[1]);

  return [
    [ev1[0] / ev1Mag, ev1[1] / ev1Mag],
    [ev2[0] / ev2Mag, ev2[1] / ev2Mag],
  ];
}

function matMul(a, b) {
  const aNRows = a.length;
  const aNCols = a[0].length;
  const bNCols = b[0].length;

  const output = new Array(aNRows);

  for (let r = 0; r < aNRows; r += 1) {
    output[r] = new Array(bNCols);
    for (let c = 0; c < bNCols; c += 1) {
      output[r][c] = 0;
      for (let i = 0; i < aNCols; i += 1) {
        output[r][c] += a[r][i] * b[i][c];
      }
    }
  }

  return output;
}

function covariance(x, y) {
  const xMean = mean(x);
  const yMean = mean(y);

  let numerator = 0;
  for (let i = 0; i < x.length; i += 1) {
    numerator += (x[i] - xMean) * (y[i] - yMean);
  }

  return numerator / (y.length - 1);
}

function covarianceMatrix2d(X) {
  const x = X.map((row) => row[0]);
  const y = X.map((row) => row[1]);

  const covXX = covariance(x, x);
  const covYY = covariance(y, y);
  const covXY = covariance(x, y);

  return [[covXX, covXY], [covXY, covYY]];
}

function genData2d(nRows) {
  const xMeanLow = -random(-1, 0);
  const xMeanHi = -random(0, 1);
  const xStd = random(1 / 15, 1 / 2);

  const yMeanLow = random(-1, 0);
  const yMeanHi = random(0, 1);
  const yStd = random(1 / 15, 1 / 2);

  const safeNRows = nRows || 10;

  const output = new Array(safeNRows);
  let xSum = 0;
  let ySum = 0;

  for (let r = 0; r < safeNRows; r += 1) {
    output[r] = new Array(2);

    const xMean = map(r, 0, safeNRows, xMeanLow, xMeanHi);
    const yMean = map(r, 0, safeNRows, yMeanLow, yMeanHi);

    const xVal = randomGaussian(xMean, xStd);
    const yVal = randomGaussian(yMean, yStd);

    xSum += xVal;
    ySum += yVal;

    output[r][0] = xVal;
    output[r][1] = yVal;
  }

  const xMean = xSum / safeNRows;
  const yMean = ySum / safeNRows;

  const centered = new Array(safeNRows);
  for (let r = 0; r < safeNRows; r += 1) {
    centered[r] = [
      (output[r][0] - xMean),
      (output[r][1] - yMean),
    ];
  }

  return [output, centered];
}

function plot2d(X) {
  const windowScale = 1.5;
  X.forEach((row) => {
    let [x, y] = row;
    x = map(x, -windowScale, windowScale, -width / 2, width / 2);
    y = map(y, -windowScale, windowScale, -height / 2, height / 2);
    ellipse(x, y, 20, 20);
  });
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

function setup() {
  createCanvas(canvasW, canvasH);

  [data, centeredData] = genData2d();
  covarianceMatrix = covarianceMatrix2d(centeredData);

  eigVals = eigenvalues2by2(covarianceMatrix);
  eigVectors = eigenvectors2by2(covarianceMatrix, eigVals);

  projectionMatrix = [
    [eigVectors[0][0], eigVectors[1][0]],
    [eigVectors[0][1], eigVectors[1][1]],
  ];

  projectedData = matMul(centeredData, projectionMatrix);

  // centeredData = matScale(width / 2, centeredData);
  // projectedData = matScale(width / 3, projectedData);
}

let dataStep;
const centeringFrames = 100;
const rotatingFrames = 200;
function draw() {
  background(200);

  // origin at middle
  // larger y higher on screen
  translate(width / 2, height / 2);
  scale(1, -1);

  fill(255, 100);

  drawAxes();

  let start;
  let end;
  if (frameCount <= centeringFrames) {
    start = 0;
    end = centeringFrames;

    dataStep = animatePoints(
      data,
      centeredData,
      frameCount,
      start,
      end,
    );
    plot2d(dataStep);
  } else if (frameCount <= centeringFrames + rotatingFrames) {
    start = centeringFrames;
    end = centeringFrames + rotatingFrames;

    dataStep = animatePoints(
      centeredData,
      projectedData,
      frameCount,
      start,
      end,
    );
    plot2d(dataStep);

    push();
    strokeWeight(3);
    stroke(255, 0, 0);
    line(
      0, 0,
      width * map(frameCount, start, end, eigVectors[0][0], 1),
      width * map(frameCount, start, end, eigVectors[0][1], 0),
    );

    line(
      0, 0,
      -width * map(frameCount, start, end, eigVectors[0][0], 1),
      -width * map(frameCount, start, end, eigVectors[0][1], 0),
    );
    stroke(150, 0, 0);
    line(
      0, 0,
      height * map(frameCount, start, end, eigVectors[1][0], 0),
      height * map(frameCount, start, end, eigVectors[1][1], 1),
    );
    line(
      0, 0,
      -height * map(frameCount, start, end, eigVectors[1][0], 0),
      -height * map(frameCount, start, end, eigVectors[1][1], 1),
    );
    pop();
  } else {
    dataStep = projectedData;
    plot2d(dataStep);

    push();
    strokeWeight(3);
    stroke(255, 0, 0);
    line(0, 0, -width, 0);
    line(0, 0, width, 0);
    stroke(150, 0, 0);
    line(0, 0, 0, -height);
    line(0, 0, 0, height);
    pop();
  }

  fill(255);
  // plot_2d(data);

  // fill(100, 50);
  // plot_2d(centered_data);

  // fill(255, 0, 0, 50);
  // plot_2d(projected_data);
}

window.setup = setup;
window.draw = draw;
