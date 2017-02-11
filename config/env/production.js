
module.exports = {
  hostName: 'https://overwatch.herokuapp.com',
  tinyUrlHost:'http://crsrd.co/',
  portNum: -1,
  s3: {
    imageBucket: "feighty-images",
    contentsBucket: "feighty-videos",
    momentsBucket: "feighty-moments",
  },
  awsProfileImageUrl: "http://feighty-images.s3.amazonaws.com/",
  enableBungieIntegration: process.env.enableBungieIntegration || false,
  logLevel: 'info',
  enableNewRelic:false,
  disableEnvetUpdateForComments: process.env.DISABLE_EVENT_UPDATE_COMMENTS || false,
  minUsersForGroupNotification: 0,
  enableSESIntegration: process.env.enableSESIntegration || false
};