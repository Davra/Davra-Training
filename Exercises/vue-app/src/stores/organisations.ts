import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAlertMessagesStore } from '@davra/ui-core';
import OrganisationsService from '../services/organisationsService';
import type { Organisation } from '../types';
import { ref } from 'vue';

export const useOrganisationsStore = defineStore('organisations', () => {
  const userOrganisations = ref<Organisation[]>([]);
  const currentOrg = ref<Organisation | null>(null);
  const currentUser = ref<any>(null);
  const organisationTheme = ref<any>(null);
  const organisations = ref<Organisation[]>([]);

  const pullUserOrganisations = async () => {
    try {
      const result = await OrganisationsService.getCurrentOrganisation();
      currentOrg.value = result;
      const {
        customAttributes: { theme: orgTheme },
      } = await OrganisationsService.getOrganisationByUUID(result.UUID);
      if (orgTheme) {
        organisationTheme.value = orgTheme;
      }
    } catch (err) {}
    try {
      const orgs: Organisation[] =
        await OrganisationsService.getUserOrganisations();
      userOrganisations.value = orgs;
    } catch (err) {}
    try {
      const user: any = await OrganisationsService.getCurrentUser();
      currentUser.value = user;
    } catch (err) {}
  };

  const switchOrganisation = async (uuid: string) => {
    try {
      const { success } = await OrganisationsService.switchOrganisation(uuid);
      if (!success) {
        useAlertMessagesStore().setSnackbarMessage(
          'Error switching Organisation',
          'error'
        );
        return;
      }

      const result = await OrganisationsService.getCurrentOrganisation();
      currentOrg.value = result;

      setTimeout(() => location.reload(), 300);
    } catch (err) {
      useAlertMessagesStore().setSnackbarMessage(
        'Error switching Organisation',
        'error'
      );
    }
  };

  const pullOrganisations = async (ifEmpty?: boolean) => {
    if (ifEmpty && organisations.value.length)
      return

    try {
      const organisationsRequest = await OrganisationsService.getOrganisations()
      organisations.value = organisationsRequest
    }
    catch (err: any) {
      useAlertMessagesStore().setSnackbarMessage(err, 'error')
    }
  }

  const saveOrganisation = async (organisation: Organisation, UUID: string) => {
    let res = false
    try {
      if (UUID) {
        await OrganisationsService.putOrganisation(organisation, UUID)
      }
      else {
        await OrganisationsService.postOrganisation(organisation)
       }
      res = true
      useAlertMessagesStore().setSnackbarMessage(`Organisation ${organisation.name} successfully saved`, 'success')
    }
    catch (err: any) {
      useAlertMessagesStore().setSnackbarMessage(err, 'error')
    }
    await pullOrganisations()

    return res
  }

  return {
    userOrganisations,
    currentOrg,
    organisationTheme,
    pullUserOrganisations,
    switchOrganisation,
    currentUser,
    pullOrganisations,
    organisations,
    saveOrganisation
  };
});

if (import.meta.hot)
  import.meta.hot.accept(
    acceptHMRUpdate(useOrganisationsStore, import.meta.hot)
  );
