import React from 'react';
import {Box, Typography, Grid, Paper, Button} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import AnalyticsImage from '../assets/images/AnalyticsImage.svg';
import ApproveImage from '../assets/images/ApproveImage.svg';

const sections = [
    {
        title: 'Веб-WMS для вашего бизнеса',
        description: 'Все в одной системе: приемка и отгрузка, перемещения, инвентаризация, переоценка и списание, документооборот, аналитика и ABC-анализ. Работает в любом современном браузере; разворачивается локально, на ваших серверах или в облаке.',
        image: null,
        imageLeft: false,
    },
    {
        title: 'WMS это',
        description:
            'Система управления складом — программное решение, которое автоматизирует приемку, размещение, отгрузку, инвентаризацию и учет остатков. Цель — ускорить операции, сократить ошибки и снизить издержки.',
        image: AnalyticsImage,
        imageLeft: true,
    },
    {
        title: 'Что внутри',
        description: `Приемка, отгрузка, перемещения, инвентаризация, переоценка и списание.\nПартионный и поэкземплярный учет с FEFO/FIFO и контролем сроков годности.\nАдресное хранение: стеллажи и ячейки с учетом габаритов, веса и условий хранения (комната / охлаждение / холодильник / морозильник).\nРезервирование товара под заявку, листы подбора, акты расхождения.\nДокументы (ТН, ТТН, CMR, инвойс, приходные ордера, акты приемки / списания / переоценки / инвентаризации) — PDF из шаблонов или реальные .xlsx / .docx через RPA-канал в 1С и MS Office.\nИмпорт поставок из 1С (RPA) или JSON, аналитика и ABC-анализ.\nПоддержка нескольких складов и ролей: Кладовщик / Бухгалтер / Заведующий.`,
        image: ApproveImage,
        imageLeft: false,
    },
];

const MAX_WIDTH = 1440;

const HomePage = () => {
    const navigate = useNavigate();
    return (
        <Box sx={{width: '100%', bgcolor: 'background.default', minHeight: '100vh'}}>
            <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <Box sx={{width: '100%', maxWidth: MAX_WIDTH, px: {xs: 2, md: 6}, my: 3}}>
                    <Paper elevation={2} sx={{ background: '#fff', borderRadius: 4, p: { xs: 3, md: 6 }, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)', width: '100%' }}>
                        <Box
                            sx={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 6,
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="h2"
                                    color="text.primary"
                                    sx={{ fontWeight: 800, mb: 2, textAlign: { xs: 'center', md: 'left' } }}
                                >
                                    WMS — складская система нового поколения
                                </Typography>
                                <Typography
                                    variant="h5"
                                    color="text.secondary"
                                    sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}
                                >
                                    Управляйте складом, закупками и отчетностью прямо в браузере — с импортом из 1С и автозаполнением документов через RPA. Просто. Надежно. Современно.
                                </Typography>
                                <Box display="flex" gap={2} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        onClick={() => navigate('/login')}
                                    >
                                        Вход
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="large"
                                        onClick={() => navigate('/register')}
                                    >
                                        Регистрация
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Box>
            <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                {sections.map((section, idx) => (
                    <Box key={idx} sx={{width: '100%', maxWidth: MAX_WIDTH, px: {xs: 2, md: 6}, my: 3}}>
                        <Paper elevation={2} sx={{
                            background: '#fff',
                            borderRadius: 4,
                            p: {xs: 2, md: 4},
                            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)'
                        }}>
                            <Grid
                                container
                                spacing={4}
                                alignItems="center"
                                minHeight={{md: 260}}
                                direction={section.imageLeft ? 'row-reverse' : 'row'}
                            >
                                {section.image && (
                                    <Grid size={{ xs: 12, md: 6 }}
                                          sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                        <Box sx={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                                            <img
                                                src={section.image}
                                                alt={section.title}
                                                style={{
                                                    maxWidth: 340,
                                                    width: '100%',
                                                    height: 'auto',
                                                    borderRadius: 12,
                                                    boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                )}
                                <Grid size={{ xs: 12, md: section.image ? 6 : 12 }} sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: section.image
                                        ? {xs: 'center', md: section.imageLeft ? 'flex-end' : 'flex-start'}
                                        : 'stretch',
                                    width: '100%',
                                }}>
                                    <Typography
                                        variant="h4"
                                        color="text.primary"
                                        gutterBottom
                                        sx={{
                                            fontWeight: 700,
                                            textAlign: section.image
                                                ? {xs: 'center', md: section.imageLeft ? 'right' : 'left'}
                                                : {xs: 'center', md: 'left'},
                                            mb: 1
                                        }}
                                    >
                                        {section.title}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        color="text.secondary"
                                        sx={{
                                            whiteSpace: 'pre-line',
                                            fontSize: 17,
                                            textAlign: section.image
                                                ? {xs: 'center', md: section.imageLeft ? 'right' : 'left'}
                                                : {xs: 'center', md: 'left'},
                                            ...(section.image ? { maxWidth: 480 } : { width: '100%' }),
                                        }}
                                    >
                                        {section.description}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default HomePage;
