var lodash = require('./lodash')
var config =  require('config')

var errorTypes = {
  signUp: "Sign Up Error",
  signIn: "Sign In Error",
  addConsole : "Add Console"
}

var errorCodes = {
  unknownError: {
    code: 0,
    description: "Unknown Error"
  },
  internalServerError: {
    code: 1,
    description: "Internal Server Error"
  },
  invalidEmail : {
    code: 2,
    description: "Invalid Email Provided"
  },
  invalidPassword: {
    code: 3,
    description: "Invalid Password Provided"
  },
  emailIsAlreadyTaken : {
    code: 4,
    description: "Email is already taken"
  },
  noUserFoundWithTheEmailProvided: {
    code: 5,
    description: "No User found with the email provided"
  },
  consoleTypeNotProvided: {
    code: 6,
    description: "Console Type not provided"
  },
  consoleIdNotProvided: {
    code: 7,
    description: "BattleTag/GamerTag not provided"
  },
  userAlreadyOwnsThisConsole: {
    code: 8,
    description: "You already own this console"
  },
  userCannotDowngradeTheConsole: {
    code: 9,
    description: "You cannot downgrade your console"
  },
  invalidConsoleType: {
    code: 10,
    description: "Invalid console type"
  }
}

function formErrorObject(type, errorCodeObj, data) {
  var m = ""
  if(lodash._.isInvalidOrEmpty(data)){
    m = lodash._.isInvalidOrEmpty(errorCodeObj) ? errorCodes.unknownError.description : errorCodeObj.description
  } else {
    m = lodash._.isInvalidOrEmpty(errorCodeObj) ? errorCodes.unknownError.description : errorCodeObj.description +": " + data
  }
  return {
    type: lodash._.isInvalidOrBlank(type) ? "error" : type,
    code: lodash._.isInvalidOrEmpty(errorCodeObj) ? errorCodes.unknownError.code : errorCodeObj.code,
    description: m,
  }
}

module.exports = {
  formErrorObject : formErrorObject,
  errorTypes: errorTypes,
  errorCodes: errorCodes
}