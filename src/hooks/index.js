import { useMemo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useDirectoryFetch from './useDirectoryFetch';
import useDraft from './useDraft';
import { selectUser } from '../store/slices/authSlice';
import {
    fetchWarehouses,
    setWarehouses,
    selectWarehousesState,
} from '../store/slices/warehousesSlice';
import {
    fetchSuppliers,
    setSuppliers,
    selectSuppliersState,
} from '../store/slices/suppliersSlice';
import {
    fetchEmployees,
    setEmployees,
    selectEmployeesState,
} from '../store/slices/employeesSlice';
import productService from '../services/productService';

const useDirectorySlice = (selector, thunk, setAction, keyOf) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const key = keyOf(user);
    const { data, loading, error, loadedForKey } = useSelector(selector);

    useEffect(() => {

        if (key && loadedForKey !== key && !loading) {
            dispatch(thunk(key));
        }
    }, [dispatch, key, loadedForKey, loading, thunk]);

    const refresh = useCallback(() => {
        if (!key) return Promise.resolve(null);
        return dispatch(thunk(key)).unwrap().catch(() => null);
    }, [dispatch, key, thunk]);

    const setData = useCallback(
        (next) => {
            const value = typeof next === 'function' ? next(data) : next;
            dispatch(setAction(value));
        },
        [dispatch, data, setAction]
    );

    const effectiveLoading = loading || (!!key && loadedForKey !== key);

    return { data, loading: effectiveLoading, error, refresh, setData };
};

export const useWarehouses = () => useDirectorySlice(
    selectWarehousesState,
    fetchWarehouses,
    setWarehouses,
    (user) => user?.organizationId || null,
);

export const useEmployees = () => useDirectorySlice(
    selectEmployeesState,
    fetchEmployees,
    setEmployees,
    (user) => user?.organizationId || null,
);

export const useSuppliers = () => useDirectorySlice(
    selectSuppliersState,
    fetchSuppliers,
    setSuppliers,
    (user) => user?.organizationId || null,
);

export const useInventoryByWarehouse = (warehouseId) => {
    const fetcher = useMemo(
        () => () => warehouseId ? productService.getInventory(warehouseId) : Promise.resolve([]),
        [warehouseId]
    );
    return useDirectoryFetch(fetcher, [warehouseId]);
};

export { useDirectoryFetch, useDraft };
