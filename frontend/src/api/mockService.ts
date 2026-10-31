import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import * from '../types/index'

export const setupMock = (axiosInstance: typeof axios) => {
  const mock = new AxiosMockAdapter(axiosInstance, { delayResponse: 300 })

  mock.onGet().reply(200, {})
}
