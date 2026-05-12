import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import organizationService from '../../services/organizationService';
import { logout } from './authSlice';

export const fetchEmployees = createAsyncThunk(
    'employees/fetch',
    async (orgId) => {
        if (!orgId) return [];
        const res = await organizationService.getEmployees(orgId);
        return Array.isArray(res) ? res : (res?.content || []);
    }
);

const initialState = {
    data: [],
    loading: false,
    error: null,
    loadedForKey: null,
};

const employeesSlice = createSlice({
    name: 'employees',
    initialState,
    reducers: {
        invalidateEmployees: (state) => {
            state.loadedForKey = null;
        },
        setEmployees: (state, action) => {
            state.data = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEmployees.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.loadedForKey = action.meta.arg ?? null;
            })
            .addCase(fetchEmployees.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error?.message || 'Ошибка загрузки сотрудников';
                state.data = [];
                state.loadedForKey = action.meta.arg ?? null;
            })
            .addCase(logout.fulfilled, () => initialState);
    },
});

export const { invalidateEmployees, setEmployees } = employeesSlice.actions;

export const selectEmployeesState = (state) => state.employees;

export default employeesSlice.reducer;
