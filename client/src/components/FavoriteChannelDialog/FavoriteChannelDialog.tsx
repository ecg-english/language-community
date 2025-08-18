import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useCommunity } from '../../contexts/CommunityContext';
import { useFavoriteChannel } from '../../contexts/FavoriteChannelContext';

interface FavoriteChannelDialogProps {
  open: boolean;
  onClose: () => void;
}

const FavoriteChannelDialog: React.FC<FavoriteChannelDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { categories, channels } = useCommunity();
  const { favoriteChannel, setFavoriteChannel, removeFavoriteChannel } = useFavoriteChannel();
  const [selectedChannel, setSelectedChannel] = useState<{ id: number; name: string; category_id: number } | null>(favoriteChannel);

  const handleSetFavorite = () => {
    if (selectedChannel) {
      setFavoriteChannel(selectedChannel);
    }
    onClose();
  };

  const handleRemoveFavorite = () => {
    removeFavoriteChannel();
    setSelectedChannel(null);
    onClose();
  };

  const handleChannelSelect = (channel: { id: number; name: string; category_id: number }) => {
    setSelectedChannel(channel);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('selectFavoriteChannel')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('favoriteChannelDescription')}
          </Typography>

          {categories.map((category) => {
            const categoryChannels = channels[category.id] || [];
            if (categoryChannels.length === 0) return null;

            return (
              <Box key={category.id} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {category.name}
                </Typography>
                <List sx={{ p: 0 }}>
                  {categoryChannels.map((channel) => {
                    const isSelected = selectedChannel?.id === channel.id;
                    const isCurrentFavorite = favoriteChannel?.id === channel.id;

                    return (
                      <ListItem
                        key={channel.id}
                        button
                        selected={isSelected}
                        onClick={() => handleChannelSelect({
                          id: channel.id,
                          name: channel.name,
                          category_id: category.id
                        })}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          border: isSelected ? '2px solid' : '1px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          backgroundColor: isSelected ? 'primary.50' : 'transparent',
                          '&:hover': {
                            backgroundColor: isSelected ? 'primary.50' : 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon>
                          {isCurrentFavorite ? (
                            <StarIcon color="primary" />
                          ) : (
                            <StarBorderIcon color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                                                     primary={
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                               <ChatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                               <Typography variant="body1" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                                 {channel.name}
                               </Typography>
                             </Box>
                           }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {channel.description || t('noDescription')}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
                <Divider sx={{ mt: 2 }} />
              </Box>
            );
          })}

          {categories.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('noChannels')}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t('cancel')}
        </Button>
        {favoriteChannel && (
          <Button onClick={handleRemoveFavorite} color="error">
            {t('removeFavoriteChannel')}
          </Button>
        )}
        <Button
          onClick={handleSetFavorite}
          variant="contained"
          disabled={!selectedChannel}
        >
          {t('setFavoriteChannel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FavoriteChannelDialog; 