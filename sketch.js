import matUtils from './utils/matUtils.js';
import plotUtils from './utils/plotUtils.js';
import genData2d from './utils/genData.js';

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

function setup() {
  createCanvas(canvasW, canvasH);

  [data, centeredData] = genData2d();
  covarianceMatrix = matUtils.covarianceMatrix2d(centeredData);

  eigVals = matUtils.eigenvalues2by2(covarianceMatrix);
  eigVectors = matUtils.eigenvectors2by2(covarianceMatrix, eigVals);

  projectionMatrix = [
    [eigVectors[0][0], eigVectors[1][0]],
    [eigVectors[0][1], eigVectors[1][1]],
  ];

  projectedData = matUtils.matMul(centeredData, projectionMatrix);
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

  plotUtils.drawAxes();

  let start;
  let end;
  if (frameCount <= centeringFrames) {
    start = 0;
    end = centeringFrames;

    dataStep = plotUtils.animatePoints(
      data,
      centeredData,
      frameCount,
      start,
      end,
    );
    plotUtils.plot2d(dataStep);
  } else if (frameCount <= centeringFrames + rotatingFrames) {
    start = centeringFrames;
    end = centeringFrames + rotatingFrames;

    dataStep = plotUtils.animatePoints(
      centeredData,
      projectedData,
      frameCount,
      start,
      end,
    );
    plotUtils.plot2d(dataStep);

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
    plotUtils.plot2d(dataStep);

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
}

window.setup = setup;
window.draw = draw;
