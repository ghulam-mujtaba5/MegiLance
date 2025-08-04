// @AI-HINT: This is the Signup page root component. All styles are per-component only. See Signup.common.css, Signup.light.css, and Signup.dark.css for theming.
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaGoogle, FaGithub, FaBuilding } from 'react-icons/fa';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Checkbox from '@/app/components/Checkbox/Checkbox';
import './Signup.common.css';
import './Signup.light.css';
import './Signup.dark.css';

interface SignupProps {
  theme?: 'light' | 'dark';
}

const Signup: React.FC<SignupProps> = ({ theme = 'light' }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: '',
  });

  const validate = () => {
    const newErrors = { fullName: '', email: '', password: '', confirmPassword: '', agreedToTerms: '' };
    let isValid = true;

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required.';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid.';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the terms.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      console.log('Form submitted:', formData);
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <div className={`Signup Signup--${theme}`}>
      <div className="Signup-panel Signup-panel--brand">
        <div className="Signup-brand-content">
          <FaBuilding className="Signup-logo-icon" />
          <h1 className="Signup-brand-title">MegiLance</h1>
          <p className="Signup-brand-subtitle">Join the Premier Platform for Crypto Freelancers</p>
          <p className="Signup-brand-text">Unlock opportunities, manage projects seamlessly, and get paid securely in cryptocurrency.</p>
        </div>
      </div>
      <div className="Signup-panel Signup-panel--form">
        <div className="Signup-form-container">
          <h2 className="Signup-title">Create Your Account</h2>
          <p className="Signup-subtitle">Start your journey with MegiLance today.</p>

          <div className="Signup-social-buttons">
            <Button theme={theme} variant="secondary" fullWidth><FaGoogle /> Sign up with Google</Button>
            <Button theme={theme} variant="secondary" fullWidth><FaGithub /> Sign up with GitHub</Button>
          </div>

          <div className="Signup-divider"><span>OR</span></div>

          <form className="Signup-form" onSubmit={handleSubmit} noValidate>
            <Input theme={theme} label="Full Name" type="text" placeholder="John Doe" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} required />
            <Input theme={theme} label="Email Address" type="email" placeholder="you@example.com" name="email" value={formData.email} onChange={handleChange} error={errors.email} required />
            <Input theme={theme} label="Password" type="password" placeholder="Minimum 8 characters" name="password" value={formData.password} onChange={handleChange} error={errors.password} required />
            <Input theme={theme} label="Confirm Password" type="password" placeholder="Re-enter your password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
            <Checkbox name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleChange} error={errors.agreedToTerms}>
              I agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
            </Checkbox>
            <Button theme={theme} variant="primary" fullWidth type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          <p className="Signup-login-link">
            Already have an account? <Link href="/Login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
