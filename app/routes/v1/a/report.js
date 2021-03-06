var express = require('express')
var router = express.Router()
var routeUtils = require('./../../routeUtils')
var service = require('../../../service/index')
var utils = require('../../../utils/index')
var helpers = require('../../../helpers')


function createReport(req, res) {
    utils.l.i("Report create request: " + JSON.stringify(req.body))
    if(utils._.isInvalidOrEmpty(req.body.description)){
        var err = utils.errors.formErrorObject(utils.errors.errorTypes.report, utils.errors.errorCodes.missingFields)
        routeUtils.handleAPIError(req, res, err, err)
    } else {
        var sourceText = utils._.isInvalidOrEmpty(req.body.source) || utils._.isInvalidOrBlank(req.body.source.sourceCode)? "" : utils.constants.contactUsSourceCodesMapping[req.body.source.sourceCode]
        var subject = "Overwatch Contact Us " + sourceText
        var email = req.isAuthenticated() ? req.user.email : req.body.email
        if(utils._.isInvalidOrBlank(email)){
            var err = utils.errors.formErrorObject(utils.errors.errorTypes.report, utils.errors.errorCodes.missingFields)
            routeUtils.handleAPIError(req, res, err, err)
            return
        }
        helpers.freshdesk.postTicket(email, subject, req.body.description, req.adata['$os'], req.adata['$os_version'], function(err, resp){
            if (err) {
                routeUtils.handleAPIError(req, res, err, err)
            } else {
                routeUtils.handleAPISuccess(req, res, resp)
            }
        })
    }
}

function resolveReport(req,res){
    service.reportService.resolveReport(req.body, function(err, report) {
        if (err) {
            routeUtils.handleAPIError(req, res, err, err)
        } else {
            routeUtils.handleAPISuccess(req, res, report)
        }
    })
}

function listReport(req,res){
    service.reportService.listReport(req.param("status"), function(err, reportList) {
        if (err) {
            routeUtils.handleAPIError(req, res, err, err)
        } else {
            routeUtils.handleAPISuccess(req, res, reportList)
        }
    })
}

routeUtils.rPost(router, '/create', 'createReport', createReport)
routeUtils.rPost(router, '/resolve', 'resolveReport', resolveReport)
routeUtils.rGet(router, '/list', 'listReport', listReport)
module.exports = router