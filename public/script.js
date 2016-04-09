$(function() {
  
  function pad(text, length) {
    text = text.toString();
    while (text.length < length) {
      text = "0" + text;
    }
    return text;
  }
  
  function format(number) {
    if (number < 1000) {
      return number.toString();
    } else {
      return Math.floor(number/1000) + " " + pad(number - Math.floor(number/1000)*1000, 3);
    }
  }
  
  function updateDonations(donations) {
    donations.sort(function (a, b) {
      return a.timestamp - b.timestamp;
    });
    
    var total = 0;
    
    var individuals = [];
    var companies = [];
    
    for (var i = 0; i < donations.length; i++) {
      var donation = donations[i];
      total = Math.round(total + donation.amount);
      if (donation.name) {
        if (donation.type == "individual") {
          individuals.push(donation.name);
        } else {
          companies.push(donation.name);
        }
      }
    }
    
    $("p.donations-individuals").hide();
    if (individuals.length > 0) {
      $("p.donations-individuals.some").show();
      $("p.donations-individuals.some span").text(individuals.join(", "));
    } else {
      $(".donations-individuals.none").show();
    }
    
    $("p.donations-companies").hide();
    if (companies.length > 0) {
      $("p.donations-companies.some").show();
      $("p.donations-companies.some span").text(companies.join(", "));
    } else {
      $("p.donations-companies.none").show();
    }
    
    $("span.donations").text(donations.length);
    $("span.total").text(donations.length);
    $("span.donations-label").hide();
    if (donations.length == 0) {
      $("span.donations-label.zero").show();
    } else if (donations.length == 1) {
      $("span.donations-label.one").show();
    } else {
      $("span.donations-label.many").show();
    }
    
    $("span.total").text(format(total));
    $("span.total-label").hide();
    if (total == 0) {
      $("span.total-label.zero").show();
    } else if (total == 1) {
      $("span.total-label.one").show();
    } else {
      $("span.total-label.many").show();
    }
    
    function interpolation(x) {
      return x < 1 ? 1 - Math.pow(1 - x, 2) : 1;
    }
    
    $("div.progress-bowl-inner").css("height", interpolation(total/20000)*180);
  }
  
  $.get("/donations").success(function(donations) {
    //donations.push({name: "Quentin Adam", amount: 100, type: "individual"});
    //donations.push({name: "Bruno Ronsmans", amount: 100, type: "individual"});
    updateDonations(donations);
  })
  
  $("input[name=payment]").change(function() {
    $(".wiretransfer").hide();
    $(".creditcard").hide();
    var payment = $("input[name=payment]:checked").val();
    $("." + payment).show();
  });
  
  $("input[name=type]").change(function() {
    $(".individual").hide();
    $(".company").hide();
    var type = $("input[name=type]:checked").val();
    $("." + type).show();
  });
  
  function updateAmount() {
    var amount = parseInt($("input[name=amount]").val());
    if (isNaN(amount)) amount = 0;
    $("span.amount").text(amount);
    return amount;
  }
  
  updateAmount();
  
  $("input[name=amount]").on("keyup change", function() {
    updateAmount();
  });
  
  function extractDigits(text) {
    var digits = "";
    for (var i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) >= 48 && text.charCodeAt(i) <= 57) digits += text.charAt(i);
    }
    return digits;
  }
  
  //Input restriction functions
  
  function restrictCardNumber(input) {
    input.keyup(function() {
      var value = input.val();
      var remaining = extractDigits(value).substr(0, 16);
      var result = "";
      while (remaining.length > 0) {
        var sub = remaining.substr(0, 4);
        if (result.length > 0) result += " ";
        result += sub;
        remaining = remaining.substr(4);
      }
      if (value != result && value != result + " ") {
        input.val(result);
      }
    });
  }
  
  function restrictNumber(input, length) {
    input.keyup(function() {
      var value = input.val();
      var result = extractDigits(value);
      if (length !== undefined) result = result.substr(0, length);
      if (value != result) {
        input.val(result);
      }
    });
  }
  
  //Validation functions
  
  $("input").keydown(function() {
    $(this).css("background-color", "white");
    $("p.error").hide();
  });
  
  function highlight(input) {
    input.css("background-color", "#FCC");
  }
  
  function validate(input, transformer, validator) {
    var value = input.val().trim();
    if (validator === undefined) {
      validator = transformer;
    } else {
      value = transformer(value);
    }
    if (!validator(value)) {
      highlight(input);
      throw new Error();
    }
    return value;
  }
  
  function validateName() {
    var type = $("input[name=type]:checked").val();
    if (type == "individual") {
      var firstName = validate($("input[name=firstName]"), function(value) {
        return value.length > 0;
      });
      var lastName = validate($("input[name=lastName]"), function(value) {
        return value.length > 0;
      });
      return firstName + " " + lastName;
    } else {
      return validate($("input[name=name]"), function(value) {
        return value.length > 0;
      });
    }
  }
  
  function validateEmail() {
    return validate($("input[name=email]"), function(value) {
      return value.toLowerCase();
    }, function(value) {
      return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(value);
    });
  }
  
  function validateAmount() {
    return validate($("input[name=amount]"), function(value) {
      return parseInt(value);
    }, function(value) {
      return !isNaN(value) && value > 0;
    });
  }
  
  function validateCardNumber() {
    return validate($("input[name=card-number]"), function(value) {
      return extractDigits(value).length == 16;
    });
  }
  
  function validateCardExpiryMonth() {
    return validate($("input[name=card-expiry-month]"), function(value) {
      if (extractDigits(value).length != 2) return false;
      value = parseInt(value);
      return value >= 1 && value <= 12;
    });
  }
  
  function validateCardExpiryYear() {
    return validate($("input[name=card-expiry-year]"), function(value) {
      if (extractDigits(value).length == 2) {
        value = 2000 + parseInt(value);
      } else if (extractDigits(value).length == 4) {
        value = parseInt(value);
      } else {
        return false;
      }
      return value >= 2015;
    });
  }
  
  function validateCardCVC() {
    return validate($("input[name=card-cvc]"), function(value) {
      return extractDigits(value).length == 3;
    });
  }
  
  restrictNumber($("input[name=amount]"));
  restrictCardNumber($("input[name=card-number]"));
  restrictNumber($("input[name=card-expiry-month]"), 2);
  restrictNumber($("input[name=card-expiry-year]"), 4);
  restrictNumber($("input[name=card-cvc]"), 3);
  
  function donate(parameters) {
    $.post("/donate", parameters, function(data) {
      if (data.error) {
        console.log(data.error);
        if (data.error.name == "StripeCardError") {
          processErrorCode(data.error.code);
        } else {
          $("p.error.other").show();
        }
      } else {
        $(".form").hide();
        $(".thanks").show();
        updateDonations(data.donations);
        if (parameters.payment == "creditcard") {
          $("#thank-creditcard").modal("show");
        } else {
          $("#thank-wiretransfer").modal("show");
        }
      }
    }).always(function() {
      enableUI();
    });
  }
  
  $("#redo").click(function() {
    $(".form").show();
    $(".thanks").hide();
    return false;
  })
  
  function disableUI() {
    $(".overlay").fadeIn();
  }
  
  function enableUI() {
    $(".overlay").fadeOut();
  }
  
  function getParameters() {
    var parameters = {};
    parameters.name = validateName();
    parameters.type = $("input[name=type]:checked").val();
    parameters.anonymous = $("input[name=anonymous]").prop('checked') ? 1 : 0;
    parameters.email = validateEmail();
    parameters.payment = $("input[name=payment]:checked").val();
    parameters.amount = validateAmount();
    parameters.language = language;
    return parameters;
  }
  
  function processErrorCode(code) {
    if (code == "incorrect_number") {
      //The card number is incorrect.
      highlight($("input[name=card-number]"));
      $("p.error.incorrect-number").show();
    } else if (code == "invalid_number") {
      //The card number is not a valid credit card number.
      highlight($("input[name=card-number]"));
      $("p.error.invalid-number").show();
    } else if (code == "invalid_expiry_month") {
      //The card's expiration month is invalid.
      highlight($("input[name=card-expiry-month]"));
      $("p.error.invalid-expiry-month").show();
    } else if (code == "invalid_expiry_year") {
      //The card's expiration year is invalid.
      highlight($("input[name=card-expiry-year]"));
      $("p.error.invalid-expiry-year").show();
    } else if (code == "expired_card") {
      //The card has expired.
      highlight($("input[name=card-expiry-month]"));
      highlight($("input[name=card-expiry-year]"));
      $("p.error.expired-card").show();
    } else if (code == "invalid_cvc") {
      //The card's security code is invalid.
      highlight($("input[name=card-cvc]"));
      $("p.error.invalid-cvc").show();
    } else if (code == "incorrect_cvc") {
      //The card's security code is incorrect.
      highlight($("input[name=card-cvc]"));
      $("p.error.incorrect-cvc").show();
    } else if (code == "incorrect_zip") {
      //The card's zip code failed validation.
      $("p.error.incorrect-zip").show();
    } else if (code == "card_declined") {
      //The card was declined.
      $("p.error.card-declined").show();
    } else if (code == "missing") {
      //There is no card on a customer that is being charged.
      $("p.error.other").show();
    } else if (code == "processing_error") {
      //An error occurred while processing the card.
      $("p.error.other").show();
    } else if (code == "rate_limit") {
      //An error occurred due to requests hitting the API too quickly. Please let us know if you're consistently running into this error.
      $("p.error.other").show();
    }
  }
  
  function confirmWireTransfer(callback) {
    $("#confirm-wiretransfer").modal("show");
    $("#confirm-wiretransfer button.confirm").off("click");
    $("#confirm-wiretransfer button.confirm").on("click", function() {
      $("#confirm-wiretransfer").modal("hide");
      callback();
    });
  };
  
  $("button#pay-wiretransfer").on("click", function() {
    try {
      var parameters = getParameters();
      confirmWireTransfer(function() {
        disableUI();
        donate(parameters);
      });
    } catch (error) {
      enableUI();
    }
  });
  
  Stripe.setPublishableKey("pk_live_YUzp6BeHnaiK9NsV9OWSTpOA");
  
  $("button#pay-creditcard").click(function() {
    try {
      var parameters = getParameters();
      var card = {};
      card.number = validateCardNumber();
      card["exp_month"] = validateCardExpiryMonth();
      card["exp_year"] = validateCardExpiryYear();
      card.cvc = validateCardCVC();
      disableUI();
      Stripe.card.createToken(card, function(status, response) {
        if (response.error) {
          console.log(response.error);
          processErrorCode(response.error.code);
          enableUI();
        } else {
          parameters.token = response.id;
          donate(parameters);
        }
      });
    } catch (error) {
      enableUI();
    }
  });
  
});