import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AttractionsIcon from '@mui/icons-material/Attractions';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';

// A helper function to get an icon based on activity type
const getActivityIcon = (activityType: string) => {
  switch (activityType.toLowerCase()) {
    case 'arrival':
    case 'departure':
    case 'transport':
      return <FlightIcon />;
    case 'accommodation':
      return <HotelIcon />;
    case 'dining':
    case 'food':
      return <RestaurantIcon />;
    case 'sightseeing':
    case 'attraction':
      return <AttractionsIcon />;
    default:
      return <LocalActivityIcon />;
  }
};

export default function ItineraryDisplay({ itinerary }) {
  if (!itinerary) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Your Generated Itinerary
      </Typography>
      {itinerary.itinerary.map((day, index) => (
        <Accordion key={index} defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel${index}a-content`}
            id={`panel${index}a-header`}
          >
            <Typography variant="h6">Day {day.day}: {day.theme}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {day.activities.map((activity, actIndex) => (
                <ListItem key={actIndex}>
                  <ListItemIcon>
                    {getActivityIcon(activity.activity_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${activity.start_time} - ${activity.end_time} - ${activity.description}`}
                    secondary={activity.location_name}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>Estimated Costs</Typography>
        {Object.entries(itinerary.estimated_cost).map(([key, value]) => (
          <Chip key={key} label={`${key.charAt(0).toUpperCase() + key.slice(1)}: $${value}`} sx={{ mr: 1, mb: 1 }} />
        ))}
      </Box>
    </Box>
  );
}
