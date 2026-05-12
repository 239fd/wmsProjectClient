import React, { useState } from 'react';
import {
  Box, Stepper, Step, StepLabel, Button, Stack, CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';

const FormWizard = ({
    steps,
    trigger,
    onSubmit,
    busy = false,
    submitLabel = 'Подтвердить',
    onCancel,
    cancelLabel = 'Отмена',
    activeStep: controlledStep,
    onStepChange,
}) => {
    const [internalStep, setInternalStep] = useState(0);
    const isControlled = controlledStep !== undefined;
    const activeStep = isControlled ? controlledStep : internalStep;
    const setActive = (next) => {
        if (isControlled) onStepChange?.(next);
        else setInternalStep(next);
    };

    const isLast = activeStep === steps.length - 1;
    const current = steps[activeStep];

    const handleNext = async () => {
        if (current.fields && current.fields.length > 0 && trigger) {
            const ok = await trigger(current.fields, { shouldFocus: true });
            if (!ok) return;
        }
        setActive(activeStep + 1);
    };

    const handleBack = () => {
        if (activeStep > 0) setActive(activeStep - 1);
    };

    const handleSubmitClick = async () => {

        if (current.fields && current.fields.length > 0 && trigger) {
            const ok = await trigger(current.fields, { shouldFocus: true });
            if (!ok) return;
        }
        onSubmit?.();
    };

    return (
        <Box>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((s) => (
                    <Step key={s.key}>
                        <StepLabel>{s.label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box sx={{ minHeight: 200 }}>
                {current.render?.({ activeStep, isLast })}
            </Box>

            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3} spacing={1}>
                <Box>
                    {onCancel && (
                        <Button onClick={onCancel} disabled={busy} type="button">
                            {cancelLabel}
                        </Button>
                    )}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        onClick={handleBack}
                        disabled={busy || activeStep === 0}
                        startIcon={<ArrowBackIcon />}
                        type="button"
                    >
                        Назад
                    </Button>
                    {!isLast ? (
                        <Button
                            onClick={handleNext}
                            disabled={busy}
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            type="button"
                        >
                            Далее
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmitClick}
                            disabled={busy}
                            variant="contained"
                            color="primary"
                            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                            type="button"
                        >
                            {submitLabel}
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
};

export default FormWizard;
