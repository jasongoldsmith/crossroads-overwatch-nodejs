var lodash = require('./lodash')
var config =  require('config')

var errorTypes = {
  all: "All",
  signUp: "Sign Up Error",
  signIn: "Sign In Error",
  addConsole : "Add Console",
  updatePassword: "Update Password",
  changePrimaryConsole: "Change Primary Console",
  updateEmail: "Update Email",
  report: "report",
  resetPassword: 'resetPassword'
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
    types: [errorTypes.signUp, errorTypes.signIn, errorTypes.updateEmail, errorTypes.resetPassword],
    title: "Invalid Email Provided",
    message: "Please enter a valid email address."
  },
  invalidPassword: {
    code: 3,
    types: [errorTypes.signUp, errorTypes.signIn, errorTypes.updatePassword, errorTypes.updateEmail],
    title: "Invalid Password",
    message: "Please enter a password with more than 4 characters."
  },
  emailIsAlreadyTaken : {
    code: 4,
    types: [errorTypes.signUp, errorTypes.updateEmail],
    title: "Email Unavailable",
    message: "An account already exists with that email address. Please try logging in."
  },
  noUserFoundWithTheEmailProvided: {
    code: 5,
    types: [errorTypes.signIn],
    title: "Email Address Error",
    message: "We cannot find a Crossroads account with the email address you provided. Check for any typos or try signing up for Crossroads!"
  },
  consoleTypeNotProvided: {
    code: 6,
    types: [errorTypes.addConsole, errorTypes.changePrimaryConsole],
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
    title: "GamerTag not provided",
    message: "Please enter your Gamertag."
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
    title: "Name Already Taken",
    message: "An account already exists for that BattleTag. " +
    "Please check for any typos. If you believe someone is using your account name, let us know at support@crossroadsapp.co!"
  },
  battleTagEmptyReceivedFromBattleNet: {
    code: 12,
    types: [errorTypes.addConsole],
    title: "Invalid BattleTag",
    message: "We can't find a BattleTag associated with your Battle.net account. Please sign in on Battle.net and create a BattleTag."
  },
  accessTokenProfileNotReceivedFromBattleNet: {
    code: 13,
    types: [errorTypes.addConsole],
    title: "Profile Access Error",
    message: "Sorry, we couldn't load your profile. Please try logging in again!"
  },
  oldPasswordDoesNotMatchTheCurrentPassword: {
    code: 14,
    types: [errorTypes.updatePassword],
    title: "Password Error",
    message: "Your passwords do not match."
  },
  newPasswordIsSameAsOldPassword: {
    code: 15,
    types: [errorTypes.updatePassword],
    title: "Password Error",
    message: "Your new password must be different than your old password."
  },
  consoleDoesNotExistForUser: {
    code: 16,
    types: [errorTypes.changePrimaryConsole],
    title: "Console not found.",
    message: "Console not found for user"
  },
  newEmailSameAsCurrentEmail: {
    code: 17,
    types: [errorTypes.updateEmail],
    title: "Email Error",
    message: "The new email must be different than the existing email."
  },
  incorrectPassword: {
    code: 18,
    types: [errorTypes.signIn, errorTypes.updatePassword, errorTypes.updateEmail],
    title: "Incorrect Password",
    message: "Please check the password provided."
  },
  missingFields: {
    code: 19,
    types: [errorTypes.report],
    title: "Missing Fields",
    message: "Please complete the required fields."
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