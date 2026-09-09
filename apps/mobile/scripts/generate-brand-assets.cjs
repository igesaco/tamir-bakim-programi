const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'assets');

fs.mkdirSync(assetsDir, {
  recursive: true,
});

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;

    for (let i = 0; i < 8; i += 1) {
      crc =
        (crc >>> 1) ^
        (
          (crc & 1)
            ? 0xedb88320
            : 0
        );
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer =
    Buffer.from(type);

  const length =
    Buffer.alloc(4);

  length.writeUInt32BE(
    data.length,
    0,
  );

  const crc =
    Buffer.alloc(4);

  crc.writeUInt32BE(
    crc32(
      Buffer.concat([
        typeBuffer,
        data,
      ]),
    ),
    0,
  );

  return Buffer.concat([
    length,
    typeBuffer,
    data,
    crc,
  ]);
}

function createCanvas(
  width,
  height,
  background,
) {
  const pixels =
    Buffer.alloc(
      width * height * 4,
    );

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i =
        (y * width + x) * 4;

      pixels[i] =
        background[0];
      pixels[i + 1] =
        background[1];
      pixels[i + 2] =
        background[2];
      pixels[i + 3] =
        background[3];
    }
  }

  return {
    width,
    height,
    pixels,
  };
}

function setPixel(
  canvas,
  x,
  y,
  color,
) {
  if (
    x < 0 ||
    y < 0 ||
    x >= canvas.width ||
    y >= canvas.height
  ) {
    return;
  }

  const i =
    (y * canvas.width + x) * 4;

  canvas.pixels[i] =
    color[0];
  canvas.pixels[i + 1] =
    color[1];
  canvas.pixels[i + 2] =
    color[2];
  canvas.pixels[i + 3] =
    color[3] ?? 255;
}

function fillRect(
  canvas,
  x,
  y,
  width,
  height,
  color,
) {
  for (
    let yy = Math.max(0, y);
    yy < Math.min(
      canvas.height,
      y + height,
    );
    yy += 1
  ) {
    for (
      let xx = Math.max(0, x);
      xx < Math.min(
        canvas.width,
        x + width,
      );
      xx += 1
    ) {
      setPixel(
        canvas,
        xx,
        yy,
        color,
      );
    }
  }
}

function fillRoundedRect(
  canvas,
  x,
  y,
  width,
  height,
  radius,
  color,
) {
  const r2 =
    radius * radius;

  for (
    let yy = y;
    yy < y + height;
    yy += 1
  ) {
    for (
      let xx = x;
      xx < x + width;
      xx += 1
    ) {
      const left =
        xx < x + radius;
      const right =
        xx >=
        x + width - radius;
      const top =
        yy < y + radius;
      const bottom =
        yy >=
        y + height - radius;

      let inside = true;

      if (left && top) {
        const dx =
          xx - (x + radius);
        const dy =
          yy - (y + radius);

        inside =
          dx * dx +
            dy * dy <=
          r2;
      }

      if (right && top) {
        const dx =
          xx -
          (x + width - radius - 1);
        const dy =
          yy - (y + radius);

        inside =
          dx * dx +
            dy * dy <=
          r2;
      }

      if (left && bottom) {
        const dx =
          xx - (x + radius);
        const dy =
          yy -
          (y + height - radius - 1);

        inside =
          dx * dx +
            dy * dy <=
          r2;
      }

      if (right && bottom) {
        const dx =
          xx -
          (x + width - radius - 1);
        const dy =
          yy -
          (y + height - radius - 1);

        inside =
          dx * dx +
            dy * dy <=
          r2;
      }

      if (inside) {
        setPixel(
          canvas,
          xx,
          yy,
          color,
        );
      }
    }
  }
}

