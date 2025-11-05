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
  Button,
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
    case '交通': // Add Chinese for transport
      return <FlightIcon />;
    case 'accommodation':
    case '住宿': // Add Chinese for accommodation
      return <HotelIcon />;
    case 'dining':
    case 'food':
    case '用餐': // Add Chinese for dining
      return <RestaurantIcon />;
    case 'sightseeing':
    case 'attraction':
    case '观光': // Add Chinese for sightseeing
      return <AttractionsIcon />;
    default:
      return <LocalActivityIcon />;
  }
};

import type { Itinerary } from '../types';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
}

export default function ItineraryDisplay({ itinerary, selectedDay, setSelectedDay }: ItineraryDisplayProps) {
  if (!itinerary) return null;

    return (

      <Box>

        <Typography variant="h5" component="h2" gutterBottom>
          Your Generated Itinerary
        </Typography>

        {itinerary.itinerary && itinerary.itinerary.length > 0 && (
            <Box sx={{display: 'flex', gap: 1, mb: 2, overflowX: 'auto'}}>
              {itinerary.itinerary.map((dayItem) => (
                  <Button
                      key={dayItem.day}
                      variant={selectedDay === dayItem.day ? 'contained' : 'outlined'}
                      onClick={() => setSelectedDay(dayItem.day)}
                      size="small"
                  >
                    Day {dayItem.day}
                  </Button>
              ))}
            </Box>
        )}

        {itinerary.itinerary.map((day, index) => (
            <Accordion key={index} defaultExpanded={day.day === selectedDay}>
              <AccordionSummary
                  expandIcon={<ExpandMoreIcon/>}
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
                            primary={
                              <>
                                {`${activity.start_time} - ${activity.end_time} - ${activity.description}`}
                                {activity.estimated_cost !== undefined && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ml: 1}}>
                                      (Est. ¥{activity.estimated_cost})
                                    </Typography>
                                )}
                              </>
                            }
                            secondary={activity.location_name}
                        />
                      </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
        ))}

        <Box sx={{mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1}}>
          <Typography variant="h6" gutterBottom>Estimated Costs</Typography>
          {itinerary.estimated_cost && Object.entries(itinerary.estimated_cost).map(([key, value]) => (
              <Chip key={key} label={`${key.charAt(0).toUpperCase() + key.slice(1)}: ¥${value}`} sx={{mr: 1, mb: 1}}/>
          ))}
        </Box>
      </Box>
  );
}