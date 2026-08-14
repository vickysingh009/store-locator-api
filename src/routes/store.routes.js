const express = require('express');
const validate = require('../middleware/validate');
const { createStoreSchema, storeIdSchema, updateStoreSchema, nearbyStoreSchema } = require('../validators/store.validator');
const { createStore, getStores, getStoreById, updateStore, deleteStore, getNearbyStores } = require('../controllers/store.controller');

const router = express.Router();

router.post('/', validate(createStoreSchema), createStore);
router.get('/', getStores);
router.get('/nearby', validate(nearbyStoreSchema), getNearbyStores);
router.get('/:id', validate(storeIdSchema), getStoreById);
router.put('/:id', validate(updateStoreSchema), updateStore);
router.delete('/:id', validate(storeIdSchema), deleteStore);

module.exports = router;
