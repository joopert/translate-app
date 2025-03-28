import { client } from '~/api-client/client.gen';

export default defineNuxtPlugin(() => {
  client.setConfig({
    baseURL: 'http://localhost:8001', //TODO: on prod this must be different
    credentials: 'include', // TODO: on prod this should be 'same-origin'
  });
});
