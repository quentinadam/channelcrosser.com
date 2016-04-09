"use strict";

const util = require("util");
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const moment = require("moment");
const co = require("co");
const Database = require("./lib/Database");
const Email = require("./lib/Email");
const Payment = require("./lib/Payment");

console.log = ((log) => function() {
  let value = util.format.apply(util, arguments);
  if (value.length > 0) {
    log(moment().format("DD/MM hh:mm:ss"), value);
  } else {
    log(value);
  }
})(console.log);

let app = express();
let database = new Database("database.sqlite");

app.use(morgan('short'));

app.use(function (req, res, next) {
  if (req.hostname === "keepcalmandkeepcrossing.com") {
    return res.redirect("https://www.keepcalmandkeepcrossing.com" + req.originalUrl);
  }
  if (req.hostname === "channelcrosser.com") {
    return res.redirect("https://www.channelcrosser.com" + req.originalUrl);
  }
  var visitor = req.headers["cf-visitor"];
  if (visitor) {
    visitor = JSON.parse(visitor);
    if (visitor.scheme === "http" && req.hostname === "www.keepcalmandkeepcrossing.com") {
      return res.redirect("https://www.keepcalmandkeepcrossing.com" + req.originalUrl);
    }
    if (visitor.scheme === "http" && req.hostname === "www.channelcrosser.com") {
      return res.redirect("https://www.channelcrosser.com" + req.originalUrl);
    }
  }
  next();
});

app.use(express.static("public", {etag: false, maxAge: 3600*1000}));
app.use(bodyParser.urlencoded({extended: false}));

app.get("/", function (req, res) {
  var language = req.acceptsLanguages("en", "fr");
  if (!language) language = "fr";
  res.redirect("/" + language + "/");
});

app.post("/donate", function (req, res) {
  var donation = {};
  donation.name = req.body.name;
  donation.type = req.body.type;
  donation.anonymous = parseInt(req.body.anonymous);
  donation.email = req.body.email;
  donation.amount = parseInt(req.body.amount);
  donation.payment = req.body.payment;
  donation.language = req.body.language;
  donation.timestamp = new Date();
  co(function*() {
    try {
      if (donation.payment == "creditcard") {
        donation.token = req.body.token;
        yield Payment.process(donation);
      }
      let donations = yield database.insertDonation(donation);
      Email.sendNewDonationEmail(donation);
      if (donation.payment == "wiretransfer") Email.sendWireTransferConfirmationEmail(donation);
      res.send({error: null, donations: donations});
    } catch (error) {
      console.log(error.stack);
      if (error.type === "StripeCardError") {
        res.send({error: {"name": "StripeCardError", "code": error.code}});
      } else {
        res.send({error: {"name": "InternalError"}});
      }
    }
  });
});

app.get("/donations", function (req, res) {
  database.selectDonations().then((donations) => {
    res.send(donations);
  }, (error) => {
    console.log(error);
    res.send([]);
  });
});

let server = app.listen(80, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log("Web app listening at http://%s:%s", host, port);
});