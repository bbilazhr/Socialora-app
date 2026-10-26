import app from '../src/api-server/server.js';

export default function handler(req, res) {
  return app(req, res);
}
