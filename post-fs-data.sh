#
# Copyright (C) 2025 belowzeroiq
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

MODDIR=${0%/*}
CONF="/data/adb/tnftweaker/tweaker_config.conf"

# Load config if exists
[ -f "$CONF" ] && . "$CONF"

# Governor selector
if [ -n "$governor" ]; then
  for cpu_gov in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
    chmod 644 "$cpu_gov"
    echo "$governor" > "$cpu_gov"
    chmod 444 "$cpu_gov"
  done
fi
