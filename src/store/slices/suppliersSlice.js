import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import supplierService from '../../services/supplierService';
import { logout } from './authSlice';

export const fetchSuppliers = createAsyncThunk(
    'suppliers/fetch',
    async (orgId) => {
        if (!orgId) return [];
        const res = await supplierService.list();
        return Array.isArray(res) ? res : (res?.content || []);
    }
);

const initialState = {
    data: [],
    loading: false,
    error: null,
    loadedForKey: null,
};

const suppliersSlice = createSlice({
    name: 'suppliers',
    initialState,
    reducers: {
        invalidateSuppliers: (state) => {
            state.loadedForKey = null;
        },
        setSuppliers: (state, action) => {
            state.data = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSuppliers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSuppliers.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.loadedForKey = action.meta.arg ?? null;
            })
            .addCase(fetchSuppliers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error?.message || 'Ошибка загрузки поставщиков';
                state.data = [];
                state.loadedForKey = action.meta.arg ?? null;
            })
            .addCase(logout.fulfilled, () => initialState);
    },
});

export const { invalidateSuppliers, setSuppliers } = suppliersSlice.actions;

export const selectSuppliersState = (state) => state.suppliers;

export default suppliersSlice.reducer;
