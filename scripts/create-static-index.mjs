import { readdir, writeFile } from "node:fs/promises";

const assets = await readdir(".output/public/assets");
const script = assets.find((name) => /^index-.*\.js$/.test(name));
const stylesheet = assets.find((name) => /^styles-.*\.css$/.test(name));
if (!script || !stylesheet) throw new Error("Build assets not found");

await writeFile(
  ".output/public/index.html",
  `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RuralCare</title><link rel="stylesheet" href="/assets/${stylesheet}"></head><body><script type="module" src="/assets/${script}"></script></body></html>\n`,
);
