import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FavoriteChannel {
  id: number;
  name: string;
  category_id: number;
}

interface FavoriteChannelContextType {
  favoriteChannel: FavoriteChannel | null;
  setFavoriteChannel: (channel: FavoriteChannel | null) => void;
  removeFavoriteChannel: () => void;
}

const FavoriteChannelContext = createContext<FavoriteChannelContextType | undefined>(undefined);

export const useFavoriteChannel = () => {
  const context = useContext(FavoriteChannelContext);
  if (context === undefined) {
    throw new Error('useFavoriteChannel must be used within a FavoriteChannelProvider');
  }
  return context;
};

interface FavoriteChannelProviderProps {
  children: ReactNode;
}

export const FavoriteChannelProvider: React.FC<FavoriteChannelProviderProps> = ({ children }) => {
  const [favoriteChannel, setFavoriteChannelState] = useState<FavoriteChannel | null>(null);

  // ローカルストレージからお気に入りチャンネルを読み込み
  useEffect(() => {
    const savedFavoriteChannel = localStorage.getItem('favoriteChannel');
    if (savedFavoriteChannel) {
      try {
        setFavoriteChannelState(JSON.parse(savedFavoriteChannel));
      } catch (error) {
        console.error('Failed to parse favorite channel from localStorage:', error);
        localStorage.removeItem('favoriteChannel');
      }
    }
  }, []);

  const setFavoriteChannel = (channel: FavoriteChannel | null) => {
    setFavoriteChannelState(channel);
    if (channel) {
      localStorage.setItem('favoriteChannel', JSON.stringify(channel));
    } else {
      localStorage.removeItem('favoriteChannel');
    }
  };

  const removeFavoriteChannel = () => {
    setFavoriteChannelState(null);
    localStorage.removeItem('favoriteChannel');
  };

  return (
    <FavoriteChannelContext.Provider value={{
      favoriteChannel,
      setFavoriteChannel,
      removeFavoriteChannel,
    }}>
      {children}
    </FavoriteChannelContext.Provider>
  );
}; 