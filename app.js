const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
require('dotenv').config(); 
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);


const app = express();
app.use(bodyParser.json());

app.use(cors());


app.post('/initialize', (req, res) => {
  const { email, amount, phone, reference} = req.body;

  paystack.transaction.initialize({
    email: email,
    amount: amount * 100, // Amount in Pesewas (GHS)
    currency: 'GHS', // Specify Ghana Cedis
    reference: reference, // Custom reference provided by the user
    mobile_money: {
      phone: phone, // Customer's phone number
      provider: 'mtn'
    },
    metadata: {
      custom_fields: [
        {
          display_name: "Mobile Number",
          variable_name: "mobile_number",
          value: phone
        },
        {
          display_name: "Reference",
          variable_name: "reference",
          value: reference// Store the case description here
        }
      ]
    }
  }).then((body) => {
    res.json(body);
  }).catch((error) => {
    res.status(500).json(error);
  });
});

// Verify transaction
app.get('/verify/:reference', (req, res) => {
  const reference = req.params.reference;

  paystack.transaction.verify(reference)
    .then((body) => {
      res.json(body);
    }).catch((error) => {
      res.status(500).json(error);
    });
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const event = req.body;
  console.log(event);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});