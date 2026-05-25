import { describe, expect, test } from "bun:test";
import { detectPackageManager, createPackageManagerCommands } from "./package-manager.detector.js";

describe("detectPackageManager", () => {
  test("honors priority and explicit option", () => {
    expect(detectPackageManager({ explicit: "pnpm", files: ["bun.lock"] }).name).toBe("pnpm");
    expect(detectPackageManager({ files: ["bun.lock", "pnpm-lock.yaml"] }).name).toBe("bun");
    expect(detectPackageManager({ files: ["deno.json", "package-lock.json"] }).name).toBe("deno");
    expect(detectPackageManager({ files: ["yarn.lock"], packageManagerField: "pnpm@9.0.0" }).name).toBe("yarn");
    expect(detectPackageManager({ files: [], packageManagerField: "pnpm@9.0.0" }).name).toBe("pnpm");
  });

  test("builds package manager commands for every supported manager", () => {
    expect(createPackageManagerCommands("bun")).toMatchObject({
      executeRnm: ["bunx", "@bunin/react-native-micro-frontend-cli"],
    });
    expect(createPackageManagerCommands("npm")).toMatchObject({
      executeRnm: ["npx", "@bunin/react-native-micro-frontend-cli"],
    });
    expect(createPackageManagerCommands("pnpm")).toMatchObject({
      executeRnm: ["pnpm", "dlx", "@bunin/react-native-micro-frontend-cli"],
    });
    expect(createPackageManagerCommands("yarn")).toMatchObject({
      executeRnm: ["yarn", "dlx", "@bunin/react-native-micro-frontend-cli"],
    });
    expect(createPackageManagerCommands("deno")).toMatchObject({
      executeRnm: ["deno", "run", "-A", "npm:@bunin/react-native-micro-frontend-cli"],
    });
  });

  test("builds script and install commands for every supported manager", () => {
    expect(createPackageManagerCommands("bun").runScript("release:dry-run")).toEqual(["bun", "run", "release:dry-run"]);
    expect(createPackageManagerCommands("npm").runScript("release:dry-run")).toEqual(["npm", "run", "release:dry-run"]);
    expect(createPackageManagerCommands("pnpm").runScript("release:dry-run")).toEqual(["pnpm", "release:dry-run"]);
    expect(createPackageManagerCommands("yarn").runScript("release:dry-run")).toEqual(["yarn", "release:dry-run"]);
    expect(createPackageManagerCommands("deno").runScript("release:dry-run")).toEqual(["deno", "task", "release:dry-run"]);

    expect(createPackageManagerCommands("bun").installDependencies(["@bunin/react-native-micro-frontend"], false)).toEqual(["bun", "add", "@bunin/react-native-micro-frontend"]);
    expect(createPackageManagerCommands("npm").installDependencies(["@bunin/react-native-micro-frontend"], true)).toEqual(["npm", "install", "--save-dev", "@bunin/react-native-micro-frontend"]);
    expect(createPackageManagerCommands("pnpm").installDependencies(["@bunin/react-native-micro-frontend"], true)).toEqual(["pnpm", "add", "-D", "@bunin/react-native-micro-frontend"]);
    expect(createPackageManagerCommands("yarn").installDependencies(["@bunin/react-native-micro-frontend"], true)).toEqual(["yarn", "add", "-D", "@bunin/react-native-micro-frontend"]);
    expect(createPackageManagerCommands("deno").installDependencies(["@bunin/react-native-micro-frontend"], false)).toEqual(["echo", "Deno projects require manual dependency setup: @bunin/react-native-micro-frontend"]);
  });
});
