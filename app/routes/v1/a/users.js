var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var models = require('../../../models')
var utils = require('../../../utils')
var service = require('../../../service')
var passwordHash = require('password-hash')

function getSelfUser(req, res) {
  var feedData = {value: req.user}
  routeUtils.handleAPISuccess(req, res, feedData)
}

function listById(req, res) {
  utils.l.i("Get user by id request" + JSON.stringify(req.body))
  getUserById(req.body, function(err, user) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res,  {value: user})
    }
  })
}

function list(req, res) {
  utils.l.i("User list request")
  var username = req.param("userName")
  var consoleId = req.param("consoleId")
  utils.l.i("User list request", "username: " + username + " consoleId: " + consoleId)
  listUsers(username, consoleId, function(err, users) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, users)
    }
  })
}

function update(req, res) {
  utils.l.i("Update user request" + JSON.stringify(req.body))
  updateUser(req.body, function(err, user) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, user)
    }
  })
}

function updateGroup(req, res) {
  utils.l.i("Update user group request" + JSON.stringify(req.body))

  if(!req.body.id || !req.body.clanId) {
    var err = {
      error: "Id and ClanId are required fields"
    }
    routeUtils.handleAPIError(req, res, err, err)
  }else {
    service.userService.updateUserGroup(req.body, function (err, user) {
      if (err) {
        routeUtils.handleAPIError(req, res, err, err)
      } else {
        routeUtils.handleAPISuccess(req, res, {value: user})
      }
    })
  }
}

function updatePassword(req, res) {
  utils.l.i("Update user password request" + JSON.stringify(req.body))

  if(!req.body.oldPassword || !req.body.newPassword) {
    var err = utils.errors.formErrorObject(utils.errors.errorTypes.updatePassword, utils.errors.errorCodes.invalidPassword)
    routeUtils.handleAPIError(req, res, err, err)
  } else {

    //TODO: check what password rules are needed??
    //try {
    //  req.assert('newPassWord').notEmpty().isAlphaNumeric()
    //} catch(ex) {
    //  var err = {
    //    error: "password must be between 1 and 9 characters and must be alphanumeric"
    //  }
    //  return routeUtils.handleAPIError(req, res, err, err)
    //}

    updateUserPassword(req.user, req.body.oldPassword, req.body.newPassword, function (err, user) {
      if (err) {
        routeUtils.handleAPIError(req, res, err, err)
      } else {
        routeUtils.handleAPISuccess(req, res, {value: user})
      }
    })
  }
}

function updateReviewPromptCardStatus(req, res) {
  utils.l.d("Update user review prompt card status request" + JSON.stringify(req.body))
  if(!req.body.reviewPromptCardStatus) {
    var err = {
      error: "reviewPromptCardStatus is a required field"
    }
    routeUtils.handleAPIError(req, res, err, err)
  } else {
    service.userService.updateReviewPromptCardStatus(req.user, req.body, function (err, user) {
      if (err) {
        routeUtils.handleAPIError(req, res, err, err)
      } else {
        routeUtils.handleAPISuccess(req, res, user)
      }
    })
  }
}

function getUserMetrics(req, res) {
  utils.l.i("Get user metrics request")
  models.user.getUserMetrics(function(err, metrics) {
    if(err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, metrics)
    }
  })
}

