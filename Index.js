// ==========================================
// MATHQUEST - MODERN MATH GAME WITH DATABASE
// ==========================================

// Supabase Configuration - GANTI DENGAN URL DAN KEY ANDA
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentUser = null;
let currentGame = null;
let score = 0;
let timer = 60;
let timerInterval = null;
let currentQuestion = null;
let userStats = null;

// DOM Elements
const screens = {
    loading: document.getElementById('loadingScreen'),
    auth: document.getElementById('authScreen'),
    main: document.getElementById('mainMenu'),
    game: document.getElementById('gameScreen')
};

// Auth elements
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// User interface elements
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const welcomeName = document.getElementById('welcomeName');
const userLevel = document.getElementById('userLevel');
const userScore = document.getElementById('userScore');
const dailyPlayed = document.getElementById('dailyPlayed');
const dailyScore = document.getElementById('dailyScore');
const logoutBtn = document.getElementById('logoutBtn');

// =======================
// SCREEN MANAGEMENT
// =======================

function showLoadingScreen() {
    switchScreen('loading');
}

function showAuthScreen() {
    switchScreen('auth');
}

function showMainMenu() {
    switchScreen('main');
}

function showGameScreen() {
    switchScreen('game');
}

function switchScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }
}

// =======================
// INITIALIZATION
// =======================

async function init() {
    showLoadingScreen();
    setupEventListeners();
    await checkAuthState();
    hideLoadingScreen();
}

function setupEventListeners() {
    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });

    // Auth forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            switchNavigation(target);
        });
    });

    // Game cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('play-btn') || e.target.closest('.play-btn')) {
                const game = card.getAttribute('data-game');
                startGame(game);
            }
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('data-filter');
            filterGames(filter);
        });
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);
}

// =======================
// AUTHENTICATION
// =======================

async function checkAuthState() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
            currentUser = session.user;
            await loadUserData();
            showMainMenu();
        } else {
            showAuthScreen();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showAuthScreen();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.auth-btn');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        setButtonLoading(submitBtn, true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        currentUser = data.user;
        await loadUserData();
        showMainMenu();
        
        showNotification('Selamat datang kembali! 🎉', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.auth-btn');
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Password tidak cocok!', 'error');
        return;
    }

    try {
        setButtonLoading(submitBtn, true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (error) throw error;

        // Create user profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: data.user.id,
                    full_name: name,
                    level: 1,
                    total_score: 0,
                    games_played: 0
                }
            ]);

        if (profileError) {
            // If profile creation fails, we still show success message for auth
            console.error('Profile creation error:', profileError);
        }

        showNotification('Registrasi berhasil! Silakan login.', 'success');
        switchAuthTab('login');
        
        // Clear form
        e.target.reset();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        userStats = null;
        showAuthScreen();
        showNotification('Sampai jumpa! 👋', 'info');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// =======================
// USER DATA MANAGEMENT
// =======================

async function loadUserData() {
    try {
        // Load user profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) {
            // If profile doesn't exist, create one
            if (error.code === 'PGRST116') {
                await createUserProfile();
                return;
            }
            throw error;
        }

        userStats = profile;
        updateUserInterface();

        // Load leaderboard
        await loadLeaderboard();

        // Load daily stats
        await loadDailyStats();
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error memuat data pengguna', 'error');
    }
}

async function createUserProfile() {
    try {
        const name = currentUser.user_metadata?.full_name || 'Player';
        
        const { data, error } = await supabase
            .from('profiles')
            .insert([
                {
                    id: currentUser.id,
                    full_name: name,
                    level: 1,
                    total_score: 0,
                    games_played: 0
                }
            ])
            .select()
            .single();

        if (error) throw error;

        userStats = data;
        updateUserInterface();
    } catch (error) {
        console.error('Error creating user profile:', error);
    }
}

function updateUserInterface() {
    if (!userStats) return;

    const name = userStats.full_name || currentUser.email;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    userName.textContent = name;
    welcomeName.textContent = name;
    userAvatar.textContent = initials;
    userLevel.textContent = userStats.level;
    userScore.textContent = userStats.total_score.toLocaleString();
}

