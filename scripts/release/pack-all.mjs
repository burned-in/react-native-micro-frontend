#!/usr/bin/env bun
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { packageOrder } from "./package-list.mjs";

const outputDirFlagIndex = process.argv.indexOf("--out-dir");
const outputDir = outputDirFlagIndex >= 0
  ? process.argv[outputDirFlagIndex + 1]
  : ".npm-pack";

if (!outputDir) {
  console.error("--out-dir requires a directory path");
  process.exit(1);
}

const absoluteOutputDir = resolve(outputDir);

rmSync(absoluteOutputDir, {
  recursive: true,
  force: true,
});

mkdirSync(absoluteOutputDir, {
  recursive: true,
});

for (const packageDir of packageOrder) {
  run("bun", ["pm", "pack", "--cwd", `./${packageDir}`, "--destination", absoluteOutputDir, "--quiet"]);
}

console.log(`[pack] wrote tarballs to ${absoluteOutputDir}`);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
