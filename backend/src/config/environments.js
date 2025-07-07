module.exports = {
  development: {
    seeders: true,
    debugMode: true,
    forceSSL: false
  },
  staging: {
    seeders: false,
    debugMode: true,
    forceSSL: true
  },
  production: {
    seeders: false,
    debugMode: false,
    forceSSL: true
  }
};