async function loadLeaderboard() {
    try {
        const { data: leaderboard, error } = await supabase
            .from('profiles')
            .select('full_name, total_score, level')
            .order('total_score', { ascending: false })
            .limit(10);

        if (error) throw error;

        updateLeaderboard(leaderboard);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

async function loadDailyStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: dailyStats, error } = await supabase
            .from('game_sessions')
            .select('score')
            .eq('user_id', currentUser.id)
            .gte('created_at', today);

        if (error) throw error;

        const totalPlayed = dailyStats.length;
        const totalScore = dailyStats.reduce((sum, session) => sum + session.score, 0);

        dailyPlayed.textContent = totalPlayed;
        dailyScore.textContent = totalScore;
    } catch (error) {
        console.error('Error loading daily stats:', error);
    }
}

async function updateUserStats(gameScore) {
    try {
        const newTotalScore = userStats.total_score + gameScore;
        const newGamesPlayed = userStats.games_played + 1;
        const newLevel = Math.floor(newTotalScore / 1000) + 1;

        const { error } = await supabase
            .from('profiles')
            .update({
                total_score: newTotalScore,
                games_played: newGamesPlayed,
                level: newLevel
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        // Save game session
        const { error: sessionError } = await supabase
            .from('game_sessions')
            .insert([
                {
                    user_id: currentUser.id,
                    game_type: currentGame,
                    score: gameScore,
                    duration: 60 - timer
                }
            ]);

        if (sessionError) throw sessionError;

        // Reload user data
        await loadUserData();
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
}

// =======================
// GAME LOGIC
// =======================

function startGame(gameType) {
    currentGame = gameType;
    score = 0;
    timer = 60;

    // Create game screen dynamically
    createGameScreen();
    
    // Switch to game screen
    showGameScreen();
    
    // Start game logic
    startTimer();
    generateQuestion();
}

function createGameScreen() {
    const gameTitles = {
        arithmetic: 'Aritmatika Cepat',
        geometry: 'Petualangan Geometri',
        fractions: 'Misteri Pecahan',
        algebra: 'Aljabar Master',
        logic: 'Logika Matematika',
        memory: 'Memori Angka'
    };

    screens.game.innerHTML = `
        <div class="game-container">
            <div class="game-header">
                <button id="backToMenu" class="back-btn">← Kembali</button>
                <div class="game-info">
                    <h2>${gameTitles[currentGame]}</h2>
                    <div class="game-stats">
                        <div class="stat">
                            <span class="stat-label">Skor</span>
                            <span class="stat-value" id="currentScore">0</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Waktu</span>
                            <span class="stat-value" id="currentTimer">60</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="game-content">
                <div class="question-section">
                    <div class="question-display">
                        <h3 id="questionText">Memuat soal...</h3>
                    </div>
                    <div class="options-grid" id="optionsGrid">
                        <!-- Options will be generated here -->
                    </div>
                </div>

                <div class="game-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text">
                        Soal: <span id="currentQuestion">1</span>/10
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners for game screen
    document.getElementById('backToMenu').addEventListener('click', () => {
        stopGame();
        showMainMenu();
    });
}

function generateQuestion() {
    const difficulty = userStats?.level || 1;
    let questionData;

    switch (currentGame) {
        case 'arithmetic':
            questionData = generateArithmeticQuestion(difficulty);
            break;
        case 'geometry':
            questionData = generateGeometryQuestion(difficulty);
            break;
        case 'fractions':
            questionData = generateFractionsQuestion(difficulty);
            break;
        case 'algebra':
            questionData = generateAlgebraQuestion(difficulty);
            break;
        case 'logic':
            questionData = generateLogicQuestion(difficulty);
            break;
        case 'memory':
            questionData = generateMemoryQuestion(difficulty);
            break;
        default:
            questionData = generateArithmeticQuestion(difficulty);
    }

    currentQuestion = questionData;
    displayQuestion(questionData);
}

function generateArithmeticQuestion(difficulty) {
    const operators = ['+', '-', '*', '/'];
    let num1, num2, operator, answer;

    const ranges = {
        1: { min: 1, max: 10 },
        2: { min: 1, max: 20 },
        3: { min: 1, max: 50 }
    };

    const range = ranges[Math.min(difficulty, 3)] || ranges[3];

    operator = operators[Math.floor(Math.random() * operators.length)];

    switch (operator) {
        case '+':
            num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            answer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            num2 = Math.floor(Math.random() * (range.min, num1));
            answer = num1 - num2;
            break;
        case '*':
            num1 = Math.floor(Math.random() * (Math.min(10, range.max))) + 1;
            num2 = Math.floor(Math.random() * (Math.min(10, range.max))) + 1;
            answer = num1 * num2;
            break;
        case '/':
            answer = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            num1 = answer * num2;
            break;
    }

    const question = `${num1} ${operator} ${num2} = ?`;
    const options = generateOptions(answer, range.max * 2);

    return { question, answer, options, type: 'arithmetic' };
}

function generateGeometryQuestion(difficulty) {
    const shapes = ['persegi', 'segitiga', 'lingkaran', 'persegi panjang'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    let question, answer;

    switch (shape) {
        case 'persegi':
            const side = Math.floor(Math.random() * 10) + 1;
            question = `Hitung luas persegi dengan sisi ${side} cm`;
            answer = side * side;
            break;
        case 'segitiga':
            const base = Math.floor(Math.random() * 10) + 1;
            const height = Math.floor(Math.random() * 10) + 1;
            question = `Hitung luas segitiga dengan alas ${base} cm dan tinggi ${height} cm`;
            answer = Math.round((base * height) / 2);
            break;
        case 'lingkaran':
            const radius = Math.floor(Math.random() * 7) + 1;
            question = `Hitung luas lingkaran dengan jari-jari ${radius} cm (π = 3.14)`;
            answer = Math.round(3.14 * radius * radius);
            break;
        case 'persegi panjang':
            const length = Math.floor(Math.random() * 10) + 1;
            const width = Math.floor(Math.random() * 10) + 1;
            question = `Hitung luas persegi panjang dengan panjang ${length} cm dan lebar ${width} cm`;
            answer = length * width;
            break;
    }

    const options = generateOptions(answer, 200);
    return { question, answer, options, type: 'geometry' };
}

function generateFractionsQuestion(difficulty) {
    const numerator1 = Math.floor(Math.random() * 5) + 1;
    const denominator1 = Math.floor(Math.random() * 5) + 2;
    const numerator2 = Math.floor(Math.random() * 5) + 1;
    const denominator2 = Math.floor(Math.random() * 5) + 2;

    const operations = ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let question, answer;

    if (operation === '+') {
        question = `${numerator1}/${denominator1} + ${numerator2}/${denominator2} = ?`;
        answer = (numerator1/denominator1) + (numerator2/denominator2);
    } else {
        question = `${numerator1}/${denominator1} - ${numerator2}/${denominator2} = ?`;
        answer = (numerator1/denominator1) - (numerator2/denominator2);
    }

    answer = Math.round(answer * 100) / 100;
    const options = generateOptions(answer, 2, true);
    
    return { question, answer, options, type: 'fractions' };
}

function generateAlgebraQuestion(difficulty) {
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const c = Math.floor(Math.random() * 20) + 1;

    let question, answer;

    if (Math.random() > 0.5) {
        // Simple equation: ax + b = c
        question = `Jika ${a}x + ${b} = ${c}, berapa nilai x?`;
        answer = (c - b) / a;
    } else {
        // Distribution: a(x + b) = c
        question = `Jika ${a}(x + ${b}) = ${c}, berapa nilai x?`;
        answer = (c / a) - b;
    }

    answer = Math.round(answer * 10) / 10;
    const options = generateOptions(answer, 10, true);

    return { question, answer, options, type: 'algebra' };
}

function generateLogicQuestion(difficulty) {
    const patterns = [
        { sequence: [2, 4, 6, 8], answer: 10, question: "Lanjutkan pola: 2, 4, 6, 8, ..." },
        { sequence: [1, 4, 9, 16], answer: 25, question: "Lanjutkan pola: 1, 4, 9, 16, ..." },
        { sequence: [1, 1, 2, 3, 5], answer: 8, question: "Lanjutkan pola Fibonacci: 1, 1, 2, 3, 5, ..." },
        { sequence: [3, 6, 9, 12], answer: 15, question: "Lanjutkan pola: 3, 6, 9, 12, ..." }
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const options = generateOptions(pattern.answer, 30);

    return { 
        question: pattern.question, 
        answer: pattern.answer, 
        options, 
        type: 'logic' 
    };
}

function generateMemoryQuestion(difficulty) {
    const numbers = [];
    const length = 4 + Math.floor(difficulty / 2);
    
    for (let i = 0; i < length; i++) {
        numbers.push(Math.floor(Math.random() * 9) + 1);
    }

    const sequence = numbers.join(' - ');
    const answer = numbers[numbers.length - 2]; // Second last number
    
    setTimeout(() => {
        const question = `Apa angka sebelum ${numbers[numbers.length - 1]} dalam sequence: ${sequence}?`;
        currentQuestion.question = question;
        document.getElementById('questionText').textContent = question;
    }, 3000);

    const options = generateOptions(answer, 9);
    
    return { 
        question: `Ingat sequence: ${sequence}`, 
        answer, 
        options, 
        type: 'memory' 
    };
}

function generateOptions(correctAnswer, range, decimal = false) {
    const options = [correctAnswer];
    
    while (options.length < 4) {
        let wrongAnswer;
        const variation = Math.floor(Math.random() * 5) + 1;
        
        if (Math.random() > 0.5) {
            wrongAnswer = decimal ? 
                Math.round((correctAnswer + Math.random()) * 10) / 10 :
                correctAnswer + variation;
        } else {
            wrongAnswer = decimal ?
                Math.round((correctAnswer - Math.random()) * 10) / 10 :
                Math.max(1, correctAnswer - variation);
        }

        // Ensure unique options
        if (!options.includes(wrongAnswer) && wrongAnswer !== correctAnswer) {
            if (decimal || (wrongAnswer > 0 && wrongAnswer <= range)) {
                options.push(wrongAnswer);
            }
        }
    }
    
    return shuffleArray(options);
}

function displayQuestion(questionData) {
    document.getElementById('questionText').textContent = questionData.question;
    
    const optionsGrid = document.getElementById('optionsGrid');
    optionsGrid.innerHTML = '';

    questionData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.addEventListener('click', () => checkAnswer(option));
        optionsGrid.appendChild(button);
    });
}

function checkAnswer(selectedAnswer) {
    const correctAnswer = currentQuestion.answer;
    const selectedBtn = Array.from(document.querySelectorAll('.option-btn'))
        .find(btn => btn.textContent == selectedAnswer);

    // Disable all buttons during feedback
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.style.pointerEvents = 'none';
    });

    if (selectedAnswer == correctAnswer) {
        // Correct answer
        selectedBtn.classList.add('correct');
        score += 10;
        document.getElementById('currentScore').textContent = score;
        
        playSound('correct');
        showFeedback('Luar Biasa! 🎉', 'success');
    } else {
        // Wrong answer
        selectedBtn.classList.add('incorrect');
        
        // Highlight correct answer
        document.querySelectorAll('.option-btn').forEach(btn => {
            if (btn.textContent == correctAnswer) {
                btn.classList.add('correct');
            }
        });
        
        playSound('wrong');
        showFeedback('Coba lagi! 💪', 'error');
    }
    
    // Generate new question after delay
    setTimeout(() => {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.classList.remove('correct', 'incorrect');
        });
        generateQuestion();
    }, 2000);
}

function startTimer() {
    timerInterval = setInterval(() => {
        timer--;
        document.getElementById('currentTimer').textContent = timer;
        
        // Update progress bar
        const progress = ((60 - timer) / 60) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        
        if (timer <= 0) {
            endGame();
        }
    }, 1000);
}

function stopGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

async function endGame() {
    stopGame();
    
    // Update user stats
    await updateUserStats(score);
    
    // Show game over modal
    showGameOverModal(score);
}

function showGameOverModal(finalScore) {
    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Permainan Selesai! 🎮</h2>
            </div>
            <div class="modal-body">
                <div class="final-score">
                    <span class="score-label">Skor Akhir</span>
                    <span class="score-value">${finalScore}</span>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" id="playAgain">Main Lagi</button>
                    <button class="modal-btn secondary" id="backToMain">Menu Utama</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('playAgain').addEventListener('click', () => {
        modal.remove();
        startGame(currentGame);
    });

    document.getElementById('backToMain').addEventListener('click', () => {
        modal.remove();
        showMainMenu();
    });
}

// =======================
// UI UTILITIES
// =======================

function switchAuthTab(tabName) {
    authTabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    
    authForms.forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}Form`);
    });
}

