document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeNavigation();
    initializeModalHandlers();
});

function initializeEventListeners() {
    // Get all change buttons in Account section
    const accountBtns = document.querySelectorAll('.settings-section')[0].querySelectorAll('.btn-action');
    
    // Change Email - first button
    accountBtns[0]?.addEventListener('click', openChangeEmailModal);

    // Change Password - second button
    accountBtns[1]?.addEventListener('click', openChangePasswordModal);

    // Manage Bank Connections
    document.querySelector('.btn-manage')?.addEventListener('click', function() {
        showNotification('Opening bank connections...');
    });

    // Delete Account
    const deleteBtn = document.querySelector('.btn-danger');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', openDeleteAccountModal);
    }

    // Notification Preferences and Notification Center
    const notificationItems = document.querySelectorAll('.settings-item.clickable');
    notificationItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            if (index === 0) {
                showNotification('Opening notification preferences...');
            } else if (index === 1) {
                showNotification('Opening notification center...');
            }
        });
    });

    // Data Export
    const dataSections = document.querySelectorAll('.settings-section');
    const dataPrivacySection = dataSections[2]; // Data & Privacy is the 3rd section
    const exportBtn = dataPrivacySection.querySelector('.btn-action');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportData();
        });
    }

    // Logout
    document.querySelector('.btn-logout')?.addEventListener('click', function() {
        if (confirm('Are you sure you want to log out?')) {
            showNotification('Logging out...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    });

    // Back to Dashboard
    document.querySelector('.back-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'dashboard.html';
    });
}

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // If href is #, prevent default and show notification
            if (href === '#') {
                e.preventDefault();
                showNotification('Coming soon');
            }
            // Otherwise allow normal navigation
        });
    });
}

function initializeModalHandlers() {
    // Get all modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

function openChangeEmailModal() {
    document.getElementById('changeEmailModal').classList.add('active');
}

function openChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.add('active');
}

function openDeleteAccountModal() {
    document.getElementById('deleteAccountModal').classList.add('active');
}

function submitEmailChange() {
    const newEmail = document.getElementById('newEmail').value;
    const password = document.getElementById('emailPassword').value;

    if (!newEmail || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!validateEmail(newEmail)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    showNotification('Updating email address...');
    setTimeout(() => {
        document.getElementById('changeEmailModal').classList.remove('active');
        document.getElementById('emailForm').reset();
        showNotification('Email updated successfully');
    }, 1500);
}

function submitPasswordChange() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return;
    }

    showNotification('Updating password...');
    setTimeout(() => {
        document.getElementById('changePasswordModal').classList.remove('active');
        document.getElementById('passwordForm').reset();
        showNotification('Password updated successfully');
    }, 1500);
}

function submitDeleteAccount() {
    const password = document.getElementById('deletePassword').value;

    if (!password) {
        showNotification('Please enter your password', 'error');
        return;
    }

    const confirmed = confirm(
        'This action cannot be undone. All your data will be permanently deleted. Are you absolutely sure?'
    );

    if (!confirmed) return;

    showNotification('Deleting account...');
    setTimeout(() => {
        document.getElementById('deleteAccountModal').classList.remove('active');
        document.getElementById('deleteForm').reset();
        showNotification('Account deleted successfully. Redirecting...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }, 2000);
}

function exportData() {
    showNotification('Preparing your data export...');
    
    // Simulate data export
    setTimeout(() => {
        const data = {
            email: 'demo@example.com',
            subscriptions: [
                { name: 'Netflix', price: '$15.99', renewalDate: '2025-01-15' },
                { name: 'Spotify', price: '$10.99', renewalDate: '2025-01-20' },
                { name: 'Headspace', price: '$12.99', renewalDate: '2025-01-10' }
            ],
            alerts: [
                { type: 'Upcoming Renewal', count: 2 },
                { type: 'Action Needed', count: 2 }
            ],
            exportDate: new Date().toISOString()
        };

        const csv = generateCSV(data);
        downloadCSV(csv, `subscription-data-${Date.now()}.csv`);
        showNotification('Data export downloaded successfully');
    }, 1500);
}

function generateCSV(data) {
    let csv = 'Subscription Manager Data Export\n';
    csv += `Export Date: ${data.exportDate}\n`;
    csv += `Email: ${data.email}\n\n`;
    
    csv += 'SUBSCRIPTIONS\n';
    csv += 'Name,Price,Renewal Date\n';
    data.subscriptions.forEach(sub => {
        csv += `${sub.name},${sub.price},${sub.renewalDate}\n`;
    });

    csv += '\nALERTS SUMMARY\n';
    csv += 'Type,Count\n';
    data.alerts.forEach(alert => {
        csv += `${alert.type},${alert.count}\n`;
    });

    return csv;
}

function downloadCSV(csv, filename) {
    const link = document.createElement('a');
    const blob = new Blob([csv], { type: 'text/csv' });
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    
    const bgColor = type === 'error' ? '#ef4444' : '#1f2937';
    const textColor = '#ffffff';

    notification.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${bgColor};
        color: ${textColor};
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: slideUp 0.3s ease;
        max-width: 90%;
        text-align: center;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Add animation if not already defined
    if (!document.querySelector('style[data-notification]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notification', 'true');
        style.textContent = `
            @keyframes slideUp {
                from {
                    transform: translateX(-50%) translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
