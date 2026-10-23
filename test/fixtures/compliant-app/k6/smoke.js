import http from 'k6/http';

export const options = { vus: 10, duration: '1m' };
export default () => http.get(`${__ENV.BASE_URL}/health`);
