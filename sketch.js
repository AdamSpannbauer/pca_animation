import matUtils from './utils/matUtils.js';
import plotUtils from './utils/plotUtils.js';
import genData2d from './utils/genData.js';

const canvasW = 512;
const canvasH = 512;

// dang globalists
let t;

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

// Cheating on drawing ellipse axes diams
let maxX;
let maxY;

// UI elements
let playPauseBtn;
let restartBtn;
let pauseAfterStepCheckbox;

const myFontPath = './assets/MostlyMono.ttf';
let myFont;

let dataTableX;
let dataTableY;
const dataTableFontSize = 15;

let state = 'centering';

const viridisPallete10 = [
  '#440154',
  '#461d6d',
  '#433880',
  '#3b518b',
  '#31678d',
  '#287c8e',
  '#21918d',
  '#25a584',
  '#3cb875',
  '#61c960',
];

function restart() {
  t = 0;
  state = 'centering';
  playPauseBtn.html('Pause');
  loop();

  [data, centeredData] = genData2d(10, -1, 1);
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

function labelStep(txt) {
  push();
  scale(1, -1);
  fill(0);
  noStroke();
  text(txt, -width / 2 + textSize() * 0.5, -height / 2 + textSize() * 1.5);
  pop();
}

function playPause() {
  if (playPauseBtn.html() === 'Pause') {
    playPauseBtn.html('Play');
    noLoop();
  } else {
    playPauseBtn.html('Pause');
    loop();
  }
}

function displayTable2d(tbl, x, y, pallete) {
  push();
  const vGap = textSize() * 1.5;
  let wStr;
  if (typeof (tbl[0][0]) === 'string') {
    wStr = tbl[0][0];
  } else {
    wStr = '00.00';
  }
  const hGap = textWidth(wStr) + textSize() * 1.1;

  const w = hGap * tbl[0].length;
  const h = vGap * tbl.length;
  strokeWeight(1);
  stroke(0);
  rect(x + hGap / 8, y - textSize(), w, h);

  noStroke();
  textAlign(RIGHT);

  const colors = pallete || viridisPallete10;

  let i = 0;
  let j = 0;
  let xi = x;
  let yi = y;
  tbl.forEach((row) => {
    yi = y + i * vGap;
    fill(colors[i]);
    row.forEach((val) => {
      j += 1;
      xi = x + j * hGap;
      if (typeof (val) !== 'string') {
        text(val.toFixed(2), xi, yi);
      } else {
        text(val, xi, yi);
      }
    });
    j = 0;
    i += 1;
  });
  pop();
}

function preload() {
  myFont = loadFont(myFontPath);
}

function setup() {
  createCanvas(canvasW, canvasH);
  textFont(myFont);

  dataTableX = -width / 2;
  dataTableY = dataTableFontSize * 2;

  playPauseBtn = createButton('Pause');
  playPauseBtn.mousePressed(playPause);

  restartBtn = createButton('Restart');
  restartBtn.mousePressed(restart);

  pauseAfterStepCheckbox = createCheckbox('Pause after each step', true);

  restart();
}

let dataStep;
const centeringFrames = 100;

// possible states:
// ['centering', 'ellipse', 'rotating', 'projected_data', 'projecting', 'reduced_data']

function draw() {
  background(200);
  t += 1;

  // origin at middle
  // larger y higher on screen
  translate(width / 2, height / 2);
  scale(1, -1);

  textSize(30);
  fill(255, 100);

  let start;
  let end;

  if (state === 'centering') {
    labelStep('Center');
    start = 0;
    end = centeringFrames;

    dataStep = plotUtils.animatePoints(
      data,
      centeredData,
      t,
      start,
      end,
    );

    plotUtils.drawAxes();
    plotUtils.plot2d(dataStep);

    push();
    scale(1, -1);
    textSize(dataTableFontSize);
    displayTable2d(dataStep, dataTableX, dataTableY);
    pop();
    if (t >= centeringFrames) {
      state = 'calculate_cov_mat';
      currAngle = deltaAngle;
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (state === 'calculate_cov_mat') {
    push();
    scale(0.5, 0.5);
    translate(-width / 2, height / 2);

    plotUtils.drawAxes();
    plotUtils.plot2d(centeredData);

    strokeWeight(10);
    stroke(viridisPallete10[viridisPallete10.length - 3]);
    line(0, 0, covarianceMatrix[0][0] * width, 0);
    stroke(viridisPallete10[viridisPallete10.length - 6]);
    line(0, 0, 0, covarianceMatrix[1][1] * width);

    state = 'eigen';
    pop();

    push();
    scale(1, -1);

    textSize(18);
    displayTable2d([
      ['Cov(x, x)', 'Cov(x, y)'],
      ['Cov(y, x)', 'Cov(y, y)'],
    ], dataTableX - textSize() / 2, dataTableY);

    fill(viridisPallete10[viridisPallete10.length - 3]);
    stroke(viridisPallete10[viridisPallete10.length - 3]);
    text(`Cov(x, x) = Var(x) = ${covarianceMatrix[0][0].toFixed(2)}`, dataTableX + textSize() * 7, dataTableY + textSize() * 4);
    fill(viridisPallete10[viridisPallete10.length - 6]);
    stroke(viridisPallete10[viridisPallete10.length - 6]);
    text(`Cov(y, y) = Var(y) = ${covarianceMatrix[1][1].toFixed(2)}`, dataTableX + textSize() * 7, dataTableY + textSize() * 5.2);

    fill(0);
    stroke(0);
    text(`Cov(x, y) = Cov(y, x) = ${covarianceMatrix[0][1].toFixed(2)}`, dataTableX + textSize() * 7, dataTableY + textSize() * 6.3);

    line(-width * 0.06, 2 * textSize(), 0, 2 * textSize());
    triangle(0, 2 * textSize() - 10, 0, 2 * textSize() + 10, width * 0.02, 2 * textSize());
    noStroke();
    fill(255, 100);
    displayTable2d(covarianceMatrix, 30, dataTableY);
    textSize(dataTableFontSize);
    fill(0);
    text(`total variance = Var(x) + Var(y) = ${covarianceMatrix[0][0].toFixed(2)} + ${covarianceMatrix[1][1].toFixed(2)} = ~${(covarianceMatrix[0][0] + covarianceMatrix[1][1]).toFixed(2)}`, -width / 2 + textSize(), height / 2 - textSize() * 1.1);
    fill(255, 100);
    pop();
    labelStep('Calculate covariance matrix');

    if (pauseAfterStepCheckbox.checked()) playPause();
  } else if (state === 'eigen') {
    push();
    scale(0.5, 0.5);
    translate(-width / 2, height / 2);

    plotUtils.drawAxes();
    plotUtils.plot2d(centeredData);

    strokeWeight(10);
    stroke(viridisPallete10[viridisPallete10.length - 6]);
    line(0, 0, projectionMatrix[0][1] * eigVals[1] * width, projectionMatrix[1][1] * eigVals[1] * width * 1.2);
    stroke(viridisPallete10[viridisPallete10.length - 3]);
    line(0, 0, projectionMatrix[0][0] * eigVals[0] * width, projectionMatrix[1][0] * eigVals[0] * width * 1.2);

    state = 'rotating';
    pop();

    push();
    scale(1, -1);

    textSize(18);
    noStroke();
    fill(0);
    text('Covariance matrix:', dataTableX + textSize() * 0.5, dataTableY);
    fill(255, 100);
    displayTable2d(covarianceMatrix, dataTableX, dataTableY + textSize() * 1.5);
    stroke(0);
    fill(0);
    line(-width * 0.2, dataTableY + 2 * textSize(), -width * 0.1, dataTableY + 2 * textSize());
    triangle(-width * 0.1, dataTableY + 2 * textSize() - 10, -width * 0.1, dataTableY + 2 * textSize() + 10, -width * 0.08, dataTableY + 2 * textSize());

    noStroke();
    text('Eigenvectors:', 0, dataTableY);
    fill(255, 100);
    displayTable2d([[projectionMatrix[0][0]], [projectionMatrix[1][0]]], 0, dataTableY + textSize() * 1.5, [viridisPallete10[viridisPallete10.length - 3], viridisPallete10[viridisPallete10.length - 3]]);
    displayTable2d([[projectionMatrix[0][1]], [projectionMatrix[1][1]]], width * 0.2, dataTableY + textSize() * 1.5, [viridisPallete10[viridisPallete10.length - 6], viridisPallete10[viridisPallete10.length - 6]]);

    fill(0);
    text('Eigenvalues:', 0, dataTableY + textSize() * 5);
    fill(255, 100);
    displayTable2d([[eigVals[0]]], 0, dataTableY + textSize() * 6.5, [viridisPallete10[viridisPallete10.length - 3]]);
    displayTable2d([[eigVals[1]]], width * 0.2, dataTableY + textSize() * 6.5, [viridisPallete10[viridisPallete10.length - 6]]);

    textSize(dataTableFontSize);
    fill(0);
    noStroke();
    text(`total variance = Sum(Eigenvalues) = ${eigVals[0].toFixed(2)} + ${eigVals[1].toFixed(2)} = ~${(eigVals[0] + eigVals[1]).toFixed(2)}`, -width / 2 + textSize(), height / 2 - textSize() * 2.4);
    text(`total variance = Var(x) + Var(y) = ${covarianceMatrix[0][0].toFixed(2)} + ${covarianceMatrix[1][1].toFixed(2)} = ~${(covarianceMatrix[0][0] + covarianceMatrix[1][1]).toFixed(2)}`, -width / 2 + textSize(), height / 2 - textSize() * 1.1);
    fill(255, 100);
    pop();
    labelStep('Find the eigenvectors of the \ncovariance matrix');

    if (pauseAfterStepCheckbox.checked()) playPause();
  } else if (state === 'rotating') {
    push();
    plotUtils.drawAxes();

    const rotMat = [
      [cos(-currAngle), -sin(-currAngle)],
      [sin(-currAngle), cos(-currAngle)],
    ];

    dataStep = matUtils.matMul(projectedData, rotMat);

    plotUtils.plot2d(dataStep);

    noFill();
    rotate(currAngle);
    strokeWeight(5);
    stroke(viridisPallete10[viridisPallete10.length - 6]);
    line(0, 0, 0, eigVals[1] * width);
    stroke(viridisPallete10[viridisPallete10.length - 3]);
    line(0, 0, eigVals[0] * width, 0);
    strokeWeight(3);
    stroke('#fde7254D');
    const diamX = maxX * 2.5;
    const diamY = maxY * 2.5;
    ellipse(0, 0, max([eigVals[0] * width * 2, diamX]), max([eigVals[1] * width * 2, diamY]));

    currAngle += angleVel;
    pop();

    push();
    scale(1, -1);
    textSize(dataTableFontSize);

    displayTable2d(dataStep, dataTableX, dataTableY);
    fill(0);
    text('Covariance matrix:', dataTableX + textSize(), -height / 2 + textSize() * 10);
    fill(255, 100);
    displayTable2d(matUtils.covarianceMatrix2d(dataStep), dataTableX, -height / 2 + textSize() * 12);
    pop();

    labelStep('Rotate to max variance axes');
    if (abs(currAngle) <= angleSpeed) {
      state = 'projected_data';
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (state === 'projected_data') {
    labelStep('Data plotted on\n\'Principal Axes\'');
    plotUtils.drawAxes();
    plotUtils.plot2d(projectedData);
  }

  fill(255);
}

window.setup = setup;
window.draw = draw;
window.preload = preload;
