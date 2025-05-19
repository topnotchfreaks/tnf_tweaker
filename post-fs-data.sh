#!/system/bin/sh

MODDIR=${0%/*}
CONF="/data/adb/tnftweaker/tweaker_config.conf"

# Load config if exists
[ -f "$CONF" ] && . "$CONF"

# Governor selector
if [ -n "$governor" ]; then
  for cpu_gov in /sys/devices/system/cpu/cpufreq/policy*/scaling_governor; do
    chmod 644 "$cpu_gov"
    echo "$governor" > "$cpu_gov"
    chmod 444 "$cpu_gov"
  done
fi
