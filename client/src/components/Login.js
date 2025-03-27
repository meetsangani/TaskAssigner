import React, { useState } from 'react';
import './styles.css';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        fetch('http://localhost:8000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
            .then(async (response) => {
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token); // Store the token
                    navigate(data.redirectTo);
                } else {
                    const errorData = await response.json();
                    alert('Login failed: ' + errorData.message);
                }
            })
            .catch((error) => {
                console.error('An error occurred:', error);
                alert('An unexpected error occurred. Please try again.');
            });
    };

    const forgot = () => {
        navigate('/ForgotPassword');
    };

    return (
        <div className="window-container">
            <div className="split-layout">
                <div className="image-side">
                    <div className="blue-overlay"></div>
                </div>
                <div className="form-side">
                    <div className="form-container">
                        <h1 className="title">Log In</h1>
                        <p className="subtitle">Welcome Back</p>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="EMAIL"
                                    className="form-input"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="PASSWORD"
                                    className="form-input"
                                    onChange={handleChange}
                                    required
                                />
                                <div className="forgot-link">
                                    <a href="/ForgotPassword" onClick={forgot}>FORGOT PASSWORD?</a>
                                </div>
                            </div>
                            <button type="submit" className="primary-button">
                                Log In
                                <span className="arrow">→</span>
                            </button>


                            <div className='register-link' style={{marginTop : "20px" , textAlign : "center"}}>
                                Need an account ? <a href="/register" >Sign Up</a>
                            </div>
                        
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
