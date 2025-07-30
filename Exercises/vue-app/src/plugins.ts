
import { DavraApiConfig as CoreApiConfig } from '@davra/ui-core';
import { DavraApiConfig as DashApiConfig } from '@davra/ui-dashboards';
import { DavraApiConfig } from './services/davraApi';

export default () => {
  DashApiConfig.baseURL = import.meta.env.VITE_API_HOST;
  if (import.meta.env.VITE_BEARER_TOKEN) {
    DashApiConfig.headers = {
      Authorization: `bearer ${import.meta.env.VITE_BEARER_TOKEN}`,
    };
  }
  
  CoreApiConfig.baseURL = import.meta.env.VITE_API_HOST;
  if (import.meta.env.VITE_BEARER_TOKEN) {
      CoreApiConfig.headers = {
      Authorization: `bearer ${import.meta.env.VITE_BEARER_TOKEN}`,
    };
  }

  DavraApiConfig.baseURL = import.meta.env.VITE_API_HOST;
  if (import.meta.env.VITE_BEARER_TOKEN) {
    DavraApiConfig.headers = {
      Authorization: `bearer ${import.meta.env.VITE_BEARER_TOKEN}`,
    };
  }
}