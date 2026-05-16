const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const services = require('../../src/applicationServices');
const userRepository = require('../../src/infrastructure/database/repositories/userRepository');

jest.mock('../../src/infrastructure/database/repositories/userRepository');
jest.mock('../../src/infrastructure/database/repositories/postRepository');
jest.mock('../../src/infrastructure/jobs/jobQueue', () => ({
  enqueue: jest.fn().mockResolvedValue(undefined),
}));

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects duplicate registration email', async () => {
    userRepository.findByEmail.mockResolvedValue({ _id: 'existing' });

    await expect(
      services.registerUser({ username: 'benjamin', email: 'benjamin@example.com', password: 'password123' }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_USED' });
  });

  it('returns token for valid credentials', async () => {
    const password = await bcrypt.hash('password123', 10);
    userRepository.findByEmail.mockResolvedValue({
      username: 'benjamin',
      password,
      comparePassword(candidate) {
        return bcrypt.compare(candidate, this.password);
      },
      createJwt() {
        return jwt.sign({ userId: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET);
      },
    });

    const result = await services.loginUser('benjamin@example.com', 'password123');

    expect(result.token).toEqual(expect.any(String));
  });
});
