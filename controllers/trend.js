const { validationResult } = require('express-validator')
const Histories = require('../models/histories');
const Data = require('../models/data');


exports.fetchStat = async (req, res, next) => {
    try {
        const [allData] = await Histories.fetchStat();
        res.status(200).json(allData)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
    }
}

// exports.fetchStatDetail = async (req, res, next) => {
//     try {
//         const [bounds] = await Data.fetchBounds();
//         res.status(200).json(bounds)
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//     }
// }