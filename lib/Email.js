"use strict";

const config = require("../config");
const AWS = require('aws-sdk');
AWS.config.update(config.aws);
const ses = new AWS.SES();

module.exports = {
  sendEmail: function(options) {
    let params = {
      Destination: {ToAddresses: options.to},
      Message: { Body: { }, Subject: {Data: options.subject} },
      Source: '"Keep Calm and Keep Crossing" <info@keepcalmandkeepcrossing.com>'
    };
    if (options.html) params.Message.Body.Html = {Data: options.html};
    if (options.text) params.Message.Body.Text = {Data: options.text};
    return new Promise((resolve, reject) => {
      ses.sendEmail(params, (error, data) => {
        if (error) return reject(error);
        resolve(data);
      });
    });
  },
  sendNewDonationEmail: function(donation) {
    let to = ["keepcalmandkeepcrossing@gmail.com"];
    let subject = "Donation of " + donation.amount + " EUR from " + donation.name;
    let text = "Donation of " + donation.amount + " EUR from " + donation.name + " (" + donation.email + ") via " + 
      {"wiretransfer": "wire transfer", "creditcard": "credit card"}[donation.payment];
    return this.sendEmail({to: to, subject: subject, text: text});
  },
  sendWireTransferConfirmationEmail: function(donation) {
    let to = [donation.email];
    let subject;
    let lines;
    if (donation.language == "fr") {
      subject = "Votre donation pour Keep Calm and Keep Crossing";
      lines = [
        "Cher ami,",
        "",
        "Les amis de la Pouponnière et nous-mêmes vous remercions pour votre générosité !",
        "Si vous n’avez pas encore effectué le virement, nous vous rappelons les coordonnées bancaires :",
        "",
        "IBAN : BE20 0013 7648 4156",
        "BIC : GEBABEBB",
        "",
        "Nous restons à votre disposition en cas de besoin.",
        "",
        "De tout notre coeur, MERCI !",
        "",
        "Keep Calm and Keep Crossing",
        "+32 472 666 775",
        "www.facebook.com/channelcrosser",
        "www.channelcrosser.com/fr"
      ];
    } else {
      subject = "Your donation for Keep Calm and Keep Crossing";
      lines = [
        "Dear friend,",
        "",
        "The staff of la Pouponnière and our team thank you for your generous donation!",
        "If you haven't completed the bank transfer yet, please find below the bank details :",
        "",
        "IBAN : BE20 0013 7648 4156",
        "BIC : GEBABEBB",
        "",
        "Please do not hesitate to contact us in case of any problems.",
        "",
        "Thank you very much,",
        "",
        "Keep Calm and Keep Crossing",
        "+32 472 666 775",
        "www.facebook.com/channelcrosser",
        "www.channelcrosser.com/en"
      ];
    }
    let text = lines.join("\n");
    let html = "<!DOCTYPE html><html><head></head><body><p>" + lines.join("<br>") + "</p></body></html>";
    return this.sendEmail({to: to, subject: subject, text: text, html: html});
  },
}
