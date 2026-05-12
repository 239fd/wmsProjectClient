import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import warehouseService from '../../services/warehouseService';
import { logout } from './authSlice';

export const fetchWarehouses = createAsyncThunk(
    'warehouses/fetch',
    async (orgId) => {
        if (!orgId) return [];
        const res = await warehouseService.getWarehousesByOrg(orgId);
        return Array.isArray(res) ? res : (res?.content || []);
    }
);

const initialState = {
    data: [],
    loading: false,
    error: null,
    loadedForKey: null,
};

const warehousesSlice = createSlice({
    name: 'warehouses',
    initialState,
    reducers: {
        invalidateWarehouses: (state) => {
            state.loadedForKey = null;
        },
        setWarehouses: (state, action) => {
            state.data = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWarehouses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWarehouses.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.loadedForKey = action.meta.arg ?? null;
            })
            .addCase(fetchWarehouses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error?.message || 'Ошибка загрузки складов';
                state.data = [];

                state.loadedForKey = action.meta.arg ?? null;
            })
            .addCase(logout.fulfilled, () => initialState);
    },
});

export const { invalidateWarehouses, setWarehouses } = warehousesSlice.actions;

export const selectWarehousesState = (state) => state.warehouses;

export default warehousesSlice.reducer;
