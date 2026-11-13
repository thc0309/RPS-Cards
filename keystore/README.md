# Keystore

Android signing key for `com.stagoo.rpscards`.

## Create it
```bash
keystore/create-keystore.sh
```
The script asks for the certificate fields (name, organization, city, country), the key alias and a password,
then writes `upload.jks` and `signing.properties` here. You type every value; nothing is generated for you.

## What is versioned
Only this README, the script and `signing.properties.example`.
`upload.jks` and `signing.properties` are **git-ignored on purpose**: this repository is public, and anyone holding the
keystore and its password can sign an update that Android accepts as yours. Back both files up outside git
(password manager, encrypted drive).

## Play Store
Enable **Play App Signing** when you create the app. The key made here is then only the *upload* key, which Google can reset if it is lost.
