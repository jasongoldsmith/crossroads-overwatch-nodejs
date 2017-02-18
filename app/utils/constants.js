var lodash = require('./lodash')
var config =  require('config')
var baseUrl = "https://s3-us-west-1.amazonaws.com/w3.crossroadsapp.co/overwatch/"
var emailValidator = require("email-validator");

var baseUrl = "https://s3-us-west-1.amazonaws.com/w3.crossroadsapp.co/overwatch/"

var imageFiles = [
  "profile1.png",
  "profile2.png",
  "profile3.png",
  "profile4.png",
  "profile5.png",
  "profile6.png",
  "profile7.png"
]

var reportListStatus = {
  all:['new', 'resolved', 'defered', 'open'],
  unresolved:['new','open'],
  new:'new',
  open:'open',
  resolved:'resolved',
  defered:'defered'
}

var eventAction = {
  leave: 'leave',
  join: 'join'
}

var eventLaunchStatusList = {
    now:'now',
    upcoming:'upcoming'
}

var eventStatus = {
  new:'new',
  open:'open',
  full:'full',
  can_join:'can_join'
}

var reviewPromptCardStatus = {
  COMPLETED: 'COMPLETED',
  REFUSED: 'REFUSED',
  NEVER_SHOWN: 'NEVER_SHOWN',
  TO_BE_SHOWN: 'TO_BE_SHOWN'
}

var bungieMemberShipType = {
  PSN:2,
  XBOX:1,
  PS3:2,
  PS4:2,
  XBOX360:1,
  XBOXONE:1,
  bungieNetUser:254
}

var newGenConsoleType = {
  2:"PS4",
  1:"XBOXONE"
}
var consoleGenericsId = {
  PSN:"PlayStation Gamertag",
  XBOX:"Xbox Gamertag",
  PS3:"PlayStation Gamertag",
  PS4:"PlayStation Gamertag",
  XBOX360:"Xbox Gamertag",
  XBOXONE:"Xbox Gamertag"
}
var bungieMessageTypes = {
  accountVerification:'accountVerification',
  passwordReset:'passwordReset',
  eventInvitation:'eventInvitation'
}

var bungieMessages = {
  accountVerification:'Open the link to verify your %CONSOLETYPE% on Crossroads %URL%. If you have any questions, please email us at support@crossroadsapp.co because this mailbox is unmonitored',
  passwordReset: 'Hi! We received a request to reset your password. Please follow the link: %URL%. If you did not forget your password, please disregard this message.',
  addConsoleErrorMsg: "Oops! We could not find the #CONSOLE_TYPE# #CONSOLE_ID# publicly linked to your bungie account. Make sure your profile is public and try again.",
  bungieMembershipLookupError: "Looks like your #CONSOLE_TYPE# #CONSOLE_ID# isn't publicly linked to your Bungie account. Check Profile > Settings > Linked Accounts to make sure it's public and try again.",
  eventInvitationCurrent:"I reserved you a Fireteam spot for %ACTIVITY_NAME%. Respond on Crossroads %EVENT_DEEPLINK%.",
  eventInvitationUpcoming:"I reserved you a Fireteam spot for %ACTIVITY_NAME% at %EVENT_TIME%. Respond on Crossroads %EVENT_DEEPLINK%.",
  eventInvitationDefault:"I reserved you a Fireteam spot for %ACTIVITY_NAME%. Respond on Crossroads %EVENT_DEEPLINK%."
}

var bungieErrorMessage= function(messageId) {
  switch (messageId) {
    case "UserCannotResolveCentralAccount":
      return  {
        error: "We couldn’t find a Bungie.net profile linked to the %CONSOLETYPE% you entered.",
        errorType: "BungieLoginError"
      }
      break
    case "NotParsableError" || "DestinyInvalidClaimException" || "DestinyUnexpectedError" || "DestinyShardRelayClientTimeout":
      return {
        error: "We are unable to contact Bungie.net. Please try again in a few minutes.",
        errorType: "BungieConnectError"
      }
      break
    case "WebAuthRequired":
      return {
        error: "We are unable to contact Bungie.net. Please try again in a few minutes.",
        errorType: "BungieLoginError"
      }
      break
    case "BungieLegacyConsoleError":
      return {
        error: "In line with Rise of Iron, we now only support next-gen consoles. When you’ve upgraded your console, please come back and join us!",
        errorType: "BungieLegacyConsoleError"
      }
    break
    default:
      return {
        error: "We are unable to contact Bungie.net. Please try again in a few minutes.",
        errorType: "BungieConnectError"
      }
      break
  }
}
var eventNotificationTrigger = {
  launchUpcomingEvents:'launchUpcomingEvents',
  launchEventStart:'launchEventStart',
  eventStartReminder:'eventStartReminder',
  dailyOneTimeReminder:'dailyOneTimeReminder',
  launchUpComingReminders:'launchUpComingReminders',
  eventExpiry:'eventExpiry',
  userTimeout:'userTimeout',
  preUserTimeout:'preUserTimeout'
}

