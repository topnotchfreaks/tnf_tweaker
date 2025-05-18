#!/system/bin/sh

mkdir -p /data/adb/tnftweaker
CONF="/data/adb/tnftweaker/tweaker_config.conf"

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
  echo enabled > /sys/class/thermal/thermal_zone*/mode
  echo 1 > /sys/kernel/sched_boost
  echo Y > /sys/module/msm_thermal/parameters/enabled
  echo 1 > /sys/module/msm_thermal/core_control/enabled
  echo 1 > /sys/kernel/msm_thermal/enabled
  setprop init.svc.thermal running
  setprop init.svc.thermal-managers running
  setprop init.svc.thermal_manager running
  setprop init.svc.thermal_mnt_hal_service running
  setprop init.svc.thermal-engine running
  setprop init.svc.mi-thermald running
  setprop init.svc.mi_thermald running
  setprop init.svc.thermalloadalgod running
  setprop init.svc.thermalservice running
  setprop init.svc.thermal-hal running
  setprop init.svc.vendor.thermal-symlinks running
  setprop init.svc.android.thermal-hal running
  setprop init.svc.vendor.thermal-hal running
  setprop init.svc.thermal-manager running
  setprop init.svc.vendor-thermal-hal-1-0 running
  setprop init.svc.vendor.thermal-hal-1-0 running
  setprop init.svc.vendor.thermal-hal-2-0.mtk running
  setprop init.svc.vendor.thermal-hal-2-0 running
elif [ "$thermal" = "disabled" ]; then
  # Disable thermal throttling (your disable commands)
  echo 0 > /sys/class/thermal/thermal_zone*/mode
  echo 0 > /sys/kernel/sched_boost
  echo N > /sys/module/msm_thermal/parameters/enabled
  echo 0 > /sys/module/msm_thermal/core_control/enabled
  echo 0 > /sys/kernel/msm_thermal/enabled
  setprop init.svc.thermal stopped
  setprop init.svc.thermal-managers stopped
  setprop init.svc.thermal_manager stopped
  setprop init.svc.thermal_mnt_hal_service stopped
  setprop init.svc.thermal-engine stopped
  setprop init.svc.mi-thermald stopped
  setprop init.svc.mi_thermald stopped
  setprop init.svc.thermalloadalgod stopped
  setprop init.svc.thermalservice stopped
  setprop init.svc.thermal-hal stopped
  setprop init.svc.vendor.thermal-symlinks stopped
  setprop init.svc.android.thermal-hal stopped
  setprop init.svc.vendor.thermal-hal stopped
  setprop init.svc.thermal-manager stopped
  setprop init.svc.vendor-thermal-hal-1-0 stopped
  setprop init.svc.vendor.thermal-hal-1-0 stopped
  setprop init.svc.vendor.thermal-hal-2-0.mtk stopped
  setprop init.svc.vendor.thermal-hal-2-0 stopped
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
