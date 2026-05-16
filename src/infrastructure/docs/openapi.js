const swaggerJsdoc = require('swagger-jsdoc');

const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Loop Social API',
      version: '1.0.0',
      description: 'Production-ready API documentation for the Loop Social backend.',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/infrastructure/http/routes/*.js'],
});

module.exports = openApiSpec;
