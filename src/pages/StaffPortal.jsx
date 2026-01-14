import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StaffPortal = () => {
    const navigate = useNavigate();
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'Highlife8191!') {
            localStorage.setItem('highlife_staff_auth', 'true');
            navigate('/admin');
        } else {
            setError('Incorrect access code.');
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1a1a1a',
            color: 'white'
        }}>
            <form onSubmit={handleLogin} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                backgroundColor: '#262626',
                padding: '3rem',
                borderRadius: '1rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: 'white' }}>Dealer Login</h2>
                    <p style={{ color: '#a3a3a3', fontSize: '0.875rem' }}>Enter your staff access code.</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <input
                    type="password"
                    placeholder="Access Code"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #404040',
                        backgroundColor: '#171717',
                        color: 'white',
                        outline: 'none',
                        fontSize: '1rem'
                    }}
                    autoFocus
                />

                <button type="submit" style={{
                    backgroundColor: 'var(--color-gold, #fbbf24)',
                    color: 'black',
                    fontWeight: '700',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'background-color 0.2s'
                }}>
                    Access Dashboard
                </button>

                <a href="/" style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>Back to Home</a>
            </form>
        </div>
    );
};

export default StaffPortal;
