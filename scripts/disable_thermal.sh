#!/system/bin/sh

set -e

mkdir -p /data/adb/modules/tnftweaker/system
unzip -o /data/adb/modules/tnftweaker/thermal.zip -d /data/adb/modules/tnftweaker/

# Universal Thermal Disabler
echo 0 > /sys/class/thermal/thermal_zone*/mode

# Matikan fitur-fitur thermal lainnya
echo 0 > /proc/sys/kernel/sched_boost
echo N > /sys/module/msm_thermal/parameters/enabled
echo 0 > /sys/module/msm_thermal/core_control/enabled
echo 0 > /sys/kernel/msm_thermal/enabled

# Matikan pengumpulan statistik I/O pada semua perangkat penyimpanan
for queue in /sys/block/sd*/queue
do
    echo "0" > "$queue/iostats"
done

sleep 5

# Thermal Stop Semi-auto Methode
stop logd
sleep 1
stop android.thermal-hal
sleep 1
stop vendor.thermal-engine
sleep 1
stop vendor.thermal_manager
sleep 1
stop vendor.thermal-manager
sleep 1
stop vendor.thermal-hal-2-0
sleep 1
stop vendor.thermal-symlinks
sleep 1
stop thermal_mnt_hal_service
sleep 1
stop thermal
sleep 1
stop mi_thermald
sleep 1
stop thermald
sleep 1
stop thermalloadalgod
sleep 1
stop thermalservice
sleep 1
stop sec-thermal-1-0
sleep 1
stop debug_pid.sec-thermal-1-0
sleep 1
stop thermal-engine
sleep 1
stop vendor.thermal-hal-1-0
sleep 1
stop vendor-thermal-1-0
sleep 1
stop thermal-hal
sleep 3

# Thermal Stop Setprop Methode
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
setprop init.svc.vendor.thermal-symlinks
setprop init.svc.android.thermal-hal stopped
setprop init.svc.vendor.thermal-hal stopped
setprop init.svc.thermal-manager stopped
setprop init.svc.vendor-thermal-hal-1-0 stopped
setprop init.svc.vendor.thermal-hal-1-0 stopped
setprop init.svc.vendor.thermal-hal-2-0.mtk stopped
setprop init.svc.vendor.thermal-hal-2-0 stopped

# Thermal by @Masramms Telegram