import { academiaflowClient } from './academiaFlowClient';
import { extractErrorMessage } from './apiError';

export const fetchProfesorAsignaturas = async () => {
  try {
    const response = await academiaflowClient.get('/profesor-asignaturas');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const createProfesorAsignatura = async (data) => {
  try {
    const response = await academiaflowClient.post('/profesor-asignaturas', data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const deleteProfesorAsignatura = async (id) => {
  try {
    await academiaflowClient.delete(`/profesor-asignaturas/${id}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
