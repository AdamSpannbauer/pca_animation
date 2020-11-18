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

// to be actual p5js vectors
let eigVector1;
let eigVector2;

let deltaAngle;
let currAngle = 0;
const angleSpeed = Math.PI / 1000;
let angleVel;

let maxX;
let maxY;

function setup() {
  createCanvas(canvasW, canvasH);

  [data, centeredData] = genData2d();
  covarianceMatrix = matUtils.covarianceMatrix2d(centeredData);

  eigVals = matUtils.eigenvalues2by2(covarianceMatrix);
  eigVectors = matUtils.eigenvectors2by2(covarianceMatrix, eigVals);

  eigVector1 = createVector(eigVectors[0][0], eigVectors[0][1]);
  eigVector2 = createVector(eigVectors[1][0], eigVectors[1][1]);

  if (eigVector1.x < 0) {
    eigVector1.rotate(PI);
  }

  projectionMatrix = [
    [eigVector1.x, eigVector2.x],
    [eigVector1.y, eigVector2.y],
  ];

  deltaAngle = eigVector1.heading();
  if (deltaAngle < 0) {
    angleVel = angleSpeed;
  } else {
    angleVel = -angleSpeed;
  }
  currAngle = deltaAngle;

  projectedData = matUtils.matMul(centeredData, projectionMatrix);
  maxX = projectedData.reduce((accum, curr) => max([accum, abs(curr[0])]), 0);
  maxY = projectedData.reduce((accum, curr) => max([accum, abs(curr[1])]), 0);
  maxX = map(maxX, -1.5, 1.5, -width / 2, width / 2);
  maxY = map(maxY, -1.5, 1.5, -height / 2, height / 2);
}

let dataStep;
const centeringFrames = 100;
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
  } else if (abs(currAngle) >= angleSpeed) {
    push();
    rotate(currAngle);

    plotUtils.plot2d(projectedData);

    strokeWeight(3);
    stroke(255, 0, 0);

    const diamX = maxX * 2.5;
    const diamY = maxY * 2.5;
    ellipse(0, 0, diamX, diamY);
    line(-diamX / 2, 0, diamX / 2, 0);
    line(0, -diamY / 2, 0, diamY / 2);

    currAngle += angleVel;
    pop();
  } else {
    plotUtils.plot2d(projectedData);
  }

  fill(255);
}

window.setup = setup;
window.draw = draw;
