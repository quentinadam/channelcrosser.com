const config = require("../config");
const stripe = require("stripe")(config.stripe.secretKey);

module.exports = {
  process: function(donation) {
    return new Promise((resolve, reject) => {
      stripe.charges.create({
        amount: Math.round(donation.amount * 100),
        currency: "EUR",
        source: donation.token,
        description: "Donation " + donation.name + " (" + donation.email + ")",
        receipt_email: donation.email,
        metadata: {
          name: donation.name,
          email: donation.email
        }
      }, function(error, charge) {
        if (error) return reject(error);
        console.log(charge);
        resolve();
      });
    });
  }
}