import { createAiTutorHandler } from '../../server/aiTutor.js';

const handleAiTutor = createAiTutorHandler();

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, message: 'Użyj metody POST.' });
  }
  const result = await handleAiTutor(request.body ?? {});
  return response.status(result.status).json(result.body);
}
