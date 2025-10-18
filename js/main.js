// =================================================================================
// JAVASCRIPT FOR RAW EVENT WEBSITE
// =================================================================================

// --- 1. SUPABASE SETUP ---
const SUPABASE_URL = 'https://bqmfjqexrububqelxwml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxbWZqcWV4cnVidWJxZWx4d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjI2MjcsImV4cCI6MjA3NTQ5ODYyN30.J7lpQZ-q3-vtO68obTxTgcUFkTSCAoYuRKQFK0gQmyU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 2. CORE FUNCTIONS ---

/**
 * Checks the current user's session status.
 * Redirects user based on their login status and current page.
 * @returns {object|null} The user object or null.
 */
const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
    }

    const protectedPages = ['dashboard.html', 'register.html'];
    if (!user && protectedPages.some(page => window.location.pathname.includes(page))) {
        window.location.href = 'login.html';
    }

    return user;
};

/**
 * Loads the user's registration status on the dashboard page.
 */
const loadDashboard = async () => {
    const dashboardContent = document.querySelector('#dashboard-content');
    const user = await checkUser();
    if (!user || !dashboardContent) return;

    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (data) {
        dashboardContent.innerHTML = `
            <h2>Registration Complete! ✅</h2>
            <div class="event-details-box" style="margin-top: 25px; margin-bottom: 15px; justify-content: center;">
                <a href="https://maps.app.goo.gl/7uPjaKawVzxydjq68" target="_blank" rel="noopener noreferrer" class="event-detail event-detail-link">
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path></svg>
                    <span><strong>Venue:</strong> Decathlon, Uppal</span>
                </a>
            </div>
            <p>Thank you for registering for RAW-2. We have received your details.</p>
            <p><strong>Name:</strong> ${data.full_name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p>We will verify your payment and contact you shortly.</p>
            <a href="rules.html" class="cta-button" style="display:inline-block; text-align:center;">View Event Rules</a>
        `;
    } else {
        dashboardContent.innerHTML = `
            <h2>Welcome to RAW-2!</h2>
            <p>You are logged in but have not yet registered for the event.</p>
            <a href="register.html" class="cta-button" style="display:inline-block; text-align:center;">Register for Event Now</a>
        `;
    }
};

/**
 * Handles the submission of the event registration form.
 */
const handleRegistration = async (e) => {
    e.preventDefault();
    const registrationForm = document.querySelector('#event-registration-form');
    const user = await checkUser();
    if (!user || !registrationForm) return;

    const formButton = registrationForm.querySelector('button');
    formButton.disabled = true;
    formButton.textContent = 'Submitting...';

    // Get all form data
    const fullName = document.querySelector('#name').value;
    const age = document.querySelector('#age').value;
    const weight = document.querySelector('#weight').value;
    const height = document.querySelector('#height').value;
    const healthIssues = document.querySelector('#health-issues').value;
    const experience = document.querySelector('#experience').value;
    const physicallyChallenged = document.querySelector('#physically-challenged').value;
    const aadharFile = document.querySelector('#aadhar-upload').files[0];
    const paymentFile = document.querySelector('#payment-upload').files[0];

    try {
        // Upload Aadhar image
        const aadharFilePath = `public/${user.id}-aadhar-${aadharFile.name}`;
        let { error: aadharError } = await supabase.storage.from('uploads').upload(aadharFilePath, aadharFile);
        if (aadharError) throw aadharError;

        // Upload Payment image
        const paymentFilePath = `public/${user.id}-payment-${paymentFile.name}`;
        let { error: paymentError } = await supabase.storage.from('uploads').upload(paymentFilePath, paymentFile);
        if (paymentError) throw paymentError;

        // Get public URLs for the uploaded files
        const { data: aadharUrlData } = supabase.storage.from('uploads').getPublicUrl(aadharFilePath);
        const { data: paymentUrlData } = supabase.storage.from('uploads').getPublicUrl(paymentFilePath);
        
        // Insert all data into the 'registrations' table
        const { error: insertError } = await supabase.from('registrations').insert({
            user_id: user.id,
            full_name: fullName,
            age: age,
            weight: weight,
            height: height,
            email: user.email,
            health_issues: healthIssues,
            experience: experience,
            physically_challenged: physicallyChallenged,
            aadhar_url: aadharUrlData.publicUrl,
            payment_url: paymentUrlData.publicUrl
        });
        if (insertError) throw insertError;
        
        // Success
        alert('Registration successful!');
        window.location.href = 'dashboard.html';

    } catch (error) {
        alert('Error submitting registration: ' + error.message);
        formButton.disabled = false;
        formButton.textContent = 'Complete Registration';
    }
};

// --- 3. INITIALIZATION & EVENT LISTENERS ---

/**
 * This runs when the page is fully loaded. 
 * It finds elements and attaches all necessary event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- General Selectors ---
    const logoutButton = document.querySelector('#logout-button');
    const loginForm = document.querySelector('#login');
    const signupForm = document.querySelector('#signup');
    const showSignupLink = document.querySelector('#show-signup');
    const showLoginLink = document.querySelector('#show-login');
    const registrationForm = document.querySelector('#event-registration-form');
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    // --- Attach Event Listeners ---
// Page Transitions
// This captures clicks on all internal links
document.querySelectorAll('a:not([target="_blank"]):not([href^="#"])').forEach(link => {
    link.addEventListener('click', (e) => {
        const destination = link.href;
        
        // Prevent transition if the link is not a valid destination or is the current page
        if (!destination || destination === window.location.href) {
            return;
        }
        
        e.preventDefault(); // Stop the browser from instantly changing the page
        document.body.classList.add('fade-out'); // Add the fade-out class to trigger the CSS animation

        // Wait for the animation to finish, then change the page
        setTimeout(() => {
            window.location.href = destination;
        }, 400); // This delay MUST match the animation duration in your CSS
    });
});
    // Logout Button
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        });
    }

    // Signup Form
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.querySelector('#signup-email').value;
            const password = document.querySelector('#signup-password').value;

            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                alert('Error signing up: ' + error.message);
            } else {
                alert('Signup successful! Please check your email for a confirmation link.');
                signupForm.reset();
            }
        });
    }

    // Login Form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.querySelector('#login-email').value;
            const password = document.querySelector('#login-password').value;
            
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                alert('Error logging in: ' + error.message);
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }
    
    // Toggle between Login/Signup forms
    if (showSignupLink && showLoginLink) {
        const loginDiv = document.querySelector('#login-form');
        const signupDiv = document.querySelector('#signup-form');

        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginDiv.style.display = 'none';
            signupDiv.style.display = 'block';
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupDiv.style.display = 'none';
            loginDiv.style.display = 'block';
        });
    }

    // Event Registration Form
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }

    // Mobile Menu Toggle
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // File Input Listeners for registration page
    document.querySelectorAll('.file-upload-wrapper input[type="file"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
            const fileNameDisplay = e.target.closest('.file-upload-wrapper').querySelector('.file-name');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = fileName;
            }
        });
    });

    // --- Page-Specific Initialization ---
    const path = window.location.pathname;

    if (path.includes('dashboard.html')) {
        loadDashboard();
    } else if (path.includes('register.html')) {
        checkUser().then(user => {
            if(user) { document.querySelector('#email').value = user.email; }
        });
    } else {
        checkUser();
    }
});

