import { academiaflowClient } from './academiaFlowClient';
import { extractErrorMessage } from './apiError';

export const fetchAsignaturas = async (search) => {
  try {
    const response = await academiaflowClient.get('/asignaturas', {
      params: {
        search: search || undefined,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const createAsignatura = async (data) => {
  try {
    const response = await academiaflowClient.post('/asignaturas', data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const updateAsignatura = async (id, data) => {
  try {
    const response = await academiaflowClient.put(`/asignaturas/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const deleteAsignatura = async (id) => {
  try {
    await academiaflowClient.delete(`/asignaturas/${id}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
