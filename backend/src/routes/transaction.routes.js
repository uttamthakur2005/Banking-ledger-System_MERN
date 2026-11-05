const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const transactionController = require('../controllers/transaction.controller')


const transactionRouter = express.Router()


// Create a New Transaction POST /api/transaction
transactionRouter.post('/', authMiddleware.authMiddleware, transactionController.createTransaction)

// Create initial funds transaction from system user POST /api/transactions/system/initial-funds
transactionRouter.post('/system/initial-funds', authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)


module.exports = transactionRouter