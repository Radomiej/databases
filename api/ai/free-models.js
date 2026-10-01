import { createFreeModelsHandler } from '../../server/aiTutor.js';

const handleFreeModels = createFreeModelsHandler();

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false, message: 'Użyj metody GET.' });
  }
  const result = await handleFreeModels();
  return response.status(result.status).json(result.body);
}
