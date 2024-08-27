// Express Server Code
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
require('dotenv').config(); 
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/initialize', (req, res) => {
  const { email, amount, phone, caseDescription } = req.body;

  paystack.transaction.initialize({
    email: email,
    amount: amount * 100, // Amount in Pesewas (GHS)
    currency: 'GHS', // Specify Ghana Cedis
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

// Verify transaction
app.get('/verify/:reference', (req, res) => {
  const reference = req.params.reference;

  paystack.transaction.verify(reference)
    .then((body) => {
      return res.json(body);
    })
    .catch((error) => {
      console.error('Error verifying transaction:', error);
      return res.status(500).json({ error: 'Transaction verification failed', details: error });
    });
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const event = req.body;
  console.log('Webhook event received:', event);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Client-Side JavaScript (Form Submission)
function submitDonationForm() {
  const email = document.getElementById('email').value;
  const amount = document.querySelector('input[name="amount"]:checked')?.value || document.getElementById('custom-amount').value;
  const phone = document.getElementById('phone').value;
  const caseDescription = document.getElementById('case-description').value;

  if (!email || !amount || !phone || !caseDescription) {
    console.error('All fields must be filled out.');
    return;
  }

  fetch('/initialize', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, amount, phone, caseDescription }),
  })
  .then(response => response.json())
  .then(data => {
      console.log('Success:', data);
      // Handle the response
  })
  .catch((error) => {
      console.error('Error:', error);
      // Handle the error
  });
}
