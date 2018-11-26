
function writeHeader(x : number, y : number, w : number, h : number) {
  const fontUrl = "https://fonts.googleapis.com/css?family=Gloria+Hallelujah";
  console.log(`
<html>
<link href="${fontUrl}" rel="stylesheet">
<body>

<h1>Shaky diagram</h1>

<svg width="1000" height="500" viewBox="${x} ${y} ${w} ${h}">
`);
}

function writeFooter() {
  console.log(`
</svg>

</body>
</html>`);
}

export function processFile(contents : string) {
  const svg = convertToSVG(contents);
  writeHeader(svg.boundLeft | 0, svg.boundTop | 0,
    svg.boundRight - svg.boundLeft | 0,
    svg.boundBottom - svg.boundTop | 0);
  console.log(svg.body);
  writeFooter();
}

class SVGBuilder {
  body : string;
  scaleX : number = 20;
  scaleY : number = 20;
  rngScale : number = 1.5;

  boundLeft : number = 10000;
  boundTop : number = 10000;
  boundRight : number = 0;
  boundBottom : number = 0;

  constructor() {
    this.body = `
  <style>
    .txt { font-family: 'Gloria Hallelujah', cursive; font-size:30; }
    .line { stroke:black; stroke-width:4; fill:transparent;
      stroke-linecap:round; }
    .dot { stroke:black; stroke-width:4; fill:black; }
  </style>
`;
  }

  random() { return Math.random() * this.rngScale};
  centerRandom() { return (Math.random() - 0.5) * this.rngScale };

  shakyLine(x1 : number, y1 : number, x2 : number, y2 : number) {
    x1 = this.toX(x1);
    x2 = this.toX(x2);
    y1 = this.toY(y1);
    y2 = this.toY(y2);
    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const rx1 = Math.random();
    const ry1 = this.centerRandom();
    const xm1 = x1 + (x2 - x1) * rx1 + this.scaleX * (y2 - y1) * ry1 * 0.5 / len;
    const ym1 = y1 + (y2 - y1) * rx1 + this.scaleY * (x1 - x2) * ry1 * 0.5 / len;
    const rx2 = Math.random();
    const ry2 = this.centerRandom();
    const xm2 = x1 + (x2 - x1) * rx1 + this.scaleX * (y2 - y1) * ry2 * 0.5 / len;
    const ym2 = y1 + (y2 - y1) * rx1 + this.scaleY * (x1 - x2) * ry2 * 0.5 / len;
    this.body += `<path d="M${x1},${y1} C${xm1},${ym1} ${xm2},${ym2} ${x2},${y2}"` +
              ` class="line"/>\n`;
  }

