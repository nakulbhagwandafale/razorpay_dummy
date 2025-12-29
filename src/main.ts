import './style.css';

// Pricing plans data
interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  popular: boolean;
  features: string[];
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for getting started',
    price: 499,
    icon: '🚀',
    popular: false,
    features: [
      '5 Video Courses',
      'Basic Support',
      '1 Month Access',
      'Course Materials',
      'Mobile Access'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best value for serious learners',
    price: 999,
    icon: '⚡',
    popular: true,
    features: [
      '25 Video Courses',
      'Priority Support',
      '6 Months Access',
      'Course Materials',
      'Certificate of Completion',
      '1-on-1 Mentorship'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and organizations',
    price: 2499,
    icon: '👑',
    popular: false,
    features: [
      'Unlimited Courses',
      '24/7 Priority Support',
      'Lifetime Access',
      'All Course Materials',
      'Team Analytics',
      'Custom Learning Paths',
      'Dedicated Account Manager'
    ]
  }
];

// Simple router
class Router {
  private routes: Map<string, () => void> = new Map();
  
  register(path: string, handler: () => void) {
    this.routes.set(path, handler);
  }
  
  navigate(path: string) {
    window.history.pushState({}, '', path);
    this.resolve();
  }
  
  resolve() {
    const path = window.location.pathname;
    const handler = this.routes.get(path) || this.routes.get('/');
    if (handler) handler();
  }
  
  init() {
    window.addEventListener('popstate', () => this.resolve());
    this.resolve();
  }
}

const router = new Router();
const app = document.querySelector<HTMLDivElement>('#app')!;

// Render home page with pricing
function renderHomePage() {
  app.innerHTML = `
    <main>
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">
            ✨ <span>Limited Time Offer</span> - 50% Off All Plans
          </div>
          <h1>Unlock Your <span class="gradient-text">Learning Potential</span></h1>
          <p>Join thousands of learners who have transformed their careers with our premium courses. Start your journey today.</p>
        </div>
      </section>
      
      <section class="pricing-section" id="pricing">
        <div class="pricing-header">
          <h2>Choose Your Plan</h2>
          <p>Simple, transparent pricing that grows with you</p>
        </div>
        
        <div class="pricing-grid">
          ${pricingPlans.map(plan => `
            <div class="pricing-card ${plan.popular ? 'popular' : ''}">
              ${plan.popular ? '<div class="popular-badge">Most Popular</div>' : ''}
              <div class="plan-icon">${plan.icon}</div>
              <h3 class="plan-name">${plan.name}</h3>
              <p class="plan-description">${plan.description}</p>
              <div class="plan-price">
                <span class="currency">₹</span>
                <span class="amount">${plan.price.toLocaleString()}</span>
                <span class="period">/one-time</span>
              </div>
              <ul class="features-list">
                ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
              </ul>
              <button 
                class="buy-button ${plan.popular ? 'primary' : 'secondary'}" 
                data-plan-id="${plan.id}"
                data-plan-name="${plan.name}"
                data-plan-price="${plan.price}"
              >
                Get Started
              </button>
            </div>
          `).join('')}
        </div>
      </section>
    </main>
  `;
  
  // Attach event listeners to buy buttons
  document.querySelectorAll('.buy-button').forEach(button => {
    button.addEventListener('click', handleBuyClick);
  });
}

// Handle buy button click
async function handleBuyClick(event: Event) {
  const button = event.target as HTMLButtonElement;
  const planId = button.dataset.planId!;
  const planName = button.dataset.planName!;
  const planPrice = parseInt(button.dataset.planPrice!);
  
  button.classList.add('loading');
  button.textContent = 'Processing...';
  
  try {
    // For demo purposes, we'll create a mock order
    // In production, you would call your backend to create the order
    const orderId = `order_${Date.now()}_${planId}`;
    
    // Initialize Razorpay checkout
    initRazorpayCheckout({
      orderId,
      planId,
      planName,
      amount: planPrice
    });
  } catch (error) {
    showToast('Failed to process. Please try again.', 'error');
    button.classList.remove('loading');
    button.textContent = 'Get Started';
  }
}

