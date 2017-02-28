var AWS = require('aws-sdk');
var utils = require('../utils')
var ejs = require('ejs')
var fs = require('fs')
var path = require('path')

AWS.config.update(utils.config.awsSESKey)
var ses = new AWS.SES()

function sendEmailText(to, from, subject, body, callback) {

  ses.sendEmail({
    Source: from,
    Destination: {ToAddresses: to},
    Message: {
      Subject: {
        Data: subject
      },
      Body: {
        Text: {
          Data: body
        }
      }
    }
  },
    function(err, response) {
      if(err) {
        utils.l.s("Unable to send email", err)
        return callback({error: "Something went wrong. Please try again later"}, null)
      } else {
        utils.l.d('Email sent:', response)
        return callback(err, response)
      }
  })
}

function sendEmailHtml(to, from, subject, html, callback) {

  ses.sendEmail({
      Source: from,
      Destination: {ToAddresses: to},
      Message: {
        Subject: {
          Data: subject
        },
        Body: {
          Html: {
            Data: html
          }
        }
      }
    },
    function(err, response) {
      if(err) {
        utils.l.s("Unable to send email", err)
        return callback({error: "Something went wrong. Please try again later"}, null)
      } else {
        utils.l.d('Email sent:', response)
        return callback(err, response)
      }
    })
}

function sendEmailForResetPassword(to, from, resetLink, subject, text, callback){
  //sendEmailText(to, from, subject, text, callback)
  console.log("link", resetLink)
  var htmlData = fs.readFileSync(path.normalize(__dirname + '/../views/account/resetPasswordEmail.ejs'),'utf8')

  var ejs_string = htmlData,
    template = ejs.compile(ejs_string),
    html = template({link: resetLink});
  sendEmailHtml(to, from, subject, html, callback)
}

function sendEmailForWelcome(to, from, subject, callback){
  var text = "Crossroads is a platform for connecting players to achieve maximum fun. It's completely free, lets you schedule your teams in advance, and automatically converts all time zones. If you have any suggestions or feedback to improve your experience, we welcome your input at research@crossroadsapp.co!"
  sendEmailText(to, from, subject, text, callback)

  //var htmlData = fs.readFileSync(path.normalize(__dirname + '/../views/account/welcomeEmail.ejs'),'utf8')
  //
  //var ejs_string = htmlData,
  //  template = ejs.compile(ejs_string),
  //  html = template({});
  //sendEmailHtml([to], from, subject, html, callback)
}

module.exports = {
  sendEmailText: sendEmailText,
  sendEmailHtml: sendEmailHtml,
  sendEmailForResetPassword: sendEmailForResetPassword,
  sendEmailForWelcome: sendEmailForWelcome
}