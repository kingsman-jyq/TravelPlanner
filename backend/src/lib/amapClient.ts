import axios from 'axios';
import { AMAP_WEB_API_KEY, AMAP_SECURITY_KEY } from '../config'; // AMAP_SECURITY_KEY is primarily for JS API, not typically used for Web Service API

interface GeocodeResult {
  longitude: number;
  latitude: number;
}

export async function geocodeAddressBackend(address: string): Promise<GeocodeResult | null> {
  if (!AMAP_WEB_API_KEY) {
    console.error('AMAP_WEB_API_KEY is not configured.');
    return null;
  }

  if (!address) {
    return null;
  }

  try {
    const response = await axios.get('https://restapi.amap.com/v3/geocode/geo', {
      params: {
        key: AMAP_WEB_API_KEY,
        address: address,
        // city: '全国' // Optional: specify city if needed, but for now, allow nationwide search
      },
    });

    const data = response.data;

    if (data.status === '1' && data.infocode === '10000' && data.geocodes.length > 0) {
      const location = data.geocodes[0].location;
      const [longitude, latitude] = location.split(',').map(Number);
      return { longitude, latitude };
    } else {
      console.warn(`Backend geocoding failed for address: ${address}. Status: ${data.status}, Infocode: ${data.infocode}, Info: ${data.info}`);
      return null;
    }
  } catch (error) {
    console.error(`Error during backend geocoding for address: ${address}`, error);
    return null;
  }
}