function switchNavigation(target) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-target') === target);
    });
    
    // Implement section switching logic here
    console.log('Switch to:', target);
}

function filterGames(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });

    document.querySelectorAll('.game-card').forEach(card => {
        const difficulty = card.getAttribute('data-difficulty');
        const show = filter === 'all' || difficulty === filter;
        card.style.display = show ? 'block' : 'none';
    });
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-lg);
                border-left: 4px solid var(--primary);
                z-index: 1000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 400px;
            }
            .notification.success { border-left-color: var(--success); }
            .notification.error { border-left-color: var(--danger); }
            .notification.info { border-left-color: var(--primary); }
            .notification.show { transform: translateX(0); }
            .notification-content {
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: var(--gray);
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

function showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
        color: white;
        padding: 16px 24px;
        border-radius: var(--border-radius);
        font-weight: 600;
        z-index: 1000;
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(feedback);

    // Animate in
    setTimeout(() => {
        feedback.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 100);

    // Animate out and remove
    setTimeout(() => {
        feedback.style.transform = 'translate(-50%, -50%) scale(0)';
        setTimeout(() => feedback.remove(), 300);
    }, 1500);
}

function playSound(type) {
    // Implement sound effects using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'correct') {
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } else {
            oscillator.frequency.value = 300;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.8);
        }
    } catch (e) {
        // Audio not supported
    }
}

