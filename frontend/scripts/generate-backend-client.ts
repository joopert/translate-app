import { createClient } from '@hey-api/openapi-ts';

createClient({
  input: 'http://localhost:8001/openapi.json',
  output: 'api-client',
  plugins: [
    '@hey-api/client-nuxt',
    {
      name: '@hey-api/sdk',
      methodNameBuilder(operation) {
        return `${operation.id}`;
      },
    },
  ],
});
