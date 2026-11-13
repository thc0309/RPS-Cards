#!/usr/bin/env bash
# Creates the Android upload keystore for com.stagoo.rpscards.
# Run from anywhere:  keystore/create-keystore.sh
# Every identity field and both passwords are typed by you; nothing is generated for you.
# Output (git-ignored on purpose): keystore/upload.jks and keystore/signing.properties
set -euo pipefail

DIR="${KEYSTORE_DIR:-$(cd "$(dirname "$0")" && pwd)}"
JAVA_HOME_DEFAULT="/Users/chuongtong/Library/Java/JavaVirtualMachines/jbr-17.0.14/Contents/Home"
KEYTOOL="${KEYTOOL:-${JAVA_HOME:-$JAVA_HOME_DEFAULT}/bin/keytool}"
[ -x "$KEYTOOL" ] || KEYTOOL="$(command -v keytool || true)"
[ -x "$KEYTOOL" ] || { echo "keytool not found. Set JAVA_HOME to a JDK 17." >&2; exit 1; }

STORE="$DIR/upload.jks"
PROPS="$DIR/signing.properties"
if [ -e "$STORE" ] || [ -e "$PROPS" ]; then
  echo "Refusing to overwrite an existing keystore in $DIR. Move or delete it first." >&2
  exit 1
fi

ask() { # ask <label> <default> -> echoes the answer
  local answer
  read -r -p "$1${2:+ [$2]}: " answer
  echo "${answer:-$2}"
}
clean() { printf '%s' "$1" | tr -d ',="\\'; } # keep the distinguished name well-formed

echo "== Certificate identity (public: it is embedded in every APK) =="
CN="$(clean "$(ask 'Name (CN)' '')")"
OU="$(clean "$(ask 'Unit (OU)' '')")"
O="$(clean "$(ask 'Organization (O)' '')")"
L="$(clean "$(ask 'City (L)' '')")"
ST="$(clean "$(ask 'State/Province (ST)' '')")"
C="$(clean "$(ask 'Country, 2 letters (C)' 'VN')")"
ALIAS="$(clean "$(ask 'Key alias' 'bao-bua-keo-upload')")"
DAYS="$(ask 'Validity in days (must pass Oct 2033)' '10000')"
[ -n "$CN" ] && [ "${#C}" -eq 2 ] && [ -n "$ALIAS" ] || { echo "Name, 2-letter country and alias are required." >&2; exit 1; }

DNAME="CN=$CN"
for pair in "OU=$OU" "O=$O" "L=$L" "ST=$ST" "C=$C"; do
  [ -n "${pair#*=}" ] && DNAME="$DNAME, $pair"
done

echo "== Password (at least 8 characters; used for both the store and the key) =="
read -r -s -p "Password: " PW; echo
read -r -s -p "Repeat password: " PW2; echo
[ "$PW" = "$PW2" ] && [ "${#PW}" -ge 8 ] || { echo "Passwords differ or are shorter than 8 characters." >&2; exit 1; }

umask 077
export RPS_KS_PASSWORD="$PW"
"$KEYTOOL" -genkeypair -storetype PKCS12 -keystore "$STORE" -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity "$DAYS" -dname "$DNAME" \
  -storepass:env RPS_KS_PASSWORD -keypass:env RPS_KS_PASSWORD

{
  echo "# Release signing for com.stagoo.rpscards. Never share this file."
  echo "RPS_UPLOAD_STORE_FILE=$STORE"
  echo "RPS_UPLOAD_KEY_ALIAS=$ALIAS"
  echo "RPS_UPLOAD_STORE_PASSWORD=$PW"
  echo "RPS_UPLOAD_KEY_PASSWORD=$PW"
} > "$PROPS"
chmod 600 "$STORE" "$PROPS"

echo; echo "Created $STORE"
echo "Fingerprints (public, needed by Play Console / Firebase):"
"$KEYTOOL" -list -v -keystore "$STORE" -alias "$ALIAS" -storepass:env RPS_KS_PASSWORD | grep -E "SHA1|SHA256|Valid from" | sed 's/^ *//'
echo; echo "Back up $DIR (the .jks and signing.properties) somewhere safe now."
