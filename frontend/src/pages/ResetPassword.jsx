import React from 'react';
import { Stepper, Step, StepLabel } from '@mui/material';
import ResetPasswordCodeForm from '../components/ResetPasswordCodeForm';
import ResetPasswordEmailForm from '../components/ResetPasswordEmailForm';

export const PageContext = React.createContext();

const steps = [
    'Enter your email',
    'Enter the verification code and new password'
];

/**
 * The reset password page. Has two components - Enter email to send code to email. Then enter code and new password to change password.
 */
/*eslint-disable eqeqeq*/
const ResetPassword = () => {
    const [step, setStep] = React.useState(0);

    return (
        <PageContext.Provider value={{step, setStep}}>
            { step == 0 && <ResetPasswordEmailForm /> }
            { step == 1 && <ResetPasswordCodeForm /> }
            <Stepper activeStep={step} alternativeLabel style={{
                marginLeft: "30%",
                marginRight: "30%",
                marginTop: "2%"
            }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
        </PageContext.Provider>
    )
}

export default ResetPassword;