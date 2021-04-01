function warnScreenTooSmall() {
  push();
  translate(width / 2, height / 2);
  textFont('monospace');
  textSize(20);
  textAlign(CENTER, CENTER);

  fill(0);

  text('Screen\ntoo small.\n\nTry zooming\nout if on\ndesktop.', 0, 0);
  pop();
}

function labelStep(txt) {
  push();
  scale(1, -1);
  fill(0);
  noStroke();
  text(txt, -width / 2 + textSize() * 0.5, -height / 2 + textSize() * 1.5);
  pop();
}

function labelStepSubtitle(txt) {
  push();
  scale(1, -1);
  fill(0);
  noStroke();
  text(txt, -width / 2 + textSize() * 0.5, -height / 2 + textSize() * 5);
  pop();
}

function displayTable2d(tbl, x, y, pallete) {
  push();
  const vGap = textSize() * 1.5;
  let [[wStr]] = tbl;
  if (typeof (wStr) !== 'string' || wStr === '') {
    wStr = '00.00';
  }

  if (wStr.length < 5) {
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

  let i = 0;
  let j = 0;
  let xi = x;
  let yi = y;
  tbl.forEach((row) => {
    yi = y + i * vGap;
    fill(pallete[i]);
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

export default {
  displayTable2d, labelStep, warnScreenTooSmall, labelStepSubtitle,
};
