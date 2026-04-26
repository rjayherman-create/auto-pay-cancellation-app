# Creating a Desktop Shortcut for CardHugs

## Option 1: Quick Start Batch File (RECOMMENDED)

The simplest option - just double-click to launch everything.

### Steps:

1. **Locate your project directory**
   - Example: `C:\Users\YourName\Documents\cardhugs`

2. **Right-click on `Start-CardHugs.bat`**
   - Select "Send to" → "Desktop (create shortcut)"

3. **Customize the shortcut** (optional)
   - Right-click the desktop shortcut
   - Select "Properties"
   - **Shortcut tab:**
     - Target: `C:\full\path\to\Start-CardHugs.bat`
     - Start in: `C:\full\path\to\project`
     - Change Icon: Browse and select an image

4. **Double-click the shortcut to launch**
   - Containers start automatically
   - App opens in your browser

---

## Option 2: Create Custom Shortcut

For more control over the shortcut appearance and behavior.

### Steps:

1. **Right-click your Desktop** → "New" → "Shortcut"

2. **Enter the target location:**
   ```
   C:\Users\YourName\Documents\cardhugs\Start-CardHugs.bat
   ```

3. **Name it:** `CardHugs` (or whatever you prefer)

4. **Finish and customize:**
   - Right-click the shortcut → Properties
   - **Shortcut tab:**
     - Target: `C:\Users\YourName\Documents\cardhugs\Start-CardHugs.bat`
     - Start in: `C:\Users\YourName\Documents\cardhugs`
     - Shortcut key: `Ctrl+Alt+C` (optional)
     - Run: Select "Minimized" (optional)

5. **Change icon (optional):**
   - Click "Change Icon..."
   - Browse to any `.ico` or `.png` file

---

## Option 3: PowerShell Shortcut

For advanced users who want PowerShell version:

```powershell
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut([System.Environment]::GetFolderPath("Desktop") + "\CardHugs.lnk")
$shortcut.TargetPath = "C:\Users\YourName\Documents\cardhugs\Start-CardHugs.ps1"
$shortcut.Save()
```

---

## Quick URL Shortcut (Direct Link)

If you just want a link to open the app (containers must already be running):

1. **Right-click Desktop** → "New" → "Internet Shortcut"

2. **Enter URL:**
   ```
   http://localhost
   ```

3. **Name it:** `CardHugs Local`

4. **Finish**

---

## What Happens When You Click

### With Start-CardHugs.bat:

1. ✅ Checks if Docker is running
2. ✅ Starts all containers (`docker-compose up -d`)
3. ✅ Waits 10 seconds for services to be ready
4. ✅ Displays container status
5. ✅ Opens http://localhost in your browser
6. ✅ Shows access information in terminal

### With Direct URL Shortcut:

1. ✅ Opens http://localhost in browser
2. ⚠️ Assumes containers are already running
3. ⚠️ Useful for quick access during development

---

## Command-Line Reference

Once containers are running, you can access:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost | CardHugs web application |
| **Backend API** | http://localhost:8000 | REST API endpoints |
| **Health Check** | http://localhost:8000/health | API health status |

---

## Troubleshooting Desktop Shortcuts

### Issue: Shortcut doesn't work

**Solution 1:** Verify the path
```cmd
dir C:\full\path\to\Start-CardHugs.bat
```

**Solution 2:** Run Command Prompt as Administrator
- Right-click Command Prompt → "Run as administrator"
- Navigate to project directory
- Run: `Start-CardHugs.bat`

**Solution 3:** Check Docker is running
- Open Docker Desktop
- Verify it's fully loaded before clicking shortcut

### Issue: "Docker is not running" error

**Solution:**
1. Open Docker Desktop application
2. Wait for it to fully start (watch system tray)
3. Then click your CardHugs shortcut

### Issue: Port already in use

**Solution:**
1. Stop existing containers: `docker-compose stop`
2. Try again

---

## Advanced: Minimize on Startup

Edit `Start-CardHugs.bat` and replace the last section with:

```batch
REM Open in default browser
start http://localhost

REM Minimize the command window
echo Launching... This window will close in 5 seconds
timeout /t 5 /nobreak
exit
```

---

## Advanced: Auto-Start with Windows

1. Press `Win+R` → Type `shell:startup` → Press Enter
2. Drag `Start-CardHugs.bat` into the Startup folder
3. Next time you boot, CardHugs will start automatically

---

## Summary

| Method | Ease | Features | Best For |
|--------|------|----------|----------|
| **Start-CardHugs.bat** | ⭐⭐⭐⭐⭐ | Auto-start containers, status display | Daily use |
| **Custom Shortcut** | ⭐⭐⭐⭐ | Customizable icon, hotkey | Professional setup |
| **PowerShell** | ⭐⭐⭐ | Advanced control, scripting | Power users |
| **URL Shortcut** | ⭐⭐⭐⭐⭐ | Simple, fast, lightweight | When containers running |

---

## Next Steps

1. Choose your preferred method above
2. Create the shortcut
3. Test it by clicking/double-clicking
4. Pin to taskbar if desired (right-click → "Pin to taskbar")

Let me know if you need help with any of these steps!
