// MathFun Premium - Enhanced Interactive Math Platform
console.log(' MathFun Premium - Platform Belajar Matematika Terdepan!');

// Initialize the premium application
document.addEventListener('DOMContentLoaded', function() {
    initializePremiumApp();
});

function initializePremiumApp() {
    // Initialize all premium features
    initializeParticles();
    initializePremiumNavigation();
    initializeEnhancedCategoryFilter();
    initializeCurriculumTabs();
    initializeProgressAnimations();
    initializeNewsletterForm();
    initializeFloatingActions();
    initializeGameCards();
    initializeViewControls();
    initializeSearchFunctionality();
    
    // Initialize animations and interactions
    initializePremiumAnimations();
    initializeInteractiveElements();
    
    console.log('🚀 MathFun Premium initialized successfully!');
}

// Particle Background Animation
function initializeParticles() {
    const canvas = document.getElementById('mathParticles');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 1 - 0.5,
            speedY: Math.random() * 1 - 0.5,
            color: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`
        });
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
            
            // Draw connections
            particles.forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
    
    // Handle resize
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Premium Navigation with smooth scrolling and active states
function initializePremiumNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    
    // Update active nav link based on scroll position
    function updateActiveNavLink() {
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    // Smooth scroll for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Smooth scroll to section
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    window.addEventListener('scroll', updateActiveNavLink);
    updateActiveNavLink(); // Initialize on load
}

// Enhanced Category Filter with animations
function initializeEnhancedCategoryFilter() {
    const categoryCards = document.querySelectorAll('.category-card');
    const gamesGrid = document.getElementById('gamesGrid');
    
    // Sample games data
    const gamesData = [
        {
            id: 1,
            title: "Petualangan Angka",
            category: "numbers",
            description: "Jelajahi dunia angka dengan karakter yang menyenangkan",
            age: "4-6",
            difficulty: "easy",
            rating: 4.8,
            players: "2.3k",
            icon: "🔢",
            featured: true
        },
        {
            id: 2,
            title: "Penjumlahan Ajaib",
            category: "addition", 
            description: "Kumpulkan buah dan jumlahkan dengan teman-teman",
            age: "6-8",
            difficulty: "medium",
            rating: 4.9,
            players: "3.1k",
            icon: "➕",
            featured: true
        },
        {
            id: 3,
            title: "Misteri Pengurangan",
            category: "subtraction",
            description: "Selesaikan misteri dengan kemampuan pengurangan",
            age: "7-9", 
            difficulty: "medium",
            rating: 4.6,
            players: "1.8k",
            icon: "➖",
            featured: false
        },
        {
            id: 4,
            title: "Perkalian Monster",
            category: "multiplication",
            description: "Kalahkan monster dengan jawaban perkalian yang benar",
            age: "8-10",
            difficulty: "hard",
            rating: 4.7,
            players: "2.1k",
            icon: "✖️",
            featured: true
        },
        {
            id: 5,
            title: "Bentuk & Ruang",
            category: "geometry",
            description: "Temukan bentuk geometri dalam petualangan 3D",
            age: "5-7",
            difficulty: "easy",
            rating: 4.5,
            players: "1.5k", 
            icon: "🔺",
            featured: false
        },
        {
            id: 6,
            title: "Puzzle Matematika",
            category: "puzzle",
            description: "Selesaikan puzzle dengan logika matematika",
            age: "9-12",
            difficulty: "hard",
            rating: 4.8,
            players: "2.4k",
            icon: "🧩",
            featured: true
        }
    ];
    
    // Render games grid
    function renderGamesGrid(games = gamesData) {
        gamesGrid.innerHTML = games.map(game => `
            <div class="game-card enhanced-game-card" data-category="${game.category}" data-id="${game.id}">
                ${game.featured ? `<div class="game-badge featured">FEATURED</div>` : ''}
                <div class="game-image">
                    <div class="game-icon">${game.icon}</div>
                    <div class="game-overlay">
                        <button class="btn-play-preview">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="game-content">
                    <h3 class="game-title">${game.title}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-meta">
                        <span class="game-age">${game.age} Tahun</span>
                        <span class="game-difficulty ${game.difficulty}">${getDifficultyText(game.difficulty)}</span>
                    </div>
                    <div class="game-stats">
                        <div class="game-rating">
                            <div class="stars">${getStarRating(game.rating)}</div>
                            <span class="rating-text">${game.rating} (${game.players})</span>
                        </div>
                    </div>
                </div>
                <div class="game-actions">
                    <button class="btn-play">
                        <i class="fas fa-gamepad"></i>
                        <span>Main Sekarang</span>
                    </button>
                    <button class="btn-info">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to new game cards
        initializeGameCardInteractions();
    }
    
    function getDifficultyText(difficulty) {
        const difficulties = {
            easy: "Mudah",
            medium: "Sedang", 
            hard: "Sulit"
        };
        return difficulties[difficulty] || difficulty;
    }
    
    function getStarRating(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    }
    
    // Category filter functionality
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active category
            categoryCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            // Filter games
            let filteredGames = gamesData;
            if (category !== 'all') {
                filteredGames = gamesData.filter(game => game.category === category);
            }
            
            // Add animation
            gamesGrid.style.opacity = '0';
            gamesGrid.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                renderGamesGrid(filteredGames);
                gamesGrid.style.opacity = '1';
                gamesGrid.style.transform = 'translateY(0)';
            }, 300);
        });
    });
    
    // Initial render
    renderGamesGrid();
}

