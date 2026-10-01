import { createAiTutorHandler, createFreeModelsHandler } from './aiTutor.js';

const handleAiTutor = createAiTutorHandler();
const handleFreeModels = createFreeModelsHandler();

export async function postAiTutor(request, response) {
  const result = await handleAiTutor(request.body);
  return response.status(result.status).json(result.body);
}

export async function getFreeModels(_request, response) {
  const result = await handleFreeModels();
  return response.status(result.status).json(result.body);
}
