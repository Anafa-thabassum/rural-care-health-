import { readdir, writeFile } from "node:fs/promises";

const outputDirectory = ".vercel/output/static";
const assets = await readdir(`${outputDirectory}/assets`);
const script = assets.find((name) => /^index-.*\.js$/.test(name));
const stylesheet = assets.find((name) => /^styles-.*\.css$/.test(name));

if (!script || !stylesheet) throw new Error("Build assets not found");

await writeFile(
  `${outputDirectory}/index.html`,
  `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RuralCare</title><link rel="stylesheet" href="/assets/${stylesheet}"></head><body><script type="module" src="/assets/${script}"></script></body></html>\n`,
);
