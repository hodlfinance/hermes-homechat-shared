// Bundles native/src/surface.tsx the way Metro does on the device, so the test
// renders the same module graph the app runs. That matters for HPD-871: Metro
// (Babel) compiles every module to CommonJS on its own, so a named import with
// no matching export becomes `undefined` and fails only when it is called.
// Node's ESM loader and esbuild's ESM linker would instead refuse to load the
// graph at all. Each package source file is therefore compiled to CommonJS
// first (esbuild `transform`, one file at a time, like Babel) and only then
// linked into one bundle.
//
// react-native, react-native-svg and lucide-react-native are replaced by the
// inert stand-ins in native-module-stubs.ts. React itself stays external so the
// surface and react-test-renderer share one React instance.
import { readdirSync, readFileSync } from "node:fs";
import Module from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build, transform, type Message } from "esbuild";

import { lucideStub, reactNativeStub, reactNativeSvgStub } from "./native-module-stubs";

const here = dirname(fileURLToPath(import.meta.url));
const nativeRoot = resolve(here, "../..");
const packageRoot = resolve(nativeRoot, "..");
const surfaceEntry = join(nativeRoot, "src/surface.tsx");

const stubs: Record<string, unknown> = {
  "react-native": reactNativeStub,
  "react-native-svg": reactNativeSvgStub,
  "lucide-react-native": lucideStub,
};
const stubGlobal = "__hpd871NativeModuleStubs";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "test" || entry.name === "assets" ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/** Every value name any native module imports from `specifier`. */
function importedNames(specifier: string): string[] {
  const names = new Set<string>();
  const pattern = new RegExp(`import\\s+(?:type\\s+)?([^;]*?)\\s+from\\s+"${specifier.replace(/[-/]/g, "\\$&")}"`, "g");
  for (const file of sourceFiles(nativeRoot)) {
    for (const match of readFileSync(file, "utf8").matchAll(pattern)) {
      if (/^import\s+type\s/.test(match[0])) continue;
      const braces = match[1].match(/\{([\s\S]*)\}/);
      if (!braces) continue;
      for (const part of braces[1].split(",")) {
        const trimmed = part.trim();
        if (!trimmed || trimmed.startsWith("type ")) continue;
        names.add(trimmed.split(/\s+as\s+/)[0].trim());
      }
    }
  }
  return [...names].filter((name) => name !== "default");
}

function stubModuleSource(specifier: string): string {
  const lines = [`const m = globalThis[${JSON.stringify(stubGlobal)}][${JSON.stringify(specifier)}];`, "export default m.default;"];
  for (const name of importedNames(specifier)) lines.push(`export const ${name} = m[${JSON.stringify(name)}];`);
  return lines.join("\n");
}

export type BundledSurface = {
  createNativeR8Surface: (host: unknown) => (props: Record<string, never>) => unknown;
  /** Bundler warnings, e.g. an import that "will always be undefined". */
  warnings: string[];
};

function formatMessage(message: Message): string {
  const where = message.location ? `${message.location.file}:${message.location.line}: ` : "";
  return `${where}${message.text}`;
}

export async function bundleNativeSurface(): Promise<BundledSurface> {
  const result = await build({
    entryPoints: [surfaceEntry],
    bundle: true,
    write: false,
    format: "cjs",
    platform: "node",
    target: "node20",
    jsx: "automatic",
    logLevel: "silent",
    loader: { ".png": "empty", ".jpg": "empty", ".ttf": "empty" },
    external: ["react", "react/jsx-runtime", "react/jsx-dev-runtime"],
    alias: { "@hodlfinance/hermes-homechat-shared/core": join(packageRoot, "src/index.ts") },
    plugins: [{
      name: "hpd871-metro-like",
      setup(pluginBuild) {
        pluginBuild.onResolve({ filter: /^(react-native|react-native-svg|lucide-react-native)$/ }, (args) => ({
          path: args.path,
          namespace: "hpd871-stub",
        }));
        // Metro semantics: every package source module is compiled to CommonJS
        // on its own. The modules live in their own namespace so esbuild reads
        // them as the CommonJS they now are (the package says "type": "module").
        pluginBuild.onResolve({ filter: /.*/ }, async (args) => {
          if ((args.pluginData as { inner?: boolean } | undefined)?.inner) return undefined;
          if (args.namespace !== "file" && args.namespace !== "metro-cjs") return undefined;
          const resolved = await pluginBuild.resolve(args.path, {
            importer: args.importer,
            kind: args.kind,
            pluginData: { inner: true },
            resolveDir: args.resolveDir,
          });
          if (resolved.errors.length) return { errors: resolved.errors };
          if (resolved.external || resolved.namespace !== "file") return resolved;
          if (!resolved.path.startsWith(packageRoot) || resolved.path.includes("/node_modules/") || !/\.tsx?$/.test(resolved.path)) {
            return resolved;
          }
          return { path: resolved.path, namespace: "metro-cjs" };
        });
        pluginBuild.onLoad({ filter: /.*/, namespace: "metro-cjs" }, async (args) => {
          const compiled = await transform(readFileSync(args.path, "utf8"), {
            loader: args.path.endsWith(".tsx") ? "tsx" : "ts",
            format: "cjs",
            jsx: "automatic",
            target: "node20",
            sourcefile: args.path,
          });
          return { contents: compiled.code, loader: "js", resolveDir: dirname(args.path) };
        });
        pluginBuild.onLoad({ filter: /.*/, namespace: "hpd871-stub" }, (args) => ({
          contents: stubModuleSource(args.path),
          loader: "js",
        }));
      },
    }],
  });

  (globalThis as Record<string, unknown>)[stubGlobal] = stubs;
  const code = result.outputFiles[0].text;
  // Compile in place (never written to disk) under a file name inside the
  // package, so require("react") resolves to the package's own React.
  const filename = join(here, "__bundled-native-surface.cjs");
  const compiled = new Module(filename);
  compiled.filename = filename;
  compiled.paths = (Module as unknown as { _nodeModulePaths(dir: string): string[] })._nodeModulePaths(here);
  (compiled as unknown as { _compile(code: string, filename: string): void })._compile(code, filename);
  const exported = compiled.exports as { createNativeR8Surface: BundledSurface["createNativeR8Surface"] };
  return {
    createNativeR8Surface: exported.createNativeR8Surface,
    warnings: result.warnings.map(formatMessage),
  };
}
