var models = require('../models')
var utils = require('../utils')

var BnetStrategy = require('passport-bnet').Strategy

var battleNetAuth = {
  clientID : utils.config.battleNetClientId,
  clientSecret : utils.config.battleNetClientSecret,
  callbackUrl :  utils.config.battleNetCallbackUrl
};

module.exports = function (passport, config) {
  // serialize sessions
  passport.serializeUser(function(user, callback) {
    return callback(null, user.id)
  })

  passport.deserializeUser(function(id, callback) {
    models.user.getById(id, function (err, user) {
      return callback(err, user)
    })
  })

  var bnet = new BnetStrategy({
    clientID: battleNetAuth.clientID,
    clientSecret: battleNetAuth.clientSecret,
    callbackURL: battleNetAuth.callbackUrl,
    region: "us",
    passReqToCallback : true
  }, function(req, accessToken, refreshToken, profile, done){
    console.log("passport callback")
    var authData = {
      accessToken : accessToken,
      refreshToken: refreshToken,
      profile: profile
    }
    return done(null, authData)
  })

  passport.use("battleNet", bnet)
}