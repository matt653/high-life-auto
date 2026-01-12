
import React, { createContext, useState, useEffect, useContext } from 'react';

const GarageContext = createContext();

export const useGarage = () => {
    return useContext(GarageContext);
};

export const GarageProvider = ({ children }) => {
    const [savedVehicles, setSavedVehicles] = useState([]);

    // Load from local storage on mount
    useEffect(() => {
        const storedGarage = localStorage.getItem('garage_v1');
        if (storedGarage) {
            try {
                setSavedVehicles(JSON.parse(storedGarage));
            } catch (error) {
                console.error("Failed to parse garage from localStorage", error);
            }
        }
    }, []);

    // Save to local storage whenever garage changes
    useEffect(() => {
        localStorage.setItem('garage_v1', JSON.stringify(savedVehicles));
    }, [savedVehicles]);

    const addToGarage = (vehicle) => {
        setSavedVehicles(prev => {
            if (prev.some(v => v.id === vehicle.id)) return prev;
            return [...prev, vehicle];
        });
    };

    const removeFromGarage = (vehicleId) => {
        setSavedVehicles(prev => prev.filter(v => v.id !== vehicleId));
    };

    const isInGarage = (vehicleId) => {
        return savedVehicles.some(v => v.id === vehicleId);
    };

    const toggleGarage = (vehicle) => {
        if (isInGarage(vehicle.id)) {
            removeFromGarage(vehicle.id);
        } else {
            addToGarage(vehicle);
        }
    };

    return (
        <GarageContext.Provider value={{ savedVehicles, addToGarage, removeFromGarage, isInGarage, toggleGarage }}>
            {children}
        </GarageContext.Provider>
    );
};
