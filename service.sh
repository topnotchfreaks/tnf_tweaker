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