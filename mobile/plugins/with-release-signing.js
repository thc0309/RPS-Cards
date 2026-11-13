/* global require, module */
/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins use CommonJS. */
// Signs release builds with the upload keystore described in ../keystore/signing.properties.
// Falls back to the debug key when that file is absent, so a fresh clone still builds.
// Passwords are read at build time by Gradle and never written into the generated project.
const { withAppBuildGradle } = require('expo/config-plugins');

const PROPS_BLOCK = `
def rpsSigningProps = new Properties()
def rpsSigningFile = rootProject.file('../../keystore/signing.properties')
if (rpsSigningFile.exists()) { rpsSigningFile.withInputStream { rpsSigningProps.load(it) } }
def rpsDebugSigning = project.findProperty('rpsDebugSigning') == 'true'
def rpsHasReleaseKey = !rpsDebugSigning && rpsSigningProps.getProperty('RPS_UPLOAD_STORE_FILE') && rpsSigningProps.getProperty('RPS_UPLOAD_STORE_PASSWORD')
`;

const RELEASE_SIGNING = `
        release {
            if (rpsHasReleaseKey) {
                storeFile file(rpsSigningProps.getProperty('RPS_UPLOAD_STORE_FILE'))
                storePassword rpsSigningProps.getProperty('RPS_UPLOAD_STORE_PASSWORD')
                keyAlias rpsSigningProps.getProperty('RPS_UPLOAD_KEY_ALIAS')
                keyPassword rpsSigningProps.getProperty('RPS_UPLOAD_KEY_PASSWORD')
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (gradle.includes('rpsHasReleaseKey')) return mod;
    if (!gradle.includes('android {')) throw new Error('with-release-signing: android block not found');
    gradle = gradle.replace('android {', `${PROPS_BLOCK}\nandroid {`);
    gradle = gradle.replace(/(signingConfigs \{[\s\S]*?debug \{[\s\S]*?\n {8}\})/, `$1${RELEASE_SIGNING}`);
    gradle = gradle.replace(
      /(release \{\s*\n\s*\/\/ Caution![\s\S]*?\n\s*)signingConfig signingConfigs\.debug/,
      '$1signingConfig rpsHasReleaseKey ? signingConfigs.release : signingConfigs.debug',
    );
    mod.modResults.contents = gradle;
    return mod;
  });
};
