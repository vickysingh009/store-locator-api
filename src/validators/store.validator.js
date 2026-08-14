const { z } = require('zod');

const storeBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  address: z.object({
    street: z.string().trim().min(1, 'Street is required').max(200, 'Street must be at most 200 characters'),
    city: z.string().trim().min(1, 'City is required').max(100, 'City must be at most 100 characters'),
    state: z.string().trim()
      .regex(/^[A-Za-z]{2}$/, 'State must be exactly 2 letters (e.g. NY, CA)')
      .transform((val) => val.toUpperCase()),
    zipCode: z.string().trim()
      .regex(/^\d{5}$/, 'ZIP code must contain exactly 5 digits')
  }).strict(),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.tuple([
      z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
      z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90')
    ])
  }).strict()
}).strict();

const createStoreSchema = z.object({
  body: storeBodySchema
});

const storeIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid store ID format')
  })
});

const updateStoreSchema = z.object({
  params: storeIdSchema.shape.params,
  body: storeBodySchema
});

module.exports = { createStoreSchema, storeIdSchema, updateStoreSchema };
