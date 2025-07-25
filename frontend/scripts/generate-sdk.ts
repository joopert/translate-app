import { createClient } from '@hey-api/openapi-ts';

createClient({
  input: 'http://localhost:8001/api/openapi.json',
  output: { format: 'prettier', path: 'api-client' }, //TODO: would like camelcase/pascalcase. But need to figure out how to accept on fastapi side.
  plugins: [
    '@hey-api/client-nuxt',
    'zod',
    {
      name: '@hey-api/sdk',
      methodNameBuilder(operation) {
        return `${operation.id}`;
      },
    },
  ],
  watch: {
    enabled: true,
    interval: 30000,
  },
});
