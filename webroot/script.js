//
// Copyright (C) 2025 belowzeroiq
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//

    // filepath: /home/env/Documents/GitHub/tnf_tweaker/webroot/index.html
    // --- KernelSU JS API helpers ---
    let callbackCounter = 0;
    function getUniqueCallbackName(prefix) {
      return `${prefix}_callback_${Date.now()}_${callbackCounter++}`;
    }

    function exec(command, options) {
      if (typeof options === "undefined") options = {};
      return new Promise((resolve, reject) => {
        const callbackFuncName = getUniqueCallbackName("exec");
        window[callbackFuncName] = (errno, stdout, stderr) => {
          resolve({ errno, stdout, stderr });
          delete window[callbackFuncName];
        };
        try {
          ksu.exec(command, JSON.stringify(options), callbackFuncName);
        } catch (error) {
          reject(error);
          delete window[callbackFuncName];
        }
      });
    }

    async function updateTweakerConfig(key, value) {
    const path = "/data/adb/tnftweaker/tweaker_config.conf";

      try {
        const { stdout } = await exec(`cat ${path} || touch ${path} && echo ""`);
        const lines = stdout.split("\n").filter(Boolean);
        let updated = false;
      
        // Update line if key exists
        const newLines = lines.map(line => {
          if (line.startsWith(`${key}=`)) {
            updated = true;
            return `${key}=${value}`;
          }
          return line;
        });
      
        if (!updated) {
          newLines.push(`${key}=${value}`);
        }
      
        const newContent = newLines.join("\n");
      
        await exec(`echo "${newContent}" > ${path}`);
      } catch (err) {
        console.error("Failed to update tweaker_config.conf:", err);
      }
    }

    // Function to load the current kernel profile
    const profileSelect = document.getElementById('profileSelect');
    const profileIcon = document.getElementById('profileIcon');
    const icons = {
      powersave: 'icons/powersave.png',
      balanced: 'icons/balanced.png',
      performance: 'icons/performance.png',
    };

    async function loadCurrentProfile() {
      try {
        const { stdout } = await exec('cat /sys/kernel/kprofiles/kp_mode');
        const val = stdout.trim();
        const map = { '1': 'powersave', '2': 'balanced', '3': 'performance' };
        const profile = map[val] || 'balanced';
        profileSelect.value = profile;
        profileIcon.src = icons[profile];
      } catch (err) {
        console.error("Failed to read kernel profile:", err);
      }
    }

    // Function to set kernel profile mode
    function setKProfilesMode(mode) {
      // Map mode string to value
      let value = "3"; // Default to Performance
      if (mode === "powersave") value = "1";
      else if (mode === "balanced") value = "2";
      else if (mode === "performance") value = "3";
      // Execute the shell command
      return exec(`echo ${value} > /sys/kernel/kprofiles/kp_mode`);
    }

    // --- UI logic ---
    document.addEventListener('DOMContentLoaded', async () => {
      fetchDeviceInfo(); // Start fetching device info immediately

      await loadTweakerConfig();

      // Profile icon logic
      const profileSelect = document.getElementById('profile-select');
      const profileIcon = document.getElementById('profile-icon');
      const applyProfileBtn = document.getElementById('apply-profile');
      const icons = {
        powersave: 'assets/powersave.svg',
        balanced: 'assets/balanced.svg',
        performance: 'assets/performance.svg'
      };

      if (applyProfileBtn && profileSelect) {
        applyProfileBtn.addEventListener('click', () => {
          const selectedText = profileSelect.options[profileSelect.selectedIndex].text;
          setKProfilesMode(profileSelect.value)
            .then(() => {
              showToast(`Applied profile: ${selectedText}`);
              // Save the selected profile persistently for boot
              exec(`sed -i 's/^profile=.*/profile=${profileSelect.value}/' /data/adb/tnftweaker/tweaker_config.conf`);
            })
            .catch(() => showToast('Failed to apply profile'));
        });
      }

      // Remove this block to prevent auto-applying on select change:
      if (profileSelect && profileIcon) {
        profileSelect.addEventListener('change', (e) => {
          profileIcon.src = icons[e.target.value] || icons.balanced;
          showToast(`Profile set to ${e.target.options[e.target.selectedIndex].text}`);
        });
        profileIcon.src = icons[profileSelect.value] || icons.balanced;
      }

      // Toast for toggles
      document.querySelectorAll('input[type="checkbox"]').forEach(toggle => {
        // Skip bypass toggle and thermal toggle (handled separately)
        if (toggle.id === 'bypass-toggle' || toggle.id === 'thermal-toggle') return;
        toggle.addEventListener('change', (e) => {
          const label = e.target.closest('.flex.items-center.space-x-2')?.innerText ||
                        e.target.closest('.flex.items-center')?.innerText ||
                        'Setting';
          showToast(`${label.trim()} ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
        // Skip bypass toggle and charging toggle (handled separately)
        if (toggle.id === 'bypass-toggle' || toggle.id === 'charging-toggle') return;
        toggle.addEventListener('change', (e) => {
          const label = e.target.closest('.flex.items-center.space-x-2')?.innerText ||
                        e.target.closest('.flex.items-center')?.innerText ||
                        'Setting';
          showToast(`${label.trim()} ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
      });

    // Load current profile on page load
    document.addEventListener("DOMContentLoaded", () => {
      profileSelect.addEventListener("change", async () => {
        const selected = profileSelect.value;
        await setKProfilesMode(selected);
        await updateTweakerConfig("profile", selected);
      });
    
      loadCurrentProfile(); // This alone is enough
    });

      // Thermal toggle logic
      const thermalToggle = document.getElementById('thermal-toggle');
      const thermalStatus = document.getElementById('thermal-status');
        
      if (thermalToggle && thermalStatus) {
        thermalToggle.addEventListener('change', async (e) => {
          const enabled = e.target.checked;
          const result = await setThermalThrottling(enabled);
        
          thermalStatus.textContent = result ? (enabled ? 'Enabled' : 'Disabled') : 'Failed';
          showToast('Reboot to apply thermal change');
        
          await updateTweakerConfig("thermal", enabled ? "enabled" : "disabled");
        });
      }

      // Bypass Charging toggle logic
      const chargingToggle = document.getElementById('charging-toggle');
      const chargingStatus = document.getElementById('charging-status');
        
      if (chargingToggle && chargingStatus) {
        chargingToggle.addEventListener('change', async (e) => {
          const enabled = e.target.checked;
          const result = await setBypassCharging(enabled);
        
          chargingStatus.textContent = result ? (enabled ? 'Enabled' : 'Disabled') : 'Failed';
          showToast(`Bypass charging ${result ? (enabled ? 'enabled' : 'disabled') : 'failed'}`);
        
        });
      }

      // Initial fetches
      fetchDeviceInfo();
    });

    // Toast notification function
    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.remove('opacity-0', 'pointer-events-none');
      toast.classList.add('opacity-100');
      clearTimeout(window._toastTimeout);
      window._toastTimeout = setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
      }, 2000);
    }

    // Fetch kernel version and device model using KernelSU exec
    function fetchDeviceInfo() {
      // Start both fetches at the same time
      exec('uname -r').then(({ stdout }) => {
        document.getElementById('kernel-version').textContent = stdout.trim() || 'Unknown';
      }).catch(() => {
        document.getElementById('kernel-version').textContent = 'Error loading';
      });

      exec('getprop ro.product.vendor.model').then(({ stdout }) => {
        document.getElementById('device-model').textContent = stdout.trim() || 'Unknown';
      }).catch(() => {
        document.getElementById('device-model').textContent = 'Error loading';
      });
    }

