import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

import '@davra/ui-dashboards/dist/style.css';
import '@mdi/font/css/materialdesignicons.css';
import initDavraLibs from './plugins';

initDavraLibs()

// Vuetify
import 'vuetify/styles';
import { createVuetify, ThemeDefinition } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary: '#4b9c94',
    background: '#EEEEEE'
  },
};

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'lightTheme',
    themes: {
      lightTheme,
    },
  },
  components,
  directives,
});

createApp(App).use(vuetify).use(router).use(createPinia()).mount('#app');