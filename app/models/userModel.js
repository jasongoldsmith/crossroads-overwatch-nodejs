var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')
var passwordHash = require('password-hash')
var uuid = require('node-uuid');

// User Schema
var UserSchema = require('./schema/userSchema')

// Model initialization
var User = mongoose.model('User', UserSchema.schema)
var roundRobinCounterModel = require('./roundRobinCounterModel')
var groupModel = require('./groupModel')
var userGroupModel = require('./userGroupModel')


//static variables
var roundRobinCount = null

roundRobinCounterModel.getByQuery(function(err, counter) {
  if (counter) {
    utils.l.d ( "getting roundRobinCount from mongo: " + counter.value)
    roundRobinCount = counter.value
  } else {
    roundRobinCount = 0
  }
})

// Public functions
function setFields(user_id, data, callback) {
  getById(user_id, function(err, user) {
    if (err)
      return callback(err)

    utils._.extend(user, data)
    save(user, callback)
  })
}

function getByQuery(query, callback) {
  User
    .find(query)
    .select("-passWord")
    .exec(callback)
}

function getByQueryLite(query, excludeFields, callback) {
  User
    .find(query)
    .select(excludeFields)
    .exec(callback)
}

function getUserIdsByQuery(query, callback) {
  User
    .find(query)
    .select({_id:1,isLoggedIn:1})
    .exec(callback)
}


function getById(id, callback) {
  if (!id) return callback("Invalid id:" + id)
  getByQuery({'_id':id}, utils.firstInArrayCallback(callback))
}

function getByIds(ids, callback) {
  if (utils._.isEmpty(ids)) return callback("Invalid ids:" + ids)
  getByQuery({ '_id': { '$in': ids }}, callback)
}

//function save(user, callback) {
//  utils.async.waterfall([
//    function(callback) {
//      // We need this as groups is mixed type
//      user.markModified('groups')
//      user.save(function(err, c, numAffected) {
//        if (err) {
//          utils.l.s("Got error on saving user", {err: err, user: user})
//        } else if (!c) {
//          utils.l.s("Got null on saving user", {user: user})
//        }
//        return callback(err, c)
//      })
//    }/*,
//    function(c, callback) {
//      getById(c._id, callback)
//    }*/
//  ],
//  function(err, user) {
//    if(err) {
//      if(utils.format.isDuplicateMongoKeyError(err)) {
//        var field = utils.format.getDuplicateMongoErrorKey(err)
//        var errmsgTemplate = "An account already exists for #FIELD#." +
//          "Check your Bungie messages for instructions on how to finish signing up."
//        return callback({error: errmsgTemplate.replace("#FIELD#", field)}, user)
//      }
//      return callback(err, user)
//    } else {
//      return callback(err, user)
//    }
//  })
//}

function save(user, callback){
  user.save(function(err, newUser){
    if(err){
      return callback(err)
    } else {
      return callback(null, newUser)
    }
  })
}

function deleteUser(data, callback) {
  utils.async.waterfall([
      function(callback) {
        User.findOne({_id: data.id}, callback)
      },
      function(user, callback) {
        if(!user) {
          return callback({error: "User with this id does not exist"}, null)
        }
        utils.l.d("Deleting the user")
        user.remove(callback)
      }
    ],
    function(err, user) {
      if (err) {
        return callback(err, null)
      } else {
        getById(user._id, callback)
      }
    }
  )
}

function handleMissingImageUrl(data, callback) {
  if (!data.imageUrl) {
    utils.l.d("no image URL found")
    var imageFiles = utils.constants.imageFiles
    data.imageUrl = utils.constants.baseUrl + imageFiles[roundRobinCount % imageFiles.length]
    utils.l.d("image URL round robin count = " + roundRobinCount)
    utils.l.d("image files length = " + imageFiles.length)
    roundRobinCount++
    utils.l.d("setting roundRobinCount to mongo: " + roundRobinCount)
    roundRobinCounterModel.updateCounter(roundRobinCount, function(err, counter) {
      return callback(null, data)
    })
		}else return callback(null,data)
}

