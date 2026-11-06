// The value is not set here. Set it in frontend/.env.local:
//   VITE_USE_MOCKED_API_CALLS=true uses the mock data
//   VITE_USE_MOCKED_API_CALLS=false uses the real api
interface ImportMetaEnv {
  readonly VITE_USE_MOCKED_API_CALLS?: string;
}
