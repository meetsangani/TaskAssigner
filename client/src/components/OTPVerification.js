import React, { useState, useRef } from 'react';
import './styles.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const otpfile = require('./otpfile.png');

function OTPVerification() {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);
    const [error, setError] = useState(null);

    const handleChange = (index, value) => {
        if (isNaN(value) || value.length > 1) return; 

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const otpsend = async () => {
        const enteredOtp = otp.join('');

        if (enteredOtp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/verify_otp', {
                otp: enteredOtp,
            });
            alert(response.data.message);
            navigate('/CreatePassword', { state: { email: location.state.email } }); 
        } catch (err) {
            console.error("Error during OTP verification:", err);
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        }
    };

    return (
        <div className="window-container">
            <div className="split-layout">
                <div className="image-side3">
                    <img src={otpfile} alt="OTP" className="otp-image" />
                </div>
                <div className="form-side">
                    <div className="form-container">
                        <h1 className="title">OTP</h1>
                        <div className="image-container">
                            <img src={otpfile} height={150} alt="OTP Verification" />
                        </div>
                        <h2 className="verification-title">Verification Code</h2>
                        <p className="verification-text">
                            We have sent a Verification code<br />
                            to your <b>Email Address</b>
                        </p>

                        <div className="otp-container">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    className="otp-input"
                                />
                            ))}
                        </div>

                        {error && <p className="error-message">{error}</p>}
                        <button type="submit" className="primary-button" onClick={otpsend}>
                            Verify OTP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OTPVerification;