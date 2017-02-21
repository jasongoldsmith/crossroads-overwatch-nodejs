var models = require('../models')
var utils = require('../utils')
var helpers = require('../helpers')
var passwordHash = require('password-hash')
var service = require('../service')

var BnetStrategy = require('passport-bnet').Strategy
var LocalStrategy   = require('passport-local').Strategy;

var battleNetAuth = {
  clientID : utils.config.battleNetClientId,
  clientSecret : utils.config.battleNetClientSecret,
  callbackUrl :  utils.config.battleNetCallbackUrl
};

function handleAddConsolePCWithBattleNetLogin(req, authData, done){
  utils.l.d("handleAddConsolePCWithBattleNetLogin req.user", req.user)
  utils.l.d("handleAddConsolePCWithBattleNetLogin authData", authData)

  utils.async.waterfall([
    function(callback){
      if(!req.user){
        utils.l.e("handleAddConsolePCWithBattleNetLogin err: user data not present in the request.Something went wrong ", req.user)
        return done(null, null)
      }
      if(utils._.isInvalidOrBlank(authData.accessToken) || utils._.isInvalidOrEmpty(authData.profile)){
        utils.l.e("handleAddConsolePCWithBattleNetLogin access token or profile null")

        var err = utils.errors.formErrorObject(utils.errors.errorTypes.addConsole, utils.errors.errorTypes.accessTokenProfileNotReceivedFromBattleNet, null)
        return callback(err)

      }
      if(utils._.isInvalidOrBlank(authData.profile.battletag)){
        utils.l.e("handleAddConsolePCWithBattleNetLogin battle tag is null.")
        var err = utils.errors.formErrorObject(utils.errors.errorTypes.addConsole, utils.errors.errorTypes.battleTagEmptyReceivedFromBattleNet, null)
        return callback(err)
      }
      //TODO: check if the battle tag is already taken, if taken update the account
      updateUserWithBattleNetInfo(req.user, authData.accessToken, authData.refreshToken, authData.profile.battletag, callback)
    }
  ], function(err, user){
    if(err){
      utils.l.e("handleAddConsolePCWithBattleNetLogin err ", err)
      return done(null, null)
    } else {
      utils.l.d("handleAddConsolePCWithBattleNetLogin: user updated" , user)
      return done(null, user)
    }
  })

}

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

function updateUserWithBattleNetInfo(user, accessToken, refreshToken, battletag, callback){
  var userConsoleData = {}

  utils.async.waterfall([
    function(callback){
      utils.l.d("updateUserWithBattleNetInfo")
      userConsoleData.verifyStatus = utils.constants.accountVerifyStatusMap.verified
      userConsoleData.consoleId = battletag
      userConsoleData.consoleType = utils.constants.consoleTypes.pc
      userConsoleData.isPrimary = true
      //set other consoles to isPrimary=false
      utils._.forEach(user.consoles, function (console) {
        console.isPrimary = false
      })
      user.consoles.push(userConsoleData)
      user.battleNetAccessToken = accessToken
      user.battleNetRefreshToken = refreshToken
      user.battleTag = battletag
      models.user.addUserToGroupsBasedOnConsole(user._id, userConsoleData.consoleType, callback)
    }, function(userGroups, callback){
      utils.l.d("updateUserWithBattleNetInfo user groups", userGroups)

      models.groups.getDefaultGroupForConsole(utils.constants.consoleTypes.pc, callback)
    }, function(defaultGroup, callback){
      utils.l.d("default group", defaultGroup)
      user.clanId = defaultGroup._id,
        user.clanName = defaultGroup.groupName
      service.userService.getOverwatchProfile(user.battleTag, callback)
    }, function(overwatchProfiles, callback){
      //TODO: add support adding profile for regions - Pick the profile based on region
      if(overwatchProfiles.length > 0){
        var pcProfile = utils._.find(overwatchProfiles, { 'region': 'us', 'console': 'pc'})
        if(utils._.isInvalidOrEmpty(pcProfile)){
          //if US-PC profile is not present, then take any PC profile
          pcProfile = utils._.find(overwatchProfiles, {'console': 'pc'})
        }
        utils.l.d("addConsole PC , pc overwatch profile", pcProfile)
        var pcConsole = utils._.find(user.consoles, {'consoleType': utils.constants.consoleTypes.pc})
        user.imageUrl = utils._.isInvalidOrBlank(pcProfile) || utils._.isInvalidOrBlank(pcProfile.imageUrl) ? user.imageUrl:  pcProfile.imageUrl
        pcConsole.clanTag  = utils._.isInvalidOrBlank(pcProfile) || utils._.isInvalidOrBlank(pcProfile.level)? null : "Lvl " + pcProfile.level
      }
      console.log("user", user)
      service.userService.updateUser(user, function (err, updatedUser) {
        if(err) {
          utils.l.s("Unable to update the user", err)
          return callback({error: "Something went wrong. Please try again"}, null)
        } else {
          utils.l.d("updateUserWithBattleNetInfo user", updatedUser)

          return callback(null, updatedUser)
        }
      })
    }
  ], callback)
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

  function handleUserSingIn(req, emailFromReq, password, done) {
    var email = emailFromReq.toLowerCase()
    utils.async.waterfall([
      function(callback) {
        models.user.findUserByEmail(email, callback)
      }, function(user, callback){
        if(!user) {
          //create user
          return callback(utils.errors.formErrorObject(utils.errors.errorTypes.signIn, utils.errors.errorCodes.noUserFoundWithTheEmailProvided))
        } else {
          if(!passwordHash.verify(password, user.password)) {
            return callback(utils.errors.formErrorObject(utils.errors.errorTypes.signIn, utils.errors.errorCodes.incorrectPassword))
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

  function handleUserSingUp(req, emailFromReq, password, done) {
    var email = emailFromReq.toLowerCase()
    utils.async.waterfall([
      function(callback) {
        models.user.findUserByEmail(email, callback)
      }, function(user, callback){
        if(!user) {
          //create user
          models.user.getOrCreateUIDFromRequest(req, true, function(err, uid){
            if(err){
              return callback(err)
            } else {
              models.user.createUserWithEmailAndPassword(uid, email, password, callback)
            }
          })
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

  //TODO: remove this after login is changed by front end
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

  var battlenet = new BnetStrategy({
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
    handleAddConsolePCWithBattleNetLogin(req, authData, done)
  })

  passport.use('local_signIn', local_signIn)
  passport.use('local_signUp', local_signUp)
  passport.use("battleNet", bnet)
  passport.use("battlenet", battlenet)

}