function drawLine(
  canvas,
  x0,
  y0,
  x1,
  y1,
  thickness,
  color,
) {
  const dx =
    Math.abs(x1 - x0);
  const sx =
    x0 < x1 ? 1 : -1;
  const dy =
    -Math.abs(y1 - y0);
  const sy =
    y0 < y1 ? 1 : -1;
  let err =
    dx + dy;

  while (true) {
    fillRect(
      canvas,
      x0 -
        Math.floor(
          thickness / 2,
        ),
      y0 -
        Math.floor(
          thickness / 2,
        ),
      thickness,
      thickness,
      color,
    );

    if (
      x0 === x1 &&
      y0 === y1
    ) {
      break;
    }

    const e2 =
      2 * err;

    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }

    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function drawT(
  canvas,
  x,
  y,
  scale,
  color,
) {
  fillRect(
    canvas,
    x,
    y,
    230 * scale,
    52 * scale,
    color,
  );

  fillRect(
    canvas,
    x +
      88 * scale,
    y,
    55 * scale,
    260 * scale,
    color,
  );
}

function drawB(
  canvas,
  x,
  y,
  scale,
  color,
) {
  const s = scale;

  fillRect(
    canvas,
    x,
    y,
    52 * s,
    260 * s,
    color,
  );

  fillRect(
    canvas,
    x,
    y,
    142 * s,
    50 * s,
    color,
  );

  fillRect(
    canvas,
    x,
    y + 105 * s,
    142 * s,
    48 * s,
    color,
  );

  fillRect(
    canvas,
    x,
    y + 210 * s,
    142 * s,
    50 * s,
    color,
  );

  fillRect(
    canvas,
    x + 112 * s,
    y + 20 * s,
    42 * s,
    98 * s,
    color,
  );

  fillRect(
    canvas,
    x + 112 * s,
    y + 135 * s,
    42 * s,
    105 * s,
    color,
  );
}

function drawWrench(
  canvas,
  centerX,
  topY,
  scale,
  color,
) {
  const s = scale;

  fillRect(
    canvas,
    centerX -
      22 * s,
    topY + 75 * s,
    44 * s,
    190 * s,
    color,
  );

  fillRect(
    canvas,
    centerX -
      65 * s,
    topY + 32 * s,
    130 * s,
    46 * s,
    color,
  );

  fillRect(
    canvas,
    centerX -
      65 * s,
    topY,
    38 * s,
    78 * s,
    color,
  );

  fillRect(
    canvas,
    centerX +
      27 * s,
    topY,
    38 * s,
    78 * s,
    color,
  );

  fillRect(
    canvas,
    centerX -
      19 * s,
    topY + 18 * s,
    38 * s,
    52 * s,
    [8, 13, 17, 255],
  );
}

function drawBrand(
  canvas,
  {
    compact = false,
  } = {},
) {
  const w =
    canvas.width;
  const h =
    canvas.height;

  const orange =
    [255, 151, 16, 255];

  const silver =
    [238, 242, 245, 255];

  const panel =
    [10, 15, 19, 255];

  const border =
    [56, 64, 70, 255];

  const margin =
    Math.round(
      w * .055,
    );

  const radius =
    Math.round(
      w * .16,
    );

  fillRoundedRect(
    canvas,
    margin,
    margin,
    w - 2 * margin,
    h - 2 * margin,
    radius,
    panel,
  );

  drawLine(
    canvas,
    margin +
      radius / 2,
    margin,
    w - margin -
      radius / 2,
    margin,
    Math.max(
      3,
      Math.round(
        w * .005,
      ),
    ),
    border,
  );

  drawLine(
    canvas,
    w - margin,
    margin +
      radius / 2,
    w - margin,
    h - margin -
      radius / 2,
    Math.max(
      4,
      Math.round(
        w * .006,
      ),
    ),
    orange,
  );

  const carY =
    Math.round(
      h * .27,
    );

  drawLine(
    canvas,
    Math.round(
      w * .18,
    ),
    carY,
    Math.round(
      w * .36,
    ),
    Math.round(
      h * .22,
    ),
    Math.max(
      6,
      Math.round(
        w * .012,
      ),
    ),
    orange,
  );

  drawLine(
    canvas,
    Math.round(
      w * .34,
    ),
    Math.round(
      h * .22,
    ),
    Math.round(
      w * .47,
    ),
    Math.round(
      h * .18,
    ),
    Math.max(
      7,
      Math.round(
        w * .013,
      ),
    ),
    silver,
  );

  drawLine(
    canvas,
    Math.round(
      w * .47,
    ),
    Math.round(
      h * .18,
    ),
    Math.round(
      w * .62,
    ),
    Math.round(
      h * .19,
    ),
    Math.max(
      7,
      Math.round(
        w * .013,
      ),
    ),
    silver,
  );

  drawLine(
    canvas,
    Math.round(
      w * .62,
    ),
    Math.round(
      h * .19,
    ),
    Math.round(
      w * .82,
    ),
    Math.round(
      h * .28,
    ),
    Math.max(
      7,
      Math.round(
        w * .013,
      ),
    ),
    silver,
  );

  const scale =
    Math.max(
      1,
      Math.floor(
        w / 1024,
      ),
    );

  const markY =
    Math.round(
      h * .35,
    );

  drawT(
    canvas,
    Math.round(
      w * .19,
    ),
    markY,
    scale,
    silver,
  );

  drawB(
    canvas,
    Math.round(
      w * .61,
    ),
    markY,
    scale,
    silver,
  );

  drawWrench(
    canvas,
    Math.round(
      w * .51,
    ),
    markY,
    scale,
    orange,
  );

  if (!compact) {
    const barY =
      Math.round(
        h * .72,
      );

    fillRect(
      canvas,
      Math.round(
        w * .19,
      ),
      barY,
      Math.round(
        w * .30,
      ),
      Math.max(
        10,
        Math.round(
          h * .025,
        ),
      ),
      silver,
    );

    fillRect(
      canvas,
      Math.round(
        w * .52,
      ),
      barY,
      Math.round(
        w * .29,
      ),
      Math.max(
        10,
        Math.round(
          h * .025,
        ),
      ),
      orange,
    );

    const subY =
      Math.round(
        h * .80,
      );

    for (
      let x =
        Math.round(
          w * .25,
        );
      x <
      Math.round(
        w * .77,
      );
      x +=
        Math.round(
          w * .045,
        )
    ) {
      fillRect(
        canvas,
        x,
        subY,
        Math.max(
          5,
          Math.round(
            w * .009,
          ),
        ),
        Math.max(
          5,
          Math.round(
            h * .012,
          ),
        ),
        silver,
      );
    }
  }
}

function encodePng(
  canvas,
) {
  const {
    width,
    height,
    pixels,
  } = canvas;

  const raw =
    Buffer.alloc(
      (width * 4 + 1) *
        height,
    );

  for (
    let y = 0;
    y < height;
    y += 1
  ) {
    const rowStart =
      y *
      (width * 4 + 1);

    raw[rowStart] = 0;

    pixels.copy(
      raw,
      rowStart + 1,
      y * width * 4,
      (y + 1) *
        width *
        4,
    );
  }

  const ihdr =
    Buffer.alloc(13);

  ihdr.writeUInt32BE(
    width,
    0,
  );

  ihdr.writeUInt32BE(
    height,
    4,
  );

  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([
      137, 80, 78, 71,
      13, 10, 26, 10,
    ]),
    chunk(
      'IHDR',
      ihdr,
    ),
    chunk(
      'IDAT',
      zlib.deflateSync(
        raw,
        {
          level: 9,
        },
      ),
    ),
    chunk(
      'IEND',
      Buffer.alloc(0),
    ),
  ]);
}

function writeAsset(
  name,
  width,
  height,
  compact = false,
) {
  const canvas =
    createCanvas(
      width,
      height,
      [8, 13, 17, 255],
    );

  drawBrand(
    canvas,
    {
      compact,
    },
  );

  fs.writeFileSync(
    path.join(
      assetsDir,
      name,
    ),
    encodePng(
      canvas,
    ),
  );
}

writeAsset(
  'icon.png',
  1024,
  1024,
  false,
);

writeAsset(
  'brand-logo.png',
  1024,
  1024,
  false,
);

writeAsset(
  'splash.png',
  1600,
  1600,
  false,
);

console.log(
  '[brand] Tamir Bakım icon, splash and in-app logo generated as standards-compliant PNG files.',
);
