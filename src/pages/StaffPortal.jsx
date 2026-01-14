import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StaffPortal = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Set the magic token
        localStorage.setItem('highlife_staff_auth', 'true');

        // Optional: Set a specific timeout or expiry if we were fancy, but simple is fine.

        // Redirect to Inventory immediately
        navigate('/inventory');
    }, [navigate]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1a1a1a',
            color: 'white',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <h2>Authenticating Staff Access...</h2>
            <div className="animate-spin" style={{
                width: '32px',
                height: '32px',
                border: '4px solid rgba(255,255,255,0.3)',
                borderTopColor: 'var(--color-gold)',
                borderRadius: '50%'
            }}></div>
        </div>
    );
};

export default StaffPortal;
