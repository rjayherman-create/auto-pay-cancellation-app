document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeNavigation();
});

function initializeEventListeners() {
    // Manage buttons
    document.querySelectorAll('.btn-sm:not(.danger)').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.subscription-card');
            const name = card.querySelector('.subscription-name').textContent;
            showNotification(`Managing ${name}...`);
        });
    });

    // Cancel buttons
    document.querySelectorAll('.btn-sm.danger').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.subscription-card');
            const name = card.querySelector('.subscription-name').textContent;
            if (confirm(`Are you sure you want to cancel ${name}?`)) {
                showNotification(`${name} cancellation initiated...`);
                setTimeout(() => {
                    card.style.opacity = '0.5';
                    card.style.pointerEvents = 'none';
                }, 1000);
            }
        });
    });

    // Alerts banner
    document.querySelector('.banner-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
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

function showNotification(message) {
    const notification = document.createElement('div');
    
    notification.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #1f2937;
        color: white;
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