  text(x : number, y : number, t : string) {
    function escapeHtml(text : string) : string {
      function translate(s : string) {
        switch (s) {
          case "&": return "&amp;";
          case '<': return "&lt;";
          case '>': return "&gt;";
          case '"': return "&quot;";
          case "'": return "&#039;";
        }
      };
      return text.replace(/[&<>"']/g, translate);
    }
    // TODO Update the bounds properly.
    this.body += `<text x="${this.toX(x)}" ` +
              `y="${this.toY(y + 0.6)}" ` +
              `class="txt">` + escapeHtml(t) + `</text>`;
  }

  dot(x : number, y : number) {
    x = (x + .5) * this.scaleX;
    y = (y + .5) * this.scaleY;
    const r = 0.4;
    const d = 0.25;

    const xs = [];
    const ys = [];
    const dxs = [];
    const dys = [];

    for (let i = 0; i < 4; i++) {
      const rr = r * (0.8 + 0.4 * this.random());
      xs.push(x + Math.sin(i * Math.PI / 2) * rr * this.scaleX);
      ys.push(y + Math.cos(i * Math.PI / 2) * rr * this.scaleY);
      dxs.push(Math.cos(i * Math.PI / 2) * d * this.scaleX);
      dys.push(- Math.sin(i * Math.PI / 2) * d * this.scaleY);
    }
    this.body += `<path d="M${xs[0]},${ys[0]} `;

    for (let i = 0; i < 4; i++) {
      this.body += `C${xs[i] + dxs[i]},${ys[i] + dys[i]} ` +
      `${xs[(i + 1) % 4] - dxs[(i + 1) % 4]},` +
      `${ys[(i + 1) % 4] - dys[(i + 1) % 4]} ` +
      `${xs[(i + 1) % 4]},${ys[(i + 1) % 4]} `;
    }

    this.body += `" class="ldot"/>\n`;
  }

  filledPath(p : IPoint[]) {
    this.body += `<path d="M${this.toX(p[0].x)},${this.toY(p[0].y)} `;
    for (let i = 1; i < p.length; i++) {
      this.body += `L${this.toX(p[i].x)},${this.toY(p[i].y)} `;
    }
    this.body += `Z" style="fill:#eee;"/>\n`;
  }

  toX(x : number) {
    x = (x + 0.5) * this.scaleX;
    this.boundLeft = Math.min(this.boundLeft, x - this.scaleX);
    this.boundRight = Math.max(this.boundRight, x + this.scaleX);
    return x;
  }
  toY(y : number) {
    y = (y + 0.5) * this.scaleY;
    this.boundTop = Math.min(this.boundTop, y - this.scaleY);
    this.boundBottom = Math.max(this.boundBottom, y + this.scaleY);
    return y;
  }
}

function padLinesToMax(lines : string[]) {
  const maxLen = lines.reduce((m, l) => Math.max(m, l.length), 0);
  return lines.map((l) => l + " ".repeat(maxLen - l.length));
}

function transpose(lines : string[]) : string[] {
  const rows = [];
  for (const c of lines[0]) rows.push("");
  for (const l of lines) {
    for (let j = 0; j < l.length; j++) {
      rows[j] += l[j];
    }
  }
  return rows;
}

interface IPoint {
  x : number;
  y : number;
}

interface IColoring {
  coloring : number[][];
  paths : IPoint[][];  // Maps color to sequence of points.
}

function detectAreas(lines : string[]) : IColoring {
  // Representative color for each set element.
  const colorOwner : number[] = [0];
  // Zero initialize to the default color.
  const width = lines[0].length;
  const height = lines.length;

  // Each point on the grid is assigned a color. The color is recorded
  // in the following array.
  const coloring : number[][] =
    Array(lines.length + 1).fill(0).map((l) => Array(width + 1).fill(0));

  // Allocate new color and make space for it in the colorOwner array.
  function newColor() {
    const color = colorOwner.length;
    colorOwner.push(color);
    return color;
  }

  function findOwner(c : number) : number {
    // Find the owner.
    let owner = c;
    while (colorOwner[owner] !== owner) {
      owner = colorOwner[owner];
    }

    // Compress the path to the root.
    while (colorOwner[c] !== c) {
      const next = colorOwner[c];
      colorOwner[c] = owner;
      c = next;
    }
    return owner;
  }

  // Union the color sets {c1} and {c2}.
  function unify(c1 : number, c2 : number) {
    c1 = findOwner(c1);
    c2 = findOwner(c2);
    if (c1 < c2) {
      colorOwner[c2] = c1;
    } else if (c2 < c1) {
      colorOwner[c1] = c2;
    }
  }

  // Compute color.
  for (let i = 0; i < height; i++) {
    const l = lines[i];
    for (let j = 0; j < width; j++) {
      const c = l[j];
      if (c === "+") {
        // Four way split => we need new color.
        coloring[i + 1][j + 1] = newColor();
      } else if (c === "|") {
        // Reuse the color from above, unify colors on the left.
        unify(coloring[i][j], coloring[i + 1][j]);
        coloring[i + 1][j + 1] = coloring[i][j + 1];
      } else if (c === "-") {
        unify(coloring[i][j], coloring[i][j + 1]);
        coloring[i + 1][j + 1] = coloring[i + 1][j];
      } else {
        unify(coloring[i][j], coloring[i + 1][j]);
        unify(coloring[i][j], coloring[i][j + 1]);
        coloring[i + 1][j + 1] = coloring[i + 1][j];
      }
    }
  }

  // Make sure the borders are all the same color.
  for (let i = 0; i < height; i++) {
    unify(coloring[i][width], coloring[0][width]);
  }
  for (let j = 0; j < width; j++) {
    unify(coloring[height][j], coloring[height][0]);
  }

  // Renumber the colors to be dense.
  let maxColor = 0;
  let colorNumbering : number[] = colorOwner.map((i) => -1);
  for (let i = 0; i < colorOwner.length; i++) {
    let owner = findOwner(i);
    if (colorNumbering[owner] === -1) {
      colorNumbering[owner] = maxColor++;
    }
    colorNumbering[i] = colorNumbering[owner];
  }
  for (let i = 0; i < coloring.length; i++) {
    coloring[i] = coloring[i].map((j : number) => colorNumbering[j]);
  }

  const regionPaths : IPoint[][] = [];

  const directions : IPoint[] = [
    { x : 1, y : 0 },
    { x : 0, y : 1 },
    { x : -1, y : 0 },
    { x : 0, y : -1 },
  ];

  const pivots : IPoint[] = [
    { x : -1, y : -1 },
    { x : 0, y : -1 },
    { x : 0, y : 0 },
    { x : -1, y : 0 },
  ];

  function computePath(c : number, x : number, y : number) : IPoint[] {
    const startX = x;
    const startY = y;
    const path : IPoint[] = [{ x : x - 1, y : y - 1 }];
    let direction = 0;

    do {
      let i : number;
      let probeX : number;
      let probeY : number;
      let probeDirection : number;
      for (i = -1; i <= 2; i++) {
        probeDirection = (direction + i + 4) % 4;
        probeX = x + directions[probeDirection].x;
        probeY = y + directions[probeDirection].y;

        if (c === coloring[probeY][probeX]) {
          break;
        }
      }
      switch (i) {
        case -1: // Turning left.
          path.push({ x : x + pivots[direction].x,
                      y : y + pivots[direction].y });
          break;
        case 0: // Going straight => Nothing to do.
          break;
        case 1: // Going right.
          path.push({ x : x + pivots[probeDirection].x,
                      y : y + pivots[probeDirection].y });
          break;
        case 2: // Going back => nothing to do.
         path.push({ x : x + pivots[(direction + 1) % 4].x,
                     y : y + pivots[(direction + 1) % 4].y });
         path.push({ x : x + pivots[probeDirection].x,
                     y : y + pivots[probeDirection].y });
          break;
      }

      direction = probeDirection;
      x = probeX;
      y = probeY;

    } while (startX !== x || startY !== y || direction !== 3);

    return path;
  }

  // Compute paths.
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let c = coloring[i][j];
      if (c > 0 && !regionPaths[c]) {
        regionPaths[c] = computePath(c, j, i);
      }
    }
  }