function createUserFromData(data, callback) {
  utils.async.waterfall([
    function(callback) {
      handleMissingImageUrl(data, callback)
    },
    function(data, callback) {
      var user = new User(data)
      utils.l.d("image Url assigned: " + data.imageUrl)
      save(user, callback)
    }
  ], callback)

}

function getUserByData(data, callback) {
  utils.l.d('getUserByData::data',data)
  User.findOne(data)
    .exec(function(err, user) {
      if(err) {
        utils.l.s("Error in getUserByData", err)
        return callback({error: "Something went wrong. Please try again later"}, null)
      } else {
        return callback(err, user)
      }
    })
}

function getUserByConsole(consoleId, consoleType, bungieMemberShipId, callback) {
  var query= null

  if(utils._.isInvalidOrBlank(bungieMemberShipId)){
    query = {
      consoles: {
        $elemMatch: {
          consoleType: consoleType,
          consoleId:{$regex : new RegExp(["^", consoleId, "$"].join("")), $options:"i"}
        }}
    }
  }else{
    query = {"$or":[
      {bungieMemberShipId:bungieMemberShipId},
      {consoles: {
          $elemMatch: {
            consoleType: consoleType,
            consoleId: {$regex: new RegExp(["^", consoleId, "$"].join("")), $options: "i"}
          }
        }}
    ]}
  }

  utils.l.d("getUserByConsole::",query)
  User.find(query).exec(utils.firstInArrayCallback(callback))
}

function getAll(callback) {
  getByQuery({}, callback)
}

function getUserById(data, callback) {
  utils.async.waterfall([
      function (callback) {
        User.findOne({_id: data.id}, callback)
      },
      function(user, callback) {
        if (!user) {
          utils.l.d("no user found")
          return callback({ error: "user with this id does not exist" }, null)
        } else {
          utils.l.d("found user: " + utils.l.userLog(user))
          return callback(null, user)
        }
      }
  ],
    callback
  )
}

function listUsers(username, consoleId, callback) {
  getByQuery(constructFindUserQuery(username, consoleId), callback)
}


function updateUser(data, allowClanUpdate, callback) {
  utils.async.waterfall([
      function (callback) {
        getById(data.id, callback)
      },
      function(user, callback) {
        if (!user) {
          utils.l.d("no user found")
          return callback({ error: "user with this id does not exist" }, null)
        } else {
          if(!allowClanUpdate && (data.clanId && data.clanId != user.clanId)) {
            return callback({ error: "ClanId Update is not allowed." }, null)
          }else {
            utils.l.d("found user: " + utils.l.userLog(user))
            if (data.passWord) {
              data.passWord = passwordHash.generate(data.passWord)
            }
            if(data.userName) {
              data.userName = data.userName.toLowerCase().trim()
            }
            utils._.extend(user, data)
            user.save(callback)
          }
        }
      }
    ],
    callback)
}

/*
function listMemberCount(ids,consoleType,callback){
  utils.async.map(ids,
     function(id,callback){
       getUserCount(id,consoleType,callback)
     },
    function(err,counts){
      return callback(null,counts)
    }
  )
}

function getUserCount(id,consoleType,callback){
  utils.async.waterfall([
      function(callback){
        User
          .count({"groups.groupId":id,"consoles.consoleType":consoleType,"consoles.verifyStatus":"VERIFIED"})
          .exec(function(err,count){
            if(!err) return callback(null,{_id:id,count:count})
          })
      }
    ],callback
  )
}
*/

function getUserMetrics(callback) {
  User.aggregate([{
    "$group": {"_id": {"consoleType": "$consoles.consoleType", "verifyStatus":"$consoles.verifyStatus"},
    "count": {"$sum": 1}}}], callback)
}

function findByUserIdAndUpdate(id,data,callback){
  User.findByIdAndUpdate(id,{ "$set": data},callback)
}