// Function to the thermal throttling
async function setThermalThrottling(enable) {
  try {
    let commands = [];
    if (enable) {
      commands = [
        `sh /data/adb/modules/tnftweaker/scripts/enable_thermal.sh`,
      ];
    } else {
      commands = [
        `sh /data/adb/modules/tnftweaker/scripts/disable_thermal.sh`
      ];
    }
    for (const cmd of commands) {
      await exec(cmd);
    }
    return true;
  } catch {
    return false;
  }
}

    // Set bypass charging state using KernelSU exec
    async function setBypassCharging(enable) {
      try {
        let commands = [];
        if (enable) {
          commands = [
            `echo 1 > /sys/class/qcom-battery/input_suspend`
          ];
        } else {
          commands = [
            `echo 0 > /sys/class/qcom-battery/input_suspend`
          ];
        }
        for (const cmd of commands) {
          await exec(cmd);
        }
        return true;
      } catch {
        return false;
      }
    }

    async function loadTweakerConfig() {
      const path = "/data/adb/tnftweaker/tweaker_config.conf";
      try {
        const { stdout } = await exec(`cat ${path} || echo ""`);
        const lines = stdout.split("\n").filter(Boolean);
        let profile = "balanced";
        let thermal = "enabled";

        lines.forEach(line => {
          if (line.startsWith("profile=")) profile = line.split("=")[1];
          if (line.startsWith("thermal=")) thermal = line.split("=")[1];
          // bypasscharging= is ignored
        });

        // Set kernel profile select and icon
        const profileSelect = document.getElementById('profile-select');
        const profileIcon = document.getElementById('profile-icon');
        if (profileSelect) {
          profileSelect.value = profile;
          if (profileIcon) {
            const icons = {
              powersave: 'assets/powersave.svg',
              balanced: 'assets/balanced.svg',
              performance: 'assets/performance.svg'
            };
            profileIcon.src = icons[profile] || icons.balanced;
          }
          // Apply the profile to the system
          await setKProfilesMode(profile);
        }

        // Set thermal toggle and status
        const thermalToggle = document.getElementById('thermal-toggle');
        const thermalStatus = document.getElementById('thermal-status');
        if (thermalToggle && thermalStatus) {
          thermalToggle.checked = (thermal === "enabled");
          await setThermalThrottling(thermal === "enabled");
          thermalStatus.textContent = (thermal === "enabled") ? "Enabled" : "Disabled";
        }

        // Set bypass charging toggle and status
        const chargingToggle = document.getElementById('charging-toggle');
        const chargingStatus = document.getElementById('charging-status');
        if (chargingToggle && chargingStatus) {
          chargingToggle.checked = (bypasscharging === "enabled");
          await setBypassCharging(bypasscharging === "enabled");
          chargingStatus.textContent = (bypasscharging === "enabled") ? "Enabled" : "Disabled";
        }
      } catch (err) {
        console.error("Failed to load tweaker_config.conf:", err);
      }
    }

    loadTweakerConfig();

function updateLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const langSelect = document.getElementById('lang-select');
  langSelect.addEventListener('change', (e) => {
    updateLanguage(e.target.value);
    localStorage.setItem('tnf_lang', e.target.value);
  });

  // Set initial language
  const savedLang = localStorage.getItem('tnf_lang') || 'en';
  langSelect.value = savedLang;
  updateLanguage(savedLang);
});

document.addEventListener('DOMContentLoaded', () => {
  updateDeviceStats();
  setInterval(updateDeviceStats, 3000); // Refresh every 3 seconds
});

async function updateDeviceStats() {
  try {
    // 1. CPU Big Frequency (assumed from policy4 – adjust if necessary)
    const { stdout: cpuBigRaw } = await exec("cat /sys/devices/system/cpu/cpufreq/policy4/scaling_cur_freq");
    const cpuBigMHz = Math.round(parseInt(cpuBigRaw.trim()) / 1000);
    document.getElementById('cpu-big-clock').textContent = `${cpuBigMHz}MHz`;

    // 2. CPU Little Frequency (assumed from policy4 – adjust if necessary)
    const { stdout: cpuFreqRaw } = await exec("cat /sys/devices/system/cpu/cpufreq/policy0/scaling_cur_freq");
    const cpuMHz = Math.round(parseInt(cpuFreqRaw.trim()) / 1000);
    document.getElementById('cpu-little-clock').textContent = `${cpuMHz}MHz`;

    // Battery Temperature (°C)
    const { stdout: battTempRaw } = await exec("cat /sys/class/power_supply/battery/temp");
    const battTempC = (parseInt(battTempRaw.trim()) / 10).toFixed(1);
    document.getElementById('battery-temp').textContent = `${battTempC}°C`;

    // RAM Utilization (%)
    const { stdout: memInfoRaw } = await exec("cat /proc/meminfo");
    const memInfo = parseMemInfo(memInfoRaw);
    const ramUsedPercent = Math.round(((memInfo.MemTotal - memInfo.MemAvailable) / memInfo.MemTotal) * 100);
    document.getElementById('ram-util').textContent = `${ramUsedPercent}%`;

  } catch (err) {
    console.error('Error updating device stats:', err);
  }
}

// Parse /proc/meminfo into object { MemTotal: bytes, MemAvailable: bytes, ... }
function parseMemInfo(raw) {
  return raw.split('\n').reduce((acc, line) => {
    const [key, val] = line.split(':');
    if (!key || !val) return acc;
    acc[key.trim()] = parseInt(val.trim().split(' ')[0]) * 1024; // from kB to bytes
    return acc;
  }, {});
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadAvailableGovernors(); // Load governors on page load
});

// Load available governors
async function loadAvailableGovernors() {
  try {
    const { stdout } = await exec("cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors");
    const governors = stdout.trim().split(/\s+/);
    const select = document.getElementById("governor-select");

    select.innerHTML = ""; // Clear existing options
    governors.forEach(gov => {
      const option = document.createElement("option");
      option.value = gov;
      option.textContent = gov.charAt(0).toUpperCase() + gov.slice(1);
      select.appendChild(option);
    });

    // Set current governor (read from cpu0 as representative)
    const { stdout: current } = await exec("cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor");
    select.value = current.trim();
  } catch (err) {
    console.error("Governor loading error:", err);
    showToast("Failed to load governors");
  }
}

