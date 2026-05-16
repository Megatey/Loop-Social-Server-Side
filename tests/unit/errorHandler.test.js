const { errorHandler, notFoundHandler } = require('../../src/infrastructure/http/middlewares/errorHandler');

function mockResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function mockRequest() {
  return {
    method: 'GET',
    originalUrl: '/test',
    log: {
      error: jest.fn(),
    },
  };
}

describe('error middleware', () => {
  it('maps mongoose validation errors into structured 400 responses', () => {
    const error = new Error('bad document');
    error.name = 'ValidationError';
    error.errors = { email: { message: 'invalid' } };
    const res = mockResponse();

    errorHandler(error, mockRequest(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      status: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
    });
  });

  it('maps cast and duplicate errors into client-safe responses', () => {
    const castError = new Error('bad id');
    castError.name = 'CastError';
    const duplicateError = new Error('duplicate');
    duplicateError.code = 11000;
    duplicateError.keyValue = { email: 'taken@example.com' };

    const castResponse = mockResponse();
    const duplicateResponse = mockResponse();

    errorHandler(castError, mockRequest(), castResponse, jest.fn());
    errorHandler(duplicateError, mockRequest(), duplicateResponse, jest.fn());

    expect(castResponse.status).toHaveBeenCalledWith(400);
    expect(duplicateResponse.status).toHaveBeenCalledWith(409);
  });

  it('creates a not-found error for unmatched routes', () => {
    const next = jest.fn();

    notFoundHandler({ method: 'POST', originalUrl: '/missing' }, {}, next);

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
    });
  });
});
