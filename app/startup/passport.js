var models = require('../models')
var utils = require('../utils')
var helpers = require('../helpers')
var passwordHash = require('password-hash')

var BnetStrategy = require('passport-bnet').Strategy
var LocalStrategy   = require('passport-local').Strategy;

var battleNetAuth = {
  clientID : utils.config.battleNetClientId,
  clientSecret : utils.config.battleNetClientSecret,
  callbackUrl :  utils.config.battleNetCallbackUrl
};

function handleBattleNetUserLogin(req, authData, done){
  var u = null
  utils.async.waterfall([
    function(callback) {
      if(utils._.isInvalidOrBlank(authData.accessToken)){
        return callback(new helpers.errors.WError('Access Token is empty. Try logging in again.'))
      }
      if(req.user){
        //if user is already logged in then return
        //TODO: check and update for user battle tag ???
        return callback(null, authData, req.user)
      }
      if(!utils._.isEmpty(authData.profile) && utils._.isValidNonEmpty(authData.profile.battletag)){
        models.user.getUserByBattleTag(authData.profile.battletag, function(err, user){
          if(err){
            return callback(err)
          } else {
            return callback(null, authData, user)
          }
        })
      } else {
        return callback(null, authData, null)
      }

    }, function(authData, userWithBattleTag, callback){
      if(utils._.isInvalidOrEmpty(userWithBattleTag)){
        createNewUserWithBattleNet(authData.accessToken, authData.refreshToken, authData.profile.battletag, callback)
      } else {
        //TODO: update user here
        return callback(null, userWithBattleTag)
      }

    }, function(user, callback){
      u = user
      req.logIn(user, callback);
    }
  ], function(err){
    if(err){
      utils.l.e("handleBattleNetUserLogin err ", err)
      return done(null, null)
    } else {
      utils.l.d("handleBattleNetUserLogin: user created" , u)
      return done(null, u)
    }
  })
}

function createNewUserWithBattleNet(accessToken, refreshToken, battletag, callback){
  //TODO: check if user's name, profile img need to be pulled from battle net??
  //TODO: check which other fields needs to be added - group, console type-id?
  utils.async.waterfall([
    function(callback){
      models.user.createUserWithBattleNetTagAndTokensAndDefaultConsole(battletag, accessToken, refreshToken, callback)
    }, function(user, callback){
      models.userGroup.addUserToGroup(user._id, user.consoles, utils.constants.regionBasedGroups.us, function(err, userGroup){
        if(err){
          return callback(err)
        } else {
          return callback(null, user)
        }
      })
    }
  ], callback)
}

module.exports = function (passport, config) {
  // serialize sessions
  passport.serializeUser(function(user, callback) {
    console.log('1*************************************  serializeUser');

    console.log('serializing user: ');console.log(user);
    return callback(null, user.id)
  })

  passport.deserializeUser(function(id, callback) {
    console.log('1*************************************  deserializeUser');
    utils.l.i("deserialize", id);
    models.user.getById(id, function (err, user) {
      console.log('deserializing user:',user);

      return callback(err, user)
    })
  })

  function handleUserSingIn(req, email, password, done) {
    utils.async.waterfall([
      function(callback) {
        models.user.findUserByEmail(email, callback)
      }, function(user, callback){
        if(!user) {
          //create user
          return callback(utils.errors.formErrorObject(utils.errors.errorTypes.signIn, utils.errors.errorCodes.noUserFoundWithTheEmailProvided))
        } else {
          if(!passwordHash.verify(password, user.password)) {
            return callback(utils.errors.formErrorObject(utils.errors.errorTypes.signIn, utils.errors.errorCodes.invalidPassword))
          } else {
            return callback(null, user)
          }
        }
      }
    ], function(err, user){
      if(err){
        return done(err, null)
      } else {
        return done(null, user)
      }
    })
  }

  function handleUserSingUp(req, email, password, done) {
    utils.async.waterfall([
      function(callback) {
        models.user.findUserByEmail(email, callback)
      }, function(user, callback){
        if(!user) {
          //create user
          models.user.createUserWithEmailAndPassword(email, password, callback)
        } else {
          return callback(utils.errors.formErrorObject(utils.errors.errorTypes.signUp, utils.errors.errorCodes.emailIsAlreadyTaken))
        }
      }
    ], function(err, user){
      if(err){
        return done(err, null)
      } else {
        return done(null, user)
      }
    })
  }

  var local_signIn = new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function(req, email, password, done){
    handleUserSingIn(req, email, password, done)
  })

  var local_signUp = new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function(req, email, password, done){
    handleUserSingUp(req, email, password, done)
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
    handleBattleNetUserLogin(req, authData, done)
  })

  passport.use('local_signIn', local_signIn)
  passport.use('local_signUp', local_signUp)
  passport.use("battleNet", bnet)
}