import React from 'react';
import { MessageCircle, Bell } from 'lucide-react';

const StickyLeadBar = () => {
    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTop: '1px solid #ddd',
            display: 'flex',
            zIndex: 1000,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            height: '60px' // explicit height to prevent layout shifts if delayed
        }} className="mobile-only-bar">
            <a href="sms:+13093371049" style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem'
            }}>
                <MessageCircle size={20} />
                Text Us
            </a>
            <button
                onClick={() => document.querySelector('input[type="tel"]')?.focus()}
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--color-gold)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                <Bell size={20} />
                Get Alerts
            </button>
            <style>{`
                .mobile-only-bar { display: none !important; }
                @media (max-width: 768px) {
                    .mobile-only-bar { display: flex !important; }
                    /* Make space for the bar */
                    body { padding-bottom: 60px; } 
                }
            `}</style>
        </div>
    );
};

export default StickyLeadBar;
