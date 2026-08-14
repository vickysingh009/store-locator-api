const Store = require('../models/store.model');
const AppError = require('../utils/app-error');

const createStore = async (req, res) => {
  const store = await Store.create(req.validated.body);
  res.status(201).json({
    success: true,
    message: 'Store created successfully',
    data: store
  });
};

const getStores = async (req, res) => {
  const stores = await Store.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores
  });
};

const getStoreById = async (req, res) => {
  const store = await Store.findById(req.validated.params.id);
  if (!store) {
    throw new AppError('Store not found', 404);
  }
  res.status(200).json({
    success: true,
    data: store
  });
};

const updateStore = async (req, res) => {
  const store = await Store.findByIdAndUpdate(
    req.validated.params.id,
    req.validated.body,
    { new: true, runValidators: true }
  );
  if (!store) {
    throw new AppError('Store not found', 404);
  }
  res.status(200).json({
    success: true,
    message: 'Store updated successfully',
    data: store
  });
};

const deleteStore = async (req, res) => {
  const store = await Store.findByIdAndDelete(req.validated.params.id);
  if (!store) {
    throw new AppError('Store not found', 404);
  }
  res.status(200).json({
    success: true,
    message: 'Store deleted successfully'
  });
};

module.exports = { createStore, getStores, getStoreById, updateStore, deleteStore };
