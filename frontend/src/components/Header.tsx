import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AI Travel Planner
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Button color="inherit" component={RouterLink} to="/">
            Plan New Trip
          </Button>
          <Button color="inherit" component={RouterLink} to="/my-trips">
            My Trips
          </Button>
          {user && <Button color="inherit" onClick={logout}>Logout</Button>}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