// Initialize Razorpay checkout
interface RazorpayOptions {
  orderId: string;
  planId: string;
  planName: string;
  amount: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function initRazorpayCheckout(options: RazorpayOptions) {
  // IMPORTANT: Replace with your actual Razorpay Key ID
  const RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_HERE';
  
  const razorpayOptions = {
    key: RAZORPAY_KEY_ID,
    amount: options.amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    name: 'LearnPro',
    description: `${options.planName} Plan Subscription`,
    order_id: options.orderId,
    handler: function(response: any) {
      // Payment successful
      console.log('Payment successful:', response);
      
      // Save payment info to session storage for course page
      sessionStorage.setItem('payment', JSON.stringify({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        signature: response.razorpay_signature,
        planId: options.planId,
        planName: options.planName,
        amount: options.amount
      }));
      
      // Redirect to course page
      router.navigate('/course');
    },
    prefill: {
      name: 'Test User',
      email: 'test@example.com',
      contact: '9999999999'
    },
    notes: {
      plan_id: options.planId
    },
    theme: {
      color: '#667eea'
    },
    modal: {
      ondismiss: function() {
        // Reset button state when modal is closed
        const buttons = document.querySelectorAll('.buy-button');
        buttons.forEach(btn => {
          btn.classList.remove('loading');
          if (btn.classList.contains('primary')) {
            btn.textContent = 'Get Started';
          } else {
            btn.textContent = 'Get Started';
          }
        });
      }
    }
  };
  
  try {
    const rzp = new window.Razorpay(razorpayOptions);
    
    rzp.on('payment.failed', function(response: any) {
      console.error('Payment failed:', response.error);
      showToast(`Payment failed: ${response.error.description}`, 'error');
    });
    
    rzp.open();
  } catch (error) {
    console.error('Razorpay initialization error:', error);
    showToast('Payment system unavailable. Please try again later.', 'error');
  }
  
  // Reset button state
  const buttons = document.querySelectorAll('.buy-button');
  buttons.forEach(btn => {
    btn.classList.remove('loading');
    btn.textContent = 'Get Started';
  });
}

// Render course page (success page)
function renderCoursePage() {
  const paymentData = sessionStorage.getItem('payment');
  let planName = 'Premium';
  
  if (paymentData) {
    const payment = JSON.parse(paymentData);
    planName = payment.planName;
  }
  
  app.innerHTML = `
    <main class="course-page">
      <header class="course-header">
        <div class="success-icon">✓</div>
        <h1>Welcome to Your Course!</h1>
        <p>Your ${planName} plan is now active. Start learning today!</p>
      </header>
      
      <section class="course-content">
        <div class="course-card">
          <h2>📚 Your Learning Path</h2>
          <div class="course-modules">
            <div class="module-item">
              <div class="module-number">1</div>
              <div class="module-info">
                <h3>Getting Started</h3>
                <p>Introduction and setup • 15 min</p>
              </div>
            </div>
            <div class="module-item">
              <div class="module-number">2</div>
              <div class="module-info">
                <h3>Core Fundamentals</h3>
                <p>Essential concepts • 45 min</p>
              </div>
            </div>
            <div class="module-item">
              <div class="module-number">3</div>
              <div class="module-info">
                <h3>Advanced Techniques</h3>
                <p>Deep dive into advanced topics • 1 hr</p>
              </div>
            </div>
            <div class="module-item">
              <div class="module-number">4</div>
              <div class="module-info">
                <h3>Real-World Projects</h3>
                <p>Hands-on practice • 2 hrs</p>
              </div>
            </div>
            <div class="module-item">
              <div class="module-number">5</div>
              <div class="module-info">
                <h3>Final Assessment</h3>
                <p>Test your knowledge • 30 min</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="course-card">
          <h2>🎯 Quick Stats</h2>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">
            You now have full access to all course materials and resources included in your plan.
          </p>
          <ul class="features-list">
            <li>5 comprehensive modules</li>
            <li>4+ hours of content</li>
            <li>Downloadable resources</li>
            <li>Certificate upon completion</li>
          </ul>
        </div>
        
        <button class="back-button" id="back-home">
          ← Back to Plans
        </button>
      </section>
    </main>
  `;
  
  document.getElementById('back-home')?.addEventListener('click', () => {
    router.navigate('/');
  });
}

// Toast notification
function showToast(message: string, type: 'success' | 'error') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Register routes
router.register('/', renderHomePage);
router.register('/course', renderCoursePage);

// Initialize app
router.init();
