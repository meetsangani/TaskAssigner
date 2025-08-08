import React, { useState } from 'react';
import './styles.css';
import { useNavigate } from 'react-router-dom';

const SignUpForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        profile_pic: ''
    });

    const navigate = useNavigate();

    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      const maxSize = 300 * 1024; 
  
      if (file && file.type.startsWith('image/')) {
        if (file.size > maxSize) {
          alert('The image size should be less than or equal to 300 KB.');
        } else {
          setFormData({
            ...formData,
            profile_pic: URL.createObjectURL(file), 
          });
          alert('Image uploaded successfully!');
        }
      } else {
        alert('Please upload a valid image.');
      }
    };
  

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    }; 

    const handleSubmit = (e) => {
      e.preventDefault();
    
      fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
        .then(async (response) => {
          if (response.ok) {
            alert('Registration successful! Please log in.');
            navigate('/'); 
          } else {
            const errorData = await response.json();
            console.error('Signup failed:', errorData);
            alert('Signup failed: ' + errorData.message);
          }
        })
        .catch((error) => {
          console.error('An error occurred:', error);
          alert('An unexpected error occurred. Please try again.');
        });
    };

    return (
      <div className="window-container">
        <div className="split-layout">
          <div className="form-side">
            <div className="form-container">
              <h1 className="title">SIGN UP</h1>
              <p className="subtitle">CREATE AN ACCOUNT</p>
  
              <form onSubmit={handleSubmit}>

              <div className="profile-upload">
                <label htmlFor="profile-upload">
                  <div className="profile-circle">
                    {formData.profile_pic ? (
                      <img
                        src={formData.profile_pic}
                        alt="Profile"
                        className="profile-preview"
                      />
                    ) : (
                      <div className="profile-placeholder">
                        <span className="plus-icon">+</span>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  type="file"
                  id="profile-upload"
                  name="profile_pic"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }} 
                />
              </div>

                <div className="input-group">
                  <input
                    type="text"
                    name="name"
                    placeholder="FULL NAME"
                    className="form-input"
                    onChange={handleChange}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="PHONE NUMBER"
                    className="form-input"
                    onChange={handleChange}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="EMAIL"
                    className="form-input"
                    onChange={handleChange}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    name="password"
                    placeholder="PASSWORD"
                    className="form-input"
                    onChange={handleChange}
                  />
                </div>
  
                <button type="submit" className="primary-button">
                  SIGN UP
                </button>
              </form>
  
              <p className="auth-link">
                Already have an account? <a href="/">Sign In</a>
              </p>
            </div>
          </div>
          <div className="image-side1">
            <div className="blue-overlay"></div>
          </div>
        </div>
      </div>
    );
};

export default SignUpForm;