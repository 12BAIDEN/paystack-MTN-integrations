const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
require('dotenv').config(); 
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/initialize', (req, res) => {
  const { email, amount, phone, caseDescription, reference } = req.body;

  // Ensure all required fields are provided
  if (!email || !amount || !phone || !caseDescription || !reference) {
    return res.status(400).json({ error: 'All fields must be filled out' });
  }

  paystack.transaction.initialize({
    email: email,
    amount: amount * 100, // Amount in Pesewas (GHS)
    currency: 'GHS', // Specify Ghana Cedis
    mobile_money: {
      phone: phone, // Customer's phone number
      provider: 'mtn'
    },
    reference: reference, // Use the custom reference provided by the user
    metadata: {
      custom_fields: [
        {
          display_name: "Mobile Number",
          variable_name: "mobile_number",
          value: phone
        },
        {
          display_name: "Case Description",
          variable_name: "case_description",
          value: caseDescription // Store the case description here
        }
      ]
    }
  })
  .then((body) => {
    return res.json(body);
  })
  .catch((error) => {
    console.error('Error initializing transaction:', error);
    return res.status(500).json({ error: 'Transaction initialization failed', details: error });
  });
});

// Verify transaction and log metadata
app.get('/verify/:reference', (req, res) => {
  const reference = req.params.reference;

  paystack.transaction.verify(reference)
    .then((body) => {
      console.log('Transaction Metadata:', body.data.metadata); // Log metadata to verify it
      return res.json(body);
    })
    .catch((error) => {
      console.error('Error verifying transaction:', error);
      return res.status(500).json({ error: 'Transaction verification failed', details: error });
    });
});

// Webhook endpoint to capture Paystack events
app.post('/webhook', (req, res) => {
  const event = req.body;
  console.log('Webhook event received:', event.data.metadata); // Log metadata to ensure it's captured
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