function findUsersByIdAndUpdate(idList,data,callback){
  utils.l.d('updatingUsers',idList)
  utils.l.d('dataToupdate',data)
  User.update({_id:{"$in":idList}},{ "$set": data},{ multi: true },callback)
}

function filterIfUserExistsForUid(uid, callback) {
  if (utils._.isInvalid(uid)) {
    return callback(null, null)
  }
  utils.async.waterfall(
    [
      function(callback) {
        getById(uid, callback)
      }
    ],
    function (err, user) {
      if (err) {
        return callback(null, null)
      }
      if (utils._.isValid(user)) {
        return callback(null, null)
      }
      return callback(null, uid)
    }
  )
}

function getOrCreateUIDFromRequest(req, enforceNonExisting, callback) {
  utils.l.d("getOrCreateUIDFromRequest req user", req.user)
  if (req.isAuthenticated() && !enforceNonExisting) {
    utils.l.d("getOrCreateUIDFromRequest::is authenticated")
    //req.session.zuid=req.user._id
    return callback(null, req.user.id) // If user exists and it authenticated return right away
  }
  utils.async.waterfall(
    [
      function(callback) {
        var uid = req.session.zuid
        utils.l.d("getOrCreateUIDFromRequest::is session", uid)
        callback(null, uid)
      },
      function (uid, callback) {
        if (enforceNonExisting) {
          filterIfUserExistsForUid(uid, callback)
        } else {
          return callback(null, uid)
        }
      }
    ],
    function(err, uid) {
      if (err) {
        return callback(err)
      }
      if (utils._.isValid(uid)) {
        return callback(null, uid)
      }
      uid = utils.mongo.ObjectID()
      req.session.zuid = uid
      return callback(null, uid)
    }
  )
}

function constructFindUserQuery(username, consoleId) {
  var query = {}

  if(username) {
    query.email = username
  }

  if(consoleId) {
    query['consoles.consoleId'] = consoleId
  }

  return query
}

function findUsersPaginated(query, pageNumber, limit, callback) {
  User.find(query).skip(pageNumber > 0 ? ((pageNumber) * limit) : 0).limit(limit).exec(callback)
}

function findUserCount(query,callback){
  User.count(query).exec(callback)
}

function updateUserConsoles(user,callback){
  utils.async.waterfall([
    function(callback){
      getById(user._id,callback)
    },function(userDB,callback){
        utils._.extend(userDB,{consoles:user.consoles})
        userDB.imageUrl = user.imageUrl
        userDB.save(function(err, c, numAffected) {
          if (err) {
            utils.l.s("Got error on updateUserConsoles", {err: err, user: user})
          } else if (!c) {
            utils.l.s("Got null on updateUserConsolesr", {user: user})
          }
          return callback(err, c)
        })
      }
  ],
  callback)
}

function createUserWithBattleNetTagAndTokensAndDefaultConsole(tag, accessToken, refreshToken, callback){
  var defaultConsole = {
    consoleType:  utils.constants.consoleTypes.pc,
    isPrimary: true,
  }
  //TODO: remove this after new login flow with email and password has been added.
  if(utils._.isInvalidOrEmpty(tag)){
    tag = uuid.v4()
    tag = tag.substring(0,6)
  }
  defaultConsole.consoleId = tag
  var user = new User({battleTag: tag, battleNetAccessToken: accessToken, battleNetRefreshToken: refreshToken, battleNetAccessTokenFetchDate: new Date(), consoles: [defaultConsole]})
  save(user, callback)
}

function getUserByBattleTag(tag, callback){
  User.findOne({battleTag: tag}, callback)
}

function getUsersPrimaryConsoleType(userId, callback){
  User.findById(userId, function(err, user){
    if(err){
      return callback(err)
    }
    var primaryConsole = utils._.some(user.consoles, ['isPrimary', true])
    return callback(null, primaryConsole.consoleType)
  })
}

