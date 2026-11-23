#!/usr/bin/env bash
# One-time setup of the Android release signing key for Practice Koro.
#
# Run it yourself in a terminal:   bash practicekoro_mobile/android/setup-release-key.sh
#
# It asks for a password (not shown, never stored anywhere except android/key.properties,
# which is git-ignored), creates the keystore OUTSIDE the repo in ~/practicekoro-keys/ and
# writes android/key.properties so `flutter build apk --release` signs with it.
#
# IMPORTANT
#  * Back up ~/practicekoro-keys/practicekoro-release.jks AND the password (password manager
#    + one offline copy). If either is lost, you can never ship an update signed with this key.
#  * APKs built so far were signed with the debug key. Android refuses to install an update
#    signed with a different key, so people who installed those APKs must uninstall once and
#    install the new one. Do the switch at a moment you choose.
set -euo pipefail

ANDROID_DIR="$(cd "$(dirname "$0")" && pwd)"
KEY_DIR="${PK_KEY_DIR:-$HOME/practicekoro-keys}"
KEYSTORE="$KEY_DIR/practicekoro-release.jks"
ALIAS="practicekoro"
PROPS="$ANDROID_DIR/key.properties"

if [ -e "$KEYSTORE" ] || [ -e "$PROPS" ]; then
  echo "Refusing to overwrite an existing key:"
  [ -e "$KEYSTORE" ] && echo "  $KEYSTORE"
  [ -e "$PROPS" ] && echo "  $PROPS"
  exit 1
fi
command -v keytool >/dev/null || { echo "keytool not found (install a JDK)."; exit 1; }

read -r -s -p "New keystore password (min 8 characters): " PK_STORE_PASS; echo
read -r -s -p "Repeat password: " PK_STORE_PASS_2; echo
[ "$PK_STORE_PASS" = "$PK_STORE_PASS_2" ] || { echo "Passwords do not match."; exit 1; }
[ "${#PK_STORE_PASS}" -ge 8 ] || { echo "Password is too short."; exit 1; }
case "$PK_STORE_PASS" in *\\*|*$'\n'*) echo "Avoid backslashes in the password."; exit 1;; esac
export PK_STORE_PASS

mkdir -p "$KEY_DIR"
chmod 700 "$KEY_DIR"
keytool -genkeypair -v \
  -keystore "$KEYSTORE" -storetype PKCS12 \
  -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass:env PK_STORE_PASS -keypass:env PK_STORE_PASS \
  -dname "CN=Practice Koro, O=Practice Koro, C=IN"
chmod 600 "$KEYSTORE"

umask 077
cat > "$PROPS" <<PROPS_EOF
storePassword=$PK_STORE_PASS
keyPassword=$PK_STORE_PASS
keyAlias=$ALIAS
storeFile=$KEYSTORE
PROPS_EOF

echo
echo "Done."
echo "  Keystore:       $KEYSTORE"
echo "  key.properties: $PROPS (git-ignored)"
echo "Fingerprint of the new key:"
keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" -storepass:env PK_STORE_PASS | grep -E "SHA256|SHA1"
echo
echo "Now back up the keystore file and the password."
