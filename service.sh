#!/system/bin/sh

mkdir -p /data/adb/tnftweaker
CONF="/data/adb/tnftweaker/tweaker_config.conf"

# If config doesn't exist, create with default empty keys
[ -f "$CONF" ] || cat <<EOF > "$CONF"
profile=balanced
thermal=enabled
governor=walt
EOF

# Function to safely update a config key
set_config_value() {
    local key="$1"
    local value="$2"

    # If key exists, replace its value; otherwise, append it
    if grep -q "^${key}=" "$CONF"; then
        sed -i "s|^${key}=.*|${key}=${value}|" "$CONF"
    else
        echo "${key}=${value}" >> "$CONF"
    fi
}

# Load config if exists
[ -f "$CONF" ] && . "$CONF"

# Apply kernel profile if set
case "$profile" in
  powersave)   echo 1 > /sys/kernel/kprofiles/kp_mode ;;
  balanced)    echo 2 > /sys/kernel/kprofiles/kp_mode ;;
  performance) echo 3 > /sys/kernel/kprofiles/kp_mode ;;
esac

# Apply thermal setting if set
if [ "$thermal" = "enabled" ]; then
  # Enable thermal throttling (your enable commands)
  sh /data/adb/modules/tnftweaker/scripts/enable_thermal.sh
elif [ "$thermal" = "disabled" ]; then
  # Disable thermal throttling (your disable commands)
  sh /data/adb/modules/tnftweaker/scripts/disable_thermal.sh
fi

# Game detection for bypass charging
GAMELIST="/data/adb/tnftweaker/gamelist.txt"
CURRENT_APP=""

# Create default gamelist if doesn't exist
[ -f "$GAMELIST" ] || {
  cat <<EOF > "$GAMELIST"
com.tencent.ig
com.pubg.krmobile
com.vng.pubgmobile
com.rekoo.pubgm
com.activision.callofduty.shooter
com.dts.freefireth
com.dts.freefiremax
com.ea.gp.apexlegendsmobilefps
com.mobile.legends
com.ngame.allstar.eu
com.garena.game.kgvn
jp.pokemon.pokemonunite
com.riotgames.league.wildrift
com.gameloft.android.ANMP.GloftA9HM
com.ea.games.r3_row
com.ea.gp.fifamobile
jp.konami.pesam
com.mojang.minecraftpe
com.roblox.client
com.and.games505.TerrariaPaid
com.king.candycrushsaga
com.supercell.clashofclans
com.supercell.clashroyale
com.supercell.brawlstars
com.miHoYo.GenshinImpact
com.miHoYo.HonkaiImpact3rd
com.HoYoverse.hkrpgoversea
com.miHoYo.hkrpg
com.cognosphere.zenless
EOF
}

while true; do
  # Get current foreground app
  NEW_APP=$(dumpsys window windows | grep -E 'mCurrentFocus|mFocusedApp' | grep -oE '\b[^ ]+/[^ ]+\b' | cut -d/ -f1)
  
  # Only proceed if app changed
  if [ "$NEW_APP" != "$CURRENT_APP" ]; then
    CURRENT_APP="$NEW_APP"
    
    # Check if current app is in gamelist
    if grep -q "^$CURRENT_APP$" "$GAMELIST"; then
      echo "Game detected: $CURRENT_APP - enabling bypass charging"
      echo 1 > /sys/class/qcom-battery/input_suspend
    else
      # Only disable if bypasscharging wasn't manually enabled
      if [ "$bypasscharging" != "enabled" ]; then
        echo "Non-game app: $CURRENT_APP - disabling bypass charging"
        echo 0 > /sys/class/qcom-battery/input_suspend
      fi
    fi
  fi
  
  sleep 2
done