function findUserByEmail(email, callback){
  User.findOne({email: email}, callback)
}

function createUserWithEmailAndPassword(uid, email, password, callback){
  var obj = new User({_id: uid, email: email, password: passwordHash.generate(password), imageUrl: utils.constants.unverifiedProfilePic})
  save(obj, callback)
}

function addUserToGroupsBasedOnConsole(userId, consoleType, callback){
  utils.async.waterfall([
    function(callback){
      groupModel.getByConsoleType(consoleType, callback)
    }, function(groups, callback){
      utils.async.map(groups, function(group, callback){
        userGroupModel.updateUserGroupAndConsole(userId, group._id, consoleType, callback)
      }, function(err, result){
        if(err) {
          return callback(err)
        }
        return callback(null, result)
      })
    }
  ], callback)
}

function isConsoleIdAvailable(userId, consoleType, consoleId, callback){
  User.find({
    "consoles": {
      "$elemMatch" : {
        consoleType: consoleType, consoleId: consoleId
      }
    }
  }, function(err, user){
    utils.l.d("isConsoleIdAvailable user", user)
    if(utils._.isInvalidOrEmpty(user)){
      return callback(null,true)
    } else {
      return callback(null, false)
    }
  })
}

function findById(id, callback){
  User.findById(id, callback)
}

function updateUserPassword(userId, newPassword, callback) {
  utils.async.waterfall([
      function(callback){
        findById(userId, callback)
      },
      function(user, callback) {
        if (!user) {
          utils.l.d("updateUserPassword: no user found")
          return callback(utils.errors.formErrorObject(utils.errors.errorTypes.updatePassword, utils.errors.errorCodes.internalServerError))
        } else {
            utils.l.d("found user: " + utils.l.userLog(user))
            user.password = passwordHash.generate(newPassword)
            user.save(callback)
        }
      }
    ],
    callback)
}

function updateUserEmail(userId, email, callback){
  User.findOneAndUpdate({_id: userId}, {$set: {email: email}}, {new: true}, callback)
}

function isEmailAvailableForUser(userId, email, callback){
  User.findOne({_id: {$ne: userId}, email: email}, function(err, user){
    if(err){
      return callback(err)
    }
    if(user){
      return callback(null, false)
    } else {
      return callback(null, true)
    }
  })
}

module.exports = {
  model: User,
  getUserById: getUserById,
  getByIds: getByIds,
  listUsers:listUsers,
  setFields: setFields,
  save: save,
  deleteUser: deleteUser,
  getUserByData: getUserByData,
  createUserFromData: createUserFromData,
  getAll: getAll,
  getById: getById,
  updateUser: updateUser,
  getByQuery: getByQuery,
  getUserIdsByQuery: getUserIdsByQuery,
  //listMemberCount: listMemberCount,
  getUserMetrics: getUserMetrics,
  findByUserIdAndUpdate: findByUserIdAndUpdate,
  findUsersByIdAndUpdate: findUsersByIdAndUpdate,
  getOrCreateUIDFromRequest: getOrCreateUIDFromRequest,
  getByQueryLite: getByQueryLite,
  findUsersPaginated:findUsersPaginated,
  findUserCount:findUserCount,
  updateUserConsoles:updateUserConsoles,
  getUserByConsole:getUserByConsole,
  createUserWithBattleNetTagAndTokensAndDefaultConsole: createUserWithBattleNetTagAndTokensAndDefaultConsole,
  getUserByBattleTag: getUserByBattleTag,
  findUserByEmail: findUserByEmail,
  createUserWithEmailAndPassword: createUserWithEmailAndPassword,
  addUserToGroupsBasedOnConsole: addUserToGroupsBasedOnConsole,
  isConsoleIdAvailable: isConsoleIdAvailable,
  findById: findById,
  updateUserPassword: updateUserPassword,
  updateUserEmail: updateUserEmail,
  isEmailAvailableForUser: isEmailAvailableForUser
}
