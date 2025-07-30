<template>
  <v-app>
    <v-app-bar color="primary" flat>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-img :src="organisationTheme?.logoUrl || '/CE.png'" style="max-width: 90px"></v-img>
      <v-app-bar-title>Iot platform </v-app-bar-title>
      <v-avatar class="mbr-1 mr-2" color="grey-darken-1" size="36">{{ currentUser?.name.slice(0, 1).toUpperCase() }}</v-avatar>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" color="primary">
      <v-list>
        <v-list-item title="Overview" :to="{ name: 'home' }"></v-list-item>
      </v-list>
      <template v-slot:append>
        <div class="pa-8">
          <v-btn block color="white" @click="logout"> Logout </v-btn>
        </div>
      </template>
    </v-navigation-drawer>
    <v-main>
      <router-view v-if="!isLoading"></router-view>
      <v-overlay :model-value="isLoading" class="align-center justify-center" scrim="grey" opacity="1">
        <v-progress-circular color="primary" size="64" indeterminate></v-progress-circular>
      </v-overlay>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useOrganisationsStore } from "./stores/organisations";
import { useTheme } from "vuetify";
import { storeToRefs } from "pinia";
import axios from "axios";

const drawer = ref(true);
const theme = useTheme();
const { organisationTheme, currentUser } = storeToRefs(useOrganisationsStore());
const isLoading = ref(true);
onMounted(async () => {
  await useOrganisationsStore().pullUserOrganisations();
  if (organisationTheme.value) {
    theme.themes.value.lightTheme.colors.primary = organisationTheme.value.primaryColor;
  }
  isLoading.value = false;
});
const logout = async () => {
  const response = await axios.get("/logout");
  window.location.href = response.data.loginRedirect;
};
</script>
