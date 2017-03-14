var utils = require('../utils')
var models = require('../models')
var helpers = require('../helpers')
var userService = require('./userService')

function updateInstallation(pushDeviceType, deviceToken, user, callback){
  var installationObj = null
  utils.async.waterfall([
    function(callback) {
      if(utils._.isInvalid(pushDeviceType) || utils._.isInvalid(deviceToken)) {
        return callback("invalid url or token empty in the request")
      }
      models.installation.updateInstallation(user, pushDeviceType, deviceToken, callback)
    },function(installation, callback) {
      installationObj = installation
      helpers.sns.registerDeviceToken(user, installation, callback)
    },function(installation, callback){
        userService.subscribeUserNotifications(user,false,callback)
    }]
    ,function(err,result){
      utils.l.e("updateInstallation err: ", err)
      if(utils._.isValidNonBlank(installationObj))
        return callback(null,installationObj)
      else
        return callback(err,null)
    }
  )
}

function subscribeInstallation(callback){
  utils.async.waterfall([
    function(callback){
      models.installation.getInsallationCount({},callback)
    },function(installCount, callback){
      utils.l.d("installCount",installCount)
      var page=0
      var limit=100
      var batchStop = 0
      utils.async.whilst(
        function(){
          utils.l.d("batchStop in condition",batchStop)
          return batchStop<installCount
        },function(asyncCallback){
          utils.l.d("about to call subscribeInstallationAsync",page)
          subscribeInstallationAsync(page,limit,asyncCallback)
          page=page+1
          batchStop = page*limit
        },function(err,n){
          utils.l.d("completed processing:",n)
          callback(null,null)
        }
      )
    }
  ],callback)
}

function subscribeInstallationAsync(page, limit, callback){
  utils.l.i("processing subscribeInstallationAsync page::"+page)
  utils.async.waterfall([
    function(callback){
      models.installation.findInstallationsPaginated({},page,limit,callback)
    },function(installList,callback){
      utils.async.map(installList,function(installation,asynCallback){
        utils.l.d("subscribing for "+installation._id+"::deviceSubscription::"+installation.deviceSubscription)
        if(utils._.isInvalidOrBlank(installation.deviceSubscription) || utils._.isInvalidOrBlank(installation.deviceSubscription.deviceEndpointArn))
          helpers.sns.registerDeviceToken(installation.user,installation,asynCallback)
        else
          return asynCallback(null,null)
      },function(err,result){
        callback(null,page)
      })
    }
  ],callback)
}

function subscribeUsersWithoutDeviceSubscriptionToSNS(callback){
  utils.l.i("subscribeUsersWithoutDeviceSubscriptionToSNS")
  utils.async.waterfall([
    function(callback){
      utils.l.d("subscribeUsersWithoutDeviceSubscriptionToSNS start")
      var isDone = false
      var pageSize = 200
      var pageNum = 0
      var usersCount = 0
      utils.async.whilst(
        function(){
          utils.l.d("subscribeUsersWithoutDeviceSubscriptionToSNS in while condition" + isDone)
          return !isDone
        },
        function (callback){
          utils.l.d("subscribeUsersWithoutDeviceSubscriptionToSNS in while loop")
          pageNum++
          models.installation.getUsersWithoutSubscriptionGivenPageNumAndPageSize(pageNum, pageSize, function(err, installations){
            utils.l.i("subscribeUsersWithoutDeviceSubscriptionToSNS: num of installations", utils._.isInvalidOrEmpty(installations)? 0 : installations.length)
            if(utils._.isInvalidOrEmpty(installations)){
              isDone = true
              return callback(null, usersCount)
            }
            usersCount += installations.length
            utils.async.map(installations, function(installation, callback){
              utils.l.d("subscribeUsersWithoutDeviceSubscriptionToSNS: pageNum", pageNum)
              models.user.findById(installation.user, function(err, user){
                if(err){
                  usersCount--
                  utils.l.e("subscribeUsersWithoutDeviceSubscriptionToSNS: Error while getting user by id , user id : " + installation.user+ " err: ", err)
                  return callback(null, null)
                }
                if(utils._.isInvalidOrEmpty(user)){
                  usersCount--
                  utils.l.e("subscribeUsersWithoutDeviceSubscriptionToSNS: User does not exists for id , user id : " + installation.user)
                  return callback(null, null)
                } else {
                  updateInstallation(installation.deviceType, installation.deviceToken, user, function(err, updatedInstallation){
                    if(err){
                      utils.l.e("subscribeUsersWithoutDeviceSubscriptionToSNS error for user: " +  user._id + " err: ", err)
                      //check for dup token
                      models.installation.getDuplicateInstallationWithDeviceSubscription(installation.deviceToken, user._id, function(err, dupInstallation){
                        utils.l.i("subscribeUsersWithoutDeviceSubscriptionToSNS dup installation for token: " + installation.deviceToken + " :", dupInstallation)
                        if(err){
                          //ignore error and move on to the next one
                          utils.l.e("subscribeUsersWithoutDeviceSubscriptionToSNS error while looking for duplicate token for user: " +  user._id + " err: ", err)
                          return callback(null, null)
                        }
                        if(utils._.isInvalidOrEmpty(dupInstallation)){
                          //there is no duplicate installation. When the job runs again we will try to create end point again
                          utils.l.i("subscribeUsersWithoutDeviceSubscriptionToSNS no duplicate installation for user: " +  user._id)
                          return callback(null, null)
                        }
                        //we have a duplicate token, update the user's end point
                        utils.l.i("subscribeUsersWithoutDeviceSubscriptionToSNS duplicate installation for user: " +  user._id)
                        models.installation.updateDeviceSubscription(installation._id, updatedInstallation.deviceSubscription, callback)
                      })
                    } else {
                      return callback(null, updatedInstallation)
                    }
                  })
                }
              })
            }, function(err, result){
              if(err){
                return callback(err)
              }
              return callback(null, usersCount)
            })
          })
        }, function(err, result){
          utils.l.d("subscribeUsersWithoutDeviceSubscriptionToSNS in while callback" + usersCount)
          if(err){
            return callback(err)
          }
          return callback(null, usersCount)
        }
      )
    }
  ], function(err, result){
    if(err){
      return callback(null, err)
    } else {
      return callback(null, {value: "Num of updated user events= " + result})
    }
  })
}

