import { createAiTutorHandler } from './aiTutor.js';

const handleAiTutor = createAiTutorHandler();

export async function postAiTutor(request, response) {
  const result = await handleAiTutor(request.body);
  return response.status(result.status).json(result.body);
}
