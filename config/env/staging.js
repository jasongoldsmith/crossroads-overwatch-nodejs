module.exports = {
  hostName: 'https://overwatch-staging.herokuapp.com',
  tinyUrlHost:'http://stage.crsrd.co/',
  enableNewRelic: false,
  portNum: -1,
  s3: {
    imageBucket: "feighty-images",
    contentsBucket: "feighty-videos",
    momentsBucket: "feighty-moments",
  },
  awsProfileImageUrl: "http://feighty-images.s3.amazonaws.com/",
  enableBungieIntegration: process.env.enableBungieIntegration|| false,
  logLevel: 'debug',
  devMode: true,
  disableEnvetUpdateForComments: process.env.DISABLE_EVENT_UPDATE_COMMENTS || false
}