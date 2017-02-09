var config = require("config");
var utils = require('../utils');

var freshdeskAPI = require('node-freshdesk');
var API_KEY = utils.config.freshdeskApiKey
var freshdesk = new freshdeskAPI(
  'https://crossroadsapp.freshdesk.com',
  API_KEY);

function postTicket(email, subject, description, callback){
  var ticket = {
    'helpdesk_ticket': {
      'description':description,
      'subject': subject,
      'email': email,
      "custom_field": {
        "game_389511": "Overwatch"
      },
    }
  };
  freshdesk.postTicket(
    ticket,
    function(err, res, body) {
      if (err){
        utils.l.e('Freshdesk postTicket err: ', err);
        return callback(err)
      }
      else {
        utils.l.i('Freshdesk postTicket success response: ', body);
        return callback(null, body)
      }
    }
  );
}


module.exports = {
  postTicket: postTicket
}

