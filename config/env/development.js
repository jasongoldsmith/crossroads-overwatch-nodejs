module.exports = {
  hostName: 'https://overwatch-test-server.herokuapp.com',
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