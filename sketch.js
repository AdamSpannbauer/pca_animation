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

// Cheating on drawing ellipse axes diams
let maxX;
let maxY;

// UI elements
let playPauseBtn;
let pauseAfterStepCheckbox;

const myFontPath = './assets/MostlyMono.ttf';
let myFont;

let dataTableX;
let dataTableY;
const dataTableFontSize = 15;

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
  const hGap = textWidth('000.00') + textSize() * 1.1;

  const w = hGap * 2;
  const h = vGap * tbl.length;
  rect(x + hGap / 4, y - textSize(), w, h);

  textAlign(RIGHT);

  const colors = pallete || viridisPallete10;

  let i = 0;
  let yi = y;
  tbl.forEach((row) => {
    yi = y + i * vGap;
    const v1 = row[0].toFixed(2);
    noStroke(0);
    fill(colors[i]);
    text(v1, x + hGap, yi);
    text(row[1].toFixed(2), x + hGap * 2, yi);

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

  dataTableX = -width / 2 - 10;
  dataTableY = dataTableFontSize * 2;

  playPauseBtn = createButton('Pause');
  playPauseBtn.mousePressed(playPause);

  pauseAfterStepCheckbox = createCheckbox('Pause after each step', true);

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

// possible states:
// ['centering', 'ellipse', 'rotating', 'projected_data', 'projecting', 'reduced_data']

let state = 'centering';
function draw() {
  background(200);

  // origin at middle
  // larger y higher on screen
  translate(width / 2, height / 2);
  scale(1, -1);

  textSize(30);
  fill(255, 100);

  plotUtils.drawAxes();

  let start;
  let end;

  if (state === 'centering') {
    labelStep('Centering');
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

    push();
    scale(1, -1);
    textSize(dataTableFontSize);
    displayTable2d(dataStep, dataTableX, dataTableY);
    pop();
    if (frameCount >= centeringFrames) {
      state = 'ellipse';
      currAngle = deltaAngle;
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (state === 'rotating' || state === 'ellipse') {
    push();
    rotate(currAngle);

    plotUtils.plot2d(projectedData);

    strokeWeight(3);
    stroke(255, 0, 0);

    const diamX = maxX * 2.5;
    const diamY = maxY * 2.5;
    noFill();
    stroke('#fde725');
    ellipse(0, 0, diamX, diamY);
    line(-diamX / 2, 0, diamX / 2, 0);
    line(0, -diamY / 2, 0, diamY / 2);

    currAngle += angleVel;
    pop();

    push();
    scale(1, -1);
    textSize(dataTableFontSize);
    const rotMat = [
      [cos(-currAngle), -sin(-currAngle)],
      [sin(-currAngle), cos(-currAngle)],
    ];
    displayTable2d(matUtils.matMul(projectedData, rotMat), dataTableX, dataTableY);
    pop();
    if (state === 'ellipse') {
      labelStep('Identifying Axes');
      state = 'rotating';
      if (pauseAfterStepCheckbox.checked()) playPause();
    } else if (state === 'rotating' && abs(currAngle) <= angleSpeed) {
      labelStep('Rotating');
      state = 'projected_data';
      if (pauseAfterStepCheckbox.checked()) playPause();
    } else {
      labelStep('Rotating');
    }
  } else if (state === 'projected_data') {
    labelStep('Data plotted on\n\'Principal Axes\'');
    plotUtils.plot2d(projectedData);
  }

  fill(255);
}

window.setup = setup;
window.draw = draw;
window.preload = preload;
