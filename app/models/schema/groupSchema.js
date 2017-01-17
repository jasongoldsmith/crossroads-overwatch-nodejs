var mongoose = require('mongoose')
var utils = require('../../utils')
var Schema = mongoose.Schema
var serviceTypeEnum = {
  type: String,
  enum: utils._.values(utils.constants.serviceTypes),
  default: utils.constants.serviceTypes.PUSHNOTIFICATION
}

var groupNames =  utils._.values(utils.constants.regionBasedGroups)
var consoleTypes =  utils._.values(utils.constants.consoleTypes)

var GroupSchema = new Schema({
  groupName: {type: String, enum: groupNames},
  consoleType: {type: String, enum: consoleTypes},
  date: { type: Date, required: true },
  uDate: Date,
  avatarPath:String,
  overwatchMemberCount:Number,
  clanEnabled:Boolean,
  appStats:[{
    consoleType:String,
    memberCount:Number
  }],
  serviceEndpoints:[{
    serviceType:serviceTypeEnum,
    consoleType:String,
    topicEndpoint:String,
    topicName:String
  }]
})

GroupSchema.index({"__v": 1, "_id": 1})

GroupSchema.pre('validate', function(next) {
  this.uDate = new Date()
  if (this.isNew) {
    this.date = new Date()
  }
  next()
})


module.exports = {
  schema: GroupSchema
}