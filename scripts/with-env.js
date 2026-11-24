const { spawn } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");

const knownEnvs = ["staging", "production", "development", "test"];
const arg1 = process.argv[2];
const isFirstArgEnv = arg1 && !arg1.startsWith("-") && knownEnvs.includes(arg1);

const appEnv = isFirstArgEnv ? arg1 : process.env.APP_ENV || "staging";
const nextArgs = process.argv.slice(isFirstArgEnv ? 3 : 2);

if (appEnv) {
  process.env.APP_ENV = appEnv;
  dotenv.config({ path: path.resolve(process.cwd(), `.env.${appEnv}.local`), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), `.env.${appEnv}`), override: true });
}

const nextBin = path.resolve(process.cwd(), "node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 0);
});

