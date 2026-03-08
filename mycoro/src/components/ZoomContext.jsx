import React, { createContext, useState } from 'react';

export const ZoomContext = createContext();

export const ZoomProvider = ({ children }) => {
    const [fontSize, setFontSize] = useState(18);

    const increaseFont = () => setFontSize(prev => Math.min(prev + 2, 32));
    const decreaseFont = () => setFontSize(prev => Math.max(prev - 2, 14));

    return (
        <ZoomContext.Provider value={{ fontSize, increaseFont, decreaseFont }}>
            {children}
        </ZoomContext.Provider>
    );
};