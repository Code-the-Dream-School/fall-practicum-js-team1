// TEMPORARY: the login and register code uses fetch, but the mock data only answers axios calls.
// This sends the fetch calls that start with /api to the mock data.
// It is only loaded when VITE_USE_MOCKED_API_CALLS is true (see main.tsx).
// Delete this file when the login code uses the functions in client.ts.
import axios from 'axios';
import { setupMock } from './mockService';

const mockAxios = axios.create({ baseURL: '/api', validateStatus: () => true });
setupMock(mockAxios);

const realFetch = window.fetch.bind(window);

window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : '';

  // everything that is not an api call goes to the real fetch
  if (!url.startsWith('/api/')) {
    return realFetch(input, init);
  }

  const response = await mockAxios.request({
    url: url.replace('/api', ''),
    method: init?.method || 'GET',
    data: init?.body,
    headers: { 'Content-Type': 'application/json' },
  });

  return new Response(JSON.stringify(response.data), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
