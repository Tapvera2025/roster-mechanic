/**
 * Location Constants
 *
 * Australian states, territories, and location-related constants
 */

// Australian States and Territories
export const AUSTRALIAN_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' }
];

// Australian Timezones
export const AUSTRALIAN_TIMEZONES = [
  { value: 'Australia/Perth', label: '(UTC+08:00) Perth', state: 'WA' },
  { value: 'Australia/Eucla', label: '(UTC+08:45) Eucla', state: 'WA' },
  { value: 'Australia/Darwin', label: '(UTC+09:30) Darwin', state: 'NT' },
  { value: 'Australia/Brisbane', label: '(UTC+10:00) Brisbane', state: 'QLD' },
  { value: 'Australia/Adelaide', label: '(UTC+10:30) Adelaide', state: 'SA' },
  { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney', state: 'NSW' },
  { value: 'Australia/Melbourne', label: '(UTC+10:00) Melbourne', state: 'VIC' },
  { value: 'Australia/Hobart', label: '(UTC+10:00) Hobart', state: 'TAS' },
  { value: 'Australia/Canberra', label: '(UTC+10:00) Canberra', state: 'ACT' },
  { value: 'Australia/Lord_Howe', label: '(UTC+10:30) Lord Howe Island', state: 'NSW' },
];

// Country code for geocoding
export const DEFAULT_COUNTRY_CODE = 'au';

// Default coordinates (Sydney, NSW)
export const DEFAULT_COORDINATES = {
  latitude: -33.8688,
  longitude: 151.2093
};