function hideLoadingScreen() {
    setTimeout(() => {
        screens.loading.classList.remove('active');
    }, 2000);
}

function updateLeaderboard(leaderboard) {
    const leaderboardList = document.getElementById('leaderboardList');
    
    if (!leaderboard || leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="empty-state">Belum ada data peringkat</div>';
        return;
    }

    leaderboardList.innerHTML = leaderboard.map((user, index) => `
        <div class="leaderboard-item ${index < 3 ? 'top-three' : ''}">
            <div class="rank">${index + 1}</div>
            <div class="user-info">
                <div class="user-name">${user.full_name || 'Player'}</div>
                <div class="user-stats">
                    <span class="level">Level ${user.level}</span>
                    <span class="score">${user.total_score} poin</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// =======================
// DEVELOPMENT MODE - Untuk testing tanpa database
// =======================

// Jika tidak ingin setup Supabase, gunakan mode development ini
function enableDevelopmentMode() {
    console.log('🚀 Development Mode Enabled');
    
    // Override Supabase dengan mock functions
    window.supabase = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signInWithPassword: () => Promise.resolve({ 
                data: { user: { id: 'dev-1', email: 'dev@mathquest.com' } }, 
                error: null 
            }),
            signUp: () => Promise.resolve({ 
                data: { user: { id: 'dev-1', email: 'dev@mathquest.com' } }, 
                error: null 
            }),
            signOut: () => Promise.resolve({ error: null })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ 
                        data: { 
                            id: 'dev-1', 
                            full_name: 'Developer', 
                            level: 1, 
                            total_score: 0, 
                            games_played: 0 
                        }, 
                        error: null 
                    })
                }),
                order: () => ({
                    limit: () => Promise.resolve({ 
                        data: [
                            { full_name: 'Player 1', total_score: 1000, level: 2 },
                            { full_name: 'Player 2', total_score: 800, level: 1 },
                            { full_name: 'Player 3', total_score: 600, level: 1 }
                        ], 
                        error: null 
                    })
                })
            }),
            insert: () => Promise.resolve({ error: null }),
            update: () => Promise.resolve({ error: null })
        })
    };

    // Auto login setelah 3 detik
    setTimeout(() => {
        currentUser = { id: 'dev-1', email: 'dev@mathquest.com' };
        userStats = { 
            full_name: 'Developer', 
            level: 1, 
            total_score: 0, 
            games_played: 0 
        };
        showMainMenu();
        updateUserInterface();
        showNotification('Development Mode Aktif! 🛠️', 'info');
    }, 3000);
}

// Uncomment baris berikut untuk menggunakan Development Mode
// enableDevelopmentMode();

// =======================
// DATABASE SETUP INSTRUCTIONS
// =======================

/*
SUPABASE SETUP:

1. Buat akun di https://supabase.com
2. Buat project baru
3. Dapatkan URL dan anon key dari Settings > API
4. Ganti SUPABASE_URL dan SUPABASE_ANON_KEY di atas

5. Jalankan SQL berikut di SQL Editor:

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    full_name TEXT,
    level INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create game_sessions table
CREATE TABLE game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    game_type TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view all game sessions" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert own game sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
*/

// Initialize the application
document.addEventListener('DOMContentLoaded', init);