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

const minCanvasW = 500;
const minCanvasH = minCanvasW + 80;

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
let zoomP;
let controlsDiv;
let playPauseBtn;
let restartBtn;
let pauseAfterStepCheckbox;

const myFontPath = './assets/MostlyMono.ttf';
let myFont;

let dataTableX;
let dataTableY;
const dataTableFontSize = 15;

let state = 0;
const steps = [
  'init',
  'centering', 'calculate_cov_mat',
  'eigen', 'rotating', 'projected_data',
];

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
  state = 0;

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
    noLoop();
  } else {
    playPauseBtn.html('Pause');
    loop();
  }
}

function preload() {
  myFont = loadFont(myFontPath);
}

function keyPressed() {
  if (keyCode === 32) {
    playPause();
  } else if (key === 'r') {
    restart();
  } else if (keyCode === LEFT_ARROW) {
    if (t <= 120) {
      state -= 1;
    }
    t = 0;
    currAngle = deltaAngle;

    playPauseBtn.html('Pause');
    loop();
  } else if (keyCode === RIGHT_ARROW) {
    if (t !== 0) {
      state += 1;
    }
    t = 0;
    currAngle = deltaAngle;

    playPauseBtn.html('Pause');
    loop();
  }

  state = constrain(state, 0, steps.length - 1);
}

const screenTooNarrow = () => windowWidth < minCanvasW || windowHeight < minCanvasH;

function windowResized() {
  if (screenTooNarrow()) {
    playPauseBtn.html('Pause');
    displayUtils.warnScreenTooSmall();
    zoomP.style('display', 'inline');
    zoomP.position(0, 0);
    zoomP.center('horizontal');
    loop();
  } else {
    resizeCanvas(
      min([windowWidth, canvasW]),
      min([windowHeight, canvasW]),
    );
    controlsDiv.position(0, windowHeight - 75);
    controlsDiv.center('horizontal');
    zoomP.hide();
    playPauseBtn.html('Play');
    noLoop();
  }
}

function setup() {
  console.log(
    'Controls: \n\
\t* space bar to play/pause \n\
\t* arrow keys to jump forwards/back \n\
\t* r key to restart \n\
\n\
Be warned; if you\'re here to look at the code... don\'t. \n\
The code is very admittably terrible; don\'t look at it. \n\
Just go outside or something instead... c\'mon. \n\
',
  );
  createCanvas(
    min([windowWidth, canvasW]),
    min([windowHeight, canvasW]),
  );

  textFont(myFont);

  dataTableX = -width / 2;
  dataTableY = dataTableFontSize * 2;

  // eslint-disable-next-line no-undef
  zoomP = createP('<kbd>Ctrl</kbd>+<kbd>-</kbd> to zoom out');
  zoomP.position(0, 0);
  zoomP.center('horizontal');
  zoomP.hide();

  // eslint-disable-next-line no-undef
  controlsDiv = createDiv();

  // eslint-disable-next-line no-undef
  // controlsP = createP('use <- & -> keys to jump back & forwards');
  // controlsP.parent(controlsDiv);
  // controlsP.style('font-family', 'monospace');
  // controlsP.style('font-size', 10);

  // eslint-disable-next-line no-undef
  playPauseBtn = createButton('Pause');
  playPauseBtn.mousePressed(playPause);
  playPauseBtn.parent(controlsDiv);

  // eslint-disable-next-line no-undef
  restartBtn = createButton('Restart');
  restartBtn.mousePressed(restart);
  restartBtn.parent(controlsDiv);

  // eslint-disable-next-line no-undef
  pauseAfterStepCheckbox = createCheckbox('Pause after each step', true);
  pauseAfterStepCheckbox.style('background-color', color(255, 150));
  pauseAfterStepCheckbox.style('display', 'inline-block');
  pauseAfterStepCheckbox.parent(controlsDiv);

  controlsDiv.position(0, windowHeight - 75);
  controlsDiv.center('horizontal');
  controlsDiv.id('controls');

  restart();
}

function draw() {
  background(200);
  if (screenTooNarrow()) {
    displayUtils.warnScreenTooSmall();
    zoomP.style('display', 'inline');
    zoomP.position(0, 0);
    zoomP.center('horizontal');
    return;
  }

  t += 1;

  // origin at middle
  // larger y higher on screen
  translate(width / 2, height / 2);
  scale(1, -1);

  textSize(30);
  fill(255, 100);
  if (steps[state] === 'init') {
    plotUtils.drawAxes();
    plotUtils.plot2d(data, viridisPalette10);

    push();
    scale(1, -1);
    textSize(dataTableFontSize);
    displayUtils.displayTable2d(data, dataTableX, dataTableY, viridisPalette10);
    pop();

    displayUtils.labelStep('Input data');

    push();
    textSize(textSize() * 0.5);
    displayUtils.labelStepSubtitle(
      '* space bar to play/pause \n* arrow keys to jump forwards/back \n* r key to restart \n',
    );
    pop();

    state += 1;
    t = 0;
    if (pauseAfterStepCheckbox.checked()) playPause();
  } else if (steps[state] === 'centering') {
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
      state += 1;
      currAngle = deltaAngle;
      t = 0;
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (steps[state] === 'calculate_cov_mat') {
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
      state += 1;
      t = 0;
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (steps[state] === 'eigen') {
    const stepIsOver = eigenDecompStep({
      centeredData,
      covarianceMatrix,
      eigVals,
      t,
      projectionMatrix,
      palette: viridisPalette10,
      dataTableFontSize,
      dataTableX,
      dataTableY,
    });

    if (stepIsOver) {
      state += 1;
      t = 0;
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (steps[state] === 'rotating') {
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
      state += 1;
      if (pauseAfterStepCheckbox.checked()) playPause();
    }
  } else if (steps[state] === 'projected_data') {
    projectedDataStep({ projectedData, palette: viridisPalette10 });
  }

  fill(255);
}

window.setup = setup;
window.draw = draw;
window.preload = preload;
window.windowResized = windowResized;
window.keyPressed = keyPressed;
