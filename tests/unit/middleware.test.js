const { authorize } = require('../../src/infrastructure/http/middlewares/authenticate');

describe('authorization middleware', () => {
  it('allows matching roles and rejects non-matching roles', () => {
    const allowNext = jest.fn();
    authorize('admin')({ user: { role: 'admin' } }, {}, allowNext);

    expect(allowNext).toHaveBeenCalledWith();

    const denyNext = jest.fn();
    authorize('admin')({ user: { role: 'user' } }, {}, denyNext);

    expect(denyNext.mock.calls[0][0]).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });
});
