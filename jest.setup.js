import '@testing-library/jest-dom'

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ENPHASE_CLIENT_ID = 'test-client-id'
process.env.ENPHASE_CLIENT_SECRET = 'test-client-secret'
process.env.ENPHASE_REDIRECT_URI = 'http://localhost:3000/api/connections/enphase/callback'
