import React from 'react';
import { Box, Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const ROUTE_LABELS = {
    main: 'Главная',
    profile: 'Личный кабинет',
    settings: 'Настройки',
    organization: 'Организация',
    employees: 'Сотрудники',
    receive: 'Приёмка',
    ship: 'Отгрузка',
    inventory: 'Инвентаризация',
    writeoff: 'Списание',
    revaluation: 'Переоценка',
    analytics: 'Аналитика',
    suppliers: 'Поставщики',
    supplies: 'Поставки',
    documents: 'Документы',
    'erp-extractor': 'ERP-импорт',
};

const PageBreadcrumbs = ({ items, sx }) => {
    const location = useLocation();
    const segments = location.pathname.split('/').filter(Boolean);

    if (!items && segments.length <= 1 && segments[0] === 'main') {
        return null;
    }

    let resolved;
    if (items?.length) {

        resolved = [{ label: 'Главная', to: '/main', icon: HomeIcon }, ...items];
    } else {

        let acc = '';
        resolved = segments.map((seg, idx) => {
            acc += `/${seg}`;
            const isMainRoot = idx === 0 && seg === 'main';
            return {
                label: ROUTE_LABELS[seg] || seg,
                to: acc,
                icon: isMainRoot ? HomeIcon : null,
            };
        });
    }

    if (resolved.length < 2) return null;

    return (
        <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 }, pt: 2, ...sx }}>
            <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="хлебные крошки"
            >
                {resolved.map((item, idx) => {
                    const isLast = idx === resolved.length - 1;
                    const Icon = item.icon;
                    const inner = (
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            {Icon && <Icon fontSize="small" sx={{ mb: '-2px' }} />}
                            {item.label}
                        </Box>
                    );
                    if (isLast || !item.to) {
                        return (
                            <Typography key={idx} color="text.primary" sx={{ fontWeight: 500 }}>
                                {inner}
                            </Typography>
                        );
                    }
                    return (
                        <MuiLink
                            key={idx}
                            component={RouterLink}
                            to={item.to}
                            underline="hover"
                            color="text.secondary"
                            sx={{ display: 'inline-flex', alignItems: 'center' }}
                        >
                            {inner}
                        </MuiLink>
                    );
                })}
            </Breadcrumbs>
        </Box>
    );
};

export default PageBreadcrumbs;
