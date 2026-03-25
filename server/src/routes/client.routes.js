const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const clientController = require('../controllers/client.controller');
const validate = require('../middleware/validate');
const {
  createClientValidation,
  updateClientValidation,
  bulkCreateValidation,
  getClientByIdValidation,
  deleteClientValidation
} = require('../validators/client.validator');

// All routes require authentication
router.use(auth);

// Clients CRUD routes
router.get('/', clientController.getAllClients);
router.get('/:id', ...getClientByIdValidation, validate, clientController.getClientById);
router.post('/', authorize('ADMIN', 'MANAGER'), ...createClientValidation, validate, clientController.createClient);
router.post('/bulk', authorize('ADMIN', 'MANAGER'), ...bulkCreateValidation, validate, clientController.bulkCreateClients);
router.put('/:id', authorize('ADMIN', 'MANAGER'), ...updateClientValidation, validate, clientController.updateClient);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), ...deleteClientValidation, validate, clientController.deleteClient);

module.exports = router;
