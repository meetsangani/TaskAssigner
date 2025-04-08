import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import './styles.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function PasswordReset() {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.newPassword || !formData.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/update_password', {
        email: formData.email,
        password: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      alert(response.data.message);
      navigate('/');
    } catch (err) {
      console.error("Error resetting password:", err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="window-container">
      <Card className="w-full max-w-4xl overflow-hidden">
        <div className="split-layout">
          <div className="image-side p-6 text-white flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-sm" />
          </div>

          <div className="form-side p-6">
            <div className="max-w-sm mx-auto">
              <h1 className="text-2xl font-bold mb-2">Create a New Password</h1>
              <p className="text-gray-500 mb-6">
                Your new password must be different from previously used passwords
              </p>

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="New Password"
                    className="form-input"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="form-input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {error && <p className="error-message">{error}</p>}
                <Button 
                  type="submit" 
                  className="primary-button"
                >
                  Update your password
                </Button>
              </form>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PasswordReset;