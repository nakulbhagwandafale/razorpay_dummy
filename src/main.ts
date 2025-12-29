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
      ${renderFooter()}
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
  // Razorpay Live Key ID
  const RAZORPAY_KEY_ID = 'rzp_live_RxQPaWeyT5yLdP';

  const razorpayOptions = {
    key: RAZORPAY_KEY_ID,
    amount: options.amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    name: 'LearnPro',
    description: `${options.planName} Plan Subscription`,
    order_id: options.orderId,
    handler: function (response: any) {
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
      ondismiss: function () {
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

    rzp.on('payment.failed', function (response: any) {
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

// Common header for policy pages
function renderPolicyHeader(title: string): string {
  return `
    <header class="policy-header">
      <a href="/" class="back-link" onclick="event.preventDefault(); window.router.navigate('/');">← Back to Home</a>
      <h1>${title}</h1>
    </header>
  `;
}

// Common footer for all pages
function renderFooter(): string {
  return `
    <footer class="site-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <h3>LearnPro</h3>
          <p>Empowering learners worldwide with premium education.</p>
        </div>
        <div class="footer-links">
          <h4>Policies</h4>
          <ul>
            <li><a href="/cancellation-refunds" onclick="event.preventDefault(); window.router.navigate('/cancellation-refunds');">Cancellation & Refunds</a></li>
            <li><a href="/terms" onclick="event.preventDefault(); window.router.navigate('/terms');">Terms and Conditions</a></li>
            <li><a href="/shipping" onclick="event.preventDefault(); window.router.navigate('/shipping');">Shipping</a></li>
            <li><a href="/privacy" onclick="event.preventDefault(); window.router.navigate('/privacy');">Privacy Policy</a></li>
            <li><a href="/contact" onclick="event.preventDefault(); window.router.navigate('/contact');">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>Contact</h4>
          <p>Email: support@learnpro.com</p>
          <p>Phone: +91 9876543210</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} LearnPro. All rights reserved.</p>
      </div>
    </footer>
  `;
}

// Expose router to window for navigation links
(window as any).router = router;

// Cancellation & Refunds Page
function renderCancellationRefundsPage() {
  app.innerHTML = `
    <main class="policy-page">
      ${renderPolicyHeader('Cancellation & Refunds Policy')}
      <div class="policy-content">
        <section>
          <h2>1. Cancellation Policy</h2>
          <p>At LearnPro, we understand that circumstances may change. You may cancel your subscription or course purchase according to the following terms:</p>
          <ul>
            <li><strong>Before Course Access:</strong> Full refund if you haven't accessed any course content.</li>
            <li><strong>Within 7 Days:</strong> If you're not satisfied with our courses, you can request a refund within 7 days of purchase.</li>
            <li><strong>After 7 Days:</strong> Cancellation requests after 7 days will be reviewed on a case-by-case basis.</li>
          </ul>
        </section>
        
        <section>
          <h2>2. Refund Policy</h2>
          <p>Refunds are processed according to the following guidelines:</p>
          <ul>
            <li>Refund requests must be submitted via email to support@learnpro.com</li>
            <li>Approved refunds will be credited within 5-7 business days</li>
            <li>Refunds will be processed to the original payment method</li>
            <li>Transaction fees may be deducted from the refund amount</li>
          </ul>
        </section>
        
        <section>
          <h2>3. Non-Refundable Items</h2>
          <p>The following are not eligible for refunds:</p>
          <ul>
            <li>Courses that have been fully completed</li>
            <li>Downloadable materials that have been accessed</li>
            <li>Certificates that have been issued</li>
            <li>Subscription renewals (after the renewal date)</li>
          </ul>
        </section>
        
        <section>
          <h2>4. How to Request a Refund</h2>
          <p>To request a refund, please:</p>
          <ol>
            <li>Send an email to support@learnpro.com</li>
            <li>Include your order ID and reason for refund</li>
            <li>Our team will respond within 2-3 business days</li>
          </ol>
        </section>
        
        <section>
          <h2>5. Contact Us</h2>
          <p>For any questions regarding cancellations or refunds, please contact us at:</p>
          <p>Email: support@learnpro.com<br>Phone: +91 9876543210</p>
        </section>
      </div>
      ${renderFooter()}
    </main>
  `;
}

// Terms and Conditions Page
function renderTermsPage() {
  app.innerHTML = `
    <main class="policy-page">
      ${renderPolicyHeader('Terms and Conditions')}
      <div class="policy-content">
        <section>
          <h2>1. Introduction</h2>
          <p>Welcome to LearnPro. By accessing our website and using our services, you agree to be bound by these Terms and Conditions. Please read them carefully before using our platform.</p>
        </section>
        
        <section>
          <h2>2. Definitions</h2>
          <ul>
            <li><strong>"Service"</strong> refers to the LearnPro platform and all courses offered.</li>
            <li><strong>"User"</strong> refers to anyone who accesses or uses our services.</li>
            <li><strong>"Content"</strong> refers to all materials, including videos, documents, and assessments.</li>
          </ul>
        </section>
        
        <section>
          <h2>3. User Accounts</h2>
          <p>To access our courses, you must:</p>
          <ul>
            <li>Create an account with accurate information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be at least 18 years old or have parental consent</li>
          </ul>
        </section>
        
        <section>
          <h2>4. Intellectual Property</h2>
          <p>All content on LearnPro is protected by copyright and intellectual property laws. You may not:</p>
          <ul>
            <li>Copy, reproduce, or distribute our content</li>
            <li>Share your account access with others</li>
            <li>Use our content for commercial purposes without permission</li>
          </ul>
        </section>
        
        <section>
          <h2>5. Payment Terms</h2>
          <p>By purchasing a course or subscription:</p>
          <ul>
            <li>You agree to pay the specified price</li>
            <li>All payments are processed securely via Razorpay</li>
            <li>Prices are subject to change without notice</li>
            <li>Applicable taxes may be added to the purchase price</li>
          </ul>
        </section>
        
        <section>
          <h2>6. Limitation of Liability</h2>
          <p>LearnPro shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
        </section>
        
        <section>
          <h2>7. Governing Law</h2>
          <p>These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Maharashtra, India.</p>
        </section>
        
        <section>
          <h2>8. Contact Information</h2>
          <p>For questions about these terms, contact us at:</p>
          <p>Email: support@learnpro.com<br>Phone: +91 9876543210</p>
        </section>
      </div>
      ${renderFooter()}
    </main>
  `;
}

// Shipping Policy Page
function renderShippingPage() {
  app.innerHTML = `
    <main class="policy-page">
      ${renderPolicyHeader('Shipping Policy')}
      <div class="policy-content">
        <section>
          <h2>1. Digital Delivery</h2>
          <p>LearnPro is an online education platform. All our courses and materials are delivered digitally. There is no physical shipping involved for our core services.</p>
        </section>
        
        <section>
          <h2>2. Instant Access</h2>
          <p>Upon successful payment, you will receive:</p>
          <ul>
            <li><strong>Immediate access</strong> to your purchased courses</li>
            <li>Email confirmation with your order details</li>
            <li>Access to downloadable materials (if included in your plan)</li>
            <li>Certificate upon course completion</li>
          </ul>
        </section>
        
        <section>
          <h2>3. Access Duration</h2>
          <p>Course access depends on your subscription plan:</p>
          <ul>
            <li><strong>Basic Plan:</strong> 1 Month Access</li>
            <li><strong>Pro Plan:</strong> 6 Months Access</li>
            <li><strong>Enterprise Plan:</strong> Lifetime Access</li>
          </ul>
        </section>
        
        <section>
          <h2>4. Downloadable Materials</h2>
          <p>Where applicable, downloadable materials such as PDFs, worksheets, and resources are available immediately after purchase and can be accessed through your dashboard.</p>
        </section>
        
        <section>
          <h2>5. Physical Merchandise (If Applicable)</h2>
          <p>If we offer any physical merchandise in the future:</p>
          <ul>
            <li>Shipping charges will be calculated at checkout</li>
            <li>Delivery times will vary based on location</li>
            <li>Tracking information will be provided via email</li>
          </ul>
        </section>
        
        <section>
          <h2>6. Technical Issues</h2>
          <p>If you face any issues accessing your courses after purchase:</p>
          <ul>
            <li>Check your email for order confirmation</li>
            <li>Clear your browser cache and try again</li>
            <li>Contact support@learnpro.com for assistance</li>
          </ul>
        </section>
        
        <section>
          <h2>7. Contact Us</h2>
          <p>For delivery-related queries, please contact:</p>
          <p>Email: support@learnpro.com<br>Phone: +91 9876543210</p>
        </section>
      </div>
      ${renderFooter()}
    </main>
  `;
}

// Privacy Policy Page
function renderPrivacyPage() {
  app.innerHTML = `
    <main class="policy-page">
      ${renderPolicyHeader('Privacy Policy')}
      <div class="policy-content">
        <section>
          <h2>1. Introduction</h2>
          <p>At LearnPro, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.</p>
        </section>
        
        <section>
          <h2>2. Information We Collect</h2>
          <p>We may collect the following information:</p>
          <ul>
            <li><strong>Personal Information:</strong> Name, email address, phone number</li>
            <li><strong>Payment Information:</strong> Processed securely via Razorpay</li>
            <li><strong>Usage Data:</strong> Course progress, login times, device information</li>
            <li><strong>Cookies:</strong> To enhance your browsing experience</li>
          </ul>
        </section>
        
        <section>
          <h2>3. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul>
            <li>Provide and improve our services</li>
            <li>Process payments and send receipts</li>
            <li>Send course updates and promotional materials</li>
            <li>Respond to your inquiries and support requests</li>
            <li>Analyze usage patterns to improve user experience</li>
          </ul>
        </section>
        
        <section>
          <h2>4. Data Protection</h2>
          <p>We implement security measures including:</p>
          <ul>
            <li>SSL encryption for all data transmission</li>
            <li>Secure payment processing via Razorpay</li>
            <li>Regular security audits</li>
            <li>Limited access to personal data</li>
          </ul>
        </section>
        
        <section>
          <h2>5. Third-Party Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul>
            <li>Payment processors (Razorpay) for transactions</li>
            <li>Analytics services to improve our platform</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>
        
        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>
        
        <section>
          <h2>7. Cookies Policy</h2>
          <p>We use cookies to enhance your experience. You can manage cookie preferences in your browser settings.</p>
        </section>
        
        <section>
          <h2>8. Contact Us</h2>
          <p>For privacy-related concerns, please contact:</p>
          <p>Email: privacy@learnpro.com<br>Phone: +91 9876543210</p>
        </section>
      </div>
      ${renderFooter()}
    </main>
  `;
}

// Contact Us Page
function renderContactPage() {
  app.innerHTML = `
    <main class="policy-page">
      ${renderPolicyHeader('Contact Us')}
      <div class="policy-content contact-page-content">
        <section class="contact-info-section">
          <h2>Get in Touch</h2>
          <p>We'd love to hear from you! Whether you have a question about our courses, pricing, or anything else, our team is ready to help.</p>
          
          <div class="contact-cards">
            <div class="contact-card">
              <div class="contact-icon">📧</div>
              <h3>Email Us</h3>
              <p>support@learnpro.com</p>
              <p>We respond within 24 hours</p>
            </div>
            
            <div class="contact-card">
              <div class="contact-icon">📞</div>
              <h3>Call Us</h3>
              <p>+91 9876543210</p>
              <p>Mon-Fri, 9 AM - 6 PM IST</p>
            </div>
            
            <div class="contact-card">
              <div class="contact-icon">📍</div>
              <h3>Visit Us</h3>
              <p>123 Learning Street</p>
              <p>Mumbai, Maharashtra 400001</p>
            </div>
          </div>
        </section>
        
        <section class="contact-form-section">
          <h2>Send Us a Message</h2>
          <form class="contact-form" id="contact-form">
            <div class="form-group">
              <label for="name">Your Name</label>
              <input type="text" id="name" name="name" required placeholder="Enter your name">
            </div>
            
            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" name="email" required placeholder="Enter your email">
            </div>
            
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" placeholder="Enter your phone number">
            </div>
            
            <div class="form-group">
              <label for="subject">Subject</label>
              <select id="subject" name="subject" required>
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="refund">Refund Request</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" name="message" rows="5" required placeholder="How can we help you?"></textarea>
            </div>
            
            <button type="submit" class="submit-button">Send Message</button>
          </form>
        </section>
        
        <section class="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div class="faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>We accept all major credit cards, debit cards, UPI, and net banking through Razorpay.</p>
          </div>
          <div class="faq-item">
            <h3>How do I access my courses after purchase?</h3>
            <p>After successful payment, you'll be redirected to your course dashboard immediately.</p>
          </div>
          <div class="faq-item">
            <h3>Can I get a refund?</h3>
            <p>Yes, we offer refunds within 7 days of purchase. Please see our Cancellation & Refunds policy for details.</p>
          </div>
        </section>
      </div>
      ${renderFooter()}
    </main>
  `;

  // Handle form submission
  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Thank you for your message! We will get back to you soon.', 'success');
    (e.target as HTMLFormElement).reset();
  });
}

// Register routes
router.register('/', renderHomePage);
router.register('/course', renderCoursePage);
router.register('/cancellation-refunds', renderCancellationRefundsPage);
router.register('/terms', renderTermsPage);
router.register('/shipping', renderShippingPage);
router.register('/privacy', renderPrivacyPage);
router.register('/contact', renderContactPage);

// Initialize app
router.init();
