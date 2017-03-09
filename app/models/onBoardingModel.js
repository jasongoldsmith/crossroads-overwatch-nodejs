var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')

// User Schema
var onBoardingSchema = require('./schema/onBoardingSchema')

// Model initialization
var onBoarding = mongoose.model('onBoarding', onBoardingSchema.schema)

function getRequiredOnBoardingScreenByLanguage(language, callback){
  var queryLanguage = ""
  if(utils._.isInvalidOrBlank(language)|| !utils.underscore.contains(utils.constants.languagesForOnBoarding, language)){
    queryLanguage = utils.constants.languagesForOnBoarding.english
  } else{
    queryLanguage = language
  }
  onBoarding.find({
    isRequired: true,
    language: queryLanguage
  }).sort({order: 1}).exec(callback)
}

function getOptionalOnBoardingScreenByLanguage(language, callback){
  var queryLanguage = ""
  if(utils._.isInvalidOrBlank(language)|| !utils.underscore.contains(utils.constants.languagesForOnBoarding, language)){
    queryLanguage = utils.constants.languagesForOnBoarding.english
  } else{
    queryLanguage = language
  }
  onBoarding.find({
    isRequired: false,
    language: queryLanguage
  }).sort({order: 1}).exec(callback)
}

module.exports = {
  model: onBoarding,
  getRequiredOnBoardingScreenByLanguage: getRequiredOnBoardingScreenByLanguage,
  getOptionalOnBoardingScreenByLanguage: getOptionalOnBoardingScreenByLanguage
}