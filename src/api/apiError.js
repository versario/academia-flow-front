// src/api/apiError.js
import axios from 'axios';

export const extractErrorMessage = (error) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Error inesperado'
    );
  }

  return 'Error inesperado';
};