// Apply governor on button click
document.getElementById("apply-governor").addEventListener("click", async () => {
  const selectedGovernor = document.getElementById("governor-select").value;
  if (!selectedGovernor) return showToast("Select a governor first");

  try {
    const { stdout } = await exec("ls -d /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor");
    const cpuGovernorPaths = stdout.trim().split("\n");

    for (const path of cpuGovernorPaths) {
      await exec(`chmod 644 ${path}`); // Make it writable
      await exec(`echo ${selectedGovernor} > ${path}`); // Apply governor
      await exec(`chmod 444 ${path}`); // Lock it again
    }

    showToast(`Governor set to ${selectedGovernor}`);
    await updateTweakerConfig("governor", selectedGovernor);
  } catch (err) {
    console.error("Governor apply error:", err);
    showToast("Failed to apply governor");
  }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Add Game Button
    document.getElementById('add-game').addEventListener('click', showAddGameModal);

    // Edit Game List Button
    document.getElementById('edit-gamelist').addEventListener('click', () => {
        document.getElementById('gamelist-modal').classList.remove('hidden');
    });

    // Cancel Add Game Button
    document.getElementById('cancel-addgame').addEventListener('click', () => {
        document.getElementById('addgame-modal').classList.add('hidden');
    });

    // Cancel Edit Game List Button
    document.getElementById('cancel-gamelist').addEventListener('click', () => {
        document.getElementById('gamelist-modal').classList.add('hidden');
    });

    // Confirm Add Game Button
    document.getElementById('confirm-addgame').addEventListener('click', addGamePackage);

    // Save Game List Button
    document.getElementById('save-gamelist').addEventListener('click', saveGameList);

    await loadGameList(); // Load the game list on page load
});

// Function to show Add Game Modal
function showAddGameModal() {
    document.getElementById('addgame-modal').classList.remove('hidden');
    document.getElementById('game-package-input').focus(); // Focus on the input field
}

// Function to add a game package
async function addGamePackage() {
    const packageName = document.getElementById('game-package-input').value.trim();

    if (!packageName) {
        showToast('Please enter a package name');
        return;
    }

    try {
        // Check if package already exists
        const { stdout } = await exec('cat /data/adb/tnftweaker/gamelist.txt || echo ""');
        const games = stdout.trim().split('\n').filter(Boolean);

        if (games.includes(packageName)) {
            showToast('This game is already in the list');
            return;
        }

        // Add the new package
        await exec(`echo "${packageName}" >> /data/adb/tnftweaker/gamelist.txt`);
        document.getElementById('game-package-input').value = ''; // Clear input
        document.getElementById('addgame-modal').classList.add('hidden'); // Hide modal
        loadGameList(); // Reload the game list
        showToast('Game added successfully');
    } catch (err) {
        console.error("Failed to add game:", err);
        showToast('Failed to add game');
    }
}

// Function to save the game list
async function saveGameList() {
    const content = document.getElementById('gamelist-edit').value.trim();
    try {
        await exec(`echo "${content}" > /data/adb/tnftweaker/gamelist.txt`);
        loadGameList(); // Reload the game list
        showToast('Game list saved');
        document.getElementById('gamelist-modal').classList.add('hidden'); // Hide modal
    } catch (err) {
        console.error("Failed to save game list:", err);
        showToast('Failed to save game list');
    }
}

// Function to show toast notifications
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2000);
}

// Function to load the game list
async function loadGameList() {
    try {
        // Read the game list from the file
        const { stdout } = await exec('cat /data/adb/tnftweaker/gamelist.txt || echo ""');
        const games = stdout.trim().split('\n').filter(Boolean); // Split by new lines and filter out empty lines

        // Update the game list preview area
        const gamelistPreview = document.getElementById('gamelist-preview');
        if (games.length > 0) {
            gamelistPreview.textContent = games.join('\n'); // Join games with new lines for display
        } else {
            gamelistPreview.textContent = 'No games in list'; // Display message if no games
        }

        // Update the textarea in the edit modal
        const gamelistEdit = document.getElementById('gamelist-edit');
        gamelistEdit.value = games.join('\n'); // Set the textarea value to the game list
    } catch (err) {
        console.error("Failed to load game list:", err);
        showToast('Failed to load game list');
    }
}

  