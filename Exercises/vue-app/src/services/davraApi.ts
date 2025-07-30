import axios from 'axios';

export const DavraApiConfig = {
  baseURL: '',
} as any;
export default (defaultUrl = '') => {
  const axiosInstance = axios.create({
    ...DavraApiConfig,
    baseURL: defaultUrl || DavraApiConfig.baseURL,
  });

  return axiosInstance;
};
