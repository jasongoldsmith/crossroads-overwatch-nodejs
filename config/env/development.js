module.exports = {
  hostName: 'http://localhost:3000',
  devMode: true,
  portNum: -1,
  enforceSSL: false,
  showErrorStacktrace: true,
  sendEmail: true,
  logLevel: 'debug',
  enableBungieIntegration: process.env.enableBungieIntegration || false,
  enableSESIntegration: process.env.enableSESIntegration || true,
  tinyUrlHost: 'http://crsrd.co/'
}