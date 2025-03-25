import { createClient } from '@hey-api/openapi-ts';

createClient({
  input: 'http://localhost:8001/openapi.json',
  output: 'api-client',
  plugins: ['@hey-api/client-nuxt'],
});
