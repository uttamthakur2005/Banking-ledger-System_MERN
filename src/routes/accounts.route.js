const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const accountController = require('../controllers/account.controller')


const router = express.Router()


/**
 * - POST /api/accounts/
 * - Create a new account
 * - protected Route
 */
router.post('/', authMiddleware.authMiddleware, accountController.createAccount)


/**
 * - GET /api/accounts/
 * - Get all accounts of thr logged-in user
 * - protected Route
 */
router.get('/', authMiddleware.authMiddleware, accountController.getUserAccounts)


/**
 * - GET /api/accounts/balance:account:id
 */
router.get('/balance/:accountId', authMiddleware.authMiddleware, accountController.getAccountBalance)



module.exports = router