// A simple regex to check for ':' which is characteristic of IPv6
const IPV6_REGEX = /:/;
// A simple regex to check for '.' which is characteristic of IPv4
const IPV4_REGEX = /\./;

/**
 * Determines if a given string is an IPv4 or IPv6 address.
 * Also handles CIDR notation by checking the address part.
 * @param ipString The IP address or CIDR string.
 * @returns 'IPv4', 'IPv6', or 'Unknown'.
 */
export const getIpVersion = (ipString: string): 'IPv4' | 'IPv6' | 'Unknown' => {
  const addressPart = ipString.split('/')[0].trim();

  // More robust IPv6 check, must contain a colon
  if (IPV6_REGEX.test(addressPart)) {
    return 'IPv6';
  }
  
  // More robust IPv4 check, must contain dots and no colons
  if (IPV4_REGEX.test(addressPart)) {
    return 'IPv4';
  }

  return 'Unknown';
};
