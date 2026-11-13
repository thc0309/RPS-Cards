/* global require, module */
/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins use CommonJS. */
const { withDangerousMod, withMainApplication } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

// Expo Network only sees the active network; a hotspot's AP interface is not activeNetwork.
module.exports = function withLanNetwork(config) {
  const packageName = config.android.package;
  config = withDangerousMod(config, ['android', async (mod) => {
    const directory = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/java', ...packageName.split('.'));
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'RpsLanNetworkPackage.java'), `package ${packageName};
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.*;
import com.facebook.react.uimanager.ViewManager;
import java.net.*;
import java.util.*;

public class RpsLanNetworkPackage implements ReactPackage {
  public List<NativeModule> createNativeModules(ReactApplicationContext context) {
    return Arrays.asList(new LocalAddressModule(context));
  }
  public List<ViewManager> createViewManagers(ReactApplicationContext context) { return Collections.emptyList(); }
  public static class LocalAddressModule extends ReactContextBaseJavaModule {
    LocalAddressModule(ReactApplicationContext context) { super(context); }
    public String getName() { return "RpsLanNetwork"; }
    @ReactMethod public void getLocalIPv4(Promise promise) {
      try {
        for (NetworkInterface network : Collections.list(NetworkInterface.getNetworkInterfaces())) {
          String name = network.getName().toLowerCase(Locale.ROOT);
          if (!network.isUp() || network.isLoopback() || !(name.startsWith("wlan") || name.startsWith("swlan") || name.startsWith("ap") || name.startsWith("wifi"))) continue;
          for (InetAddress address : Collections.list(network.getInetAddresses())) {
            if (address instanceof Inet4Address && !address.isLoopbackAddress() && !address.isAnyLocalAddress()) {
              promise.resolve(address.getHostAddress()); return;
            }
          }
        }
        promise.resolve(null);
      } catch (Exception error) { promise.reject("NO_LOCAL_IP", "Local address unavailable"); }
    }
  }
}
`);
    return mod;
  }]);
  return withMainApplication(config, (mod) => {
    if (!mod.modResults.contents.includes('add(RpsLanNetworkPackage())')) {
      const marker = 'PackageList(this).packages.apply {';
      if (!mod.modResults.contents.includes(marker)) throw new Error('LAN plugin: package registration marker missing');
      mod.modResults.contents = mod.modResults.contents.replace(marker, `${marker}\n              add(RpsLanNetworkPackage())`);
    }
    return mod;
  });
};
