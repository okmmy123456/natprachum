module.exports = {
  apps: [
    {
      name: "natprachum-backend",
      script: "./dist/server.js",
      cwd: "./backend",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "natprachum-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 5013",
      cwd: "./frontend",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
