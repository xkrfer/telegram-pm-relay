#!/usr/bin/env bun

/**
 * 生产环境打包脚本
 * 将整个项目打包成单个可执行 JS 文件
 */

import { readFileSync, writeFileSync } from "fs";

console.log("🔨 开始打包项目...\n");

// 1. 读取 HTML 模板并转换为内联字符串
console.log("📄 处理 HTML 模板...");
const verifyHtml = readFileSync("src/views/verify.html", "utf-8");

// 创建临时的 index.ts，内联 HTML 模板
const originalIndex = readFileSync("src/index.ts", "utf-8");
const modifiedIndex = originalIndex.replace(
  /const htmlTemplate = readFileSync\("src\/views\/verify\.html", "utf-8"\);/g,
  `const htmlTemplate = ${JSON.stringify(verifyHtml)};`
);

writeFileSync("src/index.bundle.ts", modifiedIndex);
console.log("✅ HTML 模板已内联\n");

// 2. 使用 Bun 打包
console.log("📦 执行 Bun 打包...");
const buildResult = await Bun.build({
  entrypoints: ["src/index.bundle.ts"],
  outdir: "./dist",
  target: "bun",
  minify: false, // 保持可读性以便调试，生产环境可设为 true
  sourcemap: "none",
  naming: "[name].js",
  external: [
    "pg-native", // PostgreSQL 原生绑定（可选）
  ],
});

if (!buildResult.success) {
  console.error("❌ 打包失败:");
  for (const message of buildResult.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log("✅ 打包成功！\n");
console.log("📊 打包结果:");
for (const output of buildResult.outputs) {
  const size = (output.size / 1024).toFixed(2);
  console.log(`  - ${output.path} (${size} KB)`);
}

// 3. 清理临时文件
const fs = await import("fs/promises");
await fs.unlink("src/index.bundle.ts");
console.log("\n🧹 清理临时文件完成");

console.log("\n✨ 打包完成！运行方式: bun dist/index.bundle.js");
