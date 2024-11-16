const { validationResult } = require('express-validator');
const data = require('../models/data');

exports.fetchAll = async (req, res, next) => {
    try {
        const [allData] = await data.fetchAll();
        res.status(200).json(allData)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
    }
};

exports.updateExpectedData = async (req, res, next) => {
    try {
      const [putResponse] = await data.updateExpectedValue(req.body.tag, req.body.expectedValue);
      res.status(200).json(putResponse);
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
};

// exports.updateRealtimeValue = async (req, res, next) => {
//   try {
//     const [updateRealtimeValue] = await Data.updateRealtimeValue(req.body.tag, req.body,realtimeValue, req.body.status);
//     res.status(200).json(updateRealtimeValue);
//   } catch (error) {
//     if (!error.statusCode) {
//       error.statusCode = 500
//     }
//     next(error)
//   }
// };

