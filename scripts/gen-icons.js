const sharp = require("sharp");

const src = "assets/icon.png";
const pad = 5;

const jobs = [
  { name: "icon.png", size: 1024 },
  { name: "android-icon.png", size: 1024 },
  { name: "adaptive-icon-foreground.png", size: 1024 },
  { name: "adaptive-icon-monochrome.png", size: 1024 },
  { name: "favicon.png", size: 48 },
  { name: "splash-icon.png", size: 1024 },
  { name: "ios-light.png", size: 1024 },
  { name: "ios-dark.png", size: 1024 },
  { name: "ios-tinted.png", size: 1024 },
];

(async () => {
  // 1. Detect visible pixels and crop tightly to bounding box
  const trimmed = await sharp(src)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
    .png()
    .toBuffer({ resolveWithObject: true });

  console.log(
    "Trimmed bounding box:",
    trimmed.info.width + "x" + trimmed.info.height,
  );

  // 2. For each target, resize cropped content to (size - 2*pad), then extend by pad on all sides
  for (const j of jobs) {
    const inner = j.size - pad * 2;
    await sharp(trimmed.data)
      .resize(inner, inner, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile("assets/" + j.name);
    console.log(
      "OK",
      j.name,
      j.size + "x" + j.size,
      "(content " + inner + "px)",
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
