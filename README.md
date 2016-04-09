  Crowdfunding website channelcrosser.com

## Installation

  Install the npm dependencies
  
```
npm install
``` 

  Copy default-config.json to config.json and fill the AWS (for SES email sending) and Stripe (for credit card payments) credentials in.
  
```
cp default-config.json config.json
```

  (Optional) copy the upstart service configuration to /etc/init/.
  
```
cp service.conf /etc/init/
```

## Run

```
node index.js
```