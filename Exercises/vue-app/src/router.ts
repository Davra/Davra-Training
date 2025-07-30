import { createRouter, createWebHashHistory } from "vue-router";

import HomeVue from "./components/Home.vue";

const routes = [
  { name: "home", path: "/", component: HomeVue },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