// Curriculum Tabs
function initializeCurriculumTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show active pane
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabId) {
                    pane.classList.add('active');
                }
            });
        });
    });
}

// Progress Animations
function initializeProgressAnimations() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const targetWidth = progressBar.style.width;
                progressBar.style.width = '0%';
                
                setTimeout(() => {
                    progressBar.style.transition = 'width 1.5s ease-in-out';
                    progressBar.style.width = targetWidth;
                }, 300);
            }
        });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => observer.observe(bar));
}

// Newsletter Form
function initializeNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value;
        
        if (validateEmail(email)) {
            // Simulate subscription
            showNotification('Berhasil berlangganan newsletter! 🎉', 'success');
            emailInput.value = '';
        } else {
            showNotification('Masukkan email yang valid.', 'error');
        }
    });
}

// Floating Actions
function initializeFloatingActions() {
    const fab = document.querySelector('.main-fab');
    
    fab.addEventListener('click', function() {
        showChatSupport();
    });
}

// View Controls (Grid/List)
function initializeViewControls() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const gamesGrid = document.getElementById('gamesGrid');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // Update active view button
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update grid layout
            gamesGrid.className = `games-grid ${view}-view`;
        });
    });
}

// Search Functionality
function initializeSearchFunctionality() {
    const searchInput = document.querySelector('.search-box input');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const gameCards = document.querySelectorAll('.enhanced-game-card');
        
        gameCards.forEach(card => {
            const title = card.querySelector('.game-title').textContent.toLowerCase();
            const description = card.querySelector('.game-description').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                }, 100);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
}

// Game Card Interactions
function initializeGameCardInteractions() {
    const gameCards = document.querySelectorAll('.enhanced-game-card');
    const playButtons = document.querySelectorAll('.btn-play');
    const infoButtons = document.querySelectorAll('.btn-info');
    const previewButtons = document.querySelectorAll('.btn-play-preview');
    
    playButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const gameCard = this.closest('.enhanced-game-card');
            const gameId = gameCard.getAttribute('data-id');
            startPremiumGame(gameId);
        });
    });
    
    infoButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const gameCard = this.closest('.enhanced-game-card');
            const gameId = gameCard.getAttribute('data-id');
            showGameDetails(gameId);
        });
    });
    
    previewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const gameCard = this.closest('.enhanced-game-card');
            const gameId = gameCard.getAttribute('data-id');
            showGamePreview(gameId);
        });
    });
    
    // Hover effects
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = 'var(--shadow-2xl)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = 'var(--shadow)';
        });
    });
}

// Premium Animations
function initializePremiumAnimations() {
    const animatedElements = document.querySelectorAll('.game-card, .feature-card, .curriculum-card, .parent-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// Interactive Elements
function initializeInteractiveElements() {
    // Add click effects to all buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Add loading states to primary buttons
    const primaryButtons = document.querySelectorAll('.btn-primary');
    primaryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('btn-large') || this.classList.contains('btn-xlarge')) {
                const originalHTML = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Memuat...</span>';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = originalHTML;
                    this.disabled = false;
                }, 2000);
            }
        });
    });
}

// Premium Game Start Function
function startPremiumGame(gameId) {
    showLoadingScreen(`Memuat Game #${gameId}`);
    
    // Simulate game loading
    setTimeout(() => {
        hideLoadingScreen();
        showPremiumGameInterface(gameId);
    }, 3000);
}

// Utility Functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
            </div>
            <div class="notification-message">${message}</div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-2xl);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        max-width: 400px;
        border-left: 4px solid ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--info)'};
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    });
}

function showLoadingScreen(message = 'Memuat...') {
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'premium-loading-screen';
    loadingScreen.innerHTML = `
        <div class="loading-content">
            <div class="loading-animation">
                <div class="loading-spinner"></div>
            </div>
            <h3>${message}</h3>
            <p>Mempersiapkan pengalaman belajar terbaik untuk Anda</p>
        </div>
    `;
    
    loadingScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--gradient-premium);
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: 'Nunito', sans-serif;
    `;
    
    document.body.appendChild(loadingScreen);
    
    // Add loading animation styles
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 30px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-content {
            text-align: center;
        }
        
        .loading-content h3 {
            font-size: 1.8rem;
            margin-bottom: 16px;
            font-family: 'Fredoka One', cursive;
        }
        
        .loading-content p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
    `;
    
    document.head.appendChild(style);
    loadingScreen.dataset.styleElement = 'loading-styles';
}

function hideLoadingScreen() {
    const loadingScreen = document.querySelector('.premium-loading-screen');
    const loadingStyle = document.querySelector('style[data-style-element="loading-styles"]');
    
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
            if (loadingStyle) loadingStyle.remove();
        }, 300);
    }
}

// Export for global access
window.MathFunPremium = {
    initializePremiumApp,
    showNotification,
    startPremiumGame
};