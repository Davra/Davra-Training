import DavraApi from './davraApi';
import type { Organisation } from '../types';

const getUserOrganisations = async (): Promise<Organisation[]> => {
  try {
    const { data } = await DavraApi().get<any>('/user/organisations', {
      headers: {
        Accept: 'application/json',
      },
    });

    return data;
  } catch (error) {
    throw new Error('Organisations API Error');
  }
};
const getOrganisationByUUID = async (uuid: string): Promise<Organisation> => {
  try {
    const { data } = await DavraApi().get<any>(
      '/api/v1/organisations/' + uuid,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    return data;
  } catch (error) {
    throw new Error('Organisations API Error');
  }
};

const getCurrentOrganisation = async (): Promise<Organisation> => {
  try {
    const { data } = await DavraApi().get<any>('/user/currentOrganisation', {
      headers: {
        Accept: 'application/json',
      },
    });

    return data;
  } catch (error) {
    throw new Error('Organisations API Error');
  }
};
const getCurrentUser = async (): Promise<any> => {
  try {
    const { data } = await DavraApi().get<any>('/user', {
      headers: {
        Accept: 'application/json',
      },
    });

    return data;
  } catch (error) {
    throw new Error('User API Error');
  }
};

const switchOrganisation = async (uuid: string): Promise<any> => {
  try {
    const { data } = await DavraApi().get<any>(
      `/switchOrganisation/${uuid}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    return data;
  } catch (error) {
    throw new Error('Organisations API Error');
  }
};

const getOrganisations = async (): Promise<Organisation[]> => {
  try {
    const { data } = await DavraApi().get<any>('/api/v1/organisations', {
      headers: {
        Accept: 'application/json',
      },
    });

    return data.records;
  } catch (error) {
    throw new Error('Organisations API Error');
  }
};

const postOrganisation = async (organisation: Organisation): Promise<Organisation> => {
  try {
    const { data } = await DavraApi().post<any>('/api/v1/organisations',
      organisation,
      {
      headers: {
        Accept: 'application/json',
      },
    });

    return data;
  } catch (error) {
    throw new Error('Organisations API Error');
  }
};

const putOrganisation = async (organisation: Organisation, UUID: string): Promise<object> => {
  try {
    delete organisation._id
    delete organisation.tenantId
    delete organisation.ancestors
    delete organisation.createdTime
    delete organisation.modifiedTime
    delete organisation.owner
    const { data } = await DavraApi().put<any>(`/api/v1/organisations/${UUID}`,
      organisation,
      {
      headers: {
        Accept: 'application/json',
      },
    });

    return data;
  } catch (error) {
    throw new Error('Organisations API Error');
  }
};

export default {
  getUserOrganisations,
  getOrganisationByUUID,
  getCurrentOrganisation,
  switchOrganisation,
  getCurrentUser,
  getOrganisations,
  postOrganisation,
  putOrganisation
};
