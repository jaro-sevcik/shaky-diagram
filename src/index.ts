import * as fs from "fs";
import * as process from "process";


fs.readFile(0, "utf8", (err : any, contents : string) => {
  if (err != null) {
    console.error("Could not read stdin.");
    process.exit(1);
  }

  processFile(contents);
});

function writeHeader() {
  const fontUrl = "https://fonts.googleapis.com/css?family=Gloria+Hallelujah";
  console.log(`
<html>
<link href="${fontUrl}" rel="stylesheet">
<body>

<h1>My first SVG</h1>

<svg width="1000" height="1000">
<style>
    .txt { font-family: 'Gloria Hallelujah', cursive; font-size:30; }
    .line { stroke:black; stroke-width:4; fill:transparent;
      stroke-linecap:round; }
    .dot { stroke:black; stroke-width:4; fill:black; }
</style>
<marker id="markerArrow" markerWidth="13" markerHeight="13" refX="5" refY="3"
       orient="auto">
    <path d="M1,1 L1,6 L5,3 L1,1" style="fill: #000000;" />
</marker>
`);
}

function writeFooter() {
  console.log(`
</svg>

</body>
</html>`);
}

function processFile(contents : string) {
  writeHeader();
  console.log(convertToSVG(contents));
  writeFooter();

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

function convertToSVG(contents : string) {
  let s = "";
  const lines = padLinesToMax(contents.split("\n"));
  const columns = transpose(lines);
  const height = lines.length;
  const width = columns.length;
  const processedBitmap : number[][] = [];

  const xscale = 20;
  const yscale = 20;

  function addLine(x1 : number, y1 : number, x2 : number, y2 : number) {
    x1 = (x1 + 0.5) * xscale;
    x2 = (x2 + 0.5) * xscale;
    y1 = (y1 + 0.5) * yscale;
    y2 = (y2 + 0.5) * yscale;
    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const rx1 = Math.random();
    const ry1 = Math.random() - 0.5;
    const xm1 = x1 + (x2 - x1) * rx1 + xscale * (y2 - y1) * ry1 * 0.5 / len;
    const ym1 = y1 + (y2 - y1) * rx1 + yscale * (x1 - x2) * ry1 * 0.5 / len;
    const rx2 = Math.random();
    const ry2 = Math.random() - 0.5;
    const xm2 = x1 + (x2 - x1) * rx1 + xscale * (y2 - y1) * ry2 * 0.5 / len;
    const ym2 = y1 + (y2 - y1) * rx1 + yscale * (x1 - x2) * ry2 * 0.5 / len;
    s += `<path d="M${x1},${y1} C${xm1},${ym1} ${xm2},${ym2} ${x2},${y2}"` +
      ` class="line"/>\n`;
  }

  function addText(x : number, y : number, t : string) {
    s += `<text x="${(x + 0.5) * xscale}" y="${(y + 1.1) * yscale}"` +
      ` class="txt">` + t + `</text>`;
  }

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

  function drawDot(x : number, y : number) {
    x = (x + .5) * xscale;
    y = (y + .5) * yscale;
    const r = 0.4;
    const d = 0.25;

    const xs = [];
    const ys = [];
    const dxs = [];
    const dys = [];

    for (let i = 0; i < 4; i++) {
      const rr = r * (0.8 + 0.4 * Math.random());
      xs.push(x + Math.sin(i * Math.PI / 2) * rr * xscale);
      ys.push(y + Math.cos(i * Math.PI / 2) * rr * yscale);
      dxs.push(Math.cos(i * Math.PI / 2) * d * xscale);
      dys.push(- Math.sin(i * Math.PI / 2) * d * yscale);
    }
    s += `<path d="M${xs[0]},${ys[0]} `;

    for (let i = 0; i < 4; i++) {
      s += `C${xs[i] + dxs[i]},${ys[i] + dys[i]} ` +
      `${xs[(i + 1) % 4] - dxs[(i + 1) % 4]},` +
      `${ys[(i + 1) % 4] - dys[(i + 1) % 4]} ` +
      `${xs[(i + 1) % 4]},${ys[(i + 1) % 4]} `;
    }

    s += `" class="ldot"/>\n`;
  }

  function drawArrow(x : number, y : number, dx : number, dy : number) {
    const pdx = - dy;
    const pdy = dx;
    addLine(x, y, x - 1.4 * dx - 1.0 * pdx, y - 1.4 * dy - 1.0 * pdy);
    addLine(x, y, x - 1.4 * dx + 1.0 * pdx, y - 1.4 * dy + 1.0 * pdy);
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

    if (left + 1 >= right) return false;

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
    if (head === "*") drawDot(left, y);
    if (tail === ">") drawArrow(right, y, 0.5, 0);
    if (tail === "*") drawDot(right, y);
    addLine(left, y, right, y);
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

    if (top + 1 >= bottom) return false;

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
    if (head === "*") drawDot(x, top);
    if (tail === "v") drawArrow(x, bottom, 0, 0.5);
    if (tail === "*") drawDot(x, bottom);
    addLine(x, top, x, bottom);
    return true;
  }

  // First, figure out the lines.
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
        addText(x, y, l.substr(x, end - x));
        x = end;
      }
    }
  }

  return s;
}
