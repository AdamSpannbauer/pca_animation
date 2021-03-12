/* eslint-disable import/extensions */
import matUtils from './src/utils/matUtils.js';
import genData2d from './src/genData.js';

import centeringStep from './src/animationSteps/centeringStep.js';
import calcCovMatStep from './src/animationSteps/calcCovMatStep.js';
import eigenDecompStep from './src/animationSteps/eigenDecompStep.js';
import rotatingStep from './src/animationSteps/rotatingStep.js';
import projectedDataStep from './src/animationSteps/projectedDataStep.js';
import plotUtils from './src/utils/plotUtils.js';
import displayUtils from './src/utils/displayUtils.js';

const canvasW = 600;
const canvasH = 600;

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

// UI elements
let playPauseBtn;
let restartBtn;
let pauseAfterStepCheckbox;

const myFontPath = './assets/MostlyMono.ttf';
let myFont;

let dataTableX;
let dataTableY;
const dataTableFontSize = 15;

let state = 'init';

const viridisPalette10 = [
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
  state = 'init';

  [data, centeredData] = genData2d();
  covarianceMatrix = matUtils.covarianceMatrix2d(centeredData);

  eigVals = matUtils.eigenvalues2by2(covarianceMatrix);
  eigVectors = matUtils.eigenvectors2by2(covarianceMatrix, eigVals);

  eigVector1 = createVector(eigVectors[0][0], eigVectors[0][1]);
  eigVector2 = createVector(eigVectors[1][0], eigVectors[1][1]);

  // Always have largest eig vec headed east
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

  playPauseBtn.html('Pause');
  loop();
}

function playPause() {
  if (playPauseBtn.html() === 'Pause') {
    playPauseBtn.html('Play');
    playPauseBtn.center('horizontal');
    noLoop();
  } else {
    playPauseBtn.html('Pause');
    playPauseBtn.center('horizontal');
    loop();
  }
}

function preload() {
  myFont = loadFont(myFontPath);
}

function windowResized() {
  resizeCanvas(
    min([windowWidth, canvasW]),
    min([windowHeight, canvasH]),
  );

  playPauseBtn.position(0, windowHeight - 80);
  playPauseBtn.center('horizontal');

  restartBtn.position(0, windowHeight - 30);
  restartBtn.center('horizontal');

  pauseAfterStepCheckbox.position(0, windowHeight - 55);
  pauseAfterStepCheckbox.center('horizontal');
}

function setup() {
  createCanvas(
    min([windowWidth, canvasW]),
    min([windowHeight, canvasH]),
  );
  textFont(myFont);

  dataTableX = -width / 2;
  dataTableY = dataTableFontSize * 2;

  // eslint-disable-next-line no-undef
  playPauseBtn = createButton('Pause');
  playPauseBtn.mousePressed(playPause);
  playPauseBtn.position(0, windowHeight - 80);
  playPauseBtn.center('horizontal');

  // eslint-disable-next-line no-undef
  restartBtn = createButton('Restart');
  restartBtn.mousePressed(restart);
  restartBtn.position(0, windowHeight - 30);
  restartBtn.center('horizontal');

  // eslint-disable-next-line no-undef
  pauseAfterStepCheckbox = createCheckbox('Pause after each step', true);
  pauseAfterStepCheckbox.style('background-color', color(255, 150));
  pauseAfterStepCheckbox.position(0, windowHeight - 55);
  pauseAfterStepCheckbox.center('horizontal');

  restart();
}

function draw() {
  background(200);
  t += 1;

  // origin at middle
  // larger y higher on screen
  translate(width / 2, height / 2);
  scale(1, -1);

  textSize(30);
  fill(255, 100);
  if (state === 'init') {
    plotUtils.drawAxes();
    plotUtils.plot2d(data, viridisPalette10);

    push();
    scale(1, -1);
    textSize(dataTableFontSize);
    displayUtils.displayTable2d(data, dataTableX, dataTableY, viridisPalette10);
    pop();

    displayUtils.labelStep('Input data');

    state = 'centering';
    t = 0;
    if (pauseAfterStepCheckbox.checked()) playPause();
  } else if (state === 'centering') {
    const stepIsOver = centeringStep({
      data,
      centeredData,
      palette: viridisPalette10,
      t,
      centeringFrames: 100,
      dataTableFontSize,
      dataTableX,
      dataTableY,
    });

    plotUtils.plot2d(data, viridisPalette10, 20);

    if (stepIsOver) {
      state = 'calculate_cov_mat';
      currAngle = deltaAngle;
      t = 0;
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (state === 'calculate_cov_mat') {
    const stepIsOver = calcCovMatStep({
      centeredData,
      covarianceMatrix,
      t,
      palette: viridisPalette10,
      dataTableFontSize,
      dataTableX,
      dataTableY,
    });

    if (stepIsOver) {
      state = 'eigen';
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (state === 'eigen') {
    const stepIsOver = eigenDecompStep({
      centeredData,
      covarianceMatrix,
      eigVals,
      projectionMatrix,
      palette: viridisPalette10,
      dataTableFontSize,
      dataTableX,
      dataTableY,
    });

    if (stepIsOver) {
      state = 'rotating';
      t = 0;
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (state === 'rotating') {
    let stepIsOver;
    [stepIsOver, currAngle] = rotatingStep({
      projectedData,
      eigVals,
      currAngle,
      t,
      angleVel,
      palette: viridisPalette10,
      dataTableX,
      dataTableY,
    });

    if (stepIsOver) {
      state = 'projected_data';
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (state === 'projected_data') {
    projectedDataStep({ projectedData, palette: viridisPalette10 });
  }

  fill(255);
}

window.setup = setup;
window.draw = draw;
window.preload = preload;
window.windowResized = windowResized;
