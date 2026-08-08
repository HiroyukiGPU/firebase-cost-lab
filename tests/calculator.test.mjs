import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("GitHub Pages build contains the calculator shell", async () => {
  const html = await readFile(new URL("../dist-pages/index.html", import.meta.url), "utf8");
  assert.match(html, /Firebase Cost Lab/);
  assert.match(html, /assets\/index-/);
});

test("calculator keeps daily free-tier and pricing metadata", async () => {
  const source = await readFile(new URL("../components/Calculator.tsx", import.meta.url), "utf8");
  assert.match(source, /version: "2026-08-08"/);
  assert.match(source, /freeReadDay: 50000/);
  assert.match(source, /freeWriteDay: 20000/);
  assert.match(source, /freeDay: 10/);
  assert.match(source, /成長シミュレーション/);
  assert.match(source, /Monthly Active Usersの略/);
  assert.match(source, /Daily Active Usersの略/);
});