var userNotificationTrigger = {
  userSignup:'userSignup'
}
var freelanceBungieGroup = {
  "groupId": "clan_id_not_set",
  "groupName": "Freelance Lobby",
  "avatarPath": config.hostName+"/img/iconGroupCrossroadsFreelance.png",
  "clanEnabled": false
}

var existingUserInstallData = {
  ads:"mvpUser/mvpCampaign/mvpAd/mvpCreative"
}

var invitedUserInstallData = {
  ads:"invitedUser/inviteCampaign/invitepAd/inviteCreative"
}

var sysConfigKeys = {
  awsSNSAppArn:'app_%DEVICE_TYPE%_%ENV%',
  awsSNSTopicArn:'topic_%ENV%_%GROUP%_%CONSOLETYPE%',
  eventExpiryTimeInMins:"eventExpiryTimeInMins",
  userTimeoutInMins:"userTimeoutInMins",
  preUserTimeoutInMins:"preUserTimeoutInMins",
  bungieCookie: "bungieCookie",
  bungieCsrfToken: "bungieCsrfToken",
  termsVersion: "termsVersion",
  privacyPolicyVersion: "privacyPolicyVersion",
  commentsReportMaxValue: "commentsReportMaxValue",
  commentsReportCoolingOffPeriod: "commentsReportCoolingOffPeriod",
  userActiveTimeOutInMins: "userActiveTimeOutInMins",
  deleteFullEventsTimeOutInMins: "deleteFullEventsTimeOutInMins"
}

// These keys map to the method names in eventBasedPushNotification
var notificationQueueTypeEnum = {
  join: "sendPushNotificationForJoin",
  leave: "sendPushNotificationForLeave",
  kick: "sendPushNotificationForKick",
  newCreate: "sendPushNotificationForNewCreate",
  addComment: "sendPushNotificationForAddComment",
  creatorChange: "sendPushNotificationForCreatorChange",
  eventInvite: "sendPushNotificationForEventInvites",
  eventInviteAccept: "sendInviteAcceptNotification"
}

var serviceTypes = {PUSHNOTIFICATION:'PUSHNOTIFICATION',
  EMAIL:'EMAIL'}

//***************************************Overwatch code begins********************************************************//

var consoleTypes = {
  ps4: "PS4",
  xboxone: "XBOXONE",
  pc: "PC"
}

function isValidConsoleType(consoleType){
  var lowercaseType = consoleType.toString().toLowerCase()
  if(consoleTypes[lowercaseType]){
    return true
  } else {
    return false
  }
}

var regionBasedGroups = {
  us: "North America",
  eu: "Europe",
  kr: "Korea",
  tw: "Taiwan",
  cn: "North America",
  global: "GLOBAL"
}

var accountVerifyStatusMap = {
  verified: "VERIFIED",
  initiated: "INITIATED",
  failedInvitation: "FAILED_INITIATION",
  notInitiated: "NOT_INITIATED",
  invalidGamertag : "INVALID_GAMERTAG",
  invited: "INVITED",
  invitationMsgFailed: "INVITATION_MSG_FAILED"
}

function isEmailValid(email){
  return emailValidator.validate(email)
}

var SES_EMAIL_SENDER = "support@crossroadsapp.co"

var SNS_EMAIL_RECEIVERS = ["contact@crossroadsapp.co", "preeti@forcecatalyst.com"]

module.exports = {
  l: lodash,
  baseUrl: baseUrl,
  imageFiles: imageFiles,
  reportListStatus: reportListStatus,
  eventAction: eventAction,
  eventLaunchStatusList: eventLaunchStatusList,
  bungieMemberShipType:bungieMemberShipType,
  eventNotificationTrigger: eventNotificationTrigger,
  userNotificationTrigger: userNotificationTrigger,
  bungieMessageTypes: bungieMessageTypes,
  bungieMessages: bungieMessages,
  freelanceBungieGroup: freelanceBungieGroup,
  bungieErrorMessage: bungieErrorMessage,
  consoleGenericsId: consoleGenericsId,
  sysConfigKeys: sysConfigKeys,
  eventStatus: eventStatus,
  reviewPromptCardStatus: reviewPromptCardStatus,
  notificationQueueTypeEnum: notificationQueueTypeEnum,
  existingUserInstallData:existingUserInstallData,
  newGenConsoleType:newGenConsoleType,
  invitedUserInstallData:invitedUserInstallData,
  serviceTypes:serviceTypes,
  consoleTypes: consoleTypes,
  regionBasedGroups: regionBasedGroups,
  accountVerifyStatusMap: accountVerifyStatusMap,
  isValidConsoleType: isValidConsoleType,
  isEmailValid: isEmailValid,
  SES_EMAIL_SENDER: SES_EMAIL_SENDER,
  SNS_EMAIL_RECEIVERS: SNS_EMAIL_RECEIVERS
}