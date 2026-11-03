import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
//import * as TYPES from '../types/index'

import mockData from './mockData.json' with { type: 'json' }

export const setupMock = (axiosInstance: typeof axios, baseUrl: string) => {
  console.log('setupMock()')
  const mock = new AxiosMockAdapter(axiosInstance, { delayResponse: 300 })

  const profileItemsUrl = `${baseUrl}/profile/items`
  console.log(`profile urL ${profileItemsUrl}`)
  mock.onGet(profileItemsUrl).reply(
    200,
    mockData.items,
  )
  mock.onPost(`${baseUrl}/users/register`).reply(
    201,
    {
      success: true,
      data: mockData.users[0],
      csrfToken: 'abc',
    }
  )
}
