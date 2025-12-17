import { academiaflowClient } from './academiaFlowClient';

export const fetchProfesores = async (search) => {
  const response = await academiaflowClient.get('/profesores', {
    params: {
      search: search || undefined,
    },
  });
  return response.data;
};
