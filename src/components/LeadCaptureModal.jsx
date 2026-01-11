import React, { useState, useEffect } from 'react';
import { X, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LeadCaptureModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasSeen, setHasSeen] = useState(false);

    useEffect(() => {
        // Trigger 1: Time Delay (30 seconds)
        const timer = setTimeout(() => {
            if (!hasSeen) {
                setIsOpen(true);
            }
        }, 30000);

        // Trigger 2: Exit Intent (Mouse leaves window top)
        const handleExitIntent = (e) => {
            if (e.clientY <= 0 && !hasSeen) {
                setIsOpen(true);
            }
        };

        document.addEventListener('mouseleave', handleExitIntent);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mouseleave', handleExitIntent);
        };
    }, [hasSeen]);

    const close = () => {
        setIsOpen(false);
        setHasSeen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, send to backend
        alert("Thanks! You're on the list. We'll text you when fresh metal arrives.");
        close();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        style={{
                            backgroundColor: 'white',
                            maxWidth: '500px',
                            width: '100%',
                            padding: '2rem',
                            position: 'relative',
                            borderRadius: '8px',
                            border: '4px solid var(--color-primary)'
                        }}
                    >
                        <button
                            onClick={close}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                backgroundColor: 'var(--color-gold)',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <BellRing size={32} color="white" />
                            </div>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                                Don't Miss the Next $3,000 Truck
                            </h2>
                            <p style={{ fontSize: '1rem', color: '#666' }}>
                                Good cars go fast. Join the "Fresh Inventory" list and get a text the second we park a new trade-in.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="tel"
                                placeholder="(319) 555-0123"
                                required
                                style={{
                                    padding: '1rem',
                                    fontSize: '1.125rem',
                                    border: '2px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    fontSize: '1.125rem'
                                }}
                            >
                                Get First Dibs
                            </button>
                            <p style={{ fontSize: '0.75rem', textAlign: 'center', opacity: 0.7 }}>
                                No spam. Just cars. Unsubscribe anytime.
                            </p>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LeadCaptureModal;
