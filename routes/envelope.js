const express = require('express');
const router = express.Router();

const budgetEnvelopes = [];
let id = 0;

/* Middleware to take the envelopeId from a request and check if an object with that if exists in budgetEnvelopes array*/
router.param('envelopeId', (req, res, next, id) => {
  if (isNaN(id)) {
    res.status(400).send('Please provide a whole number for the envelopeId')
    next();
  }
  const envelopeId = Number(id);
  const envelopeIndex = budgetEnvelopes.findIndex(envelope => envelope.id === envelopeId);
  if (envelopeIndex === -1) {
    res.status(404).send('Envelope not found');
  } else {
    req.envelopeIndex = envelopeIndex;
    next();
  }
});

/* Middleware to take the toEnvelopeId from a request and check if an object with that if exists in budgetEnvelopes array*/
router.param('toEnvelopeId', (req, res, next, id) => {
  if (isNaN(id)) {
    res.status(400).send('Please provide a whole number for the toEnvelopeId')
    next();
  }
  const toEnvelopeId = Number(id);
  const toEnvelopeIndex = budgetEnvelopes.findIndex(envelope => envelope.id === toEnvelopeId);
  if (toEnvelopeIndex === -1) {
    res.status(404).send('Envelope not found');
  } else {
    req.toEnvelopeIndex = toEnvelopeIndex;
    next();
  }
});

/* Middleware that checks if the subtractAmount parameter is a number and attaches is as a property to the req object */
router.param('subtractAmount', (req, res, next, id) => {
  if (isNaN(id)) {
    res.status(400).send('Please provide a whole number')
  } else {
    req.subtractAmount = Number(id);
  }
  next();
})

/* Middleware that checks the body of a http request to ensure it has the correct properties before posting to
budgetEnvelopes array */
function envelopeValidation(req, res, next) {
  console.log('Checking body for valid envelope construction');
  const requiredProperties = ['category', 'budget'];
  const providedProperties = Object.keys(req.body);

  // Check if all required properties are present
  const missingProperties = requiredProperties.filter(property => !providedProperties.includes(property));
  if (missingProperties.length > 0) {
    return res.status(400).json({ error: `Missing properties: ${missingProperties.join(', ')}` });
  }

  // Check for additional properties
  const extraProperties = providedProperties.filter(prop => !requiredProperties.includes(prop));
  if (extraProperties.length > 0) {
    return res.status(400).json({ error: `Unexpected properties: ${extraProperties.join(', ')}` });
  }

  next();
}

/* GET all budget envelops */
router.get('/', (req, res) => {
  res.status(200).send(budgetEnvelopes);
});

/* POST a new budget envelope */
router.post('/', envelopeValidation, (req, res) => {
  id += 1;
  req.body.id = id
  budgetEnvelopes.push(req.body);
  res.status(201).send(budgetEnvelopes);
});

/* GET a specific budget envelope by its id */
router.get('/:envelopeId', (req, res) => {
  res.status(200).send(budgetEnvelopes[req.envelopeIndex]);
});

/* PUT request to update a budget envelope */
router.put('/:envelopeId/:subtractAmount', (req, res) => {
  const newBudgetValue = budgetEnvelopes[req.envelopeIndex]['budget'] - req.subtractAmount;
  if (newBudgetValue < 0 ) {
    res.status(400).send('Not enough money in the budget')
  } else {
    budgetEnvelopes[req.envelopeIndex]['budget'] = newBudgetValue;
    res.status(200).send(budgetEnvelopes[req.envelopeIndex]);
  }
});

/* DELETE a specific budget envelope */
router.delete('/:envelopeId', (req, res) => {
  budgetEnvelopes.splice(req.envelopeIndex, 1);
  res.status(204).send();
});

/* POST to take transfer from one budget envelope to another */
router.post('/transfer/:envelopeId/:toEnvelopeId/:subtractAmount',
    (req, res) => {
      const subtractingBudgetValue = budgetEnvelopes[req.envelopeIndex]['budget'] - req.subtractAmount;
      const addingBudgetValue = budgetEnvelopes[req.toEnvelopeIndex]['budget'] + req.subtractAmount;
      if (subtractingBudgetValue < 0 ) {
        res.status(400).send('Not enough money in the budget to transfer')
      } else {
        budgetEnvelopes[req.envelopeIndex]['budget'] = subtractingBudgetValue;
        budgetEnvelopes[req.toEnvelopeIndex]['budget'] = addingBudgetValue;
        res.status(201).send('transfer completed.');
      }
    });

module.exports = router;
