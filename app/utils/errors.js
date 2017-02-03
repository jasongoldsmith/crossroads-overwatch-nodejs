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
    title: "Unknown Error",
    message: "Talon strikes again. If this error persists, please contact us at support@crossroadsapp.co! Error Code 00."
  },
  internalServerError: {
    code: 1,
    types : [errorTypes.all],
    title: "Internal Server Error",
    message: "Talon messed with the servers. If this error persists, please contact us at support@crossroadsapp.co! Error Code 01."
  },
  invalidEmail : {
    code: 2,
    types: [errorTypes.signUp, errorTypes.signIn],
    title: "Invalid Email Provided",
    message: "Please enter a valid email address."
  },
  invalidPassword: {
    code: 3,
    types: [errorTypes.signUp, errorTypes.signIn],
    title: "Invalid Password Provided",
    message: "Please enter a password with more than 4 characters."
  },
  emailIsAlreadyTaken : {
    code: 4,
    types: [errorTypes.signUp],
    title: "Email is already taken",
    message: "An account already exists with that email address."
  },
  noUserFoundWithTheEmailProvided: {
    code: 5,
    types: [errorTypes.signIn],
    title: "No User found with the email provided",
    message: "An account with that email address does not exist."
  },
  consoleTypeNotProvided: {
    code: 6,
    types: [errorTypes.addConsole],
    title: "Console Type not provided",
    message: "Please select a platform."
  },
  invalidConsoleType: {
    code: 7,
    types: [errorTypes.addConsole],
    title: "Invalid console type: Supported types are PC, Xbox One, PS4",
    message: "Please select a valid platform."
  },
  consoleIdNotProvided: {
    code: 8,
    types: [errorTypes.addConsole],
    title: "BattleTag/GamerTag not provided",
    message: "Please enter your BattleTag/Gamertag."
  },
  userAlreadyOwnsThisConsole: {
    code: 9,
    types: [errorTypes.addConsole],
    title: "You already own this console",
    message: "You've already added this console."
  },
  userCannotDowngradeTheConsole: {
    code: 10,
    types: [errorTypes.addConsole],
    title: "You cannot downgrade your console",
    message: "Unable to add that console. Error Code 10."
  },
  tagAlreadyTaken: {
    code: 11,
    types: [errorTypes.addConsole],
    title: "ALREADY TAKEN",
    message: "An account already exists for that BattleTag. " +
    "Please check for any typos. If you believe someone is using your account name, let us know at support@crossroadsapp.co!"
  },
  battleTagEmptyReceivedFromBattleNet: {
    code: 12,
    types: [errorTypes.addConsole],
    title: "Battletag is not available in battle.net",
    message: "We can't find that BattleTag on Battle.net. Check for typos!"
  },
  accessTokenProfileNotReceivedFromBattleNet: {
    code: 13,
    types: [errorTypes.addConsole],
    title: "Access Token Or Profile is empty. Try logging in again",
    message: "Sorry, we couldn't load your profile. Please try logging in again!"
  },
  oldPasswordDoesNotMatchTheCurrentPassword: {
    code: 14,
    types: [errorTypes.updatePassword],
    title: "Old password does not match the current password",
    message: "Your passwords do not match."
  },
  newPasswordIsSameAsOldPassword: {
    code: 15,
    types: [errorTypes.updatePassword],
    title: "New password has to be different from the old password",
    message: "Your new password must be different than your old password."
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