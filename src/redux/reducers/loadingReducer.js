import { createSlice } from '@reduxjs/toolkit';

const loadingSlice = createSlice({
    name: 'loading',
    initialState: {
        activeRequests: 0,
    },
    reducers: {
        startRequest: (state) => {
            state.activeRequests += 1;
        },
        endRequest: (state) => {
            if (state.activeRequests > 0) {
                state.activeRequests -= 1;
            }
        },
    },
});

export const { startRequest, endRequest } = loadingSlice.actions;
export const selectIsLoading = (state) => state.loading.activeRequests > 0;
export default loadingSlice.reducer;
