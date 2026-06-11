module.exports = {
  apps: [
    {
      name: "geekclaw",
      cwd: __dirname,
      script: "bun",
      args: "run start",
      interpreter: "none",
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: "26222",
      },
    },
  ],
};
