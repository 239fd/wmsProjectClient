import React, {useState} from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Menu,
    MenuItem,
    Tooltip,
    Avatar,
    Button,
    Drawer,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {useNavigate, useLocation} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../../store/slices/authSlice';

const NAV_ITEMS = [
    {key: 'receive',      label: 'Поставки',        path: '/main/receive',      allowed: ['WORKER'],     requiresOrg: true},
    {key: 'ship',         label: 'Отгрузка',        path: '/main/ship',         allowed: ['WORKER'],     requiresOrg: true},
    {key: 'inventory',    label: 'Инвентаризация',  path: '/main/inventory',    allowed: ['ACCOUNTANT'], requiresOrg: true},
    {key: 'revaluation',  label: 'Переоценка',      path: '/main/revaluation',  allowed: ['ACCOUNTANT'], requiresOrg: true},
    {key: 'writeoff',     label: 'Списание',        path: '/main/writeoff',     allowed: ['ACCOUNTANT'], requiresOrg: true},
    {key: 'documents',    label: 'Документы',       path: '/main/documents',    allowed: ['WORKER', 'ACCOUNTANT'], requiresOrg: true},
    {key: 'suppliers',    label: 'Поставщики',      path: '/main/suppliers',    allowed: ['WORKER'],     requiresOrg: true},
    {key: 'product-card', label: 'Карточка товара', path: '/main/product-card', allowed: ['WORKER'],     requiresOrg: true},
    {key: 'analytics',    label: 'Аналитика',       path: '/main/analytics',    allowed: ['DIRECTOR'],   requiresOrg: true},
    {key: 'employees',    label: 'Сотрудники',      path: '/main/employees',    allowed: ['DIRECTOR'],   requiresOrg: true},
    {key: 'organization', label: 'Организация',     path: '/main/organization', allowed: ['DIRECTOR'],   requiresOrg: false},
];

const ROLE_LABELS = {
    WORKER: 'Кладовщик',
    ACCOUNTANT: 'Бухгалтер',
    DIRECTOR: 'Заведующий',
};

const MainNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const userRole = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : undefined);
    const hasOrg = !!user?.organizationId;
    const navItems = NAV_ITEMS.filter((item) => {
        const roleOk = item.allowed === 'ALL' || (userRole && item.allowed.includes(userRole));
        if (!roleOk) return false;
        if (item.requiresOrg && !hasOrg) return false;
        return true;
    });

    const handleSettingsClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSettings = () => {
        handleClose();
        navigate('/main/settings');
    };
    const handleLogout = () => {
        handleClose();
        dispatch(logout());
        navigate('/');
    };

    const toggleMobile = (open) => () => {
        setMobileOpen(open);
    };

    const handleMobileNavigate = (path) => {
        setMobileOpen(false);
        navigate(path);
    };

    return (
        <>
            <AppBar position="static" elevation={1} sx={{mb: 4}} color="inherit">
                <Toolbar sx={{justifyContent: 'space-between', position: 'relative'}}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography
                            variant="h6"
                            sx={{fontWeight: 700, letterSpacing: 2, cursor: 'pointer'}}
                            onClick={() => navigate('/main')}
                        >
                            WMS
                        </Typography>
                        {userRole && ROLE_LABELS[userRole] && (
                            <Chip
                                label={ROLE_LABELS[userRole]}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{fontWeight: 600}}
                            />
                        )}
                    </Box>
                    <Box sx={{
                        position: {xs: 'static', md: 'absolute'},
                        left: {md: '50%'},
                        top: 0,
                        transform: {md: 'translateX(-50%)'},
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        justifyContent: {xs: 'center', md: 'flex-start'},
                        px: {xs: 1, md: 0},
                    }}>
                        <Box sx={{display: {xs: 'none', md: 'flex'}, gap: 1, flexWrap: 'wrap'}}>
                            {navItems.map((item) => (
                                <Button
                                    key={item.key}
                                    variant={location.pathname === item.path ? 'contained' : 'text'}
                                    color={location.pathname === item.path ? 'primary' : 'inherit'}
                                    onClick={() => navigate(item.path)}
                                    sx={{textTransform: 'none'}}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Box>
                        <IconButton
                            aria-label="menu"
                            onClick={toggleMobile(true)}
                            sx={{display: {xs: 'flex', md: 'none'}}}
                            size="large"
                        >
                            <MenuIcon/>
                        </IconButton>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Tooltip title="Личный кабинет">
                            <IconButton onClick={() => navigate('/main/profile')}>
                                <Avatar sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: '#fff',
                                    color: '#111',
                                    border: '1px solid rgba(0,0,0,0.12)'
                                }}>ЛК</Avatar>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Меню настроек">
                            <IconButton onClick={handleSettingsClick}>
                                <img src={require('../../assets/icons/settings-svgrepo-com.svg').default} alt="settings"
                                     style={{width: 28, height: 28}}/>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                            transformOrigin={{vertical: 'top', horizontal: 'right'}}
                        >
                            <MenuItem onClick={handleSettings}>Настройки</MenuItem>
                            <MenuItem onClick={handleLogout} sx={{color: 'error.main'}}>Выйти</MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer anchor="left" open={mobileOpen} onClose={toggleMobile(false)}>
                <Box sx={{width: 260}} role="presentation" onKeyDown={(e) => {
                    if (e.key === 'Escape') setMobileOpen(false);
                }}>
                    {userRole && ROLE_LABELS[userRole] && (
                        <Box sx={{px: 2, py: 1.5}}>
                            <Typography variant="caption" color="text.secondary">Роль</Typography>
                            <Typography variant="body1" sx={{fontWeight: 700}}>{ROLE_LABELS[userRole]}</Typography>
                        </Box>
                    )}
                    <Divider/>
                    <List>
                        {navItems.map((item) => (
                            <ListItemButton
                                key={item.key}
                                selected={location.pathname === item.path}
                                onClick={() => handleMobileNavigate(item.path)}
                            >
                                <ListItemText primary={item.label}/>
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default MainNavbar;
