const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Store = require('../src/models/store.model');

const testUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/store_locator_test';

beforeAll(async () => {
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
});

afterAll(async () => {
  await Store.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Store.deleteMany({});
});

const validStore = {
  name: 'Empire State Store',
  address: {
    street: '350 Fifth Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10118'
  },
  location: {
    type: 'Point',
    coordinates: [-73.9857, 40.7484]
  }
};

// --- Store Creation ---

describe('POST /api/stores', () => {
  it('should create a store with valid data', async () => {
    const res = await request(app).post('/api/stores').send(validStore);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Store created successfully');
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
    expect(res.body.data.name).toBe('Empire State Store');
    expect(res.body.data.address.state).toBe('NY');

    const dbStore = await Store.findById(res.body.data._id);
    expect(dbStore).not.toBeNull();
  });

  it('should normalize lowercase state to uppercase', async () => {
    const store = { ...validStore, address: { ...validStore.address, state: 'ny' } };
    const res = await request(app).post('/api/stores').send(store);

    expect(res.status).toBe(201);
    expect(res.body.data.address.state).toBe('NY');
  });

  it('should reject missing name', async () => {
    const { name, ...noName } = validStore;
    const res = await request(app).post('/api/stores').send(noName);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    const count = await Store.countDocuments();
    expect(count).toBe(0);
  });

  it('should reject invalid ZIP code', async () => {
    const store = { ...validStore, address: { ...validStore.address, zipCode: '123' } };
    const res = await request(app).post('/api/stores').send(store);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid state', async () => {
    const store = { ...validStore, address: { ...validStore.address, state: 'XYZ' } };
    const res = await request(app).post('/api/stores').send(store);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid coordinate count', async () => {
    const store = { ...validStore, location: { type: 'Point', coordinates: [-73.9, 40.7, 100] } };
    const res = await request(app).post('/api/stores').send(store);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject unknown fields', async () => {
    const store = { ...validStore, unknownField: 'test' };
    const res = await request(app).post('/api/stores').send(store);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// --- Store Retrieval ---

describe('GET /api/stores', () => {
  it('should return all stores', async () => {
    await Store.create(validStore);

    const res = await request(app).get('/api/stores');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(res.body.data.length);
  });

  it('should return empty array when no stores exist', async () => {
    const res = await request(app).get('/api/stores');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/stores/:id', () => {
  it('should return a store by id', async () => {
    const store = await Store.create(validStore);

    const res = await request(app).get(`/api/stores/${store._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Empire State Store');
  });

  it('should return 404 for nonexistent id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/stores/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Store not found');
  });

  it('should return 400 for invalid id format', async () => {
    const res = await request(app).get('/api/stores/invalid-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// --- Store Update ---

describe('PUT /api/stores/:id', () => {
  it('should update a store', async () => {
    const store = await Store.create(validStore);
    const originalCreatedAt = store.createdAt.toISOString();

    await new Promise((r) => setTimeout(r, 50));

    const updateData = {
      name: 'Updated Store',
      address: { street: '1 Broadway', city: 'Boston', state: 'ma', zipCode: '02108' },
      location: { type: 'Point', coordinates: [-71.0589, 42.3601] }
    };

    const res = await request(app).put(`/api/stores/${store._id}`).send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Store updated successfully');
    expect(res.body.data.name).toBe('Updated Store');
    expect(res.body.data.address.state).toBe('MA');
    expect(res.body.data._id.toString()).toBe(store._id.toString());
    expect(res.body.data.createdAt).toBe(originalCreatedAt);
    expect(res.body.data.updatedAt).not.toBe(originalCreatedAt);
  });

  it('should return 404 for nonexistent id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).put(`/api/stores/${fakeId}`).send(validStore);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Store not found');
  });

  it('should return 400 for invalid update body', async () => {
    const store = await Store.create(validStore);

    const res = await request(app)
      .put(`/api/stores/${store._id}`)
      .send({ name: 'Only Name' });

    expect(res.status).toBe(400);

    const unchanged = await Store.findById(store._id);
    expect(unchanged.name).toBe('Empire State Store');
  });
});

// --- Store Deletion ---

describe('DELETE /api/stores/:id', () => {
  it('should delete a store', async () => {
    const store = await Store.create(validStore);

    const res = await request(app).delete(`/api/stores/${store._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Store deleted successfully');

    const deleted = await Store.findById(store._id);
    expect(deleted).toBeNull();
  });

  it('should return 404 when deleting again', async () => {
    const store = await Store.create(validStore);
    await request(app).delete(`/api/stores/${store._id}`);

    const res = await request(app).delete(`/api/stores/${store._id}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Store not found');
  });

  it('should return 400 for invalid id format', async () => {
    const res = await request(app).delete('/api/stores/bad-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// --- Nearby Search ---

describe('GET /api/stores/nearby', () => {
  beforeEach(async () => {
    await Store.create([
      {
        name: 'Midtown Store',
        address: { street: '1 Times Sq', city: 'New York', state: 'NY', zipCode: '10036' },
        location: { type: 'Point', coordinates: [-73.9855, 40.7580] }
      },
      {
        name: 'Brooklyn Store',
        address: { street: '1 Atlantic Ave', city: 'Brooklyn', state: 'NY', zipCode: '11201' },
        location: { type: 'Point', coordinates: [-73.9762, 40.6862] }
      },
      {
        name: 'LA Store',
        address: { street: '1 Hollywood Blvd', city: 'Los Angeles', state: 'CA', zipCode: '90028' },
        location: { type: 'Point', coordinates: [-118.3287, 34.1016] }
      }
    ]);
  });

  it('should return nearby stores with distance', async () => {
    const res = await request(app).get('/api/stores/nearby?zipcode=10001&radius=10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(res.body.data.length);
    expect(res.body.count).toBeGreaterThanOrEqual(1);

    for (const store of res.body.data) {
      expect(typeof store.distance).toBe('number');
      expect(store.distance).toBeLessThanOrEqual(10);
    }
  });

  it('should return results ordered by proximity', async () => {
    const res = await request(app).get('/api/stores/nearby?zipcode=10001&radius=50');

    expect(res.status).toBe(200);
    if (res.body.data.length > 1) {
      for (let i = 1; i < res.body.data.length; i++) {
        expect(res.body.data[i].distance).toBeGreaterThanOrEqual(res.body.data[i - 1].distance);
      }
    }
  });

  it('should return empty array when no stores are within radius', async () => {
    const res = await request(app).get('/api/stores/nearby?zipcode=99501&radius=1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toEqual([]);
  });
});

// --- Nearby Validation ---

describe('GET /api/stores/nearby - validation', () => {
  it('should return 400 for missing zipcode', async () => {
    const res = await request(app).get('/api/stores/nearby?radius=10');
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid zipcode', async () => {
    const res = await request(app).get('/api/stores/nearby?zipcode=ABCDE&radius=10');
    expect(res.status).toBe(400);
  });

  it('should return 400 for short zipcode', async () => {
    const res = await request(app).get('/api/stores/nearby?zipcode=1000&radius=10');
    expect(res.status).toBe(400);
  });

  it('should return 400 for missing radius', async () => {
    const res = await request(app).get('/api/stores/nearby?zipcode=10001');
    expect(res.status).toBe(400);
  });

  it('should return 400 for zero radius', async () => {
    const res = await request(app).get('/api/stores/nearby?zipcode=10001&radius=0');
    expect(res.status).toBe(400);
  });

  it('should return 400 for negative radius', async () => {
    const res = await request(app).get('/api/stores/nearby?zipcode=10001&radius=-5');
    expect(res.status).toBe(400);
  });

  it('should return 400 for non-numeric radius', async () => {
    const res = await request(app).get('/api/stores/nearby?zipcode=10001&radius=abc');
    expect(res.status).toBe(400);
  });
});

// --- Error Handling ---

describe('Error handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 for health endpoint', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Store Locator API is running');
  });
});
