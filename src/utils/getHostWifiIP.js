import os from "os";

// extract the wifi ip address to add it to the allowed origins
export const getWiFiIP = () => {
  const interfaces = os.networkInterfaces();
  let wifiIP = "";

  for (const iface in interfaces) {
    interfaces[iface].forEach((details) => {
      // Check if the interface corresponds to Wi-Fi (name might vary depending on OS)
      if (
        (iface === "wlan0" || iface === "Wi-Fi") && // Common names for Wi-Fi interfaces
        details.family === "IPv4" &&
        !details.internal
      ) {
        wifiIP = details.address;
      }
    });
  }

  return wifiIP.toString();
};
