import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// Validation schema
const schema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters')
});

const Login = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      const response = await apiService.login(data);
      if (response.data.statusCode === 200) {
        const { token, roles } = response.data.data;
        apiService.saveAuthData(token, roles);
        navigate('/home');
      } else {
        setErrorMsg(response.data.message || 'Login failed');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'An error occurred during login');
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Login</h2>
        {errorMsg && (
          <div className="alert alert-error">{errorMsg}</div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              {...register('email')}
            />
            {errors.email && (
              <p className="error-message">{errors.email.message}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              {...register('password')}
            />
            {errors.password && (
              <p className="error-message">{errors.password.message}</p>
            )}
          </div>
          <button type="submit" className="form-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="form-link">
          <p>
            Don't have an account? <Link to="/register">Register as Patient</Link> or <Link to="/register-doctor">Register as Doctor</Link>
          </p>
          <p>
            Forgot Password? <Link to="/forgot-password">Reset Password here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;