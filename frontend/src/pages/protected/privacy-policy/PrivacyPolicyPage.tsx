// pages/protected/privacy-policy/PrivacyPolicyPage.tsx

import React, { useEffect } from 'react';
import { FaCheck, FaRegCircle, FaCalendarAlt, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import Card from '../../../components/Card';
import OneColumnLayout from '../../../components/OneColumnLayout';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useTheme } from '../../../context/ThemeContext';

const PrivacyPolicyPage: React.FC = () => {
  const { theme } = useTheme();

  // Scroll to the top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Define the main content with enhanced styling, extra sections, and icons
  const content = (
    <div className="max-w-3xl mx-auto space-y-10">
      <Card padding="p-8" shadow={true} border={true}>
        <h1 className="text-4xl font-bold mb-6 text-center">Privacy Policy</h1>
        <div className="prose prose-lg">
          <p className="mb-6 text-sm">
            Welcome to our website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. By using our service, you consent to our collection and use of information in accordance with this policy.
          </p>
          
          <h2 className="mt-8 mb-4 font-semibold">1. Introduction</h2>
          <p className="mb-6 text-sm">
            We value your privacy and are committed to protecting your personal information. This Privacy Policy outlines our practices regarding the collection, use, and sharing of your data.
          </p>
          
          <h3 className="mt-6 mb-3 font-semibold">1.1 Our Commitment</h3>
          <p className="mb-6 text-sm">
            We are dedicated to ensuring that your privacy is respected and your information is protected. Our practices are designed to provide you with the best possible experience while safeguarding your rights.
          </p>
          <ul className="mb-6 list-none ml-0 space-y-3 text-sm">
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Commitment to transparency.
            </li>
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Protection of your personal data.
            </li>
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Compliance with applicable laws.
            </li>
          </ul>

          <h2 className="mt-8 mb-4 font-semibold">2. Information We Collect</h2>
          <p className="mb-6 text-sm">
            We may collect various types of information from you when you visit our website, including:
          </p>
          <ol className="mb-6 list-none ml-0 space-y-3 text-sm">
            <li className="flex items-center">
              <FaRegCircle className="text-blue-600 mr-2" />
              Personal identification information (Name, email address, etc.).
            </li>
            <li className="flex items-center">
              <FaRegCircle className="text-blue-600 mr-2" />
              Usage data and cookies.
            </li>
            <li className="flex items-center">
              <FaRegCircle className="text-blue-600 mr-2" />
              Location data and device information.
            </li>
          </ol>

          <h2 className="mt-8 mb-4 font-semibold">3. How We Use Your Information</h2>
          <p className="mb-6 text-sm">
            The information we collect is used to provide, maintain, and improve our services, including:
          </p>
          <ul className="mb-6 list-none ml-0 space-y-3 text-sm">
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Personalizing your experience.
            </li>
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Responding to customer service requests.
            </li>
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Sending periodic emails.
            </li>
          </ul>

          <h2 className="mt-8 mb-4 font-semibold">4. Data Security</h2>
          <p className="mb-6 text-sm">
            We take data security seriously and implement appropriate measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </p>
          <p className="mb-6 text-sm">
            You acknowledge that while we strive to protect your information, we cannot guarantee absolute security.
          </p>

          <h2 className="mt-8 mb-4 font-semibold">5. Your Rights</h2>
          <p className="mb-6 text-sm">
            Depending on your location, you may have certain rights regarding your personal data. These may include the right to access, correct, or delete your personal information.
          </p>
          <ul className="mb-6 list-none ml-0 space-y-3 text-sm">
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Right to access your data.
            </li>
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Right to correct inaccurate information.
            </li>
            <li className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              Right to request deletion of your data.
            </li>
          </ul>

          <h2 className="mt-8 mb-4 font-semibold">6. Cookies and Tracking Technologies</h2>
          <p className="mb-6 text-sm">
            We use cookies and similar tracking technologies to enhance your experience. Cookies help us understand user activity and improve our services.
          </p>
          <p className="mb-6 text-sm">
            By continuing to use our website, you consent to the use of cookies in accordance with our Cookie Policy.
          </p>

          <h2 className="mt-8 mb-4 font-semibold">7. Third-Party Services</h2>
          <p className="mb-6 text-sm">
            We may employ third-party companies to facilitate our service or to perform service-related functions. These third parties have access to your personal information only to perform specific tasks on our behalf.
          </p>
          <p className="mb-6 text-sm">
            We ensure that these third-party services are bound by confidentiality obligations and do not use your information for any other purpose.
          </p>

          <h2 className="mt-8 mb-4 font-semibold">8. Contact Information</h2>
          <p className="mb-6 text-sm">
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@example.com">privacy@example.com</a>.
          </p>

          {/* Extra Content with Additional Icons */}
          <h2 className="mt-8 mb-4 font-semibold">9. Effective Date &amp; Location</h2>
          <p className="mb-6 text-sm flex items-center">
            <FaCalendarAlt className="text-purple-600 mr-2" />
            <span>Effective Date: February 1, 2025</span>
          </p>
          <p className="mb-6 text-sm flex items-center">
            <FaMapMarkerAlt className="text-red-600 mr-2" />
            <span>Headquarters: 5678 Privacy Lane, Securetown, USA</span>
          </p>
          <p className="mb-6 text-sm flex items-center">
            <FaPhone className="text-blue-600 mr-2" />
            <span>Customer Support: (987) 654-3210</span>
          </p>

          <h2 className="mt-8 mb-4 font-semibold">10. Additional Provisions</h2>
          <p className="mb-6 text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque aliquet, nibh at convallis aliquam, nunc neque fermentum est, vitae volutpat nisi purus in dui. Donec convallis sollicitudin ligula, vitae suscipit urna molestie id. Sed interdum, nunc nec luctus aliquet, ligula metus varius nibh, non semper enim metus a orci.
          </p>
          <p className="mb-6 text-sm">
            Aenean id libero et nisi hendrerit bibendum. Mauris vitae malesuada eros. Proin tincidunt felis a lorem tempor, sed congue lacus congue. Suspendisse potenti. Phasellus mollis lacus eu metus ultrices, vel imperdiet sapien porttitor.
          </p>
          <p className="mb-6 text-sm">
            In hac habitasse platea dictumst. Aliquam erat volutpat. Etiam vel lectus non sem porta consequat. Integer at felis sit amet tortor vehicula dictum. Donec ut dolor vitae nunc imperdiet fermentum. Nam faucibus lacus vel lacus ullamcorper, in hendrerit lorem condimentum.
          </p>

          <p className="mt-8 text-sm">
            <strong>Last Updated:</strong> February 1, 2025.
          </p>
        </div>
      </Card>
    </div>
  );

  return (
    <div
      className={`flex flex-col min-h-screen ${
        theme === 'dark'
          ? 'bg-dark-background text-dark-text'
          : 'bg-light-background text-light-text'
      }`}
    >
      <Navbar />
      <OneColumnLayout content={content} />
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
