process.env.PORT = process.env.PORT || '3001';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wise_comunidad_test';

// If using a production DB, don't overwrite. For tests we default to a local test DB.
