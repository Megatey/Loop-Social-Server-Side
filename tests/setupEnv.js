process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-validation';
process.env.JWT_LIFETIME = '1h';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/loop-social-test';
process.env.CORS_ORIGIN = '*';