function addConsole(req, res) {
  var newConsoleType = null
  console.log("console types" , req.param("consoleType"))
  if(utils._.isInvalidOrBlank(req.param("consoleType"))) {
    newConsoleType = req.body.consoleType ? req.body.consoleType.toString().toUpperCase() : null
  } else {
    newConsoleType = req.param("consoleType").toString().toUpperCase()
  }
  var newConsoleId = req.body.consoleId

  if(!newConsoleType) {
    var err = utils.errors.formErrorObject(utils.errors.errorTypes.addConsole, utils.errors.errorCodes.consoleTypeNotProvided, null)
    routeUtils.handleAPIError(req, res, err, err)
  } else if(!utils.constants.isValidConsoleType(newConsoleType)){
    var err = utils.errors.formErrorObject(utils.errors.errorTypes.addConsole, utils.errors.errorCodes.invalidConsoleType, null)
    routeUtils.handleAPIError(req, res, err, err)
  } else if(utils._.isValidNonBlank(utils.getUserConsoleObject(req.user, newConsoleType))) {
    var err = utils.errors.formErrorObject(utils.errors.errorTypes.addConsole, utils.errors.errorCodes.userAlreadyOwnsThisConsole, null)
    routeUtils.handleAPIError(req, res, err, err)
  } else {
    switch (newConsoleType) {
      case utils.constants.consoleTypes.pc: {
        service.userService.addConsolePC(req, res, req.user, newConsoleType, function (err, user) {
          if (err) {
            routeUtils.handleAPIError(req, res, err, err)
          } else {
            routeUtils.handleAPISuccess(req, res, {value: user})
          }
        })
        break;
      }
      case utils.constants.consoleTypes.ps4:
        //intentional fall through
      case utils.constants.consoleTypes.xboxone :{
        service.userService.addConsole(req.user, newConsoleType, newConsoleId, function (err, user) {
          if (err) {
            routeUtils.handleAPIError(req, res, err, err)
          } else {
            routeUtils.handleAPISuccess(req, res, {value:user})
          }
        })
        break;
      }
    }
  }
}

function changePrimaryConsole(req, res) {
  if(!req.body.consoleType) {
    var error = utils.errors.formErrorObject(utils.errors.errorTypes.changePrimaryConsole, utils.errors.errorCodes.consoleTypeNotProvided)
    routeUtils.handleAPIError(req, res, error, error)
  } else {
    service.userService.changePrimaryConsole(req.user, req.body.consoleType.toString().toUpperCase(), function (err, user) {
      if (err) {
        routeUtils.handleAPIError(req, res, err, err)
      } else {
        routeUtils.handleAPISuccess(req, res, {value:user})
      }
    })
  }
}

function getUserById(userId, callback) {
  utils.async.waterfall([
    function(callback){
      models.user.findById(userId, callback)
    },function(user, callback){
      //TODO: check if this is needed
      service.authService.addLegalAttributes(user,callback)
    }
  ],callback)
}

function listUsers(username, consoleId, callback) {
  models.user.listUsers(username, consoleId, callback)
}

function updateUser(data, callback) {
  models.user.updateUser(data, false, callback)
}

function updateUserPassword(user, oldPassword, newPassword, callback) {
  utils.async.waterfall([
    function(callback) {
      //TODO: check if this is needed
      //service.authService.addLegalAttributes(user,callback)
      if (!passwordHash.verify(oldPassword, user.password)) {
        return callback(utils.errors.formErrorObject(utils.errors.errorTypes.updatePassword, utils.errors.errorCodes.oldPasswordDoesNotMatchTheCurrentPassword))
      }
      if (oldPassword == newPassword) {
        return callback(utils.errors.formErrorObject(utils.errors.errorTypes.updatePassword, utils.errors.errorCodes.newPasswordIsSameAsOldPassword), null)
      }
      models.user.updateUserPassword(user._id, newPassword, callback)
    }
  ], callback)
}

function acceptLegal(req,res){
  handleAcceptLegal(req.user, function(err, user) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      var userResp = service.userService.setLegalAttributes(user)
      routeUtils.handleAPISuccess(req, res,  {value: userResp})
    }
  })
}

function handleAcceptLegal(user, callback){
  utils.async.waterfall([
    function(callback){
      models.user.getUserById({id:user._id}, callback)
    },function(user, callback){
      models.sysConfig.getSysConfigList([utils.constants.sysConfigKeys.termsVersion,utils.constants.sysConfigKeys.privacyPolicyVersion],callback)
    },function(sysConfigs, callback){
      var termsVersionObj =  utils._.find(sysConfigs, {"key": utils.constants.sysConfigKeys.termsVersion})
      var privacyObj = utils._.find(sysConfigs, {"key": utils.constants.sysConfigKeys.privacyPolicyVersion})

      updateUser({id:user._id,legal:{termsVersion:termsVersionObj.value.toString(),privacyVersion:privacyObj.value.toString()}},callback)
    }
  ],callback)
}

