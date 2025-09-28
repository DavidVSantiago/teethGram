module.exports = {
  apps : [{
    name: "minha-app-bun",
    script: "bun",
    args: "run index.js",
    exec_mode: "fork",
    cwd: "/home/sua-app"
  }]
};