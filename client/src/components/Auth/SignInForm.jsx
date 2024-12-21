import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SignInForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting login with:', formData);
      
      const response = await api.post('/auth/login', formData);
      console.log('Login response:', response.data);
      
      if (response.data.status === 'success') {
        // Pass both user data and token to login
        const { token, user } = response.data.data;
        console.log('Login successful:', { token, user });
        
        login(user, token);
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div>
      <h1>Welcome back</h1>
      
      {error && (
        <div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          label="Password"
          id="password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
        />
        <button
          type="submit"
        >
          Sign In
        </button>
        <div>
          <span>
            Don't have an account?{' '}
            <a href="/register">
              Register here
            </a>
          </span>
        </div>
      </form>
    </div>
  );
};

export default SignInForm;