function getPendingEventInvites(req, res) {
  service.userService.getPendingEventInvites(req.user, function (err, pendingEventInvites) {
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, pendingEventInvites)
    }
  })
}

function updateEmail(req, res){
  utils.l.i("Update user email request" + JSON.stringify(req.body))
  var email = ""
  utils.async.waterfall([
    function(callback){
      if(!req.body.password) {
        utils.l.e("updateEmail: password not provided ")
        var err = utils.errors.formErrorObject(utils.errors.errorTypes.updateEmail, utils.errors.errorCodes.invalidPassword)
        return callback(err)
      }
      if(!utils.constants.isEmailValid(req.body.newEmail)){
        utils.l.e("updateEmail: invalid email" ,  req.body.newEmail)
        var err = utils.errors.formErrorObject(utils.errors.errorTypes.updateEmail, utils.errors.errorCodes.invalidEmail)
        return callback(err)
      }
      if (!passwordHash.verify(req.body.password, req.user.password)) {
        utils.l.e("updateEmail: input password does not match the exisitng password")
        return callback(utils.errors.formErrorObject(utils.errors.errorTypes.updateEmail, utils.errors.errorCodes.incorrectPassword))
      }
      email = req.body.newEmail.toLowerCase()
      if(utils._.isEqual(req.user.email, email)){
        return callback(utils.errors.formErrorObject(utils.errors.errorTypes.updateEmail, utils.errors.errorCodes.newEmailSameAsCurrentEmail))
      }
      models.user.isEmailAvailableForUser(req.user._id, email, callback)
    }, function(isEmailAvailable, callback){
      if(isEmailAvailable){
        models.user.updateUserEmail(req.user._id, email, callback)
      } else {
        return callback(utils.errors.formErrorObject(utils.errors.errorTypes.updateEmail, utils.errors.errorCodes.emailIsAlreadyTaken))
      }
    }
  ], function(err, user){
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, {value: user})
    }
  })
}

function getOverwatchProfile(req, res){
  service.userService.getOverwatchProfile(req.body.tag, function(err, resp){
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, {value: resp})
    }
  })
}

function completeOnBoarding(req, res){
  req.user.hasCompletedOnBoarding = true
  service.userService.updateUser(req.user, function(err, resp){
    if (err) {
      routeUtils.handleAPIError(req, res, err, err)
    } else {
      routeUtils.handleAPISuccess(req, res, {value: resp})
    }
  })
}

routeUtils.rGet(router, '/self', 'GetSelfUser', getSelfUser)
routeUtils.rGet(router, '/list', 'list', list)
routeUtils.rPost(router, '/listById', 'listById', listById)
routeUtils.rPost(router, '/update', 'update', update)
routeUtils.rPost(router, '/updateGroup', 'updateGroup', updateGroup)
routeUtils.rPost(router, '/acceptLegal', 'acceptLegal', acceptLegal)
routeUtils.rPost(router, '/updatePassword', 'updatePassword', updatePassword)
routeUtils.rPost(router, '/updateReviewPromptCardStatus', 'updateReviewPromptCardStatus', updateReviewPromptCardStatus)
routeUtils.rGetPost(router, '/addConsole', 'addUserConsole', addConsole, addConsole)
routeUtils.rPost(router, '/changePrimaryConsole', 'changePrimaryConsole', changePrimaryConsole)
routeUtils.rGet(router, '/getMetrics', 'getUserMetrics', getUserMetrics)
routeUtils.rGet(router, '/getPendingEventInvites', 'getPendingEventInvites', getPendingEventInvites)
routeUtils.rPost(router, '/updateEmail', 'updateEmail', updateEmail)
routeUtils.rPost(router, '/getOverwatchProfile', 'getOverwatchProfile', getOverwatchProfile)
routeUtils.rPost(router, '/completeOnBoarding', 'completeOnBoarding', completeOnBoarding)

module.exports = router
