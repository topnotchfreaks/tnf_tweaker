#
# Copyright (C) 2024-2025 belowzeroiq
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
#

#!/system/bin/sh

set -e

rm -rf /data/adb/modules/tnftweaker/system

# Universal Thermal Disabler
echo 1 > /sys/class/thermal/thermal_zone*/mode

# Matikan fitur-fitur thermal lainnya
echo 1 > /proc/sys/kernel/sched_boost
echo Y > /sys/module/msm_thermal/parameters/enabled
echo 1 > /sys/module/msm_thermal/core_control/enabled
echo 1 > /sys/kernel/msm_thermal/enabled

# Matikan pengumpulan statistik I/O pada semua perangkat penyimpanan
for queue in /sys/block/sd*/queue
do
    echo "1" > "$queue/iostats"
done

sleep 5

# Thermal Stop Semi-auto Methode
start logd
sleep 1
start android.thermal-hal
sleep 1
start vendor.thermal-engine
sleep 1
start vendor.thermal_manager
sleep 1
start vendor.thermal-manager
sleep 1
start vendor.thermal-hal-2-0
sleep 1
start vendor.thermal-symlinks
sleep 1
start thermal_mnt_hal_service
sleep 1
start thermal
sleep 1
start mi_thermald
sleep 1
start thermald
sleep 1
start thermalloadalgod
sleep 1
start thermalservice
sleep 1
start sec-thermal-1-0
sleep 1
start debug_pid.sec-thermal-1-0
sleep 1
start thermal-engine
sleep 1
start vendor.thermal-hal-1-0
sleep 1
start vendor-thermal-1-0
sleep 1
start thermal-hal
sleep 3

# Thermal start Setprop Methode
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
setprop init.svc.vendor.thermal-symlinks
setprop init.svc.android.thermal-hal running
setprop init.svc.vendor.thermal-hal running
setprop init.svc.thermal-manager running
setprop init.svc.vendor-thermal-hal-1-0 running
setprop init.svc.vendor.thermal-hal-1-0 running
setprop init.svc.vendor.thermal-hal-2-0.mtk running
setprop init.svc.vendor.thermal-hal-2-0 running

# Thermal by @Masramms Telegram
