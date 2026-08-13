const express = require('express');
const validate = require('../middleware/validate');
const { createStoreSchema, storeIdSchema } = require('../validators/store.validator');
const { createStore, getStores, getStoreById } = require('../controllers/store.controller');

const router = express.Router();

router.post('/', validate(createStoreSchema), createStore);
router.get('/', getStores);
router.get('/:id', validate(storeIdSchema), getStoreById);

module.exports = router;
