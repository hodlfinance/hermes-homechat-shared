import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mobileActivitySymbol } from "../src/mobile-chat-activity";

const component = readFileSync(new URL("../src/mobile-working-dragon.tsx", import.meta.url), "utf8");
const surface = readFileSync(new URL("../src/surface.tsx", import.meta.url), "utf8");

function numberArray(name: string): number[] {
  const body = component.match(new RegExp(`const ${name} = \\[([^\\]]+)\\];`))?.[1];
  assert.ok(body, `${name} must remain a literal reviewable timeline`);
  return body.split(",").map((value) => {
    const token = value.trim();
    return /^-?[\d.]+$/.test(token) ? Number(token) : numberConstant(token);
  });
}

function numberConstant(name: string): number {
  const value = component.match(new RegExp(`const ${name} = (-?[\\d.]+);`))?.[1];
  assert.ok(value, `${name} must remain a literal reviewable constant`);
  return Number(value);
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

test("the selected HPD-663 fire assets are exact transparent PNGs", () => {
  const assets = [
    ["baby-dragon-fire-puff.png", 256, 200, "eabcc28efaa097f1a861f2192cdbe0cd2cc6e1c40c8c0f41a0b087c52a89bf7f"],
    ["baby-dragon-fire-spark-1.png", 64, 64, "c983b68b38c49b0c050a9a63488403db8b1e3c8d969695d5fbbc868d81ab8049"],
    ["baby-dragon-fire-spark-2.png", 64, 64, "02eb23e6c1c567c6b6bf61b8a05838ae1e9453f7f45ce900c4416080fb79b7b0"],
    ["baby-dragon-fire-spark-3.png", 64, 64, "e233fd2b3cc176c7d26894bb793483c98f9a2879909a8271e389864f7e0a42e9"],
    ["baby-dragon-fire-spark-4.png", 64, 64, "0cba1ff26ae892295185d90801aa32eca64007c8d2ed75bf972bb1ca91f9612c"],
  ] as const;

  for (const [filename, width, height, digest] of assets) {
    const bytes = readFileSync(new URL(`../assets/${filename}`, import.meta.url));
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(bytes.readUInt32BE(16), width);
    assert.equal(bytes.readUInt32BE(20), height);
    assert.equal(bytes[24], 8, `${filename} must remain 8-bit`);
    assert.equal(bytes[25], 6, `${filename} must remain RGBA, not a painted background`);
    assert.equal(sha256(bytes), digest);
  }
});

test("the approved 2.8-second loop shows only the selected upward fire-puff variant", () => {
  assert.match(component, /const LOOP_DURATION_MS = 2_800;/);
  assert.match(component, /duration: LOOP_DURATION_MS/);
  assert.equal(component.match(/id: "puff-/g)?.length, 3);
  assert.equal(component.match(/id: "spark-/g)?.length, 4);
  assert.doesNotMatch(component, /axis|spin|rotateY|rotateX/);

  const timeline = numberArray("FIRE_TIMELINE");
  const opacity = numberArray("FIRE_OPACITY");
  const scale = numberArray("FIRE_SCALE");
  assert.equal(timeline.length, opacity.length);
  assert.equal(timeline.length, scale.length);
  assert.deepEqual([timeline[0], timeline.at(-1)], [0, 1]);
  assert.equal(opacity[0], 0);
  assert.equal(opacity.at(-1), 0);
  assert.equal(scale[0], 0);
  assert.equal(scale.at(-1), 0);
  assert.equal(Math.round((numberConstant("FIRE_END") - numberConstant("FIRE_START")) * 2_800), 800);
});

test("three mouth puffs start connected to the mouth and every particle travels upward inside the icon", () => {
  const particleBlock = component.match(/const FIRE_PARTICLES = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  const particles = [...particleBlock.matchAll(
    /\{ id: "([^"]+)", source: [^,]+, scale: ([\d.]+), heightRatio: ([\d.]+), startY: ([\d.]+), xTravel: (-?[\d.]+), yTravel: (-?[\d.]+), rotation: "(-?[\d.]+)deg" \}/g,
  )].map((match) => ({
    id: match[1],
    scale: Number(match[2]),
    heightRatio: Number(match[3]),
    startY: Number(match[4]),
    xTravel: Number(match[5]),
    yTravel: Number(match[6]),
    rotation: Number(match[7]),
  }));

  assert.equal(particles.length, 7);
  assert.ok(particles.every(({ yTravel }) => yTravel < 0), "every selected fire particle must rise");

  const maxScale = Math.max(...numberArray("FIRE_SCALE"));
  for (const iconSize of [24, 32]) {
    for (const particle of particles) {
      for (const travel of [0, 1]) {
        const centerX = iconSize * (0.5 + particle.xTravel * travel);
        const centerY = iconSize * (particle.startY + particle.yTravel * travel);
        const halfWidth = iconSize * particle.scale * maxScale / 2;
        const halfHeight = iconSize * particle.scale * particle.heightRatio * maxScale / 2;
        const radians = Math.abs(particle.rotation) * Math.PI / 180;
        const rotatedHalfWidth = Math.cos(radians) * halfWidth + Math.sin(radians) * halfHeight;
        const rotatedHalfHeight = Math.sin(radians) * halfWidth + Math.cos(radians) * halfHeight;
        assert.ok(centerX - rotatedHalfWidth >= 0 && centerX + rotatedHalfWidth <= iconSize, `${particle.id} must not clip horizontally at ${iconSize}px after rotation`);
        assert.ok(centerY - rotatedHalfHeight >= 0 && centerY + rotatedHalfHeight <= iconSize, `${particle.id} must not clip vertically at ${iconSize}px after rotation`);
      }
    }
  }

  const mouthY = 0.61;
  const firstVisibleTravel = 0.125;
  const firstVisibleScale = 0.27;
  for (const particle of particles.filter(({ id }) => id.startsWith("puff-"))) {
    const centerY = particle.startY + particle.yTravel * firstVisibleTravel;
    const halfHeight = particle.scale * particle.heightRatio * firstVisibleScale / 2;
    assert.ok(centerY - halfHeight <= mouthY && centerY + halfHeight >= mouthY, `${particle.id} must originate at the mouth`);
  }
});

test("Reduce Motion and the existing active-run lifecycle still own whether the dragon animates", () => {
  assert.equal(mobileActivitySymbol({ tone: "working", reduceMotion: false }), "spinner");
  assert.equal(mobileActivitySymbol({ tone: "working", reduceMotion: true }), "glyph");
  assert.equal(mobileActivitySymbol({ tone: "working", reduceMotion: null }), "glyph");
  for (const tone of ["done", "error", "neutral"] as const) {
    assert.equal(mobileActivitySymbol({ tone, reduceMotion: false }), "glyph");
  }
  assert.match(component, /pose\.stopAnimation\(\);\s*pose\.setValue\(0\);\s*if \(!animated\) return;/);
  assert.match(component, /return \(\) => \{\s*loop\.stop\(\);\s*pose\.stopAnimation\(\);\s*pose\.setValue\(0\);/);
  assert.equal(numberArray("FIRE_OPACITY")[0], 0, "stopped and Reduce Motion states must render no fire");
  assert.equal(numberArray("FIRE_SCALE")[0], 0, "stopped and Reduce Motion states must collapse every fire particle");
  assert.match(component, /\{animated && FIRE_PARTICLES\.map/, "terminal and Reduce Motion renders must synchronously remove fire");
  assert.match(component, /export const MobileWorkingDragon = memo\(/, "stable activity props must not rebuild the native animation graph on every host tick");
  assert.match(component, /style=\{\{ height: size, width: size \}\}/);
  assert.ok(component.indexOf("FIRE_PARTICLES.map") > component.lastIndexOf("<DragonSlice"), "fire must layer over the unchanged dragon without moving it");

  const activityTrail = surface.match(/function MobileRunActivityTrail[\s\S]*?function MobileDelegatedTasksIndicator/)?.[0] ?? "";
  assert.match(activityTrail, /tone === "working" \? \(/);
  assert.match(activityTrail, /animated=\{symbol === "spinner"\}/);
  assert.match(activityTrail, /size=\{24\}/);
  assert.match(activityTrail, /const reduceMotion = useReduceMotion\(\)/);
});