  // let colorCodes = " 0123456789abcdefghijklmnopqrstuvwxyzABCEFGHIJKLMNOPQR";
  // for (const colorLine of coloring) {
  //   console.log(colorLine.reduce((s, c) => s + colorCodes[c], ""));
  // }

  return { paths : regionPaths, coloring };
}

function convertToSVG(contents : string) : SVGBuilder {
  const b = new SVGBuilder();
  const lines = padLinesToMax(contents.split("\n"));
  const columns = transpose(lines);
  const height = lines.length;
  const width = columns.length;
  const processedBitmap : number[][] = [];

  const xscale = 20;
  const yscale = 20;

  function isUsedHorizontal(x : number, y : number) {
    return (processedBitmap[y][x] & 1) !== 0;
  }

  function setUsedHorizontal(x : number, y : number) {
    for (let i = processedBitmap.length; i < y + 1; i++) {
      processedBitmap.push([]);
    }
    processedBitmap[y][x] = processedBitmap[y][x] | 1;
  }

  function isUsedVertical(x : number, y : number) {
    return (processedBitmap[y][x] & 2) !== 0;
  }

  function setUsedVertical(x : number, y : number) {
    for (let i = processedBitmap.length; i < y + 1; i++) {
      processedBitmap.push([]);
    }
    processedBitmap[y][x] = processedBitmap[y][x] | 2;
  }

  function drawArrow(x : number, y : number, dx : number, dy : number) {
    const pdx = - dy;
    const pdy = dx;
    b.shakyLine(x, y, x - 1.4 * dx - 1.0 * pdx, y - 1.4 * dy - 1.0 * pdy);
    b.shakyLine(x, y, x - 1.4 * dx + 1.0 * pdx, y - 1.4 * dy + 1.0 * pdy);
  }

  function tryDrawHorizontal(x : number, y : number) {
    if (isUsedHorizontal(x, y)) return true;
    let left = x;
    const line = lines[y];
    let right = left + 1;
    for (; right < width; right++) {
      const c = line[right];
      if (c !== "-" && c !== "+") {
        if (c === ">" || c === "*") right++;
        break;
      }
    }
    right--;

    if (left + 1 > right) return false;

    for (let i = left; i < right + 1; i++) {
      setUsedHorizontal(i, y);
    }

    const head = line[left];
    const tail = line[right];
    // Arrows are lengthened.
    if (head === "<") left--;
    if (tail === ">") right++;

    // We have horizontal line.
    if (head === "<") drawArrow(left, y, -0.5, 0);
    if (head === "*") b.dot(left, y);
    if (tail === ">") drawArrow(right, y, 0.5, 0);
    if (tail === "*") b.dot(right, y);
    b.shakyLine(left, y, right, y);
    return true;
  }

  function tryDrawVertical(x : number, y : number) {
    if (isUsedVertical(x, y)) return true;
    let top = y;
    const column = columns[x];
    let bottom = top + 1;
    for (; bottom < height; bottom++) {
      const c = column[bottom];
      if (c !== "|" && c !== "+") {
        if (c === "v" || c === "*") bottom++;
        break;
      }
    }
    bottom--;

    if (top + 1 > bottom) return false;

    for (let i = top; i < bottom + 1; i++) {
      setUsedVertical(x, i);
    }

    const head = column[top];
    const tail = column[bottom ];
    // Arrows are lengthened.
    if (head === "^") top--;
    if (tail === "v") bottom++;

    // We have vertical line.
    if (head === "^") drawArrow(x, top, 0, -0.5);
    if (head === "*") b.dot(x, top);
    if (tail === "v") drawArrow(x, bottom, 0, 0.5);
    if (tail === "*") b.dot(x, bottom);
    b.shakyLine(x, top, x, bottom);
    return true;
  }

  const coloring = detectAreas(lines);
  coloring.paths.forEach((p) => b.filledPath(p));

  // Figure out the lines.
  for (let y = 0; y < lines.length; y++) {
    const l = lines[y];
    if (processedBitmap.length <= y) processedBitmap.push([]);
    for (let x = 0; x < l.length; x++) {
      // Skip the character if it was already processed.
      const c = lines[y][x];
      if (c === "+" || c === "*") {
        tryDrawHorizontal(x, y);
        tryDrawVertical(x, y);
      } else if (c === "<" || c === "-") {
        tryDrawHorizontal(x, y);
      } else if (c === "^" || c === "|") {
        tryDrawVertical(x, y);
      }
    }
  }

  // Now, do the text.
  for (let y = 0; y < lines.length; y++) {
    const l = lines[y];

    function getWord(x : number) : number {
      while (x < l.length && l[x] !== " " && !processedBitmap[y][x]) {
        x++;
      }
      return x;
    }

    for (let x = 0; x < l.length; x++) {
      // Accumulate words separated by spaces.
      let start = x;
      let end = start;
      while (true) {
        const endWord = getWord(start);
        // Empty word -> end.
        if (endWord === start) break;
        end = endWord;
        // Finish if the word ends with some line character.
        if (processedBitmap[y][end]) break;
        // Prepare for the next word search.
        start = end + 1;
      }
      if (x !== end) {
        // We have a word.
        b.text(x, y, l.substr(x, end - x));
        x = end;
      }
    }
  }
  return b;
}