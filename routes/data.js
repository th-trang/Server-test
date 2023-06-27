const express = require('express')
const { body } = require('express-validator');
const router = express.Router()
const dataController = require('../controllers/data')

router.get('/', dataController.fetchAll)

router.put(
  '/',
  [
    body('tag').trim().not().isEmpty(),
    body('name').trim().isLength({ max: 15 }),
    body('expected value').trim().isLength({ min: 7 }),
    body('realtime value').trim().isLength({ min: 7 }),
    body('unit').trim().isLength({ min: 7 }),
    body('design P').trim().isLength({ min: 7 })
  ],

  dataController.editData,
);

module.exports = router;