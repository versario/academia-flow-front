import axios from 'axios';

export const academiaflowClient = axios.create({
  baseURL: 'http://localhost:8080/api',
});
