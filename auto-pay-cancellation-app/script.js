document.addEventListener('DOMContentLoaded', function() {
    initializeAlerts();
    initializeNavigation();
    initializeButtons();
});

function initializeAlerts() {
    const alertCards = document.querySelectorAll('.alert-card');
    const summaryCards = document.querySelectorAll('.summary-card');

    // Add click handlers to alert cards
    alertCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });

    // Add click handlers to summary cards
    summaryCards.forEach(card => {
        card.addEventListener('click', function() {
            // Filter alerts based on category
            const isUpcoming = this.classList.contains('upcoming');
            filterAlerts(isUpcoming ? 'upcoming' : 'action');
        });
    });
}

function filterAlerts(category) {
    const alertCards = document.querySelectorAll('.alert-card');
    
    alertCards.forEach(card => {
        if (category === 'upcoming') {
            card.style.display = card.classList.contains('upcoming-renewal') ? 'block' : 'none';
        } else if (category === 'action') {
            card.style.display = card.classList.contains('trial-ending') || 
                                card.classList.contains('unusual-charge') ? 'block' : 'none';
        } else {
            card.style.display = 'block';
        }
    });

    // Reset filter after 5 seconds
    setTimeout(() => {
        alertCards.forEach(card => {
            card.style.display = 'block';
        });
    }, 5000);
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
                return;
            }
            
            // Otherwise allow normal navigation
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
}

function handleNavigation(label) {
    // Handle navigation actions
    switch(label) {
        case 'Home':
            window.location.href = 'dashboard.html';
            break;
        case 'Discover':
            showNotification('Coming soon');
            break;
        case 'Cancel':
            showNotification('Coming soon');
            break;
        case 'Alerts':
            window.location.href = 'index.html';
            break;
        case 'Settings':
            window.location.href = 'settings.html';
            break;
    }
}

function initializeButtons() {
    const viewButtons = document.querySelectorAll('.btn-primary');
    const investigateButtons = document.querySelectorAll('.btn-secondary');

    viewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.alert-card');
            const serviceName = card.querySelector('.service-name')?.textContent || 'Service';
            showNotification(`Opening ${serviceName} subscription details...`);
        });
    });

    investigateButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showNotification('Investigating unusual charge...');
        });
    });
}

function showNotification(message) {
    // Create notification element
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
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Add animation
    const style = document.createElement('style');
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

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Make function globally available for testing
window.simulateNewAlert = function() {
    const alertsCount = document.querySelectorAll('.alert-card').length;
    console.log(`Current alerts: ${alertsCount}`);
};
