<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useDevicesStore, useTwinsStore } from '@davra/ui-core';
import { onMounted } from 'vue';
import { ref } from 'vue';
import { useDashboardsStore } from '@davra/ui-dashboards';

const deviceSotre = useDevicesStore()
const twinsStore = useTwinsStore()
const dashbaordsStore = useDashboardsStore()
const loading = ref(false)
const deviceCounters = ref(0)
const twinCounters = ref(0)
const { dashboardsCount } = storeToRefs(dashbaordsStore)
onMounted(async () => {
    loading.value = true
    const deviceReq = await deviceSotre.pullDevices(0, 1, '', '')
    deviceCounters.value = deviceReq.totalRecords

    const twinReq = await twinsStore.pullTwins(0, 1, '', '')
    twinCounters.value = twinReq.totalRecords

    await dashbaordsStore.pullDashboards()

    loading.value = false

})
</script>

<template>
    <v-container>
        <h2 class="my-3">
            Welcome to the Training Custom Application
        </h2>
        <v-row align="start" justify="start">
            <v-col cols="auto">
                <v-card color="primary" variant="flat" class="mx-auto" max-width="344" :loading="loading">
                    <v-card-item>
                        <div>
                            <div class="text-overline mb-1">
                                Devices count
                            </div>
                            <div class="text-h2 mb-1">
                                {{ deviceCounters }}
                            </div>
                            <div class="text-caption">This is the number of devices you have access to </div>
                        </div>
                    </v-card-item>
                </v-card>
            </v-col>
            <v-col cols="auto">
                <v-card color="primary" variant="flat" class="mx-auto" :loading="loading" max-width="344">
                    <v-card-item>
                        <div>
                            <div class="text-overline mb-1">
                                Twins count
                            </div>
                            <div class="text-h2 mb-1">
                                {{ twinCounters }}
                            </div>
                            <div class="text-caption">This is the number of twins you have access to </div>
                        </div>
                    </v-card-item>
                </v-card>
            </v-col>
            <v-col cols="auto">
                <v-card color="primary" variant="flat" class="mx-auto" :loading="loading" max-width="344">
                    <v-card-item>
                        <div>
                            <div class="text-overline mb-1">
                                Dashboards count
                            </div>
                            <div class="text-h2 mb-1">
                                {{ dashboardsCount }}
                            </div>
                            <div class="text-caption">This is the number of dashboards you have access to </div>
                        </div>
                    </v-card-item>
                </v-card>
            </v-col>
        </v-row>
    </v-container>

</template>
<style scoped></style>