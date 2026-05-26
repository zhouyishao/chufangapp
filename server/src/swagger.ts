export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Chufangapp API',
    version: '0.1.0'
  },
  components: {
    securitySchemes: {
      adminBearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          code: { type: 'number', example: 0 },
          message: { type: 'string', example: 'success' },
          data: { type: 'object' }
        }
      },
      ApiFail: {
        type: 'object',
        properties: {
          code: { type: 'number', example: 400 },
          message: { type: 'string', example: '参数错误' },
          data: { type: 'null', example: null }
        }
      },
      PageResult: {
        type: 'object',
        properties: {
          list: { type: 'array', items: { type: 'object' } },
          total: { type: 'number', example: 0 },
          page: { type: 'number', example: 1 },
          pageSize: { type: 'number', example: 10 }
        }
      }
    }
  },
  tags: [
    { name: 'Admin Auth' },
    { name: 'Admin Categories' },
    { name: 'Admin Ingredients' },
    { name: 'Admin Recipes' },
    { name: 'App Home' },
    { name: 'App Recipes' },
    { name: 'App Ingredients' }
  ],
  paths: {
    '/api/admin/auth/login': {
      post: {
        tags: ['Admin Auth'],
        summary: 'Admin login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['username', 'password']
              }
            }
          }
        },
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/admin/auth/profile': {
      get: {
        tags: ['Admin Auth'],
        summary: 'Admin profile',
        security: [{ adminBearerAuth: [] }],
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/admin/categories': {
      get: {
        tags: ['Admin Categories'],
        summary: 'List categories',
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'number', default: 10 } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['RECIPE', 'INGREDIENT', 'SEASONING', 'FRUIT', 'COCKTAIL'] }
          },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'DISABLED'] } }
        ],
        responses: { 200: { description: 'success' } }
      },
      post: {
        tags: ['Admin Categories'],
        summary: 'Create category',
        security: [{ adminBearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/admin/categories/{id}': {
      get: {
        tags: ['Admin Categories'],
        summary: 'Get category',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        responses: { 200: { description: 'success' } }
      },
      put: {
        tags: ['Admin Categories'],
        summary: 'Update category',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'success' } }
      },
      delete: {
        tags: ['Admin Categories'],
        summary: 'Delete category',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/admin/ingredients': {
      get: {
        tags: ['Admin Ingredients'],
        summary: 'List ingredients',
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'number', default: 10 } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'DISABLED'] } },
          { name: 'isPublish', in: 'query', schema: { type: 'boolean' } },
          { name: 'isRecommend', in: 'query', schema: { type: 'boolean' } },
          { name: 'categoryId', in: 'query', schema: { type: 'number' } }
        ],
        responses: { 200: { description: 'success' } }
      },
      post: {
        tags: ['Admin Ingredients'],
        summary: 'Create ingredient',
        security: [{ adminBearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/admin/ingredients/{id}': {
      get: {
        tags: ['Admin Ingredients'],
        summary: 'Get ingredient',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        responses: { 200: { description: 'success' } }
      },
      put: {
        tags: ['Admin Ingredients'],
        summary: 'Update ingredient',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'success' } }
      },
      delete: {
        tags: ['Admin Ingredients'],
        summary: 'Delete ingredient',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/admin/recipes': {
      get: {
        tags: ['Admin Recipes'],
        summary: 'List recipes',
        security: [{ adminBearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'number', default: 10 } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'DISABLED'] } },
          { name: 'isPublish', in: 'query', schema: { type: 'boolean' } },
          { name: 'isRecommend', in: 'query', schema: { type: 'boolean' } },
          { name: 'auditStatus', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] } }
        ],
        responses: { 200: { description: 'success' } }
      },
      post: {
        tags: ['Admin Recipes'],
        summary: 'Create recipe',
        security: [{ adminBearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/admin/recipes/{id}': {
      get: {
        tags: ['Admin Recipes'],
        summary: 'Get recipe',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        responses: { 200: { description: 'success' } }
      },
      put: {
        tags: ['Admin Recipes'],
        summary: 'Update recipe',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'success' } }
      },
      delete: {
        tags: ['Admin Recipes'],
        summary: 'Delete recipe',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/admin/recipes/{id}/publish': {
      patch: {
        tags: ['Admin Recipes'],
        summary: 'Publish/unpublish recipe',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/admin/recipes/{id}/recommend': {
      patch: {
        tags: ['Admin Recipes'],
        summary: 'Recommend/unrecommend recipe',
        security: [{ adminBearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/home': { get: { tags: ['App Home'], summary: 'Home', responses: { 200: { description: 'success' } } } },
    '/api/recipes': { get: { tags: ['App Recipes'], summary: 'List recipes', responses: { 200: { description: 'success' } } } },
    '/api/recipes/{id}': {
      get: {
        tags: ['App Recipes'],
        summary: 'Get recipe',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        responses: { 200: { description: 'success' } }
      }
    },
    '/api/ingredients': { get: { tags: ['App Ingredients'], summary: 'List ingredients', responses: { 200: { description: 'success' } } } },
    '/api/ingredients/{id}': {
      get: {
        tags: ['App Ingredients'],
        summary: 'Get ingredient',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
        responses: { 200: { description: 'success' } }
      }
    }
  }
};

