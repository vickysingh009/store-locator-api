const express = require('express');
const validate = require('../middleware/validate');
const { createStoreSchema, storeIdSchema, updateStoreSchema } = require('../validators/store.validator');
const { createStore, getStores, getStoreById, updateStore, deleteStore } = require('../controllers/store.controller');

const router = express.Router();

router.post('/', validate(createStoreSchema), createStore);
router.get('/', getStores);
router.get('/:id', validate(storeIdSchema), getStoreById);
router.put('/:id', validate(updateStoreSchema), updateStore);
router.delete('/:id', validate(storeIdSchema), deleteStore);

module.exports = router;
