import { academiaflowClient } from './academiaFlowClient';
import { extractErrorMessage } from './apiError';

export const fetchAlumnos = async (search) => {
  try {
    const response = await academiaflowClient.get('/alumnos', {
      params: {
        search: search || undefined,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const createAlumno = async (data) => {
  try {
    const response = await academiaflowClient.post('/alumnos', data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const updateAlumno = async (id, data) => {
  try {
    const response = await academiaflowClient.put(`/alumnos/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

export const deleteAlumno = async (id) => {
  try {
    await academiaflowClient.delete(`/alumnos/${id}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
