import { Box, Typography } from '@mui/material';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Box sx={{ 
        flex: { xs: 1, lg: 0.4 }, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: { xs: '24px', md: '48px' },
        backgroundColor: '#FFFFFF',
        boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
        zIndex: 2,
      }}>
        <Box sx={{ margin: '0 auto', width: '100%', maxWidth: '420px' }}>
          {children}
        </Box>
      </Box>
      <Box sx={{ 
        flex: { xs: 0, lg: 0.6 }, 
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        backgroundImage: 'url(/images/meeting_room_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)',
          zIndex: 1,
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 2, p: 8, color: '#FFF' }}>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            Empower Your Meetings.
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 400, opacity: 0.9, maxWidth: '600px', lineHeight: 1.6 }}>
            Seamlessly book, manage, and collaborate in world-class spaces designed for your next big idea.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
