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

    // --- KernelSU Exec Utilities ---
    let callbackCounter = 0;
    function getUniqueCallbackName(prefix) {
      return `${prefix}_callback_${Date.now()}_${callbackCounter++}`;
    }

    function exec(command, options = {}) {
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

    // --- Config Management ---
    async function updateTweakerConfig(key, value) {
      const path = "/data/adb/tnftweaker/tweaker_config.conf";
      try {
        const { stdout } = await exec(`cat ${path} || touch ${path} && echo ""`);
        const lines = stdout.split("\n").filter(Boolean);
        let updated = false;
        const newLines = lines.map(line => {
          if (line.startsWith(`${key}=`)) {
            updated = true;
            return `${key}=${value}`;
          }
          return line;
        });
        if (!updated) newLines.push(`${key}=${value}`);
        const newContent = newLines.join("\n");
        await exec(`echo "${newContent}" > ${path}`);
      } catch (err) {
        console.error("Failed to update tweaker_config.conf:", err);
      }
    }

    async function loadTweakerConfig() {
      const path = "/data/adb/tnftweaker/tweaker_config.conf";
      try {
        const { stdout } = await exec(`cat ${path} || echo ""`);
        const lines = stdout.split("\n").filter(Boolean);
        let profile = "balanced";
        let thermal = "enabled";
        let bypasscharging = "disabled";
        for (const line of lines) {
          if (line.startsWith("profile=")) profile = line.split("=")[1];
          else if (line.startsWith("thermal=")) thermal = line.split("=")[1];
          else if (line.startsWith("bypasscharging=")) bypasscharging = line.split("=")[1];
        }
        setProfileUI(profile);
        setThermalUI(thermal === "enabled");
        setBypassChargingUI(bypasscharging === "enabled");
      } catch (err) {
        console.error("Failed to load tweaker_config.conf:", err);
      }
    }

    // --- UI Setters ---
    async function setProfileUI(profile) {
      const profileSelect = document.getElementById('profile-select');
      const profileIcon = document.getElementById('profile-icon');
      const icons = {
        powersave: 'assets/powersave.svg',
        balanced: 'assets/balanced.svg',
        performance: 'assets/performance.svg'
      };
      if (profileSelect) {
        profileSelect.value = profile;
        if (profileIcon) profileIcon.src = icons[profile] || icons.balanced;
        await setKProfilesMode(profile);
      }
    }

    async function setThermalUI(enabled) {
      const thermalToggle = document.getElementById('thermal-toggle');
      const thermalStatus = document.getElementById('thermal-status');
      if (thermalToggle && thermalStatus) {
        thermalToggle.checked = enabled;
        await setThermalThrottling(enabled);
        thermalStatus.textContent = enabled ? "Enabled" : "Disabled";
      }
    }

    async function setBypassChargingUI(enabled) {
      const chargingToggle = document.getElementById('charging-toggle');
      const chargingStatus = document.getElementById('charging-status');
      if (chargingToggle && chargingStatus) {
        chargingToggle.checked = enabled;
        await setBypassCharging(enabled);
        chargingStatus.textContent = enabled ? "Enabled" : "Disabled";
      }
    }

    // --- Kernel Profile Logic ---
    async function isKProfilesSupported() {
      try {
        const { stdout, errno } = await exec('cat /sys/kernel/kprofiles/kp_mode');
        return errno === 0 && !!stdout.trim();
      } catch {
        return false;
      }
    }

    function setKProfilesSupportText(supported) {
      let info = document.getElementById('kprofiles-support-info');
      if (!info) {
        const container = document.querySelector('.px-6.mt-6');
        if (container) {
          info = document.createElement('div');
          info.id = 'kprofiles-support-info';
          info.className = 'mt-2 text-xs text-red-400';
          info.setAttribute('data-i18n', 'kprofiles_support_info');
          container.appendChild(info);
        }
      }
      if (info) {
        if (supported) {
          info.textContent = '';
        } else {
          const lang = localStorage.getItem('tnf_lang') || 'en';
          info.textContent = translations[lang]?.kprofiles_support_info || 'Kernel profiles not supported by current kernel!';
        }
      }
    }

    async function loadCurrentProfile() {
      const supported = await isKProfilesSupported();
      setKProfilesSupportText(supported);
      if (!supported) return;
      try {
        const { stdout } = await exec('cat /sys/kernel/kprofiles/kp_mode');
        const val = stdout.trim();
        const map = { '1': 'powersave', '2': 'balanced', '3': 'performance' };
        const profile = map[val] || 'balanced';
        setProfileUI(profile);
      } catch (err) {
        console.error("Failed to read kernel profile:", err);
      }
    }

    function setKProfilesMode(mode) {
      let value = "2";
      if (mode === "powersave") value = "1";
      else if (mode === "balanced") value = "2";
      else if (mode === "performance") value = "3";
      return exec(`echo ${value} > /sys/kernel/kprofiles/kp_mode`);
    }

    // --- Thermal & Charging Logic ---
    async function setThermalThrottling(enable) {
      try {
        const script = enable
          ? "enable_thermal.sh"
          : "disable_thermal.sh";
        await exec(`sh /data/adb/modules/tnftweaker/scripts/${script}`);
        return true;
      } catch {
        return false;
      }
    }

    async function setBypassCharging(enable) {
      try {
        await exec(`echo ${enable ? 1 : 0} > /sys/class/qcom-battery/input_suspend`);
        return true;
      } catch {
        return false;
      }
    }

    // --- Device Info & Stats ---
    function fetchDeviceInfo() {
      // Run both commands in parallel for speed
      Promise.all([
        exec('uname -r'),
        exec('getprop ro.product.vendor.model')
      ]).then(([kernel, model]) => {
        document.getElementById('kernel-version').textContent = kernel.stdout.trim() || 'Unknown';
        document.getElementById('device-model').textContent = model.stdout.trim() || 'Unknown';
      }).catch(() => {
        document.getElementById('kernel-version').textContent = 'Error loading';
        document.getElementById('device-model').textContent = 'Error loading';
      });
    }

    async function updateDeviceStats() {
      try {
        const [
          cpuBigRaw,
          cpuFreqRaw,
          battTempRaw,
          memInfoRaw
        ] = await Promise.all([
          exec("cat /sys/devices/system/cpu/cpufreq/policy4/scaling_cur_freq"),
          exec("cat /sys/devices/system/cpu/cpufreq/policy0/scaling_cur_freq"),
          exec("cat /sys/class/power_supply/battery/temp"),
          exec("cat /proc/meminfo")
        ]);
        document.getElementById('cpu-big-clock').textContent =
          `${Math.round(parseInt(cpuBigRaw.stdout.trim()) / 1000)}MHz`;
        document.getElementById('cpu-little-clock').textContent =
          `${Math.round(parseInt(cpuFreqRaw.stdout.trim()) / 1000)}MHz`;
        document.getElementById('battery-temp').textContent =
          `${(parseInt(battTempRaw.stdout.trim()) / 10).toFixed(1)}°C`;
        const memInfo = parseMemInfo(memInfoRaw.stdout);
        const ramUsedPercent = Math.round(((memInfo.MemTotal - memInfo.MemAvailable) / memInfo.MemTotal) * 100);
        document.getElementById('ram-util').textContent = `${ramUsedPercent}%`;
      } catch (err) {
        console.error('Error updating device stats:', err);
      }
    }

    function parseMemInfo(raw) {
      return raw.split('\n').reduce((acc, line) => {
        const [key, val] = line.split(':');
        if (!key || !val) return acc;
        acc[key.trim()] = parseInt(val.trim().split(' ')[0]) * 1024;
        return acc;
      }, {});
    }

    // --- Governor Logic ---
    async function loadAvailableGovernors() {
      try {
        const [{ stdout }, { stdout: current }] = await Promise.all([
          exec("cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors"),
          exec("cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor")
        ]);
        const governors = stdout.trim().split(/\s+/);
        const select = document.getElementById("governor-select");
        select.innerHTML = "";
        governors.forEach(gov => {
          const option = document.createElement("option");
          option.value = gov;
          option.textContent = gov.charAt(0).toUpperCase() + gov.slice(1);
          select.appendChild(option);
        });
        select.value = current.trim();
      } catch (err) {
        console.error("Governor loading error:", err);
        showToast("Failed to load governors");
      }
    }

    async function applyGovernor() {
      const selectedGovernor = document.getElementById("governor-select").value;
      if (!selectedGovernor) return showToast("Select a governor first");
      try {
        const { stdout } = await exec("ls -d /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor");
        const cpuGovernorPaths = stdout.trim().split("\n");
        await Promise.all(cpuGovernorPaths.map(async path => {
          await exec(`chmod 644 ${path}`);
          await exec(`echo ${selectedGovernor} > ${path}`);
          await exec(`chmod 444 ${path}`);
        }));
        showToast(`Governor set to ${selectedGovernor}`);
        await updateTweakerConfig("governor", selectedGovernor);
      } catch (err) {
        console.error("Governor apply error:", err);
        showToast("Failed to apply governor");
      }
    }

    // --- Toast Notification ---
    function showToast(message) {
      const toast = document.getElementById('toast');

      if (message.length > 25) {
        toast.classList.add('text-xs', 'max-w-xs', 'break-words', 'px-4');
      } else {
        toast.classList.remove('text-xs', 'max-w-xs', 'break-words', 'px-4');
      }

      toast.textContent = message;

      toast.classList.remove('opacity-0', 'pointer-events-none');
      toast.classList.add('opacity-100');
      clearTimeout(window._toastTimeout);
      window._toastTimeout = setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
      }, 2000);
    }

    // --- Language ---
    function updateLanguage(lang) {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
          el.textContent = translations[lang][key];
        }
      });
    }

    // --- Game List Logic ---
    async function loadGameList() {
      try {
        const { stdout } = await exec('cat /data/adb/tnftweaker/gamelist.txt || echo ""');
        const games = stdout.trim().split('\n').filter(Boolean);
        const gamelistPreview = document.getElementById('gamelist-preview');
        gamelistPreview.textContent = games.length > 0 ? games.join('\n') : 'No games in list';
        document.getElementById('gamelist-edit').value = games.join('\n');
      } catch (err) {
        console.error("Failed to load game list:", err);
        showToast('Failed to load game list');
      }
    }

    async function addGamePackage() {
      const packageName = document.getElementById('game-package-input').value.trim();
      if (!packageName) return showToast('Please enter a package name');
      try {
        const { stdout } = await exec('cat /data/adb/tnftweaker/gamelist.txt || echo ""');
        const games = stdout.trim().split('\n').filter(Boolean);
        if (games.includes(packageName)) return showToast('This game is already in the list');
        await exec(`echo "${packageName}" >> /data/adb/tnftweaker/gamelist.txt`);
        document.getElementById('game-package-input').value = '';
        document.getElementById('addgame-modal').classList.add('hidden');
        loadGameList();
        showToast('Game added successfully');
      } catch (err) {
        console.error("Failed to add game:", err);
        showToast('Failed to add game');
      }
    }

    async function saveGameList() {
      const content = document.getElementById('gamelist-edit').value.trim();
      try {
        await exec(`echo "${content}" > /data/adb/tnftweaker/gamelist.txt`);
        loadGameList();
        showToast('Game list saved');
        document.getElementById('gamelist-modal').classList.add('hidden');
      } catch (err) {
        console.error("Failed to save game list:", err);
        showToast('Failed to save game list');
      }
    }

    function showAddGameModal() {
      document.getElementById('addgame-modal').classList.remove('hidden');
      document.getElementById('game-package-input').focus();
    }

    // --- Event Listeners ---
    document.addEventListener('DOMContentLoaded', async () => {
      fetchDeviceInfo();
      await Promise.all([
        loadTweakerConfig(),
        loadAvailableGovernors()
      ]);
      updateDeviceStats();
      setInterval(updateDeviceStats, 3000);

      await loadCurrentProfile();

      const profileSelect = document.getElementById('profile-select');
      const profileIcon = document.getElementById('profile-icon');
      const applyProfileBtn = document.getElementById('apply-profile');
      const icons = {
        powersave: 'assets/powersave.svg',
        balanced: 'assets/balanced.svg',
        performance: 'assets/performance.svg'
      };

      if (applyProfileBtn && profileSelect) {
        applyProfileBtn.addEventListener('click', async () => {
          if (await isKProfilesSupported()) {
            const selectedText = profileSelect.options[profileSelect.selectedIndex].text;
            setKProfilesMode(profileSelect.value)
              .then(() => {
                showToast(`Applied profile: ${selectedText}`);
                updateTweakerConfig("profile", profileSelect.value);
              })
              .catch(() => showToast('Failed to apply profile'));
          } else {
            showToast("Kernel profiles not supported");
          }
        });
      }

      if (profileSelect && profileIcon) {
        profileSelect.addEventListener('change', (e) => {
          profileIcon.src = icons[e.target.value] || icons.balanced;
        });
        profileIcon.src = icons[profileSelect.value] || icons.balanced;
      }

      // --- Thermal Throttling toggle ---
      const thermalToggle = document.getElementById('thermal-toggle');
      const thermalStatus = document.getElementById('thermal-status');
      if (thermalToggle && thermalStatus) {
        thermalToggle.addEventListener('change', async (e) => {
          const enabled = e.target.checked;
          const result = await setThermalThrottling(enabled);
          thermalStatus.textContent = result ? (enabled ? 'Enabled' : 'Disabled') : 'Failed';
          showToast('Reboot to apply thermal changes');
          await updateTweakerConfig("thermal", enabled ? "enabled" : "disabled");
        });
      }

      // --- Bypass Charging toggle ---
      const chargingToggle = document.getElementById('charging-toggle');
      const chargingStatus = document.getElementById('charging-status');
      if (chargingToggle && chargingStatus) {
        chargingToggle.addEventListener('change', async (e) => {
          const enabled = e.target.checked;
          const result = await setBypassCharging(enabled);
          chargingStatus.textContent = result ? (enabled ? 'Enabled' : 'Disabled') : 'Failed';
          showToast(`Bypass charging ${result ? (enabled ? 'enabled' : 'disabled') : 'failed'}`);
          await updateTweakerConfig("bypasscharging", enabled ? "enabled" : "disabled");
        });
      }

      // --- Governor apply ---
      document.getElementById("apply-governor").addEventListener("click", applyGovernor);

      // --- Language ---
      const langSelect = document.getElementById('lang-select');
      langSelect.addEventListener('change', (e) => {
        updateLanguage(e.target.value);
        localStorage.setItem('tnf_lang', e.target.value);
      });
      const savedLang = localStorage.getItem('tnf_lang') || 'en';
      langSelect.value = savedLang;
      updateLanguage(savedLang);

      // --- Game List ---
      document.getElementById('add-game').addEventListener('click', showAddGameModal);
      document.getElementById('edit-gamelist').addEventListener('click', () => {
        document.getElementById('gamelist-modal').classList.remove('hidden');
      });
      document.getElementById('cancel-addgame').addEventListener('click', () => {
        document.getElementById('addgame-modal').classList.add('hidden');
      });
      document.getElementById('cancel-gamelist').addEventListener('click', () => {
        document.getElementById('gamelist-modal').classList.add('hidden');
      });
      document.getElementById('confirm-addgame').addEventListener('click', addGamePackage);
      document.getElementById('save-gamelist').addEventListener('click', saveGameList);
      await loadGameList();

      // --- Toast for toggles (generic) ---
      document.querySelectorAll('input[type="checkbox"]').forEach(toggle => {
        if (toggle.id === 'bypass-toggle' || toggle.id === 'thermal-toggle' || toggle.id === 'charging-toggle') return;
        toggle.addEventListener('change', (e) => {
          const label = e.target.closest('.flex.items-center.space-x-2')?.innerText ||
            e.target.closest('.flex.items-center')?.innerText || 'Setting';
          showToast(`${label.trim()} ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
      });
    });
