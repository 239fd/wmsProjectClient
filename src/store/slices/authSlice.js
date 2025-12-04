import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { clearAuthData } from '../api';

// Функция для безопасного парсинга JSON из localStorage
const safeGetUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e);
    clearAuthData();
    return null;
  }
};

// ============ ASYNC THUNKS ============

// Стандартный вход
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Стандартная регистрация (с ролью)
export const register = createAsyncThunk(
  'auth/register',
  async ({ email, firstName, lastName, middleName, password, role, organizationCode }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/register', {
        email,
        firstName,
        lastName,
        middleName: middleName || null,
        password,
        role,
        organizationCode: organizationCode || null,
      });
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Завершение OAuth регистрации (выбор роли)
export const completeOAuthRegistration = createAsyncThunk(
  'auth/completeOAuthRegistration',
  async ({ temporaryToken, role, organizationId, warehouseId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/oauth/complete-registration', {
        temporaryToken,
        role,
        organizationId: organizationId || null,
        warehouseId: warehouseId || null,
      });
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.removeItem('oauthRegistration'); // Очищаем временные данные

      return { user, accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Выход
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  }
);

// Получение профиля
export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Обновление профиля
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/api/profile', profileData);
      const updatedUser = response.data;

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const merged = { ...storedUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));

      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ============ INITIAL STATE ============
const initialState = {
  user: safeGetUser(),
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
  // Для OAuth регистрации (когда нужен выбор роли)
  oauthRegistration: JSON.parse(localStorage.getItem('oauthRegistration') || 'null'),
};

// ============ SLICE ============
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      }
    },
    // Сохранить данные OAuth для завершения регистрации
    setOAuthRegistration: (state, action) => {
      state.oauthRegistration = action.payload;
      if (action.payload) {
        localStorage.setItem('oauthRegistration', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('oauthRegistration');
      }
    },
    // Полная очистка состояния
    resetAuth: (state) => {
      clearAuthData();
      localStorage.removeItem('oauthRegistration');
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.oauthRegistration = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Complete OAuth Registration
      .addCase(completeOAuthRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeOAuthRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.oauthRegistration = null;
        state.error = null;
      })
      .addCase(completeOAuthRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.oauthRegistration = null;
        state.error = null;
      })
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser, setOAuthRegistration, resetAuth } = authSlice.actions;

// ============ SELECTORS ============
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectOAuthRegistration = (state) => state.auth.oauthRegistration;

export default authSlice.reducer;

