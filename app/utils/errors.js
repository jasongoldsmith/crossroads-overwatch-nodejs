var lodash = require('./lodash')
var config =  require('config')

var errorTypes = {
  all: "All",
  signUp: "Sign Up Error",
  signIn: "Sign In Error",
  addConsole : "Add Console",
  updatePassword: "Update Password"
}

var errorCodes = {
  unknownError: {
    code: 0,
    types : [errorTypes.all],
    title: "Unknown Error"
  },
  internalServerError: {
    code: 1,
    types : [errorTypes.all],
    title: "Internal Server Error"
  },
  invalidEmail : {
    code: 2,
    types: [errorTypes.signUp, errorTypes.signIn],
    title: "Invalid Email Provided"
  },
  invalidPassword: {
    code: 3,
    types: [errorTypes.signUp, errorTypes.signIn],
    title: "Invalid Password Provided"
  },
  emailIsAlreadyTaken : {
    code: 4,
    types: [errorTypes.signUp],
    title: "Email is already taken"
  },
  noUserFoundWithTheEmailProvided: {
    code: 5,
    types: [errorTypes.signIn],
    title: "No User found with the email provided"
  },
  consoleTypeNotProvided: {
    code: 6,
    types: [errorTypes.addConsole],
    title: "Console Type not provided"
  },
  invalidConsoleType: {
    code: 7,
    types: [errorTypes.addConsole],
    title: "Invalid console type"
  },
  consoleIdNotProvided: {
    code: 8,
    types: [errorTypes.addConsole],
    title: "BattleTag/GamerTag not provided"
  },
  userAlreadyOwnsThisConsole: {
    code: 9,
    types: [errorTypes.addConsole],
    title: "You already own this console"
  },
  userCannotDowngradeTheConsole: {
    code: 10,
    types: [errorTypes.addConsole],
    title: "You cannot downgrade your console"
  },
  tagAlreadyTaken: {
    code: 11,
    types: [errorTypes.addConsole],
    title: "Battletag/Gamertag is already taken"
  },
  battleTagEmptyReceivedFromBattleNet: {
    code: 12,
    types: [errorTypes.addConsole],
    title: "Battletag is not available in battle.net"
  },
  accessTokenProfileNotReceivedFromBattleNet: {
    code: 13,
    types: [errorTypes.addConsole],
    title: "Access Token Or Profile is empty. Try logging in again"
  },
  oldPasswordDoesNotMatchTheCurrentPassword: {
    code: 14,
    types: [errorTypes.updatePassword],
    title: "Old password does not match the current password"
  },
  newPasswordIsSameAsOldPassword: {
    code: 15,
    types: [errorTypes.updatePassword],
    title: "New password has to be different from the old password"
  }
}

function formErrorObject(type, errorCodeObj, data) {
  var data = {
    title: lodash._.isInvalidOrEmpty(errorCodeObj) ? errorCodes.unknownError.title : errorCodeObj.title,
    message: lodash._.isInvalidOrEmpty(errorCodeObj) ? "" : errorCodeObj.message,
    comments: data
  }

  var error = {
    type: lodash._.isInvalidOrBlank(type) ? "error" : type,
    code: lodash._.isInvalidOrEmpty(errorCodeObj) ? errorCodes.unknownError.code : errorCodeObj.code,
    details: data,
  }
  return {error: error}
}

module.exports = {
  formErrorObject : formErrorObject,
  errorTypes: errorTypes,
  errorCodes: errorCodes
}