function subscribeUsersWithoutGroupSubscriptionToSNSTopics(callback){
  utils.l.i("subscribeUsersWithoutGroupSubscriptionToSNSTopics")
  utils.async.waterfall([
    function(callback){
      utils.l.d("subscribeUsersWithoutGroupSubscriptionToSNSTopics start")
      var isDone = false
      var pageSize = 200
      var pageNum = 0
      var usersCount = 0
      utils.async.whilst(
        function(){
          utils.l.d("subscribeUsersWithoutGroupSubscriptionToSNSTopics in while condition" + isDone)
          return !isDone
        },
        function (callback){
          utils.l.d("subscribeUsersWithoutGroupSubscriptionToSNSTopics in while loop")
          pageNum++
          models.userGroup.getUsersWithoutSubscriptionGivenPageNumAndPageSize(pageNum, pageSize, function(err, userGroups){
            utils.l.i("subscribeUsersWithoutGroupSubscriptionToSNSTopics: num of user groups", utils._.isInvalidOrEmpty(userGroups)? 0 : userGroups.length)
            if(utils._.isInvalidOrEmpty(userGroups)){
              isDone = true
              return callback(null, usersCount)
            }
            usersCount += userGroups.length
            utils.async.map(userGroups, function(userGroup, callback){
              utils.l.d("subscribeUsersWithoutGroupSubscriptionToSNSTopics: pageNum", pageNum)
              models.installation.findByUser(userGroup.user, function(err, installation){
                if(err){
                  usersCount--
                  utils.l.e("subscribeUsersWithoutGroupSubscriptionToSNSTopics: Error while getting installation by user id , user id : " + userGroup.user+ " err: ", err)
                  return callback(null, null)
                }
                helpers.sns.subscirbeUserGroup(userGroup, installation, function(err, result){
                  if(err){
                    utils.l.e("subscribeUsersWithoutGroupSubscriptionToSNSTopics: subscirbeUserGroup err: " , err)
                    //ignore err and move on to next one
                    return callback(null, null)
                  } else {
                    return callback(null, result)
                  }
                })
              })
            }, function(err, result){
              if(err){
                utils.l.e("subscribeUsersWithoutGroupSubscriptionToSNSTopics: err: " , err)
                return callback(err)
              }
              return callback(null, usersCount)
            })
          })
        }, function(err, result){
          utils.l.d("subscribeUsersWithoutGroupSubscriptionToSNSTopics in while callback" + usersCount)
          if(err){
            utils.l.e("subscribeUsersWithoutGroupSubscriptionToSNSTopics: err after while completion: " , err)
            return callback(err)
          }
          return callback(null, usersCount)
        }
      )
    }
  ], function(err, result){
    if(err){
      return callback(null, err)
    } else {
      utils.l.i("subscribeUsersWithoutGroupSubscriptionToSNSTopics Num of updated users: " + result)
      return callback(null, {value: "Num of updated users = " + result})
    }
  })
}

module.exports = {
  updateInstallation: updateInstallation,
  subscribeInstallation:subscribeInstallation,
  subscribeUsersWithoutDeviceSubscriptionToSNS: subscribeUsersWithoutDeviceSubscriptionToSNS,
  subscribeUsersWithoutGroupSubscriptionToSNSTopics: subscribeUsersWithoutGroupSubscriptionToSNSTopics
}