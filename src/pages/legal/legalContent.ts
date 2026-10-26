/**
 * Public policy pages for practicekoro.online (/privacy, /terms, /refund, /contact).
 * Google Play links the privacy policy and Razorpay requires the terms, refund and contact
 * pages, so keep these in step with how the apps actually handle data and payments.
 */

export const SUPPORT_EMAIL = 'support@practicekoro.online';
export const LEGAL_LAST_UPDATED = '26 October 2026';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  slug: 'privacy' | 'terms' | 'refund' | 'contact';
  title: string;
  summary: string;
  sections: LegalSection[];
}

export const PRIVACY_POLICY: LegalDocument = {
  slug: 'privacy',
  title: 'Privacy Policy',
  summary:
    'How Practice Koro collects, uses, stores and deletes your information when you use our website, student web panel and mobile app.',
  sections: [
    {
      heading: 'Who we are',
      paragraphs: [
        'Practice Koro ("we", "us") runs an online practice platform for West Bengal government job exams at practicekoro.online, the Practice Koro student web panel and the Practice Koro Android app. This policy applies to all of them.',
      ],
    },
    {
      heading: 'Information we collect',
      bullets: [
        'Account details: your name, email address and, if you sign in with Google, your Google profile name and photo.',
        'Profile details you choose to add, such as your phone number, district, block, target exams and profile picture.',
        'Your practice activity: tests you start and submit, your answers, scores, time taken, bookmarks, mistakes and rankings.',
        'Payment details: the plan you buy, the amount, and the order and payment IDs from Razorpay. Card, UPI and bank details are entered on Razorpay and never reach or are stored by us.',
        'Support messages you send us through help tickets.',
        'Basic technical information needed to run the service, such as app version, device type and sign-in sessions.',
      ],
    },
    {
      heading: 'How we use it',
      bullets: [
        'To create and secure your account and keep you signed in.',
        'To run tests, show solutions, track your progress and calculate district and exam rankings.',
        'To process subscriptions and payments, and to handle refunds and payment disputes.',
        'To answer your support requests and send you important notices about your account or tests.',
        'To keep the service safe, prevent misuse and fix problems.',
      ],
      paragraphs: ['We do not sell your personal information and we do not use it for third-party advertising.'],
    },
    {
      heading: 'Who we share it with',
      paragraphs: ['We share information only with the services that help us run Practice Koro, and only what they need:'],
      bullets: [
        'Supabase, which hosts our database, sign-in and file storage.',
        'Razorpay, which processes payments.',
        'Google, when you choose "Sign in with Google".',
        'Government or legal authorities, if the law requires it.',
      ],
    },
    {
      heading: 'Rankings and leaderboards',
      paragraphs: [
        'Leaderboards show your name, profile picture, district, block and score to other students taking the same tests. Your email address and phone number are never shown to other students.',
      ],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'We keep your account information for as long as your account is open. When you delete your account, we delete your profile, practice history, bookmarks and support tickets.',
        'Records of payments and subscriptions are kept after deletion because tax and accounting laws require it and because they may be needed for refunds or payment disputes. These records are separated from your identity: your name, email and other profile details are removed from them.',
      ],
    },
    {
      heading: 'Your rights and choices',
      bullets: [
        'You can view and update your profile at any time in the app or the student web panel.',
        'You can delete your account from Settings in the app or the student web panel, or by following the steps at practicekoro.online/account-deletion.',
        `You can ask us for a copy of your information, or ask us to correct or delete it, by writing to ${SUPPORT_EMAIL}.`,
      ],
    },
    {
      heading: 'Security',
      paragraphs: [
        'Your data travels over encrypted connections. Each student can only read their own records, and staff access is limited by role. No system is perfectly secure, so please keep your password private.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'Practice Koro is meant for people preparing for government job exams. If you are under 18, please use Practice Koro only with the consent of a parent or guardian.',
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'If we change this policy we will update the date on this page, and tell you in the app if the change is significant.',
      ],
    },
    {
      heading: 'Contact and grievances',
      paragraphs: [
        `For any privacy question or complaint, write to ${SUPPORT_EMAIL}. We aim to reply within 7 working days.`,
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  slug: 'terms',
  title: 'Terms of Service',
  summary: 'The rules for using Practice Koro. By creating an account or buying a plan you agree to these terms.',
  sections: [
    {
      heading: 'The service',
      paragraphs: [
        'Practice Koro provides mock tests, topic tests, previous year questions, solutions and progress tracking to help you prepare for government job exams. Practice Koro is an independent platform and is not connected with WBP, WBSSC, WBPSC, the Railway Recruitment Boards, SSC or any other government body.',
        'We work hard to keep questions and solutions accurate, but we cannot guarantee that every question is error-free or that using Practice Koro will lead to selection in any exam.',
      ],
    },
    {
      heading: 'Your account',
      bullets: [
        'Give correct information when you sign up and keep your password private.',
        'One account is for one person. Do not share your account or resell access.',
        'You are responsible for activity on your account.',
      ],
    },
    {
      heading: 'Plans and payments',
      bullets: [
        'Some content is free. Paid plans unlock more tests and features for the period shown when you buy.',
        'Prices are shown in Indian Rupees.',
        'Payments are processed by Razorpay. Your plan is activated on your account as soon as the payment succeeds; there is nothing to ship.',
        'A plan ends on its expiry date. Plans do not renew automatically; you can buy again or renew from the app.',
        'Refunds are covered by our Refund Policy.',
      ],
    },
    {
      heading: 'Fair use',
      bullets: [
        'Do not copy, download in bulk, publish or sell our questions, solutions or other content.',
        'Do not use bots, scripts or other tricks to take tests, change rankings or get around plan limits.',
        'Do not try to break into accounts or systems, or disrupt the service.',
      ],
      paragraphs: ['We may suspend or close accounts that break these rules.'],
    },
    {
      heading: 'Our content',
      paragraphs: [
        'All questions, solutions, notes, designs and software on Practice Koro belong to us or our licensors. Your plan gives you a personal, non-transferable right to use them for your own preparation.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        'Practice Koro is provided as it is. To the extent the law allows, we are not liable for indirect losses, and our total liability for any claim is limited to the amount you paid us in the three months before the claim.',
      ],
    },
    {
      heading: 'Changes and ending',
      paragraphs: [
        'We may update these terms or the service. If a change is significant we will tell you in the app. You can stop using Practice Koro and delete your account at any time.',
        'These terms are governed by the laws of India.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [`Questions about these terms: ${SUPPORT_EMAIL}.`],
    },
  ],
};

export const REFUND_POLICY: LegalDocument = {
  slug: 'refund',
  title: 'Refund & Cancellation Policy',
  summary: 'When you can get your money back for a Practice Koro plan, and how refunds are paid.',
  sections: [
    {
      heading: 'Failed or duplicate payments',
      paragraphs: [
        'If money left your account but your plan was not activated, or you were charged twice for the same purchase, we refund the extra or failed amount in full. Please write to us with your payment details.',
      ],
    },
    {
      heading: 'Refund requests',
      paragraphs: [
        'Plans give instant access to digital content, so purchases are normally not refundable once the plan is active. If something went wrong, write to us within 7 days of your purchase and we will review your request fairly, taking into account how much of the plan you have used.',
      ],
    },
    {
      heading: 'Cancellation',
      paragraphs: [
        'Plans do not renew automatically, so there is nothing to cancel. Your access simply ends on the expiry date. Deleting your account ends your plan without a refund for the unused period.',
      ],
    },
    {
      heading: 'How refunds are paid',
      paragraphs: [
        'Approved refunds are sent through Razorpay to the same card, UPI or bank account you paid with. They usually reach you within 5 to 7 working days, depending on your bank.',
      ],
    },
    {
      heading: 'How to ask',
      paragraphs: [
        `Email ${SUPPORT_EMAIL} with your registered email address, the plan you bought, the date and the Razorpay payment ID from your receipt.`,
      ],
    },
  ],
};

export const CONTACT_PAGE: LegalDocument = {
  slug: 'contact',
  title: 'Contact Us',
  summary: 'We are happy to help with your account, tests, payments or anything else.',
  sections: [
    {
      heading: 'Email',
      paragraphs: [`Write to ${SUPPORT_EMAIL}. We aim to reply within 1 to 2 working days.`],
    },
    {
      heading: 'Help inside the app',
      paragraphs: [
        'Signed-in students can raise a support ticket from Help & Support in the app or the student web panel, and follow our replies there.',
      ],
    },
    {
      heading: 'Payments and refunds',
      paragraphs: [
        'For a payment problem, include your registered email address and the Razorpay payment ID so we can find it quickly. See the Refund & Cancellation Policy for details.',
      ],
    },
    {
      heading: 'Deleting your account',
      paragraphs: [
        'You can delete your account yourself from Settings, or follow the steps at practicekoro.online/account-deletion.',
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS = [PRIVACY_POLICY, TERMS_OF_SERVICE, REFUND_POLICY, CONTACT_PAGE];
