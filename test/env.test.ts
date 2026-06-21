import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { envBool, envInt, envStr, envTrans } from "../src/env.js";

const saved = { ...process.env };

afterEach(() => {
  process.env = { ...saved };
});

describe("envStr", () => {
  it("trims and falls back on empty", () => {
    process.env.TEST_STR = "  hello  ";
    assert.equal(envStr("TEST_STR", "default"), "hello");
    process.env.TEST_STR = "   ";
    assert.equal(envStr("TEST_STR", "default"), "default");
  });
});

describe("envInt", () => {
  it("parses valid integers with minimum", () => {
    process.env.TEST_PORT = "3001";
    assert.equal(envInt("TEST_PORT", 8080), 3001);
    process.env.TEST_PORT = "abc";
    assert.equal(envInt("TEST_PORT", 8080), 8080);
    process.env.TEST_PORT = "0";
    assert.equal(envInt("TEST_PORT", 8080), 8080);
  });
});

describe("envBool", () => {
  it("recognizes truthy strings", () => {
    process.env.TEST_FLAG = "true";
    assert.equal(envBool("TEST_FLAG"), true);
    process.env.TEST_FLAG = "no";
    assert.equal(envBool("TEST_FLAG"), false);
  });
});

describe("envTrans", () => {
  it("prefers explicit transport", () => {
    process.env.TRANSPORT = "http";
    assert.equal(envTrans("stdio"), "stdio");
  });

  it("reads TRANSPORT env", () => {
    process.env.TRANSPORT = "http";
    assert.equal(envTrans(), "http");
    process.env.TRANSPORT = "stdio";
    assert.equal(envTrans(), "stdio");
  });
});
